import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertTriangle,
  ArrowRight,
  LifeBuoy,
  Radio,
  Route as RouteIcon,
  ShieldCheck,
  Siren,
  Tent,
  Waves,
} from "lucide-react";
import { Link } from "react-router";

const mockAlerts = [
  {
    chip: "EMERGENCY",
    chipClass: "bg-[#ff5c39] text-white",
    title: "River Mithi — flood warning",
    body: "Level 3.2m, danger mark 3.0m. Low-lying wards: move now.",
  },
  {
    chip: "WARNING",
    chipClass: "bg-[#ff9f1c] text-[#111111]",
    title: "Cyclone TEJAS — Cat 2",
    body: "Sustained winds 138 km/h. Landfall in 6–8 hours.",
  },
  {
    chip: "WATCH",
    chipClass: "bg-[#7cc4f2] text-[#111111]",
    title: "Cloudburst over the ghats",
    body: "Rainfall 82 mm/hr upstream. Runoff hits city in 2 hours.",
  },
];

const steps = [
  {
    icon: Radio,
    n: "01",
    title: "Sense",
    body: "River gauges, tide sensors and cyclone-track feeds stream into one alert engine.",
    bg: "bg-[#7cc4f2]",
  },
  {
    icon: AlertTriangle,
    n: "02",
    title: "Warn",
    body: "Severity escalates automatically as thresholds are crossed — watch, warning, emergency.",
    bg: "bg-[#ffd02f]",
  },
  {
    icon: RouteIcon,
    n: "03",
    title: "Guide",
    body: "Every alert comes with the nearest open shelter and a route that is actually passable.",
    bg: "bg-[#d9e8c5]",
  },
];

