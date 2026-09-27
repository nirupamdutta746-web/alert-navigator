import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  BatteryCharging,
  BookOpen,
  CheckCircle2,
  CloudRain,
  Cross,
  Flame,
  HeartPulse,
  Home,
  Package,
  Radio,
  Siren,
  Tent,
  Waves,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

type GuideSection = {
  id: string;
  label: string;
  icon: typeof Siren;
  chip: string;
  title: string;
  intro: string;
};

const SECTIONS: GuideSection[] = [
  {
    id: "before",
    label: "Before",
    icon: Package,
    chip: "bg-[#7cc4f2]",
    title: "Prepare before disaster strikes",
    intro:
      "Most survival is decided before the emergency begins. Build your plan and your kit while the sky is still clear.",
  },
  {
    id: "during",
    label: "During",
    icon: Siren,
    chip: "bg-[#ffd02f]",
    title: "When the warning is issued",
    intro:
      "Act early and act deliberately. Minutes matter — do not wait for confirmation before moving to safety.",
  },
  {
    id: "after",
    label: "After",
    icon: Home,
    chip: "bg-[#d9e8c5]",
    title: "After the immediate danger passes",
    intro:
      "The aftermath holds its own hazards: floodwater, damaged buildings, and contaminated supplies. Stay alert until officials clear your area.",
  },
] as const;

type GuideItem = { text: string; sub?: string };

const STEP_LISTS: Record<(typeof SECTIONS)[number]["id"], GuideItem[]> = {
  before: [
    {
      text: "Know your risk",
      sub: "Find out if your home sits in a flood, storm-surge or cyclone zone, and learn your community's warning signals.",
    },
    {
      text: "Make a family plan",
      sub: "Agree on a meeting point, an out-of-town contact, and who collects the children or elderly members.",
    },
    {
      text: "Plan two evacuation routes",
      sub: "Practice walking or driving them so they work even in the dark or under stress.",
    },
    {
      text: "Learn how to shut off utilities",
      sub: "Gas, water and electricity — show everyone in the house where the switches and valves are.",
    },
    {
      text: "Prepare documents",
      sub: "IDs, insurance papers and medical records in a waterproof pouch, plus photos on your phone.",
    },
    {
      text: "Sign up for official alerts",
      sub: "Keep this app installed and enable notifications so warnings reach you even at night.",
    },
  ],
  during: [
    {
      text: "Follow official instructions immediately",
      sub: "If evacuation is ordered, leave at once — late evacuations are the single biggest cause of storm deaths.",
    },
    {
      text: "Move to the safest place indoors",
      sub: "For floods: highest floor. For cyclones: a small interior room on the lowest level, away from windows.",
    },
    {
      text: "Never walk or drive through floodwater",
      sub: "15 cm of moving water can knock you down; 60 cm can carry a car away. Turn around, don't drown.",
    },
    {
      text: "Stay away from windows and glass",
      sub: "Flying debris is the most common injury in high winds.",
    },
    {
      text: "Keep your phone and radio on",
      sub: "Conserve battery with low-power mode; listen for updates instead of going outside to check.",
    },
    {
      text: "Drop, cover and hold on in an earthquake",
      sub: "If the ground shakes, get under sturdy furniture and hold until the shaking stops.",
    },
  ],
  after: [
    {
      text: "Wait for the all-clear",
      sub: "Cyclones have a calm 'eye' — going outside during it traps people when winds return.",
    },
    {
      text: "Treat all floodwater as contaminated",
      sub: "It carries sewage, chemicals and live wires. Wash any skin that touches it.",
    },
    {
      text: "Check for gas leaks and damaged wires",
      sub: "Smell gas or see sparks? Leave immediately and report it from a safe distance.",
    },
    {
      text: "Never use generators indoors",
      sub: "Carbon monoxide kills silently. Keep generators outside, far from windows and doors.",
    },
    {
      text: "Report your status",
      sub: "Use the check-in feature so family and responders know you're safe, reducing rescue load.",
    },
    {
      text: "Photograph damage before cleanup",
      sub: "It documents losses for insurance claims and official assistance.",
    },
  ],
};

