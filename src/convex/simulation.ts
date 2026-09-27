import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * StormWatch simulation engine.
 *
 * A single `tick` mutation is called by the dashboard every few seconds.
 * It seeds the scenario on first run, then evolves it:
 *  - expires stale hazard alerts
 *  - escalates / de-escalates alert severities from simulated sensor readings
 *  - random-walks shelter occupancy and recomputes shelter status
 *  - occasionally flips evacuation route status (clear / congested / blocked)
 *
 * Math.random and Date.now are allowed inside mutations (not queries).
 */

const CYCLONE_NAMES = ["TEJAS", "GATI", "BIPARJOY", "MICHAUNG"];

function wave(now: number, period: number, min: number, max: number) {
  const t = (Math.sin((2 * Math.PI * now) / period) + 1) / 2; // 0..1
  return min + t * (max - min);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export const tick = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // ---------- first-run seed ----------
    const existingShelters = await ctx.db.query("shelters").collect();
    if (existingShelters.length === 0) {
      const seed = [
        {
          name: "St. Xavier High School",
          lat: 19.0656,
          lng: 72.8315,
          capacity: 850,
          occupancy: 240,
          kind: "school" as const,
          status: "open" as const,
          amenities: ["water", "first aid", "charging", "wheelchair access"],
        },
        {
          name: "Coastal Cyclone Shelter 7",
          lat: 19.033,
          lng: 72.8452,
          capacity: 1200,
          occupancy: 690,
          kind: "cyclone_shelter" as const,
          status: "filling" as const,
          amenities: ["water", "food", "generator", "medical team"],
        },
        {
          name: "Wardle Road Community Hall",
          lat: 19.076,
          lng: 72.8416,
          capacity: 500,
          occupancy: 460,
          kind: "community_hall" as const,
          status: "filling" as const,
          amenities: ["water", "first aid"],
        },
        {
          name: "Siddhivinayak Relief Camp",
          lat: 19.0176,
          lng: 72.8562,
          capacity: 600,
          occupancy: 0,
          kind: "temple" as const,
          status: "open" as const,
          amenities: ["food", "water", "child care"],
        },
        {
          name: "Marine Lines Stadium Annex",
          lat: 19.0769,
          lng: 72.8219,
          capacity: 2000,
          occupancy: 120,
          kind: "stadium" as const,
          status: "open" as const,
          amenities: ["water", "food", "medical team", "pet friendly", "charging"],
        },
      ];
      const inserted = [];
      for (const s of seed) inserted.push(await ctx.db.insert("shelters", s));

      const routes = [
        {
          name: "Route A — Hill Road Ridge Walk",
          toShelterId: inserted[0],
          path: [
            [19.0596, 72.8293],
            [19.0617, 72.8302],
            [19.0638, 72.8296],
            [19.0656, 72.8315],
          ],
          distanceKm: 1.2,
          status: "clear" as const,
          note: "Elevated road above flood line. Preferred for pedestrians.",
        },
        {
          name: "Route B — Causeway Shuttle Line",
          toShelterId: inserted[1],
          path: [
            [19.0582, 72.8347],
            [19.0498, 72.8383],
            [19.0421, 72.8409],
            [19.033, 72.8452],
          ],
          distanceKm: 3.4,
          status: "congested" as const,
          note: "Bus shuttle priority lane. Expect 25 min delay.",
        },
        {
          name: "Route C — Metro Underpass Link",
          toShelterId: inserted[4],
          path: [
            [19.0604, 72.8248],
            [19.0661, 72.8235],
            [19.0716, 72.8227],
            [19.0769, 72.8219],
          ],
          distanceKm: 2.6,
          status: "clear" as const,
          note: "Partially covered. Safe in heavy rain, high footfall.",
        },
        {
          name: "Route D — Low Bridge Shortcut",
          toShelterId: inserted[2],
          path: [
            [19.0631, 72.8372],
            [19.0684, 72.8389],
            [19.0732, 72.8404],
            [19.076, 72.8416],
          ],
          distanceKm: 1.8,
          status: "blocked" as const,
          note: "Rail underpass flooded — DO NOT USE. 1.1m water on road.",
        },
        {
          name: "Route E — Harbor Evacuation Corridor",
          toShelterId: inserted[3],
          path: [
            [19.0523, 72.8431],
            [19.0416, 72.8478],
            [19.0289, 72.8523],
            [19.0176, 72.8562],
          ],
          distanceKm: 4.5,
          status: "congested" as const,
          note: "Storm-surge zone. Vehicles only above 200mm clearance.",
        },
      ];
      for (const r of routes) await ctx.db.insert("evacuationRoutes", r);
    }

    // ---------- hazards: expire, then upsert the live scenario ----------
    const activeHazards = await ctx.db
      .query("hazards")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    for (const h of activeHazards) {
      if (h.expiresAt < now) await ctx.db.patch(h._id, { active: false });
    }

    const windKph = Math.round(wave(now, 90_000, 92, 165));
    const riverLevel = Number(wave(now, 140_000, 2.1, 3.4).toFixed(2));
    const rainMm = Math.round(wave(now, 70_000, 18, 96));
    const surgeM = Number(wave(now, 110_000, 1.2, 2.6).toFixed(1));

    const scenario = [
      {
        key: "cyclone",
        title: `Cyclone ${CYCLONE_NAMES[Math.floor(now / 600_000) % CYCLONE_NAMES.length]} — Category ${windKph > 140 ? 3 : 2} approaching coast`,
        hazardType: "cyclone" as const,
        severity: windKph > 150 ? ("emergency" as const) : windKph > 130 ? ("warning" as const) : ("watch" as const),
        message: `Sustained winds ${windKph} km/h. Landfall estimate ${windKph > 150 ? "under 3 hours" : "6–8 hours"}. Coastal wards: move inland now.`,
        ttlMs: 30 * 60_000,
      },
      {
        key: "flood",
        title: "River Mithi — flood warning",
        hazardType: "flood" as const,
        severity: riverLevel > 3.1 ? ("emergency" as const) : riverLevel > 2.7 ? ("warning" as const) : ("watch" as const),
        message: `River level ${riverLevel} m (danger mark 3.0 m). Low-lying wards face ${riverLevel > 3.0 ? "imminent" : "possible"} inundation within ${riverLevel > 3.0 ? "30" : "90"} minutes.`,
        ttlMs: 25 * 60_000,
      },
      {
        key: "rain",
        title: "Cloudburst over the ghats",
        hazardType: "heavy_rain" as const,
        severity: rainMm > 75 ? ("warning" as const) : ("watch" as const),
        message: `Rainfall ${rainMm} mm/hr upstream. Runoff expected to hit the city within 2 hours. Avoid basements and underpasses.`,
        ttlMs: 20 * 60_000,
      },
      {
        key: "surge",
        title: "Storm surge advisory — high tide",
        hazardType: "storm_surge" as const,
        severity: surgeM > 2.2 ? ("warning" as const) : ("advisory" as const),
        message: `Surge of ${surgeM} m above normal tide expected. Seafront roads will overtop at high tide. Stay off promenades.`,
        ttlMs: 40 * 60_000,
      },
    ];

    for (const s of scenario) {
      // Keep one live alert per hazard type: replace older rows of same type.
      const sameType = activeHazards.filter((h) => h.hazardType === s.hazardType);
      if (sameType.length === 0) {
        await ctx.db.insert("hazards", {
          title: s.title,
          hazardType: s.hazardType,
          severity: s.severity,
          message: s.message,
          issuedAt: now,
          expiresAt: now + s.ttlMs,
          active: true,
        });
      } else {
        const primary = sameType[0];
        await ctx.db.patch(primary._id, {
          title: s.title,
          severity: s.severity,
          message: s.message,
          expiresAt: Math.max(primary.issuedAt, now - 1000) + s.ttlMs,
          active: true,
        });
        for (const dup of sameType.slice(1)) {
          await ctx.db.patch(dup._id, { active: false });
        }
      }
    }

    // ---------- shelters: occupancy random walk ----------
    const shelters = await ctx.db.query("shelters").collect();
    for (const s of shelters) {
      const delta = Math.round((Math.random() - 0.35) * 40); // net inflow bias
      const occupancy = clamp(s.occupancy + delta, 0, s.capacity);
      const ratio = occupancy / s.capacity;
      const status =
        ratio >= 0.95 ? ("full" as const) : ratio >= 0.5 ? ("filling" as const) : ("open" as const);
      await ctx.db.patch(s._id, { occupancy, status });
    }

    // ---------- routes: occasional status flips ----------
    const routes = await ctx.db.query("evacuationRoutes").collect();
    for (const r of routes) {
      if (Math.random() < 0.12) {
        const roll = Math.random();
        const status = roll < 0.6 ? ("clear" as const) : roll < 0.9 ? ("congested" as const) : ("blocked" as const);
        if (status !== r.status) await ctx.db.patch(r._id, { status });
      }
    }

    return { at: now };
  },
});
