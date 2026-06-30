<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Next.js 16 gotchas (don't get burned)

- **Middleware is now `proxy.ts`.** Next 16 renamed Middleware → Proxy. The file lives at `src/proxy.ts` with a named `proxy(request)` export and a `config.matcher`. It is auto-discovered by filename — it looks unreferenced (nothing imports it) but it runs on every request. **Do not delete it as "dead code."** It owns the auth/onboarding redirect logic; page-level `auth()` guards are a second layer, not a replacement.

## Project structure

This is a budgeting app: Next.js 16 (App Router, Turbopack) · Prisma 7 + SQLite · NextAuth (credentials) · Anthropic SDK. `@/*` maps to `src/*`.

```
src/
  proxy.ts                  # Next 16 middleware — auth + onboarding redirects (see above)
  app/
    layout.tsx              # root layout: fonts + <Providers>
    page.tsx                # landing (server component, redirects if logged in)
    globals.css             # design tokens + Bulga custom styles
    (auth)/                 # route group: shared centered layout for login + register
      login/  register/
    dashboard/  onboarding/  settings/   # one page.tsx each
    api/**/route.ts         # REST handlers (auth via lib/api-auth)
  components/
    ui/                     # @base-ui primitives (button, input, dialog, …). NO feature logic.
    dashboard/
      dashboard-shell.tsx   # client orchestrator (tabs, FAB, modals)
      charts.tsx  notifications-panel.tsx
      tabs/                 # one file per dashboard tab (overview, spending, goals, …)
      modals/               # add-/edit- dialogs + import-modal
      primitives/           # dashboard-themed reusables: glass-card, tx-icon, tx-row
    onboarding/  settings/  # feature client components
    providers.tsx           # SessionProvider wrapper
  lib/
    auth.ts                 # NextAuth config (session, used by pages)
    api-auth.ts             # JWT extraction (used by api/ route handlers)
    constants.ts            # shared domain constants (ACCOUNT_TYPES, CURRENCIES)
    types.ts                # central view-model types — define shared types HERE
    format.ts               # currency/number formatting (client-safe)
    utils.ts                # cn() tailwind helper (client-safe)
    actions/                # server actions ("use server")
    ai/                     # Anthropic calls (server-only): categorize, parse-pdf, insights, …
    db/                     # prisma client + queries + calculations (server-only)
```

### Conventions

- **Files are kebab-case; component exports are PascalCase.** Modals end in `-modal`; spell out the noun (`add-transaction-modal`, not `add-modal`).
- **Page = fetch + guard; component = render.** Page-level server components do auth guards + data fetching, then hand data to a client shell/component as props. Don't render heavy UI inline in `page.tsx`.
- **Server/client boundary is sacred.** Client components (`"use client"`) may only import from `lib/types`, `lib/format`, `lib/utils`, `lib/constants`. Never import `lib/db/*`, `lib/ai/*`, or `lib/auth` into a client component — they pull Prisma/Node into the browser bundle.
- **Layered imports flow one way:** `ui ← primitives ← features`. `ui/` stays generic (no domain logic); dashboard-themed reusables go in `dashboard/primitives/`, not `ui/`.
- **Use the `@/` alias for cross-folder imports** (`@/components/dashboard/primitives/glass-card`), not deep relative paths. Reserve `./` for same-folder siblings.
- **No duplicated constants.** Shared lists/enums live in `lib/constants.ts`; shared types in `lib/types.ts`. If you're copy-pasting a constant into a second file, hoist it instead.
- **`auth.ts` vs `api-auth.ts`:** session-based guards for pages use `auth.ts`; stateless JWT checks in `api/*/route.ts` use `api-auth.ts`.
