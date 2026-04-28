# Architecture

**Analysis Date:** 2026-04-28

## Pattern Overview

**Overall:** Next.js 16 full-stack application with server-side data fetching, API routes, and client-side state management. Uses a clean separation of concerns with dedicated layers for authentication, data access, AI processing, and UI.

**Key Characteristics:**
- Server-first architecture with server components and server actions for data fetching
- API route handlers for CRUD operations with JWT authentication
- Prisma ORM with SQLite (better-sqlite3) for local data persistence
- Anthropic Claude AI integration for transaction categorization, PDF parsing, and insights
- Client-side state management using React hooks in a single dashboard shell component
- Multi-layer data access pattern with query functions abstracting Prisma calls

## Layers

**Presentation/UI Layer:**
- Purpose: Render interactive UI components and manage local client state
- Location: `src/components/`
- Contains: React components (Client and Server), modal dialogs, form inputs, charts, dashboard tabs
- Depends on: React, next-auth/react, Lucide React icons, Tailwind CSS
- Used by: Page components in `src/app/`

**Page/Route Layer:**
- Purpose: Define Next.js pages and API endpoints; server-side data fetching entry points
- Location: `src/app/`
- Contains: Page components (SSR with server-side data fetching), layout wrappers, API route handlers
- Depends on: Authentication, data queries, server actions
- Used by: Browser navigation, API clients

**Business Logic/Actions Layer:**
- Purpose: Server-side operations, authorization checks, and data transformation before passing to UI
- Location: `src/lib/actions/`
- Contains: Server actions that verify user identity and delegate to query functions
- Depends on: Auth module, database queries
- Used by: Page components, API handlers

**Data Access Layer:**
- Purpose: Query and mutate database with Prisma; format data for consumption
- Location: `src/lib/db/queries.ts` (primary) and `src/lib/db/prisma.ts` (client)
- Contains: Prisma query functions with SQL joins, aggregations, and complex transformations
- Depends on: Prisma client, database schema
- Used by: Server actions, API handlers, page components

**AI/Integration Layer:**
- Purpose: Integrate with external AI services for intelligent processing
- Location: `src/lib/ai/`
- Contains: Functions for transaction categorization, PDF parsing, recurring detection, insight generation
- Depends on: Anthropic SDK
- Used by: API handlers (import, onboarding), data query functions

**Authentication Layer:**
- Purpose: Session management, credential validation, JWT token handling
- Location: `src/lib/auth.ts` (NextAuth config) and `src/lib/api-auth.ts` (API helpers)
- Contains: NextAuth configuration with credentials provider, JWT callbacks, session schema
- Depends on: next-auth, bcryptjs, Prisma
- Used by: Page components, API handlers, middleware

**Utilities Layer:**
- Purpose: Type definitions, formatting, helpers, data constants
- Location: `src/lib/types.ts`, `src/lib/format.ts`, `src/lib/utils.ts`, `src/lib/data.ts`
- Contains: TypeScript interfaces, date formatting, class name utilities, mock data
- Used by: All layers

## Data Flow

**User Registration & Login:**

1. User visits `/register` page or `/login` page
2. Form submission calls `signIn()` from next-auth or POST to `/api/auth/register`
3. Credentials provider validates against database using bcrypt
4. NextAuth JWT callback populates token with `id` and `onboardingDone`
5. Session strategy delivers JWT token; session callback exposes user data to app

**Onboarding Flow:**

1. Logged-in user with `onboardingDone: false` redirected to `/onboarding`
2. OnboardingWizard component collects budget target, currency, initial accounts
3. POST to `/api/onboarding` or `/api/onboarding/auto` with setup data
4. API handler creates default categories, accounts, and goals in database
5. Backend calls `detectRecurring()` AI to flag subscriptions in imported transactions
6. Session updated via NextAuth trigger to set `onboardingDone: true`
7. User redirected to `/dashboard`

**Dashboard Data Loading (SSR):**

1. User navigates to `/dashboard`
2. `src/app/dashboard/page.tsx` (server component) calls multiple query functions in parallel
3. Queries: `getDashboardOverview()`, `getSpendingData()`, `getGoals()`, `getTransactions()`, `getSubscriptions()`, `getAccounts()`, `getInsights()`
4. All data aggregated and passed to DashboardShell as `initialData`
5. DashboardShell renders with server-side data; client state hydrates with this data
6. User can immediately see dashboard without waiting for client-side fetches

**Dynamic Tab Navigation (Client-side):**

1. User clicks tab in DashboardShell (e.g., "Transactions")
2. `fetchTab()` function makes GET to `/api/dashboard?tab=transactions&month=...&year=...`
3. Dashboard API endpoint extracts token, identifies user, and returns queried data
4. Client state updates; component re-renders with fresh data
5. Month/year changes trigger re-fetch of all visible tabs

**File Import Flow:**

1. User opens ImportModal and uploads CSV or PDF file
2. FormData sent to `/api/import` POST handler
3. Handler checks auth, creates BankStatement record, parses file
   - PDF: calls `parsePdfStatement()` AI to extract transactions
   - CSV: uses custom parser to extract headers and rows
4. Returns `{ statementId, transactions }` with raw transaction data
5. Frontend displays preview; user reviews and confirms
6. POST to `/api/import/confirm` with statement ID and transaction array
7. Handler calls `categorizeTransactions()` AI to classify each transaction
8. Transactions bulk-created in database with category IDs, icons, colors
9. Statement marked complete; user sees imported transactions in dashboard

