import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ROLES } from "./schema";

/** Throw unless the caller has the admin role. */
export async function requireAdmin(ctx: {
  db: {
    get: (id: any) => Promise<{ role?: string } | null>;
  };
}) {
  const userId = await getAuthUserId(ctx as never);
  if (!userId) throw new Error("Sign in first.");
  const user = await ctx.db.get(userId);
  if (user?.role !== ROLES.ADMIN) {
    throw new Error("Admin access required.");
  }
  return userId;
}

/** Is the signed-in user an admin? Drives the admin nav visibility. */
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    return user?.role === ROLES.ADMIN;
  },
});

/** All users with their roles. Admin only. */
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    return users
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role ?? ROLES.USER,
        isAnonymous: u.isAnonymous ?? false,
      }))
      .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
  },
});

/** Promote or demote a user between the "user" and "admin" roles. Admin only. */
export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal(ROLES.ADMIN), v.literal(ROLES.USER), v.literal(ROLES.MEMBER)),
  },
  handler: async (ctx, { userId, role }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(userId, { role });
  },
});
