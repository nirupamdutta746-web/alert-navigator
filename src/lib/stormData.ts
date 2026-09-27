/**
 * StormWatch — simulated flood / cyclone scenario for a demo city.
 *
 * Risk zones are polygons over a small coastal metro (Mumbai-like geography,
 * generic ward names). Severity is a 4-step scale: advisory → watch →
 * warning → emergency, mirroring IMD-style public bulletins.
 */

export type Severity = "advisory" | "watch" | "warning" | "emergency";

export type RiskZone = {
  id: string;
  name: string;
  severity: Severity;
  reason: string;
  /** [lat, lng] polygon ring */
  polygon: [number, number][];
};

export type Shelter = {
  id: string;
  name: string;
  kind: "school" | "community_hall" | "cyclone_shelter" | "temple" | "stadium";
  lat: number;
  lng: number;
  capacity: number;
  occupancy: number;
  status: "open" | "filling" | "full" | "closed";
  amenities: string[];
};

export type EvacuationRoute = {
  id: string;
  name: string;
  toShelterId: string;
  path: [number, number][];
  distanceKm: number;
  status: "clear" | "congested" | "blocked";
  note: string;
};

/** The severity ladder — higher number = more urgent. */
export const SEVERITY_RANK: Record<Severity, number> = {
  advisory: 0,
  watch: 1,
  warning: 2,
  emergency: 3,
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  advisory: "ADVISORY",
  watch: "WATCH",
  warning: "WARNING",
  emergency: "EMERGENCY",
};

export const RISK_ZONES: RiskZone[] = [
  {
    id: "z-dharavi",
    name: "M-East Lowlands",
    severity: "emergency",
    reason: "Riverine flood — water above 1.2m on roads",
    polygon: [
      [19.0499, 72.8547],
      [19.0556, 72.8601],
      [19.0512, 72.8663],
      [19.0441, 72.8618],
      [19.0466, 72.8565],
    ],
  },
  {
    id: "z-dockyard",
    name: "Harbor South",
    severity: "warning",
    reason: "Storm surge + high tide overtopping",
    polygon: [
      [19.0321, 72.8421],
      [19.0368, 72.8489],
      [19.0301, 72.8532],
      [19.0246, 72.8477],
    ],
  },
  {
    id: "z-bandra",
    name: "Creek West",
    severity: "warning",
    reason: "Creek inundation at 3.0m river mark",
    polygon: [
      [19.0588, 72.8341],
      [19.0632, 72.8401],
      [19.0577, 72.8448],
      [19.0529, 72.8392],
    ],
  },
  {
    id: "z-midtown",
    name: "Midtown Ridge",
    severity: "watch",
    reason: "Runoff pooling on low underpasses",
    polygon: [
      [19.0662, 72.8311],
      [19.0708, 72.8361],
      [19.0668, 72.8405],
      [19.0621, 72.8355],
    ],
  },
  {
    id: "z-hills",
    name: "High Ground",
    severity: "advisory",
    reason: "Heavy rain, no flooding expected",
    polygon: [
      [19.0741, 72.8231],
      [19.0782, 72.8281],
      [19.0746, 72.8331],
      [19.0701, 72.8281],
    ],
  },
];

/** Static fallback shelters (used if Convex seed has not run yet). */
export const FALLBACK_SHELTERS: Shelter[] = [
  {
    id: "s-1",
    name: "St. Xavier High School",
    kind: "school",
    lat: 19.0656,
    lng: 72.8315,
    capacity: 850,
    occupancy: 240,
    status: "open",
    amenities: ["water", "first aid", "charging"],
  },
  {
    id: "s-2",
    name: "Coastal Cyclone Shelter 7",
    kind: "cyclone_shelter",
    lat: 19.033,
    lng: 72.8452,
    capacity: 1200,
    occupancy: 690,
    status: "filling",
    amenities: ["water", "food", "generator", "medical team"],
  },
  {
    id: "s-3",
    name: "Wardle Road Community Hall",
    kind: "community_hall",
    lat: 19.076,
    lng: 72.8416,
    capacity: 500,
    occupancy: 460,
    status: "filling",
    amenities: ["water", "first aid"],
  },
  {
    id: "s-4",
    name: "Siddhivinayak Relief Camp",
    kind: "temple",
    lat: 19.0176,
    lng: 72.8562,
    capacity: 600,
    occupancy: 0,
    status: "open",
    amenities: ["food", "water", "child care"],
  },
  {
    id: "s-5",
    name: "Marine Lines Stadium Annex",
    kind: "stadium",
    lat: 19.0769,
    lng: 72.8219,
    capacity: 2000,
    occupancy: 120,
    status: "open",
    amenities: ["water", "food", "medical team", "pet friendly"],
  },
];

export const FALLBACK_ROUTES: EvacuationRoute[] = [
  {
    id: "r-1",
    name: "Route A — Hill Road Ridge Walk",
    toShelterId: "s-1",
    path: [
      [19.0596, 72.8293],
      [19.0617, 72.8302],
      [19.0638, 72.8296],
      [19.0656, 72.8315],
    ],
    distanceKm: 1.2,
    status: "clear",
    note: "Elevated road above flood line. Preferred for pedestrians.",
  },
  {
    id: "r-2",
    name: "Route B — Causeway Shuttle Line",
    toShelterId: "s-2",
    path: [
      [19.0582, 72.8347],
      [19.0498, 72.8383],
      [19.0421, 72.8409],
      [19.033, 72.8452],
    ],
    distanceKm: 3.4,
    status: "congested",
    note: "Bus shuttle priority lane. Expect 25 min delay.",
  },
  {
    id: "r-3",
    name: "Route C — Metro Underpass Link",
    toShelterId: "s-5",
    path: [
      [19.0604, 72.8248],
      [19.0661, 72.8235],
      [19.0716, 72.8227],
      [19.0769, 72.8219],
    ],
    distanceKm: 2.6,
    status: "clear",
    note: "Partially covered. Safe in heavy rain, high footfall.",
  },
  {
    id: "r-4",
    name: "Route D — Low Bridge Shortcut",
    toShelterId: "s-3",
    path: [
      [19.0631, 72.8372],
      [19.0684, 72.8389],
      [19.0732, 72.8404],
      [19.076, 72.8416],
    ],
    distanceKm: 1.8,
    status: "blocked",
    note: "Rail underpass flooded — DO NOT USE. 1.1m water on road.",
  },
  {
    id: "r-5",
    name: "Route E — Harbor Evacuation Corridor",
    toShelterId: "s-4",
    path: [
      [19.0523, 72.8431],
      [19.0416, 72.8478],
      [19.0289, 72.8523],
      [19.0176, 72.8562],
    ],
    distanceKm: 4.5,
    status: "congested",
    note: "Storm-surge zone. Vehicles only above 200mm clearance.",
  },
];

/** Demo home position for the citizen (Dadar-like location). */
export const HOME: [number, number] = [19.0596, 72.8293];

/** Haversine distance in km. */
export function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** True if point is inside polygon (ray casting). */
export function pointInPolygon(point: [number, number], polygon: [number, number][]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** The zone a point falls in, if any. */
export function zoneAt(point: [number, number]) {
  return RISK_ZONES.find((z) => pointInPolygon(point, z.polygon)) ?? null;
}
