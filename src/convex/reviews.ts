import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/** All reviews for one catalog item, newest first. */
export const listByItem = query({
  args: { itemId: v.id("catalogItems") },
  handler: async (ctx, { itemId }) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_item", (q) => q.eq("catalogItemId", itemId))
      .collect();
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Leave a review on a catalog item. Signed-in customers only. */
export const add = mutation({
  args: {
    itemId: v.id("catalogItems"),
    rating: v.number(),
    body: v.string(),
  },
  handler: async (ctx, { itemId, rating, body }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to leave a review.");
    const clamped = Math.min(5, Math.max(1, Math.round(rating)));
    return await ctx.db.insert("reviews", {
      catalogItemId: itemId,
      userId,
      rating: clamped,
      body: body.trim(),
      createdAt: Date.now(),
    });
  },
});
