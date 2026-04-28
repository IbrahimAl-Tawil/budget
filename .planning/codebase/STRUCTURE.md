# Codebase Structure

**Analysis Date:** 2026-04-28

## Directory Layout

```
budget/
├── src/                          # Application source code
│   ├── app/                      # Next.js App Router pages and API routes
│   │   ├── (auth)/               # Auth layout group (login/register)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   ├── api/                  # API route handlers
│   │   │   ├── accounts/         # Account CRUD
│   │   │   ├── auth/             # Auth endpoints
│   │   │   ├── dashboard/        # Dashboard data aggregation
│   │   │   ├── goals/            # Goal CRUD
│   │   │   ├── import/           # File import and transaction parsing
│   │   │   ├── insights/         # AI insight generation
│   │   │   ├── onboarding/       # Setup flow
│   │   │   ├── recurring/        # Recurring transaction detection
│   │   │   ├── settings/         # Settings and preferences
│   │   │   └── transactions/     # Transaction CRUD
│   │   ├── dashboard/            # Dashboard page
│   │   ├── onboarding/           # Onboarding page
│   │   ├── settings/             # Settings page
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout with Providers
│   │   └── globals.css           # Global styles
│   ├── components/               # React components
│   │   ├── dashboard/            # Dashboard-specific components (22 files)
│   │   │   ├── dashboard-shell.tsx       # Main shell managing all tabs and state
│   │   │   ├── overview.tsx              # Overview tab component
│   │   │   ├── spending.tsx              # Spending analysis tab
│   │   │   ├── goals.tsx                 # Goals display and management
│   │   │   ├── transactions.tsx          # Transaction list and search
│   │   │   ├── subscriptions.tsx         # Recurring subscriptions
│   │   │   ├── accounts.tsx              # Account management
│   │   │   ├── insights.tsx              # AI insights display
│   │   │   ├── add-modal.tsx             # Modal for adding transactions
│   │   │   ├── add-goal-modal.tsx        # Modal for creating goals
│   │   │   ├── add-account-modal.tsx     # Modal for creating accounts
│   │   │   ├── edit-tx-modal.tsx         # Modal for editing transactions
│   │   │   ├── edit-goal-modal.tsx       # Modal for editing goals
│   │   │   ├── edit-account-modal.tsx    # Modal for editing accounts
│   │   │   ├── import-modal.tsx          # Modal for file import
│   │   │   ├── notifications-panel.tsx   # Notifications side panel
│   │   │   ├── charts.tsx                # Chart components
│   │   │   ├── glass-card.tsx            # Reusable glass-morphism card
│   │   │   ├── tx-row.tsx                # Single transaction row
│   │   │   └── tx-icon.tsx               # Transaction icon component
│   │   ├── onboarding/           # Onboarding wizard components
│   │   ├── settings/             # Settings page components
│   │   ├── ui/                   # Base UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   └── select.tsx
│   │   └── providers.tsx          # SessionProvider wrapper
│   └── lib/                      # Utility functions, services, types
│       ├── actions/              # Server actions
│       │   └── dashboard.ts      # Dashboard data fetching actions
│       ├── ai/                   # AI integration functions
│       │   ├── client.ts         # Anthropic SDK singleton
│       │   ├── categorize.ts     # Transaction categorization
│       │   ├── parse-pdf.ts      # PDF bank statement parsing
│       │   ├── detect-recurring.ts  # Recurring transaction detection
│       │   └── generate-insights.ts # AI insight generation
│       ├── db/                   # Database layer
│       │   ├── prisma.ts         # Prisma client instance
│       │   ├── queries.ts        # Database query functions
│       │   └── seed-categories.ts # Category seed data
│       ├── auth.ts               # NextAuth configuration
│       ├── api-auth.ts           # API route auth helper
│       ├── types.ts              # TypeScript interfaces
│       ├── format.ts             # Formatting utilities
│       ├── utils.ts              # General utilities (cn function)
│       └── data.ts               # Mock/seed data constants
├── prisma/                       # Prisma ORM configuration
│   ├── schema.prisma             # Database schema definition
│   └── dev.db                    # SQLite database file (generated)
├── public/                       # Static assets
├── .next/                        # Next.js build output (generated)
├── node_modules/                 # Dependencies (generated)
├── package.json                  # Project metadata and scripts
├── package-lock.json             # Dependency lock file
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.mjs            # PostCSS configuration
├── eslint.config.mjs             # ESLint configuration
└── components.json               # shadcn/ui component registry
```

