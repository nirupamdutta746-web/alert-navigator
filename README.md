## Overview

This project uses the following tech stack:
- Vite
- Typescript
- React Router v7 (all imports from `react-router` instead of `react-router-dom`)
- React 19 (for frontend components)
- Tailwind v4 (for styling)
- Shadcn UI (for UI components library)
- Lucide Icons (for icons)
- Convex (for backend & database)
- Convex Auth (for authentication)
- Framer Motion (for animations)
- Three js (for 3d models)

All relevant files live in the 'src' directory.

Use bun for the package manager.

## Setup

This project is set up already and running on a cloud environment, as well as a convex development in the sandbox.

## Environment Variables

There are **two separate places** where environment variables live. Mixing them up is the
most common setup mistake:

| Location | File / tool | Read by |
|---|---|---|
| **Browser (client)** | `.env.local` in the project root | Vite frontend at build/dev time |
| **Convex backend** | `npx convex env set <NAME> <value>` | Convex functions at runtime |

### 1. Client variables (`.env.local`)

```bash
# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=dev:your-deployment-123

# WebSocket/HTTP endpoint the React client talks to (from the Convex dashboard)
VITE_CONVEX_URL=https://your-deployment-123.convex.cloud

# HTTP-actions URL of the same deployment (ends in .site instead of .cloud)
VITE_CONVEX_SITE_URL=https://your-deployment-123.convex.site
```

Only variables prefixed with `VITE_` are exposed to the browser. After changing them,
restart the Vite dev server.

### 2. Convex deployment variables (`npx convex env set`)

Run these from the project root (the CLI picks up `CONVEX_DEPLOYMENT` from `.env.local`).
List what is currently set with `npx convex env list`.

| Variable | Required | Purpose |
|---|---|---|
| `SITE_URL` | **Yes** | The **frontend origin** users are redirected to after sign-in. See below. |
| `VLY_CONVEX_AUTH_ISSUER` | No — Freebuff platform only | Issuer of Freebuff federated tokens. See below. |
| `AUTH_GOOGLE_ID` | For Google login | Google OAuth client ID (`...apps.googleusercontent.com`) |
| `AUTH_GOOGLE_SECRET` | For Google login | Google OAuth client secret (`GOCSPX-...`) |
| `VLY_APP_NAME` | Optional | App name shown in the email-OTP email (defaults to "a freebuff.com application") |
| `JWKS`, `JWT_PRIVATE_KEY` | Auto-managed | Convex Auth's signing keys — do not touch |
| `CONVEX_SITE_URL` | Auto-managed | **Built-in** — Convex sets it to the deployment's own `.site` URL and rejects manual overrides (`EnvVarNameForbidden`). Do not try to set it. |

#### `SITE_URL` — the post-login redirect origin

`SITE_URL` must be the URL of **your app in the browser** (e.g. `http://localhost:5173`
in development), *not* the Convex backend URL. Convex Auth uses it as the base for the
redirect after Google sign-in and other OAuth callbacks. If you set it to the
`...convex.site` backend URL by mistake, users finish signing in and land on the backend,
which responds with `"No matching routes found"` instead of the dashboard.

```bash
# development
npx convex env set SITE_URL http://localhost:5173
# production (whatever origin serves the built app)
npx convex env set SITE_URL https://your-app.example.com
```

Related: the Google Cloud Console OAuth client must whitelist
`https://<deployment>.convex.site/api/auth/callback/google` as an authorized redirect URI
(`CONVEX_SITE_URL` supplies that prefix automatically).

#### `VLY_CONVEX_AUTH_ISSUER` — Freebuff federated sign-in

This app trusts **two kinds of sign-in tokens** (see `server/auth.config.ts`):

1. **Local Convex Auth tokens** — issued by this deployment for its own email-OTP / guest /
   Google sign-in flow. Issuer is the deployment's own `CONVEX_SITE_URL`.
2. **Freebuff federated tokens** — RS256 JWTs signed by freebuff.com. They let a user who
   is already signed in on the Freebuff platform carry that identity into this project
   **without going through local sign-in**. This is the `type: "customJwt"` provider entry.

`VLY_CONVEX_AUTH_ISSUER` configures the second provider:

- It becomes the expected **`iss` (issuer) claim** the JWT must carry.
- The JWKS public-key endpoint is derived from it:
  `${VLY_CONVEX_AUTH_ISSUER}/api/web/.well-known/jwks.json` — the deployment fetches this to
  verify token signatures.

```bash
npx convex env set VLY_CONVEX_AUTH_ISSUER https://freebuff.com
```

Defaults and behavior:

- The code falls back to `https://freebuff.com` when the variable is unset, so on the
  Freebuff platform you normally never need to set it manually — it is injected at project
  creation.
- **Do not change it** unless you are intentionally moving federated sign-in to a different
  issuer (e.g. self-hosting). If the value does not exactly match the `iss` claim of the
  tokens being presented — scheme, domain and path all matter — every federated token fails
  validation and those users cannot get in.
