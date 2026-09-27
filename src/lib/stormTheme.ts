/** Neobrutalist design tokens for StormWatch. */

export const SW = {
  ink: "#111111",
  paper: "#f4f2ec",
  sun: "#ffd02f",
  sky: "#7cc4f2",
  danger: "#ff5c39",
  sage: "#d9e8c5",
} as const;

/** Map risk-zone fill + stroke by severity. */
export const severityColor: Record<string, string> = {
  emergency: SW.danger,
  warning: "#ff9f1c",
  watch: SW.sky,
  advisory: SW.sage,
};

/** Shelter marker color by status. */
export const shelterColor: Record<string, string> = {
  open: SW.sage,
  filling: SW.sun,
  full: SW.danger,
  closed: "#9a9a9a",
};

/** Evacuation route color by status. */
export const routeColor: Record<string, string> = {
  clear: "#2e7d32",
  congested: "#ff9f1c",
  blocked: SW.danger,
};

/** Tailwind classes for severity chips on cards. */
export const severityChip: Record<string, string> = {
  emergency: "bg-[#ff5c39] text-white",
  warning: "bg-[#ff9f1c] text-[#111111]",
  watch: "bg-[#7cc4f2] text-[#111111]",
  advisory: "bg-[#d9e8c5] text-[#111111]",
};

/** Tailwind classes for shelter status chips. */
export const shelterChip: Record<string, string> = {
  open: "bg-[#d9e8c5] text-[#111111]",
  filling: "bg-[#ffd02f] text-[#111111]",
  full: "bg-[#ff5c39] text-white",
  closed: "bg-[#9a9a9a] text-white",
};

/** Tailwind classes for route status chips. */
export const routeChip: Record<string, string> = {
  clear: "bg-[#2e7d32] text-white",
  congested: "bg-[#ff9f1c] text-[#111111]",
  blocked: "bg-[#ff5c39] text-white",
};
