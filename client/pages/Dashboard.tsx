import { Button } from "@/components/ui/button";
import HazardMap from "@/components/HazardMap";
import { useAuth } from "@/hooks/use-auth";
import {
  distanceKm,
  FALLBACK_ROUTES,
  FALLBACK_SHELTERS,
  HOME,
  SEVERITY_LABEL,
  zoneAt,
  type EvacuationRoute,
  type Shelter,
} from "@/lib/stormData";
import { routeChip, severityChip, shelterChip } from "@/lib/stormTheme";
import { api } from "@server/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ChevronRight,
  CircleDot,
  CloudLightning,
  Heart,
  Home,
  LifeBuoy,
  LogOut,
  MapPin,
  Route,
  Siren,
  Tent,
  Waves,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

const hazardIcon = {
  flood: Waves,
  cyclone: CloudLightning,
  heavy_rain: CloudLightning,
  storm_surge: Waves,
} as const;

const checkInIcon = {
  safe: Heart,
  evacuating: Tent,
  need_help: Siren,
} as const;

const checkInLabel = {
  safe: "I AM SAFE",
  evacuating: "EVACUATING",
  need_help: "NEED HELP",
} as const;

const checkInToast = {
  safe: "Check-in recorded — marked SAFE.",
  evacuating: "Check-in recorded — you are EVACUATING. Follow a green route.",
  need_help: "SOS recorded — marked NEED HELP. Nearby shelters notified.",
} as const;

const checkInChip = {
  safe: "bg-[#d9e8c5] text-[#111111]",
  evacuating: "bg-[#ffd02f] text-[#111111]",
  need_help: "bg-[#ff5c39] text-white",
} as const;

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center border-2 border-[#111111] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      {children}
    </span>
  );
}