## Directory Purposes

**src/app:**
- Purpose: Next.js App Router directory; contains page components and API route handlers
- Contains: Page files (page.tsx), layout files, API routes, route groups (parentheses)
- Key structure: Follows Next.js 16 conventions with file-based routing

**src/app/(auth):**
- Purpose: Route group for authentication pages; shared layout for login/register
- Contains: Login and register page components
- Layout wrapper: Applies auth-specific styling and prevents layout shift

**src/app/api:**
- Purpose: RESTful API endpoints consumed by frontend and external services
- Contains: HTTP handlers (GET, POST, PUT, DELETE) for CRUD operations
- Auth pattern: All routes check JWT token via `getApiUser()` before proceeding

**src/components:**
- Purpose: Reusable React components organized by domain
- Contains: Page-specific components, UI primitives, layout components
- Composition: Larger components composed of smaller UI primitives

**src/components/dashboard:**
- Purpose: All dashboard page UI logic and interactive elements
- Contains: Tab components (Overview, Spending, Goals, etc.), modals, charts, data display
- Centralization: DashboardShell manages all state and modal visibility; child components receive data as props

**src/components/ui:**
- Purpose: Unstyled or minimally-styled base components (input, button, dialog)
- Contains: Primitives built with @base-ui/react and Tailwind
- Usage: Imported by higher-level components and forms

**src/lib:**
- Purpose: Non-component logic: utilities, services, types, data access
- Contains: Database queries, AI functions, auth setup, helpers
- No UI code; pure functions and configuration

**src/lib/db:**
- Purpose: Database abstraction layer using Prisma
- Contains: Prisma client instance, query functions, seed data
- Responsibility: Translate between database schema and application types

**src/lib/ai:**
- Purpose: Encapsulate all external AI service calls
- Contains: Anthropic SDK instantiation, prompt-based functions for categorization/parsing/insights
- Separation: Isolates API calls; easy to swap provider if needed

**prisma/:**
- Purpose: Prisma ORM configuration and schema
- Contains: schema.prisma defining all data models, migrations (if any), dev.db SQLite file
- Build step: `postinstall` script runs `prisma generate` to create client

## Key File Locations

**Entry Points:**

- `src/app/layout.tsx`: Root layout; sets up fonts, metadata, Providers wrapper
- `src/app/page.tsx`: Landing page; hero, features, login/register links
- `src/app/dashboard/page.tsx`: Main app; server-side data fetch, passes to DashboardShell
- `src/app/onboarding/page.tsx`: Setup wizard; appears after registration
- `src/app/(auth)/login/page.tsx`: Login form
- `src/app/(auth)/register/page.tsx`: Registration form

**Configuration:**

- `tsconfig.json`: Path alias `@/*` → `./src/*` for clean imports
- `next.config.ts`: Exports AUTH_SECRET and NEXTAUTH_SECRET as env vars
- `tailwind.config.js`: Design tokens, spacing, colors for Tailwind
- `postcss.config.mjs`: Tailwind CSS processing
- `prisma/schema.prisma`: All data models (User, Transaction, Account, Goal, etc.)

**Core Logic:**

- `src/lib/db/queries.ts`: Complex Prisma queries with aggregations and joins
- `src/lib/ai/client.ts`: Singleton Anthropic client
- `src/lib/auth.ts`: NextAuth configuration with JWT strategy
- `src/lib/api-auth.ts`: Helper to extract user from API request token
- `src/lib/actions/dashboard.ts`: Server action wrappers for auth + queries

**Testing:**

- No test files detected; testing not implemented in this codebase

## Naming Conventions

**Files:**

