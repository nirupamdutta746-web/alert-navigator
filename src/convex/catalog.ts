import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./admin";

/** Browse the published preparedness catalog, with optional search + category filter. */
export const listPublished = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("emergency_kit"),
        v.literal("sensor_device"),
        v.literal("safety_gear"),
        v.literal("guide"),
        v.literal("training"),
      ),
    ),
  },
  handler: async (ctx, { search, category }) => {
    let items = await ctx.db
      .query("catalogItems")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();

    if (category) items = items.filter((i) => i.category === category);
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q),
      );
    }
    return items.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Full catalog for the admin area, including unpublished drafts. */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const items = await ctx.db.query("catalogItems").collect();
    return items.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Create or update a catalog item. Admin only. */
export const upsert = mutation({
  args: {
    id: v.optional(v.id("catalogItems")),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("emergency_kit"),
      v.literal("sensor_device"),
      v.literal("safety_gear"),
      v.literal("guide"),
      v.literal("training"),
    ),
    price: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { id, ...data }) => {
    await requireAdmin(ctx);
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    }
    return await ctx.db.insert("catalogItems", {
      ...data,
      createdAt: Date.now(),
    });
  },
});

/** Remove a catalog item and its reviews. Admin only. */
export const remove = mutation({
  args: { id: v.id("catalogItems") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    for (const r of await ctx.db
      .query("reviews")
      .withIndex("by_item", (q) => q.eq("catalogItemId", id))
      .collect()) {
      await ctx.db.delete(r._id);
    }
    await ctx.db.delete(id);
  },
});