const DO_DONT: Record<(typeof SECTIONS)[number]["id"], { dos: string[]; donts: string[] }> = {
  before: {
    dos: [
      "Keep fuel tanks at least half full all season",
      "Store extra water — one gallon (4 L) per person per day, minimum 3 days",
      "Practice your plan with the whole household, including pets",
    ],
    donts: [
      "Don't wait for an official order to start preparing",
      "Don't store all supplies in one place — split them between home, car and work",
      "Don't rely on a single warning channel",
    ],
  },
  during: {
    dos: [
      "Do evacuate early if you're in a surge or flood zone",
      "Do wear sturdy shoes and long sleeves while moving",
      "Do help neighbors only when it's safe for you first",
    ],
    donts: [
      "Don't touch electrical equipment while wet or standing in water",
      "Don't shelter in a basement during a flood",
      "Don't light candles — use flashlights or battery lanterns",
    ],
  },
  after: {
    dos: [
      "Do boil or purify all drinking water until authorities clear it",
      "Do discard food that touched floodwater, even canned goods",
      "Do keep children and pets away from debris and water",
    ],
    donts: [
      "Don't return home until officials declare the area safe",
      "Don't enter standing water near downed power lines",
      "Don't make phone calls unless urgent — texts keep networks free for rescuers",
    ],
  },
};

type KitGroup = { title: string; icon: typeof Package; items: string[] };

const KIT_GROUPS: KitGroup[] = [
  {
    title: "Water & food",
    icon: Package,
    items: [
      "Drinking water — 4 L per person per day, for at least 3 days",
      "Non-perishable food: canned goods, energy bars, dried fruit",
      "Manual can opener (not electric)",
      "Water purification tablets or a filter straw",
    ],
  },
  {
    title: "Light & power",
    icon: BatteryCharging,
    items: [
      "Flashlight or headlamp with spare batteries",
      "Power bank, fully charged",
      "Battery or hand-crank weather radio (AM/FM/NOAA)",
      "Waterproof matches or a lighter",
    ],
  },
  {
    title: "Medical & hygiene",
    icon: Cross,
    items: [
      "First-aid kit with bandages, antiseptic and painkillers",
      "7-day supply of prescription medicines",
      "Soap, sanitizer, menstrual supplies, insect repellent",
      "Dust masks (N95) for debris and smoke",
    ],
  },
  {
    title: "Tools & documents",
    icon: Radio,
    items: [
      "Whistle to signal for help (three blasts = SOS)",
      "Multi-tool or wrench for shutting off utilities",
      "Waterproof pouch with IDs, insurance and cash in small bills",
      "Local paper maps — GPS fails when towers do",
    ],
  },
];

const HAZARD_SPECIFICS: { icon: typeof Waves; hazard: string; guidance: string[] }[] = [
  {
    icon: Waves,
    hazard: "Flood",
    guidance: [
      "Move to high ground immediately; never wait in a basement.",
      "Disconnect electrical appliances if it's safe to do so.",
      "Abandon vehicles that stall in rising water.",
    ],
  },
  {
    icon: CloudRain,
    hazard: "Cyclone / hurricane",
    guidance: [
      "Shelter in an interior room on the lowest floor, away from windows.",
      "Lie under a mattress or sturdy table if the roof begins to fail.",
      "Stay indoors until officials announce the storm has fully passed.",
    ],
  },
  {
    icon: Flame,
    hazard: "Wildfire",
    guidance: [
      "Evacuate early — fires move faster than you can drive.",
      "Wear cotton or wool, never synthetics, and cover your nose and mouth.",
      "Close all doors and windows behind you to slow the fire's spread.",
    ],
  },
  {
    icon: HeartPulse,
    hazard: "Earthquake",
    guidance: [
      "Drop, cover and hold on — do not run outside during shaking.",
      "After it stops, expect aftershocks and check people before property.",
      "Use stairs, never elevators, when evacuating a building.",
    ],
  },
];

function StepRow({ step, index }: { step: GuideItem; index: number }) {
  return (
    <li className="sw-press flex gap-3 border-2 border-[#111111] bg-white p-3 shadow-[3px_3px_0_0_#111111] hover:shadow-none">
      <span className="flex size-7 shrink-0 items-center justify-center border-2 border-[#111111] bg-[#ffd02f] text-xs font-black">
        {index + 1}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black leading-tight">{step.text}</p>
        {step.sub && (
          <p className="mt-1 text-xs font-semibold leading-relaxed text-[#111111]/70">
            {step.sub}
          </p>
        )}
      </div>
    </li>
  );
}