const features = [
  {
    icon: AlertTriangle,
    title: "Live hazard alerts",
    body: "Plain-language bulletins with severity chips, issued timestamps and expiry — no jargon, no noise.",
    bg: "bg-[#ffd02f]",
  },
  {
    icon: Waves,
    title: "Risk-zone map",
    body: "Flood and surge zones drawn as hard color blocks over your streets, with your pin placed inside them.",
    bg: "bg-[#7cc4f2]",
  },
  {
    icon: Tent,
    title: "Shelters & routes",
    body: "Live capacity bars for every relief shelter, plus evacuation routes flagged clear, congested or blocked.",
    bg: "bg-[#d9e8c5]",
  },
  {
    icon: LifeBuoy,
    title: "SOS check-ins",
    body: "One tap marks you safe, evacuating or needing help — queued on-device when networks drop.",
    bg: "bg-[#ff5c39] text-white",
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const dashTarget = isAuthenticated ? "/dashboard" : "/auth?returnTo=%2Fdashboard";

  return (
    <main className="min-h-screen bg-[#f4f2ec] text-[#111111]">
      {/* ============ Nav ============ */}
      <header className="border-b-2 border-[#111111]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 border-2 border-[#111111] bg-[#111111] px-2.5 py-1.5 text-white shadow-[3px_3px_0_0_#ffd02f]">
            <Siren className="size-4" />
            <span className="text-sm font-black uppercase tracking-widest">Stormwatch</span>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-2 border-[#111111] bg-white shadow-[3px_3px_0_0_#111111] hover:shadow-none"
          >
            <Link to={dashTarget}>Open dashboard</Link>
          </Button>
        </div>
      </header>

      {/* ============ Hero ============ */}
      <section className="border-b-2 border-[#111111]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 border-2 border-[#111111] bg-[#ffd02f] px-2 py-1 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_0_#111111]">
              <Radio className="size-3.5" />
              Flood · Cyclone · Storm surge
            </div>
            <h1 className="mt-5 text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">
              Know before
              <br />
              the water
              <span className="sw-underline decoration-[#ff5c39]"> rises</span>.
            </h1>
            <p className="mt-5 max-w-lg text-base font-semibold leading-relaxed text-[#111111]/80">
              StormWatch turns river gauges, tide sensors and cyclone tracks into one live map for
              citizens: hazard alerts as they escalate, risk zones over your streets, and the
              nearest shelter with a route that is still open.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="border-2 border-[#111111] bg-[#111111] px-6 text-base font-black uppercase tracking-wider text-white shadow-[4px_4px_0_0_#ffd02f] hover:shadow-none"
              >
                <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                  Get alerts now <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-[#111111] bg-white px-6 text-base font-black uppercase tracking-wider shadow-[4px_4px_0_0_#111111] hover:shadow-none"
              >
                <Link to={dashTarget}>See the live map</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Free for citizens", "SMS fallback offline", "OpenStreetMap based"].map((t) => (
                <span
                  key={t}
                  className="border-2 border-[#111111] bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Mock alert stack — visual proof of the product */}
          <div className="flex flex-col justify-center gap-3">
            {mockAlerts.map((a, i) => (
              <div
                key={a.chip}
                className="sw-card bg-white p-4"
                style={{ transform: `translateX(${i * 14}px)` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center border-2 border-[#111111] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${a.chipClass}`}
                  >
                    <AlertTriangle className="mr-1 size-3" />
                    {a.chip}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111]/50">
                    just now
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-black uppercase tracking-wide">{a.title}</h3>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-[#111111]/70">
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ How it works ============ */}
      <section className="border-b-2 border-[#111111] bg-[#ffd02f]">
        <div className="mx-auto w-full max-w-7xl px-4 py-12">
          <h2 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
            Sense → Warn → Guide
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="sw-card bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className={`flex size-10 items-center justify-center border-2 border-[#111111] ${s.bg}`}>
                    <s.icon className="size-5" />
                  </div>
                  <span className="text-3xl font-black text-[#111111]/15">{s.n}</span>
                </div>
                <h3 className="mt-3 text-lg font-black uppercase">{s.title}</h3>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-[#111111]/75">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ What you get ============ */}
      <section className="border-b-2 border-[#111111]">
        <div className="mx-auto w-full max-w-7xl px-4 py-12">
          <h2 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
            One screen when it matters
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="sw-card bg-white p-5">
                <div
                  className={`flex size-10 items-center justify-center border-2 border-[#111111] ${f.bg}`}
                >
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-3 text-base font-black uppercase">{f.title}</h3>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-[#111111]/75">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Trust strip ============ */}
      <section className="border-b-2 border-[#111111] bg-[#111111] text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          {[
            { icon: ShieldCheck, text: "Built on open map data" },
            { icon: Radio, text: "Alerts in under 5 minutes" },
            { icon: LifeBuoy, text: "Check-ins queue offline" },
            { icon: Tent, text: "Shelter capacity, live" },
          ].map((item) => (
            <span key={item.text} className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <item.icon className="size-4 text-[#ffd02f]" />
              {item.text}
            </span>
          ))}
        </div>
      </section>

      {/* ============ Final CTA ============ */}
      <section>
        <div className="mx-auto w-full max-w-7xl px-4 py-14">
          <div className="sw-card-lg bg-[#ff5c39] p-8 text-white sm:p-12">
            <h2 className="max-w-2xl text-3xl font-black uppercase leading-tight sm:text-4xl">
              When the siren sounds, three minutes decide everything.
            </h2>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-white/90">
              Sign up, drop your pin, and get flood and cyclone alerts with the nearest open shelter
              — before the roads close.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 border-2 border-[#111111] bg-[#ffd02f] px-6 text-base font-black uppercase tracking-wider text-[#111111] shadow-[4px_4px_0_0_#111111] hover:shadow-none"
            >
              <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                Create my alert feed <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="border-t-2 border-[#111111] bg-[#f4f2ec]">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5">
          <span className="text-xs font-bold uppercase tracking-widest">StormWatch</span>
          <span className="text-xs font-semibold text-[#111111]/60">
            Hackathon prototype · simulated sensor feed · OpenStreetMap tiles
          </span>
        </div>
      </footer>
    </main>
  );
}
