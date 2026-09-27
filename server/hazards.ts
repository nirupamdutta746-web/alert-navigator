import { v } from "convex/values";
import { query } from "./_generated/server";

/** Live hazard alerts, most severe first. */
export const listHazards = query({
  args: {},
  handler: async (ctx) => {
    const hazards = await ctx.db
      .query("hazards")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    const rank = { emergency: 0, warning: 1, watch: 2, advisory: 3 } as const;
    return hazards.sort((a, b) => rank[a.severity] - rank[b.severity] || b.issuedAt - a.issuedAt);
  },
});

/** All relief shelters. */
export const listShelters = query({
  args: {},
  handler: async (ctx) => {
    const shelters = await ctx.db.query("shelters").collect();
    return shelters.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/** All evacuation routes. */
export const listRoutes = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db.query("evacuationRoutes").collect();
    const rank = { clear: 0, congested: 1, blocked: 2 } as const;
    return routes.sort((a, b) => rank[a.status] - rank[b.status] || a.distanceKm - b.distanceKm);
  },
});