export default function Catalog() {
  const { isAuthenticated } = useAuth();
  const [active, setActive] = useState<(typeof SECTIONS)[number]["id"]>("before");
  const section = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];
  const SectionIcon = section.icon;

  return (
    <main className="min-h-screen bg-[#f4f2ec] text-[#111111]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#111111]/60">
              <BookOpen className="size-3.5" />
              Survival guide
              <span className="border-2 border-[#111111] bg-[#d9e8c5] px-1.5 py-0.5 text-[#111111]">
                Read it before you need it
              </span>
            </p>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tight">
              Survive the storm
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-[#111111]/75">
              A practical guide to getting ready, staying alive and recovering from a natural
              disaster — what to do, what to avoid, and what to keep within arm's reach.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="w-fit border-2 border-[#111111] bg-white shadow-[3px_3px_0_0_#111111] hover:shadow-none"
          >
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </header>

        {/* Phase tabs */}
        <div className="sw-card mt-6 flex flex-wrap gap-2 bg-white p-4">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`sw-press flex items-center gap-1.5 border-2 border-[#111111] px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-[3px_3px_0_0_#111111] hover:shadow-none ${
                active === s.id ? "bg-[#111111] text-white" : "bg-white"
              }`}
            >
              <s.icon className="size-3.5" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Active phase: steps + do/don't */}
        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="sw-card bg-white p-5">
            <div className="flex items-center gap-2">
              <span
                className={`flex size-10 items-center justify-center border-2 border-[#111111] ${section.chip}`}
              >
                <SectionIcon className="size-5" />
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight">{section.title}</h2>
            </div>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#111111]/75">
              {section.intro}
            </p>
            <ol className="mt-4 space-y-2.5">
              {STEP_LISTS[section.id].map((step, i) => (
                <StepRow key={step.text} step={step} index={i} />
              ))}
            </ol>
          </div>

          <div className="space-y-4">
            <div className="sw-card bg-white p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <CheckCircle2 className="size-4 text-[#2f9e44]" />
                Do
              </p>
              <ul className="mt-2 space-y-2">
                {DO_DONT[section.id].dos.map((d) => (
                  <li
                    key={d}
                    className="border-2 border-[#111111] bg-[#d9e8c5] p-2 text-xs font-semibold leading-relaxed"
                  >
                    {d}
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <XCircle className="size-4 text-[#ff5c39]" />
                Don't
              </p>
              <ul className="mt-2 space-y-2">
                {DO_DONT[section.id].donts.map((d) => (
                  <li
                    key={d}
                    className="border-2 border-[#111111] bg-[#ff5c39] p-2 text-xs font-semibold leading-relaxed text-white"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <div className="sw-card bg-[#ffd02f] p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <Tent className="size-4" />
                Emergency numbers
              </p>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-[#111111]/80">
                Save your local emergency line, utility hotline and a nearby shelter's number in
                your phone — and write them on paper, because phones die.
              </p>
              <p className="mt-2 border-2 border-[#111111] bg-white p-2 text-center text-sm font-black tracking-widest">
                911 · 112 · your local line
              </p>
            </div>
          </div>
        </section>

        {/* Go-bag checklist */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
            <Package className="size-5" />
            Your emergency go-bag
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold text-[#111111]/75">
            Pack one bag per person, keep it by the door, and check expiry dates twice a year.
          </p>
          <div className="mt-4 grid gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
            {KIT_GROUPS.map((g) => (
              <article key={g.title} className="sw-card flex flex-col bg-white p-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center border-2 border-[#111111] bg-[#f4f2ec]">
                    <g.icon className="size-4" />
                  </div>
                  <h3 className="text-sm font-black uppercase leading-tight">{g.title}</h3>
                </div>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {g.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-1.5 text-xs font-semibold leading-relaxed text-[#111111]/80"
                    >
                      <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-[#2f9e44]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Hazard-specific guidance */}
        <section className="mt-4 pb-12">
          <h2 className="text-xl font-black uppercase tracking-tight">Know your hazard</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {HAZARD_SPECIFICS.map((h) => (
              <article key={h.hazard} className="sw-card bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center border-2 border-[#111111] bg-[#7cc4f2]">
                    <h.icon className="size-4" />
                  </span>
                  <h3 className="text-sm font-black uppercase">{h.hazard}</h3>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {h.guidance.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-1.5 text-xs font-semibold leading-relaxed text-[#111111]/80"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 bg-[#111111]" />
                      {line}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
