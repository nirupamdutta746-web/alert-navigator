import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

/** My most recent check-in, so the dashboard can show current state. */
export const myLatest = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    const rows = await ctx.db
      .query("checkins")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);
    return rows[0] ?? null;
  },
});

/** Recent check-ins across all citizens (community pulse). */
export const recentCount = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("checkins").collect();
    const safe = rows.filter((r) => r.status === "safe").length;
    const evacuating = rows.filter((r) => r.status === "evacuating").length;
    const needHelp = rows.filter((r) => r.status === "need_help").length;
    return { total: rows.length, safe, evacuating, needHelp };
  },
});

/** Record a citizen check-in at the given coordinates. */
export const checkIn = mutation({
  args: {
    lat: v.number(),
    lng: v.number(),
    status: v.union(
      v.literal("safe"),
      v.literal("evacuating"),
      v.literal("need_help"),
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { lat, lng, status, note }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Sign in to file a check-in.");
    const id = await ctx.db.insert("checkins", {
      userId,
      lat,
      lng,
      status,
      note,
      createdAt: Date.now(),
    });
    return id;
  },
});