function CapacityBar({ occupancy, capacity }: { occupancy: number; capacity: number }) {
  const pct = Math.min(100, Math.round((occupancy / capacity) * 100));
  const color = pct >= 95 ? "#ff5c39" : pct >= 50 ? "#ffd02f" : "#2e7d32";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 flex-1 border-2 border-[#111111] bg-[#f4f2ec]">
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-20 text-right text-[11px] font-bold tabular-nums">
        {occupancy}/{capacity}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const rawHazards = useQuery(api.hazards.listHazards) ?? [];
  const rawShelters = useQuery(api.hazards.listShelters) ?? [];
  const rawRoutes = useQuery(api.hazards.listRoutes) ?? [];
  const myCheckIn = useQuery(api.checkins.myLatest);
  const pulse = useQuery(api.checkins.recentCount);
  const unread = useQuery(api.community.unreadCount);
  const isAdmin = useQuery(api.admin.isAdmin);
  const tick = useMutation(api.simulation.tick);
  const fileCheckIn = useMutation(api.checkins.checkIn);

  // Drive the simulated sensor network: seed on mount, evolve every 4s.
  useEffect(() => {
    void tick();
    const t = setInterval(() => void tick(), 4000);
    return () => clearInterval(t);
  }, [tick]);

  const [focusShelterId, setFocusShelterId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [online, setOnline] = useState(() => navigator.onLine);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      clearInterval(clock);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const shelters: Shelter[] = useMemo(
    () =>
      rawShelters.length > 0
        ? rawShelters.map((s) => ({ ...s, id: s._id }))
        : FALLBACK_SHELTERS,
    [rawShelters],
  );

  const routes: EvacuationRoute[] = useMemo(
    () =>
      rawRoutes.length > 0
        ? rawRoutes.map((r) => ({
            ...r,
            id: r._id,
            path: r.path as [number, number][],
          }))
        : FALLBACK_ROUTES,
    [rawRoutes],
  );

  const myZone = useMemo(() => zoneAt(HOME), []);
  const topHazard = rawHazards[0] ?? null;
  const sortedShelters = useMemo(
    () =>
      [...shelters].sort(
        (a, b) =>
          distanceKm(HOME, [a.lat, a.lng]) - distanceKm(HOME, [b.lat, b.lng]),
      ),
    [shelters],
  );

  const handleCheckIn = async (status: "safe" | "evacuating" | "need_help") => {
    setSending(true);
    try {
      await fileCheckIn({ lat: HOME[0], lng: HOME[1], status });
      toast.success(checkInToast[status]);
    } catch {
      toast.error("Could not record check-in. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-[#f4f2ec] text-[#111111]">
      {/* ============ Top bar ============ */}
      <header className="sticky top-0 z-[600] border-b-2 border-[#111111] bg-[#f4f2ec]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border-2 border-[#111111] bg-[#111111] px-2.5 py-1.5 text-white shadow-[3px_3px_0_0_#ffd02f]">
              <Siren className="size-4" />
              <span className="text-sm font-black uppercase tracking-widest">
                Alert Navigator
              </span>
            </div>
            <Chip className="bg-[#7cc4f2]">
              <CircleDot className="mr-1 size-3 animate-pulse" />
              Live
            </Chip>
          </div>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1.5 lg:flex">
              {[
                { to: "/dashboard", label: "Live map", badge: 0 },
                { to: "/catalog", label: "Survival guide", badge: 0 },
                { to: "/messages", label: "Messages", badge: unread ?? 0 },
                ...(isAdmin ? [{ to: "/admin", label: "Admin", badge: 0 }] : []),
              ].map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="relative border-2 border-[#111111] bg-white px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-[3px_3px_0_0_#111111] hover:bg-[#ffd02f] hover:shadow-none"
                >
                  {n.label}
                  {n.badge > 0 && (
                    <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center border-2 border-[#111111] bg-[#ff5c39] text-[9px] font-black text-white">
                      {n.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <Chip className={online ? "bg-[#d9e8c5]" : "bg-[#ff5c39] text-white"}>
              {online ? <Wifi className="mr-1 size-3" /> : <WifiOff className="mr-1 size-3" />}
              {online ? "Network OK" : "Offline — SMS fallback"}
            </Chip>
            <span className="hidden border-2 border-[#111111] bg-white px-2 py-1 text-xs font-bold tabular-nums sm:inline-block">
              {now.toLocaleTimeString()}
            </span>
            {user?.name || user?.email ? (
              <span className="hidden max-w-32 truncate text-xs font-semibold md:inline-block">
                {user?.name ?? user?.email}
              </span>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5 border-2 border-[#111111] bg-white shadow-[3px_3px_0_0_#111111] hover:shadow-none"
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </div>
        </div>

        {/* ============ Live hazard ticker ============ */}
        <div className="border-t-2 border-[#111111] bg-[#111111] text-white">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 overflow-x-auto px-4 py-2">
            <span className="shrink-0 bg-[#ffd02f] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#111111]">
              Alerts
            </span>
            {rawHazards.length === 0 ? (
              <span className="text-xs font-semibold text-white/80">
                Monitoring sensor grid… no active bulletins yet.
              </span>
            ) : (
              rawHazards.map((h) => {
                const Icon = hazardIcon[h.hazardType];
                const sevBg =
                  h.severity === "emergency"
                    ? "bg-[#ff5c39]"
                    : h.severity === "warning"
                      ? "bg-[#ff9f1c] text-[#111111]"
                      : h.severity === "watch"
                        ? "bg-[#7cc4f2] text-[#111111]"
                        : "bg-[#d9e8c5] text-[#111111]";
                return (
                  <span
                    key={h._id}
                    className="flex shrink-0 items-center gap-2 text-xs font-semibold"
                  >
                    <Icon className="size-3.5" />
                    <span className={`px-1 py-0.5 text-[10px] font-black uppercase ${sevBg}`}>
                      {SEVERITY_LABEL[h.severity]}
                    </span>
                    {h.title}
                    <span className="text-white/40">•</span>
                  </span>
                );
              })
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        {/* ============ Status strip ============ */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sw-card bg-[#ff5c39] p-4 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest">Your zone</p>
            <p className="mt-1 text-lg font-black leading-tight">
              {myZone ? myZone.name : "Outside mapped zones"}
            </p>
            <p className="mt-0.5 text-xs font-semibold">
              {myZone
                ? `${SEVERITY_LABEL[myZone.severity]} — ${myZone.reason}`
                : "No flood or surge risk detected at your pin."}
            </p>
          </div>
          <div className="sw-card bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-widest">Top alert</p>
            <p className="mt-1 text-lg font-black leading-tight">
              {topHazard ? topHazard.title : "All clear"}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-[#111111]/70">
              {topHazard ? SEVERITY_LABEL[topHazard.severity] : "No active bulletins"}
            </p>
          </div>
          <div className="sw-card bg-[#ffd02f] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest">Shelters open</p>
            <p className="mt-1 text-lg font-black leading-tight">
              {shelters.filter((s) => s.status !== "full" && s.status !== "closed").length} of{" "}
              {shelters.length}
            </p>
            <p className="mt-0.5 text-xs font-semibold">
              {shelters.reduce((a, s) => a + (s.capacity - s.occupancy), 0).toLocaleString()} free
              beds
            </p>
          </div>
          <div className="sw-card bg-[#7cc4f2] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest">Community pulse</p>
            <p className="mt-1 text-lg font-black leading-tight">
              {pulse ? `${pulse.total} check-ins` : "No check-ins yet"}
            </p>
            <p className="mt-0.5 text-xs font-semibold">
              {pulse
                ? `${pulse.safe} safe · ${pulse.evacuating} moving · ${pulse.needHelp} need help`
                : "Be the first to report status."}
            </p>
          </div>
        </section>

        {/* ============ Map + alerts ============ */}
        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="sw-card overflow-hidden bg-white p-0">
            <div className="flex items-center justify-between border-b-2 border-[#111111] bg-white px-4 py-2.5">
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <MapPin className="size-4" /> Risk map
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#111111]/60">
                Zones · routes · shelters
              </p>
            </div>
            <div className="h-[420px] lg:h-[560px]">
              <HazardMap
                shelters={shelters}
                routes={routes}
                focusShelterId={focusShelterId}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Live hazard alerts */}
            <div className="sw-card bg-white p-0">
              <div className="flex items-center gap-2 border-b-2 border-[#111111] bg-[#ffd02f] px-4 py-2.5">
                <AlertTriangle className="size-4" />
                <p className="text-sm font-black uppercase tracking-widest">Live hazard alerts</p>
              </div>
              <div className="max-h-72 space-y-3 overflow-y-auto p-3">
                {rawHazards.length === 0 && (
                  <p className="p-2 text-xs font-semibold text-[#111111]/60">
                    Sensor grid warming up… bulletins appear here within seconds.
                  </p>
                )}
                {rawHazards.map((h) => {
                  const Icon = hazardIcon[h.hazardType];
                  return (
                    <article key={h._id} className="sw-flat bg-[#f4f2ec] p-3">
                      <div className="flex items-center gap-2">
                        <Chip className={severityChip[h.severity]}>
                          <Icon className="mr-1 size-3" />
                          {SEVERITY_LABEL[h.severity]}
                        </Chip>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111]/50">
                          {new Date(h.issuedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-sm font-black leading-snug">{h.title}</h3>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-[#111111]/80">
                        {h.message}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* SOS check-in */}
            <div className="sw-card bg-white p-0">
              <div className="flex items-center gap-2 border-b-2 border-[#111111] bg-[#ff5c39] px-4 py-2.5 text-white">
                <LifeBuoy className="size-4" />
                <p className="text-sm font-black uppercase tracking-widest">Check in / SOS</p>
              </div>
              <div className="space-y-3 p-3">
                {myCheckIn && (
                  <p className="flex items-center gap-2 text-xs font-semibold">
                    Last status:
                    <Chip className={checkInChip[myCheckIn.status]}>
                      {checkInLabel[myCheckIn.status]}
                    </Chip>
                    {new Date(myCheckIn.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {(["safe", "evacuating", "need_help"] as const).map((key) => {
                    const Icon = checkInIcon[key];
                    return (
                      <button
                        key={key}
                        disabled={sending}
                        onClick={() => void handleCheckIn(key)}
                        className={`sw-press flex flex-col items-center gap-1.5 border-2 border-[#111111] px-2 py-3 text-[10px] font-black uppercase tracking-wider shadow-[3px_3px_0_0_#111111] disabled:opacity-50 ${
                          key === "need_help" ? "bg-[#ff5c39] text-white" : "bg-[#f4f2ec]"
                        }`}
                      >
                        <Icon className="size-5" />
                        {checkInLabel[key]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] font-medium leading-relaxed text-[#111111]/60">
                  Works offline in the field — reports queue on the device and sync when a signal
                  returns. Needs-help pings surface to coordinators with your pin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ Shelters + routes ============ */}
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Shelters */}
          <div className="sw-card bg-white p-0">
            <div className="flex items-center gap-2 border-b-2 border-[#111111] bg-[#d9e8c5] px-4 py-2.5">
              <Home className="size-4" />
              <p className="text-sm font-black uppercase tracking-widest">Shelters near you</p>
            </div>
            <div className="divide-y-2 divide-[#111111]">
              {sortedShelters.map((s) => {
                const km = distanceKm(HOME, [s.lat, s.lng]);
                return (
                  <div key={s.id} className="flex items-start gap-3 p-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center border-2 border-[#111111] bg-[#f4f2ec]">
                      <Home className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-black">{s.name}</h3>
                        <Chip className={shelterChip[s.status]}>{s.status}</Chip>
                      </div>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#111111]/60">
                        {s.kind.replace(/_/g, " ")} · {km.toFixed(1)} km away ·{" "}
                        {s.amenities.slice(0, 3).join(" · ")}
                      </p>
                      <div className="mt-1.5">
                        <CapacityBar occupancy={s.occupancy} capacity={s.capacity} />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1 self-center border-2 border-[#111111] bg-white px-2 shadow-[3px_3px_0_0_#111111] hover:shadow-none"
                      onClick={() => setFocusShelterId(s.id)}
                    >
                      View <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Routes */}
          <div className="sw-card bg-white p-0">
            <div className="flex items-center gap-2 border-b-2 border-[#111111] bg-[#7cc4f2] px-4 py-2.5">
              <Route className="size-4" />
              <p className="text-sm font-black uppercase tracking-widest">Evacuation routes</p>
            </div>
            <div className="divide-y-2 divide-[#111111]">
              {routes.map((r) => {
                const dest = shelters.find((s) => s.id === r.toShelterId);
                return (
                  <div key={r.id} className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black">{r.name}</h3>
                      <Chip className={routeChip[r.status]}>{r.status}</Chip>
                      <span className="text-[11px] font-bold tabular-nums text-[#111111]/60">
                        {r.distanceKm.toFixed(1)} km
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-[#111111]/80">
                      {r.note}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#111111]/50">
                      <Tent className="size-3" />
                      to {dest ? dest.name : "shelter"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============ Footer note ============ */}
        <footer className="mt-6 mb-8 border-2 border-dashed border-[#111111] bg-white p-4">
          <p className="text-[11px] font-semibold leading-relaxed text-[#111111]/70">
            <span className="font-black uppercase tracking-widest">How this works for real:</span>{" "}
            river gauges, tide sensors and cyclone-track feeds push readings into the alert engine;
            severity escalates automatically as thresholds are crossed. Citizens see the same
            reactive map coordinators use, and check-ins still queue when mobile networks drop,
            syncing over SMS/USSD gateways.
          </p>
        </footer>
      </div>
    </main>
  );
}
