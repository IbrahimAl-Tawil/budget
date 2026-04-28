# External Integrations

**Analysis Date:** 2026-04-28

## APIs & External Services

**AI & Document Processing:**
- Anthropic Claude API (via @anthropic-ai/sdk 0.91.0)
  - Model: claude-sonnet-4-5
  - Uses: Transaction categorization, PDF bank statement parsing, financial insights generation
  - SDK: @anthropic-ai/sdk
  - Auth: `ANTHROPIC_API_KEY` environment variable
  - Endpoints:
    - `POST /api/import` - Parses PDF statements via `parsePdfStatement()`
    - `POST /api/import/confirm` - Categorizes transactions via `categorizeTransactions()`
    - `POST /api/insights/generate` - Generates financial insights via `generateInsightsForUser()`

## Data Storage

**Databases:**
- SQLite (via better-sqlite3 12.9.0)
  - Location: `prisma/dev.db`
  - Client: Prisma ORM (@prisma/client 7.8.0)
  - Adapter: @prisma/adapter-better-sqlite3 7.8.0
  - Models: User, Account, Transaction, Category, Goal, Subscription, Bill, Budget, Insight, BankStatement

**File Storage:**
- Local filesystem only - Bank statement files uploaded but not persisted on disk (parsed in memory)

**Caching:**
- Application-level caching only:
  - Insights generation cached daily per user (checked in `POST /api/insights/generate`)

## Authentication & Identity

**Auth Provider:**
- Custom authentication via NextAuth 5.0.0-beta.31
  - Strategy: JWT (session.strategy: "jwt")
  - Provider: Credentials-based (email/password)
  - Implementation: `src/lib/auth.ts`
    - Password hashing: bcryptjs 3.0.3
    - Custom authorize flow using bcrypt.compare()
    - Custom JWT callbacks for token management
    - Session callbacks to populate user data
  - Pages: `/login` (custom sign-in page)
  - Session includes: `id`, `name`, `email`, `onboardingDone` flag

**Password Handling:**
- Passwords hashed with bcryptjs before storage
- Stored in User.passwordHash field
- Verified on login via bcrypt.compare()

**Session Management:**
- JWT tokens stored in HTTP-only cookies
- Token includes userId and onboarding status
- API endpoints validate sessions via `getApiUser()` from `src/lib/api-auth.ts`
- Environment variables: `AUTH_SECRET`, `NEXTAUTH_SECRET`

## Monitoring & Observability

**Error Tracking:**
- None detected - Console errors logged to stdout

**Logs:**
- console.error() used in:
  - `src/app/api/insights/generate/route.ts` - Insights generation errors
  - `src/app/api/import/route.ts` - File import errors

**Debugging:**
- No structured logging framework; basic console logging only

## CI/CD & Deployment

**Hosting:**
- Not specified in codebase - Next.js compatible with Vercel, AWS, Google Cloud, etc.

**CI Pipeline:**
- None detected in codebase

## Environment Configuration

**Required env vars:**
- `ANTHROPIC_API_KEY` - Anthropic Claude API key (REQUIRED for insights, categorization, PDF parsing)
- `AUTH_SECRET` - Session encryption key (REQUIRED for next-auth)
- `NEXTAUTH_SECRET` - NextAuth configuration (REQUIRED for authentication)
- `NODE_ENV` - Runtime environment (dev/production; affects Prisma singleton pattern)

**Optional env vars:**
- None detected

**Secrets location:**
- `.env` file (development)
- Should use environment-specific secrets management in production

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## Data Flow & API Routes

**Authentication Flow:**
1. User submits credentials to `POST /api/auth/[...nextauth]/route.ts`
2. NextAuth handlers route to credentials provider
3. Provider queries Prisma for user by email
4. Password verified via bcrypt.compare()
5. JWT token created with userId and onboardingDone
6. Token returned to client in HTTP-only cookie

**Bank Statement Import Flow:**
1. User uploads CSV or PDF to `POST /api/import`
2. File stored in BankStatement record (status: "processing")
3. For PDF: calls `parsePdfStatement()` via Claude API (vision + document parsing)
4. Claude extracts transaction list (name, amount, date)
5. Response returned to frontend with parsed transactions
6. User confirms and submits to `POST /api/import/confirm`
7. Confirmed transactions categorized via `categorizeTransactions()` using Claude
8. Categorized transactions created in Transaction table

**Insights Generation Flow:**
1. User requests insights from `POST /api/insights/generate`
2. Check if insights generated today (daily rate limit)
3. If not: fetch user data, transactions (3 months), subscriptions, goals, accounts
4. Build financial summary object
5. Send to Claude via `generateInsightsForUser()` with system prompt
6. Claude analyzes and returns JSON array of insights with tags (Spending Pattern, Alert, Opportunity, Trend)
7. Insights stored in Insight table
8. Return insights with caching flag to frontend

## Rate Limiting

- Insights: Once per day per user (checked in `POST /api/insights/generate`)
- No API rate limiting framework detected

## Transaction Processing

**Sources:**
- Manual entry: `source: "manual"` in Transaction table
- CSV import: `source: "csv"` (derived from import flow)
- PDF import: `source: "pdf"` (derived from import flow)

**Recurring Detection:**
- Handled by Claude categorization: `isRecurring` boolean
- Also tracked in Transaction.recurringFlag field
- Dedicated `POST /api/recurring/detect` and `POST /api/recurring/confirm` routes

---

*Integration audit: 2026-04-28*
