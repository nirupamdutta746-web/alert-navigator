# 🌊 Alert Navigator

**Alert Navigator** is a disaster early-warning and evacuation web app for flood, cyclone, storm-surge, and heavy-rain events. It turns raw hazard data into plain-language alerts, shows people the risk zones and shelters near them, routes them to safety, and lets them check in as safe (or ask for help) — even when networks are unreliable.

> Sense → Warn → Guide: live sensor/feed data becomes a graded alert (watch → warning → emergency), which is paired with the nearest open shelter and a route that's actually passable.

## Features

- **Live hazard alerts** — Plain-language bulletins with severity chips (`advisory` / `watch` / `warning` / `emergency`), issue timestamps, and expiry — no jargon, no noise.
- **Risk-zone map** — Flood and surge zones rendered as color-coded zones over the map, with the user's own location plotted inside them.
- **Shelters & evacuation routes** — Live occupancy/capacity bars for relief shelters (schools, community halls, cyclone shelters, temples, stadiums) plus routes flagged `clear`, `congested`, or `blocked`.
- **SOS check-ins** — One tap marks a user `safe`, `evacuating`, or `need_help`; check-ins are queued on-device if the network drops.
- **Survival guide** — A step-by-step before/during/after playbook, including a go-bag checklist.
- **Community messaging** — Direct, private messages between members to coordinate pickups and share ground-truth updates.
- **Admin dashboard** — Tools for issuing and managing hazard alerts, shelters, and routes.
- **Authentication** — Email OTP–based sign-in with role-based access (`admin`, `member`, `user`).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Routing | [React Router v7](https://reactrouter.com/) |
| Styling / UI | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Lucide Icons](https://lucide.dev/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Maps | [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/) |
| Backend & Database | [Convex](https://www.convex.dev/) |
| Auth | [Convex Auth](https://labs.convex.dev/auth) (email OTP) |
| Charts | [Recharts](https://recharts.org/) |
| Package manager | [Bun](https://bun.sh/) |

## Project Structure

```
alert-navigator/
├── client/                 # React frontend
│   ├── components/         # Shared components (HazardMap, RequireAuth, ui/...)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                  # Client utilities
│   ├── pages/                # Route pages (Landing, Auth, Dashboard, Catalog, Messages, Admin)
│   └── main.tsx              # App entry point
├── server/                  # Convex backend functions & schema
│   ├── schema.ts             # Database schema (hazards, shelters, routes, checkins, messages...)
│   ├── hazards.ts            # Hazard alert queries/mutations
│   ├── community.ts          # Community/social features
│   ├── checkins.ts           # SOS / safety check-ins
│   ├── users.ts               # User management
│   ├── admin.ts                # Admin-only functions
│   └── auth/                   # Auth configuration (email OTP)
├── public/                   # Static assets
├── index.html
├── package.json
└── vite.config.ts
```

## Data Model

The Convex schema (`server/schema.ts`) defines:

- **`hazards`** — hazard type (`flood`, `cyclone`, `heavy_rain`, `storm_surge`), severity, message, and validity window.
- **`shelters`** — location, capacity, live occupancy, kind, and status (`open` / `filling` / `full` / `closed`).
- **`evacuationRoutes`** — a polyline to a shelter, distance, and status (`clear` / `congested` / `blocked`).
- **`checkins`** — a user's location and status (`safe` / `evacuating` / `need_help`).
- **`reportComments`** — citizen comments on a hazard alert.
- **`messages`** — direct messages between community members.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- A [Convex](https://www.convex.dev/) account/deployment

### Installation

```bash
bun install
```

### Environment Variables

Two separate places hold environment variables:

**1. Client (`.env.local` in the project root)** — read by Vite at build/dev time:

```bash
CONVEX_DEPLOYMENT=dev:your-deployment-123
VITE_CONVEX_URL=https://your-deployment-123.convex.cloud
VITE_CONVEX_SITE_URL=https://your-deployment-123.convex.site
```

Only variables prefixed with `VITE_` are exposed to the browser.

**2. Convex backend** — set via the Convex CLI, read by Convex functions at runtime:

```bash
npx convex env set SITE_URL http://localhost:5173
# Optional, for Google sign-in:
npx convex env set AUTH_GOOGLE_ID ...
npx convex env set AUTH_GOOGLE_SECRET ...
```

### Run locally

```bash
# Start the Convex backend
npx convex dev

# In another terminal, start the frontend
bun run dev
```

### Other scripts

```bash
bun run build     # Type-check and build for production
bun run lint       # Run ESLint
bun run format      # Run Prettier
bun run preview      # Preview the production build
```

## Deployment

- **Frontend**: configured for [Vercel](https://vercel.com/) (see `vercel.json`) with SPA rewrites to `index.html`. A Deno/Hono static server (`main.ts`) is also included as an alternative deployment target.
- **Backend**: deployed via `npx convex deploy`.

## Contributing

Issues and pull requests are welcome. Please run `bun run lint` and `bun run format` before submitting a PR.

## License

No license file is currently included in this repository. Add one (e.g. MIT) if you intend to open-source this project.