**Transaction Categorization:**

1. Imported transactions forwarded to `categorizeTransactions()` (batched by 50)
2. Anthropic Claude processes batch with system prompt specifying available categories
3. Claude returns JSON array with category, isRecurring, icon, color for each transaction
4. Results mapped to user's category IDs; transactions created with metadata
5. Subsequent API calls can filter by category or detect recurring patterns

**State Management:**

- **Server State:** Managed via Prisma queries; data fetched fresh on each page load or tab change
- **Client State:** Minimal; DashboardShell holds current month/year, active tab, modal visibility, local data cache
- **Session State:** Managed by NextAuth; accessible via `useSession()` hook or server-side `auth()` function
- **No Global Client State:** No Redux, Zustand, or Context API; data flows top-down from server to DashboardShell

## Key Abstractions

**DatabaseQueries:**
- Purpose: Encapsulate Prisma operations with business logic and transformations
- Examples: `getDashboardOverview()`, `getSpendingData()`, `getTransactions()`
- Pattern: Async functions returning typed view objects (DashboardOverview, SpendCategory[], TransactionView[])
- Each query joins related records, aggregates metrics (net worth, savings rate), and formats for UI

**ViewTypes:**
- Purpose: Represent data shape consumed by UI components
- Examples: `TransactionView`, `SpendCategory`, `GoalView`, `AccountView`, `InsightView`
- Pattern: Flattened objects with UI-ready strings (formatted dates, currency, icons, colors)
- Prisma schema models map to these views via transformation in query functions

**AIFunctions:**
- Purpose: Encapsulate Claude API calls with consistent request/response patterns
- Examples: `categorizeTransactions()`, `parsePdfStatement()`, `detectRecurring()`, `generateInsights()`
- Pattern: Receive raw data, invoke anthropic.messages.create() with system prompt, parse JSON response
- Batching: `categorizeTransactions()` batches transactions by 50 to stay within context limits

**APIHandlers:**
- Purpose: Validate auth, extract query params, call data access layer, return JSON
- Examples: `/api/transactions/route.ts`, `/api/goals/route.ts`, `/api/import/route.ts`
- Pattern: `getApiUser()` checks JWT token; Prisma queries run within auth boundary; Response.json() returns result
- Error handling: try/catch with console.error logging and JSON error responses

**ServerActions:**
- Purpose: Wrap query functions with auth checks for use from server components and client-side fetches
- Examples: `fetchOverview()`, `fetchTransactions()`, `fetchGoals()` in `src/lib/actions/dashboard.ts`
- Pattern: Call `auth()` to verify session, throw if unauthorized, delegate to query function
- Currently used by page components; could be called directly from forms

## Entry Points

**Landing Page:**
- Location: `src/app/page.tsx`
- Triggers: User visits root `/`
- Responsibilities: Display hero, feature cards, login/register links; redirect authenticated users to dashboard or onboarding

**Authentication Pages:**
- Location: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`
- Triggers: User follows sign-in/sign-up flow
- Responsibilities: Collect credentials, validate form inputs, call signIn() or POST to register endpoint, redirect on success

**Onboarding Page:**
- Location: `src/app/onboarding/page.tsx`
- Triggers: Authenticated user with `onboardingDone: false` navigates to `/dashboard`
- Responsibilities: Guard against incomplete setup; render OnboardingWizard component

**Dashboard Page:**
- Location: `src/app/dashboard/page.tsx`
- Triggers: User navigates to `/dashboard` with completed onboarding
- Responsibilities: Fetch all dashboard data server-side; pass to DashboardShell; handle layout and routing to dashboard components

**Settings Page:**
- Location: `src/app/settings/page.tsx`
- Triggers: User clicks Settings from dashboard menu
- Responsibilities: Render budget target, currency, category management, data export forms

**API Routes:**
- Locations: `src/app/api/*/route.ts`
- Triggers: HTTP requests from client or external systems
- Responsibilities: Validate request auth, parse body/params, call business logic, return JSON responses

## Error Handling

**Strategy:** Try/catch in all async operations; log errors; return JSON error responses with status codes; fallback UI states for failed fetches.

**Patterns:**

- **API Errors:** `try { ... } catch { return Response.json({ error: "..." }, { status: 500 }); }`
- **Data Fetch Failures:** Page component wraps promises with `.catch(() => null)` or `.catch(() => [])` to provide graceful defaults
- **UI Loading States:** Modal components show loading spinners; buttons disabled during submission; errors displayed inline
- **Validation Errors:** API handlers validate request shape and return 400 with specific error messages
- **Auth Errors:** Missing/invalid tokens return 401; session callbacks handle token refresh

## Cross-Cutting Concerns

**Logging:** Console.error() in API routes and data queries for debugging; no centralized log aggregation.

**Validation:** 
- Frontend: Form inputs validated with HTML5 attributes and onChange handlers
- Backend: Request body parsed with `as` assertions; field presence checks before use
- No dedicated validation library; inline checks in handlers

**Authentication:** 
- NextAuth JWT strategy with credentials provider
- All API routes check token via `getApiUser()` or `getToken()`
- Sessions include user.id, user.name, user.email, user.onboardingDone
- Token stored in HTTP-only cookie automatically by NextAuth

**Authorization:**
- Implicit: All queries filter by userId from authenticated token
- No role-based access control; no fine-grained permissions
- Assumption: Users can only access their own data

---

*Architecture analysis: 2026-04-28*
