import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./admin";

// ---------- Comments on live hazard reports ----------

/** Comments on one hazard alert, with author names joined in. */
export const listComments = query({
  args: { hazardId: v.id("hazards") },
  handler: async (ctx, { hazardId }) => {
    const comments = await ctx.db
      .query("reportComments")
      .withIndex("by_hazard", (q) => q.eq("hazardId", hazardId))
      .collect();
    const sorted = comments.sort((a, b) => a.createdAt - b.createdAt);
    return Promise.all(
      sorted.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        return { ...c, author: user?.name ?? user?.email ?? "Anonymous" };
      }),
    );
  },
});

/** Comment on a hazard alert: ground-truth reports from people on the ground. */
export const addComment = mutation({
  args: { hazardId: v.id("hazards"), body: v.string() },
  handler: async (ctx, { hazardId, body }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to comment.");
    const text = body.trim();
    if (!text) throw new Error("Comment cannot be empty.");
    return await ctx.db.insert("reportComments", {
      hazardId,
      userId,
      body: text,
      createdAt: Date.now(),
    });
  },
});

// ---------- Direct messages between community members ----------

/** Unread message count for the signed-in user (badge in the header). */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const inbox = await ctx.db
      .query("messages")
      .withIndex("by_to", (q) => q.eq("toId", userId))
      .collect();
    return inbox.filter((m) => m.readAt === undefined).length;
  },
});

/** The signed-in user's inbox with conversation partners resolved. */
export const listInbox = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const inbox = await ctx.db
      .query("messages")
      .withIndex("by_to", (q) => q.eq("toId", userId))
      .collect();
    const sent = await ctx.db
      .query("messages")
      .withIndex("by_from", (q) => q.eq("fromId", userId))
      .collect();

    // Group every message into a thread per conversation partner.
    const threads = new Map<
      string,
      { partnerId: typeof userId; lastBody: string; lastAt: number; unread: number }
    >();
    const touch = async (m: (typeof inbox)[number], incoming: boolean) => {
      const partnerId = incoming ? m.fromId : m.toId;
      const existing = threads.get(partnerId);
      const entry = existing ?? {
        partnerId,
        lastBody: m.body,
        lastAt: m.createdAt,
        unread: 0,
      };
      if (m.createdAt > entry.lastAt) {
        entry.lastAt = m.createdAt;
        entry.lastBody = m.body;
      }
      if (incoming && m.readAt === undefined) entry.unread += 1;
      threads.set(partnerId, entry);
    };
    for (const m of inbox) await touch(m, true);
    for (const m of sent) await touch(m, false);

    const list = [...threads.values()].sort((a, b) => b.lastAt - a.lastAt);
    return Promise.all(
      list.map(async (t) => {
        const user = await ctx.db.get(t.partnerId);
        return {
          partnerId: t.partnerId,
          partner: user?.name ?? user?.email ?? "Anonymous",
          lastBody: t.lastBody,
          lastAt: t.lastAt,
          unread: t.unread,
        };
      }),
    );
  },
});

/** Full two-way thread with one partner, oldest first. */
export const listThread = query({
  args: { partnerId: v.id("users") },
  handler: async (ctx, { partnerId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const inbox = await ctx.db
      .query("messages")
      .withIndex("by_to", (q) => q.eq("toId", userId))
      .collect()
      .then((rows) => rows.filter((m) => m.fromId === partnerId));
    const sent = await ctx.db
      .query("messages")
      .withIndex("by_from", (q) => q.eq("fromId", userId))
      .collect()
      .then((rows) => rows.filter((m) => m.toId === partnerId));
    return [...inbox, ...sent].sort((a, b) => a.createdAt - b.createdAt);
  },
});

/** All community members the signed-in user can start a conversation with. */
export const listMembers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      name: u.name ?? u.email ?? "Anonymous",
      isAnonymous: u.isAnonymous ?? false,
    }));
  },
});

/** Send a direct message. */
export const sendMessage = mutation({
  args: { toId: v.id("users"), body: v.string() },
  handler: async (ctx, { toId, body }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to send messages.");
    const text = body.trim();
    if (!text) throw new Error("Message cannot be empty.");
    return await ctx.db.insert("messages", {
      fromId: userId,
      toId,
      body: text,
      createdAt: Date.now(),
    });
  },
});

/** Mark every message from one partner as read. */
export const markThreadRead = mutation({
  args: { partnerId: v.id("users") },
  handler: async (ctx, { partnerId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const inbox = await ctx.db
      .query("messages")
      .withIndex("by_to", (q) => q.eq("toId", userId))
      .collect();
    const now = Date.now();
    for (const m of inbox) {
      if (m.fromId === partnerId && m.readAt === undefined) {
        await ctx.db.patch(m._id, { readAt: now });
      }
    }
  },
});

// ---------- Admin visibility ----------

/** Recent citizen check-ins for the admin area. Admin only. */
export const recentCheckins = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("checkins").collect();
    const sorted = rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
    return Promise.all(
      sorted.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        return { ...c, author: user?.name ?? user?.email ?? "Anonymous" };
      }),
    );
  },
});