- **Page components:** `page.tsx` (Next.js convention)
- **Layout components:** `layout.tsx` (Next.js convention)
- **API routes:** `route.ts` (Next.js convention)
- **Regular components:** kebab-case with `.tsx` extension (e.g., `dashboard-shell.tsx`, `add-modal.tsx`)
- **Configuration:** lowercase with extensions (e.g., `tsconfig.json`, `next.config.ts`)
- **Types/utilities:** lowercase with domain prefix (e.g., `auth.ts`, `api-auth.ts`, `types.ts`)

**Directories:**

- **Route grouping:** Parentheses for layout groups (e.g., `(auth)`)
- **Dynamic segments:** Brackets for catch-all or params (e.g., `[id]`, `[...nextauth]`)
- **Feature folders:** Plural names (e.g., `components`, `lib/actions`, `app/api/accounts`)
- **Shallow structure:** Avoid deep nesting; prefer flat with clear naming

**Functions:**

- **Server actions:** `fetchX()` (e.g., `fetchOverview()`, `fetchTransactions()`)
- **Query functions:** `getX()` (e.g., `getDashboardOverview()`, `getSpendingData()`)
- **API handlers:** POST/GET/etc. exported from `route.ts`
- **AI functions:** descriptive names (e.g., `categorizeTransactions()`, `parsePdfStatement()`)

**Variables:**

- **Components:** PascalCase (e.g., `DashboardShell`, `TransactionView`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MONTH_NAMES`, `ACCOUNT_GRADIENTS`, `TABS`)
- **Props interfaces:** Inline or named `{Prop}Props` (e.g., `InitialData`)

**Types:**

- **View interfaces:** `XView` (e.g., `TransactionView`, `GoalView`) for UI-ready data
- **DB models:** Named after Prisma model (e.g., `User`, `Transaction`, `Category`)
- **Props types:** Component name + `Props` (e.g., `DashboardShellProps`)

## Where to Add New Code

**New Feature (multi-component):**

- **Primary code:** Feature-specific page in `src/app/{feature}/page.tsx`
- **Components:** Related components in `src/components/{feature}/` subdirectory
- **API endpoints:** Feature-specific routes in `src/app/api/{feature}/route.ts`
- **Server actions:** Wrapper functions in `src/lib/actions/{feature}.ts`
- **Database queries:** Add query functions to `src/lib/db/queries.ts` or split to `src/lib/db/{feature}.ts` if large
- **Tests:** Would go in `src/app/{feature}/__tests__/` or alongside files as `*.test.ts`

**New Component:**

- **Implementation:** `src/components/{domain}/{component-name}.tsx`
- **Export from:** Create barrel file `src/components/{domain}/index.ts` if multiple components
- **Props:** Define interface inline or in shared types file
- **Styling:** Use Tailwind className prop; no separate CSS files

**New API Endpoint:**

- **Location:** `src/app/api/{resource}/route.ts`
- **Pattern:** Extract user via `getApiUser()`, validate request, call queries, return JSON
- **Auth:** Always check `if (!user)` at start; return 401 if missing
- **Error handling:** Wrap in try/catch; return 500 with error message

**New Database Query:**

- **Location:** Add to `src/lib/db/queries.ts`
- **Pattern:** Async function accepting userId and filters; return typed view object
- **Implementation:** Use Prisma client with joins, includes, where clauses
- **Performance:** Parallel fetches with Promise.all() for independent queries; single sequential flow for dependent ones

**Utilities:**

- **Shared helpers:** `src/lib/utils.ts` (currently has `cn()` classname utility)
- **Formatting:** `src/lib/format.ts` (date/number formatting)
- **Type definitions:** `src/lib/types.ts` (all view and interface definitions)
- **Constants:** `src/lib/data.ts` (mock data, seed data, enums)

## Special Directories

**src/app/api:**
- Purpose: RESTful API endpoints
- Generated: No (hand-written)
- Committed: Yes

**prisma/dev.db:**
- Purpose: SQLite database file (local development)
- Generated: Yes (by Prisma migrations or first connection)
- Committed: No (in .gitignore)

**.next/:**
- Purpose: Next.js build artifacts and server functions
- Generated: Yes (by `npm run build`)
- Committed: No

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (by npm install)
- Committed: No

---

*Structure analysis: 2026-04-28*