- Changing it does not affect the app's own email-OTP / guest / Google logins; it only
  governs the Freebuff-federated path.

#### Not using Freebuff?

Then you don't need `VLY_CONVEX_AUTH_ISSUER` at all. It only matters when freebuff.com is
minting sign-in tokens for your app. Running standalone:

- **Leave it unset.** The code falls back to `https://freebuff.com`; since no token with that
  issuer will ever be presented, the provider is inert and costs nothing at runtime.
- **Your sign-ins are unaffected.** Email OTP, guest and Google all run through the local
  Convex Auth provider (issuer = the deployment's own `CONVEX_SITE_URL`), which never reads
  this variable.
- **Optional cleanup:** delete the `{ type: "customJwt", ... }` entry in
  `server/auth.config.ts`. (The "do not modify" guidance around the auth files applies to
  the Freebuff template workflow — on your own fork the file is yours.)
- **Related dependency to replace:** the OTP email sender in `server/auth/emailOtp.ts` posts
  to `https://auth.freebuff.app/send_otp` with a shared API key — a Freebuff-provided
  service. On a standalone deployment, swap it for your own email provider or verification
  emails will not deliver.

#### Google OAuth variables

```bash
npx convex env set AUTH_GOOGLE_ID 1234567890-abcdefg.apps.googleusercontent.com
npx convex env set AUTH_GOOGLE_SECRET GOCSPX-xxxxxxxxxxxxxxxx
```

Read by `server/auth.ts` via the `@auth/core/providers/google` provider. Create the client
in Google Auth Platform (Web application type), whitelist
`http://localhost:5173` as an authorized JavaScript origin and
`https://<deployment>.convex.site/api/auth/callback/google` as an authorized redirect URI.
While the consent screen is in *Testing* mode, only listed test users can sign in; publish
the app to allow any Google account. Changes take effect immediately — no redeploy needed.


# Using Authentication (Important!)

You must follow these conventions when using authentication.

## Auth is already set up.

All convex authentication functions are already set up. The auth currently uses email OTP and anonymous users, but can support more.

The email OTP configuration is defined in `src/convex/auth/emailOtp.ts`. DO NOT MODIFY THIS FILE.

Also, DO NOT MODIFY THESE AUTH FILES: `src/convex/auth.config.ts` and `src/convex/auth.ts`.

## Using Convex Auth on the backend

On the `src/convex/users.ts` file, you can use the `getCurrentUser` function to get the current user's data.

## Using Convex Auth on the frontend

The `/auth` page is already set up to use auth. Navigate to `/auth` for all log in / sign up sequences.

You MUST use this hook to get user data. Never do this yourself without the hook:
```typescript
import { useAuth } from "@/hooks/use-auth";

const { isLoading, isAuthenticated, user, signIn, signOut } = useAuth();
```

## Protected Routes

The starter `/dashboard` route is protected with `RequireAuth`. Extend that page
for the product's authenticated experience, and reuse `RequireAuth` when adding
another protected route — do NOT hand-roll a redirect to `/auth`, since landing
on a bare sign-in form with no explanation of what was blocked is confusing.

`RequireAuth` states the block on the page the visitor asked for and sends them
to `/auth?returnTo=<current route>` when they choose to sign in, so they come
back to it. Pass `title` and `description` to say what the page is:

```tsx
<Route
  path="/dashboard"
  element={
    <RequireAuth
      title="Sign in to view your dashboard"
      description="Your projects and settings live here."
    >
      <Dashboard />
    </RequireAuth>
  }
/>
```

Pass `redirectImmediately` for a route where bouncing straight to `/auth` really
is better.

## Auth Page

The auth page is defined in `src/pages/Auth.tsx`. Send sign-in and sign-up actions
to `/auth`.

## Authorization

You can perform authorization checks on the frontend and backend.

On the frontend, you can use the `useAuth` hook to get the current user's data and authentication state.

You should also be protecting queries, mutations, and actions at the base level, checking for authorization securely.

## Adding a redirect after auth

The `/auth` route in `src/main.tsx` redirects to `/dashboard` by default. If the
product's main authenticated route is different, update `redirectAfterAuth` to
that route. A validated same-origin `returnTo` query parameter takes priority so
users can resume the protected page they originally requested. Never leave an
authenticated product redirecting back to the public landing page.

## Complete authenticated products

When the requested product implies accounts, a workspace, a dashboard, or other
signed-in functionality, the task is not complete with only a landing page and
auth form. Build the main authenticated experience, protect its route, and verify
that signing in reaches it.

# Frontend Conventions

You will be using the Vite frontend with React 19, Tailwind v4, and Shadcn UI.

Generally, pages should be in the `src/pages` folder, and components should be in the `src/components` folder.

Shadcn primitives are located in the `src/components/ui` folder and should be used by default.

## Page routing

Your page component should go under the `src/pages` folder.

When adding a page, update the react router configuration in `src/main.tsx` to include the new route you just added.

## Shad CN conventions

Follow these conventions when using Shad CN components, which you should use by default.
- Remember to use "cursor-pointer" to make the element clickable
- For title text, use the "tracking-tight font-bold" class to make the text more readable
- Always make apps MOBILE RESPONSIVE. This is important
- AVOID NESTED CARDS. Try and not to nest cards, borders, components, etc. Nested cards add clutter and make the app look messy.
- AVOID SHADOWS. Avoid adding any shadows to components. stick with a thin border without the shadow.
- Avoid skeletons; instead, use the loader2 component to show a spinning loading state when loading data.


## Landing Pages

You must always create good-looking designer-level styles to your application. 
- Make it well animated and fit a certain "theme", ie neo brutalist, retro, neumorphism, glass morphism, etc

Use known images and emojis from online.

If the user is logged in already, show the get started button to say "Dashboard" or "Profile" instead to take them there.

## Responsiveness and formatting

Make sure pages are wrapped in a container to prevent the width stretching out on wide screens. Always make sure they are centered aligned and not off-center.

Always make sure that your designs are mobile responsive. Verify the formatting to ensure it has correct max and min widths as well as mobile responsiveness.

- Always create sidebars for protected dashboard pages and navigate between pages
- Always create navbars for landing pages
- On these bars, the created logo should be clickable and redirect to the index page

## Animating with Framer Motion

You must add animations to components using Framer Motion. It is already installed and configured in the project.

To use it, import the `motion` component from `framer-motion` and use it to wrap the component you want to animate.


### Other Items to animate
- Fade in and Fade Out
- Slide in and Slide Out animations
- Rendering animations
- Button clicks and UI elements

Animate for all components, including on landing page and app pages.

## Three JS Graphics

Your app comes with three js by default. You can use it to create 3D graphics for landing pages, games, etc.


## Colors

You can override colors in: `src/index.css`

This uses the oklch color format for tailwind v4.

Always use these color variable names.

Make sure all ui components are set up to be mobile responsive and compatible with both light and dark mode.

Set theme using `dark` or `light` variables at the parent className.

## Styling and Theming

When changing the theme, always change the underlying theme of the shad cn components app-wide under `src/components/ui` and the colors in the index.css file.

Avoid hardcoding in colors unless necessary for a use case, and properly implement themes through the underlying shad cn ui components.

When styling, ensure buttons and clickable items have pointer-click on them (don't by default).

Always follow a set theme style and ensure it is tuned to the user's liking.

## Toasts

You should always use toasts to display results to the user, such as confirmations, results, errors, etc.

Use the shad cn Sonner component as the toaster. For example:

```
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
export function SonnerDemo() {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast("Event has been created", {
          description: "Sunday, December 03, 2023 at 9:00 AM",
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
        })
      }
    >
      Show Toast
    </Button>
  )
}
```

Remember to import { toast } from "sonner". Usage: `toast("Event has been created.")`

## Dialogs

Always ensure your larger dialogs have a scroll in its content to ensure that its content fits the screen size. Make sure that the content is not cut off from the screen.

Ideally, instead of using a new page, use a Dialog instead. 

# Using the Convex backend

You will be implementing the convex backend. Follow your knowledge of convex and the documentation to implement the backend.

## The Convex Schema

You must correctly follow the convex schema implementation.

The schema is defined in `src/convex/schema.ts`.

Do not include the `_id` and `_creationTime` fields in your queries (it is included by default for each table).
Do not index `_creationTime` as it is indexed for you. Never have duplicate indexes.


## Convex Actions: Using CRUD operations

When running anything that involves external connections, you must use a convex action with "use node" at the top of the file.

You cannot have queries or mutations in the same file as a "use node" action file. Thus, you must use pre-built queries and mutations in other files.

You can also use the pre-installed internal crud functions for the database:

```ts
// in convex/users.ts
import { crud } from "convex-helpers/server/crud";
import schema from "./schema.ts";

export const { create, read, update, destroy } = crud(schema, "users");

// in some file, in an action:
const user = await ctx.runQuery(internal.users.read, { id: userId });

await ctx.runMutation(internal.users.update, {
  id: userId,
  patch: {
    status: "inactive",
  },
});
```


## Common Convex Mistakes To Avoid

When using convex, make sure:
- Document IDs are referenced as `_id` field, not `id`.
- Document ID types are referenced as `Id<"TableName">`, not `string`.
- Document object types are referenced as `Doc<"TableName">`.
- Keep schemaValidation to false in the schema file.
- You must correctly type your code so that it passes the type checker.
- You must handle null / undefined cases of your convex queries for both frontend and backend, or else it will throw an error that your data could be null or undefined.
- Always use the `@/folder` path, with `@/convex/folder/file.ts` syntax for importing convex files.
- This includes importing generated files like `@/convex/_generated/server`, `@/convex/_generated/api`
- Remember to import functions like useQuery, useMutation, useAction, etc. from `convex/react`
- NEVER have return type validators.
