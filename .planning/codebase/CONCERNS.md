# Codebase Concerns

**Analysis Date:** 2026-04-28

## Tech Debt

**Large, Complex Components:**
- Issue: `src/components/onboarding/onboarding-wizard.tsx` is 701 lines with mixed concerns (state management, form handling, AI analysis, file upload, UI rendering)
- Files: `src/components/onboarding/onboarding-wizard.tsx`
- Impact: Difficult to test, maintain, and debug; high risk of bugs when modifying any feature
- Fix approach: Extract separate components for each step (UploadStep, AnalyzingStep, ManualEntryStep, ReviewStep) and move form logic to custom hooks

**Dashboard Shell Complexity:**
- Issue: `src/components/dashboard/dashboard-shell.tsx` is 472 lines handling tab navigation, data fetching, menu management, and UI state
- Files: `src/components/dashboard/dashboard-shell.tsx`
- Impact: Hard to add new tabs or modify navigation; multiple responsibilities make testing difficult
- Fix approach: Extract tab-fetching logic into a custom hook (`useTabFetch`), separate menu refs into a context, create a TabNavigation subcomponent

**Large Modal Components:**
- Issue: Modal components like `src/components/dashboard/import-modal.tsx` (441 lines), `src/components/dashboard/edit-account-modal.tsx` (280 lines), and `src/components/dashboard/edit-tx-modal.tsx` (227 lines) handle file upload, parsing, validation, and API calls all in one component
- Files: Multiple modal files
- Impact: Testing difficult, form state gets tangled, validation scattered
- Fix approach: Extract form logic to custom hooks (`useImportForm`, `useAccountForm`), create separate validation utilities

## Known Issues

**Truncated JSON Repair in Auto Onboarding:**
- Issue: `src/app/api/onboarding/auto/route.ts` lines 13-52 implement a custom JSON repair function for handling LLM truncation
- Files: `src/app/api/onboarding/auto/route.ts` (lines 13-52)
- Symptoms: When Claude hits token limits on large statement uploads (>200 transactions), response gets truncated, causing parse failures
- Trigger: Uploading 3+ large bank statements (10+ months of history)
- Workaround: Currently handled with fallback to partial data, but user is silently losing transaction data
- Root cause: Using 16384 max_tokens is not enough for comprehensive analysis; model truncates JSON mid-array

**Unvalidated Number Conversions:**
- Issue: Throughout the codebase, `Number()` is used on user input without validation
- Files: `src/app/api/transactions/route.ts` (lines 11-12), `src/app/api/goals/route.ts` (line 45), `src/components/dashboard/add-modal.tsx` (line 68), etc.
- Symptoms: `NaN` values can propagate through calculations (e.g., line 96 in `src/lib/db/queries.ts`: `totalSpend` defaults to 1 if all are NaN)
- Trigger: User enters non-numeric text in amount field, form submission proceeds
- Risk: Silent failures in budget calculations, incorrect spending summaries

**Silent Catch Blocks:**
- Issue: Catch blocks throughout codebase silently swallow errors without proper logging context
- Files: `src/lib/ai/generate-insights.ts` (line 134), `src/lib/ai/categorize.ts` (line 103), `src/components/dashboard/insights.tsx` (line 20)
- Impact: Parse failures silently return empty arrays, making issues invisible to debugging
- Example: If Claude's JSON response is malformed in insights generation, function returns `[]` with no error indication

## Security Considerations

**CSV Parsing Without Validation:**
- Risk: Manual CSV parsing in `src/app/api/onboarding/auto/route.ts` (lines 54-68) doesn't validate CSV structure or reject obviously malformed data
- Files: `src/app/api/onboarding/auto/route.ts` (lines 54-68)
- Current mitigation: Basic check for minimum row count (line 102: `if (rows.length < 2) continue`)
- Recommendations: 
  1. Use a CSV parsing library with proper validation (e.g., `csv-parse` or `papaparse`)
  2. Validate file size before processing (currently no file size limit)
  3. Add max transaction count per file (currently no limit)

**No Input Sanitization on User-Provided Account/Transaction Names:**
- Risk: User-entered strings (transaction names, account names, category names) are written directly to database and rendered in UI without sanitization
- Files: `src/app/api/transactions/route.ts` (line 84), `src/app/api/accounts/route.ts` (line 51)
- Current mitigation: React escapes text content by default in JSX
- Recommendations: Add input validation for length and character constraints; trim whitespace

**AI Response Parsing Without Length Limits:**
- Risk: `src/app/api/onboarding/auto/route.ts` line 175 passes truncated transaction array to Claude without checking actual length/token count
- Files: `src/app/api/onboarding/auto/route.ts` (line 175)
- Current mitigation: Hard-coded slice to 200 transactions
- Recommendations: Calculate actual prompt token count before sending; implement pagination for large statement sets

**Session Token Exposure:**
- Risk: `src/lib/api-auth.ts` reads from both `AUTH_SECRET` and `NEXTAUTH_SECRET` without clear hierarchy
- Files: `src/lib/api-auth.ts` (line 5)
- Current mitigation: Uses NextAuth's JWT with session strategy
- Recommendations: Document which env var to use; enforce only one in production; consider explicit fallback warning

## Performance Bottlenecks

**Unbounded Dashboard Data Fetching:**
- Problem: `src/components/dashboard/dashboard-shell.tsx` line 47 fetches all tabs data in parallel with hardcoded 15-second timeout
- Files: `src/components/dashboard/dashboard-shell.tsx` (lines 42-53)
- Cause: No pagination or lazy loading; if user has thousands of transactions, initial load + every tab switch refetches all data
- Improvement path: Implement pagination in `src/lib/db/queries.ts`, add cursor-based pagination for Transactions tab, lazy-load tab data on first click

**N+1 Query Pattern in Overview Calculation:**
- Problem: `src/lib/db/queries.ts` getDashboardOverview fetches transactions, then loops through them to calculate category spend
- Files: `src/lib/db/queries.ts` (lines 86-96)
- Cause: Calculates spending maps in JavaScript instead of using GROUP BY in database query
- Improvement path: Use Prisma raw queries or add calculated field in database; for 1000+ transactions, this loop is slow

**Large Component Re-renders:**
- Problem: `src/components/dashboard/dashboard-shell.tsx` re-renders entire tab on month/year change due to missing key optimization
- Files: `src/components/dashboard/dashboard-shell.tsx` (line 387 uses `key={tab}-${month}-${year}`)
- Cause: Resets component state on every navigation, causes flicker
- Improvement path: Separate data state from UI state; keep edited row state in parent only when needed

**AI API Calls on Every Analysis:**
- Problem: `src/app/api/onboarding/auto/route.ts` makes 2 Claude API calls per upload (column detection + full analysis)
- Files: `src/app/api/onboarding/auto/route.ts` (lines 108-176)
- Cause: Always calls Claude twice even for simple CSV files with clear structure
- Improvement path: Add heuristic first-pass column detection; only call Claude if heuristic confidence is low

## Fragile Areas

**Error Boundary Missing for Insights Generation:**
- Files: `src/components/dashboard/insights.tsx`, `src/lib/ai/generate-insights.ts`
- Why fragile: If Claude API fails or returns unparseable JSON, entire insights panel breaks silently; no UI feedback
- Safe modification: Wrap insights generation in try-catch that sets a visible error state in component
- Test coverage: No tests for malformed Claude responses

**Auto-Onboarding Flow Coupling:**
- Files: `src/components/onboarding/onboarding-wizard.tsx` (lines 133-186, 189-247), `src/app/api/onboarding/auto/route.ts`
- Why fragile: Tight coupling between frontend form state and backend analysis; if analysis schema changes, frontend breaks silently
- Safe modification: Create shared TypeScript type for Analysis schema; add validation at response parsing boundary
- Test coverage: No integration tests for full onboarding flow

**Categorization Dependency on Claude Response Format:**
- Files: `src/lib/ai/categorize.ts` (lines 80-87)
- Why fragile: Regex matching for JSON array with no fallback if Claude changes response format
- Safe modification: Use streaming JSON parsing or Claude's JSON mode feature (if available in SDK)
- Test coverage: No unit tests with different Claude response formats

**Month/Year Parameter Parsing Without Validation:**
- Files: `src/app/api/dashboard/route.ts` (lines 34-35), `src/app/api/transactions/route.ts` (lines 28-31)
- Why fragile: `Number()` on query params can produce 0 for invalid input; month: 0 creates invalid Date
- Safe modification: Add explicit validation: `month >= 1 && month <= 12 && year >= 2000 && year <= 2100`
- Test coverage: No tests for edge cases (month 0, year 1900, negative values)

## Scaling Limits

**SQLite Single Writer Limitation:**
- Current capacity: Single concurrent write to database
- Limit: With SQLite, only one transaction can write at a time; dashboard page concurrent requests will queue
- Scaling path: Migrate to PostgreSQL for concurrent write support; current `.env` would need migration
- Evidence: Using better-sqlite3 in `package.json` line 20

**Memory Usage with Large Imports:**
- Current capacity: Entire file loaded into memory (line 100 in `src/app/api/onboarding/auto/route.ts`: `await file.text()`)
- Limit: PDFs + CSVs over 50MB will cause memory exhaustion; no streaming or chunking
- Scaling path: Implement streaming file parsing, process chunks instead of whole file
- Evidence: No file size limits in form validation

**CSV Parsing Performance on Large Files:**
- Current capacity: Custom CSV parser (lines 54-68) is O(n) string scanning, acceptable for <100k rows
- Limit: With 500k+ row files, JavaScript string operations become slow
- Scaling path: Use native CSV library (csv-parse, etc.) which has optimized parsing
- Evidence: Multiple file processing loops through files array without parallelization

**Unbounded Promise.all() in Onboarding:**
- Current capacity: `src/app/api/onboarding/route.ts` uses multiple `Promise.all()` to create hundreds of records simultaneously
- Limit: Creating 1000+ budget entries, categories, and subscriptions in parallel can overwhelm SQLite
- Scaling path: Implement batch operations; create records in chunks of 100
- Evidence: Lines 46, 73, 80, 95, 111 all use `Promise.all()` without batching

## Dependencies at Risk

**Next.js 16 (Beta-Adjacent):**
- Risk: Using `@base-ui/react` v1.4.1 which is pre-release; base-ui is not production-stable
- Impact: Breaking changes in minor releases; no patch support guarantee
- Migration plan: Migrate to `shadcn/ui` which is built on stable Radix UI, already partially used in `src/components/ui/`

**next-auth 5.0.0-beta.31 (Beta):**
- Risk: Using pre-release auth library; API may change before 5.0.0 final
- Impact: Session handling, credential validation, callbacks could break
- Migration plan: Pin to stable next-auth 4.x until 5.0 is released; then upgrade with careful testing

**Anthropic SDK Version Pinning:**
- Risk: `@anthropic-ai/sdk` at ^0.91.0 is early version; API contracts may change
- Impact: Claude model names, response formats, error types could change
- Current usage: Model hardcoded as "claude-sonnet-4-5" (line 143 in auto/route.ts), "claude-sonnet-3.5" elsewhere
- Migration plan: Abstract model name to env var; add version checking before major SDK upgrades

## Missing Critical Features

**No Input Validation Library:**
- Problem: Form validation is scattered across components; no centralized schema validation
- Files: `src/components/dashboard/add-modal.tsx`, `src/components/dashboard/edit-account-modal.tsx`, etc.
- Blocks: Can't catch invalid data before API calls; error messages are generic
- Recommendation: Add Zod for schema validation across all forms

**No Error Boundary Component:**
- Problem: If any component errors (e.g., chart rendering, modal), entire page breaks
- Files: `src/app/dashboard/page.tsx`, `src/app/onboarding/page.tsx`
- Blocks: Users cannot recover from component crashes
- Recommendation: Add React Error Boundary wrapper around routes; log errors to sentry/similar

**No Request Rate Limiting:**
- Problem: No protection against accidental/malicious repeated requests
- Files: All `/api/*` routes
- Blocks: User could spam duplicate imports, creating duplicate transactions
- Recommendation: Add middleware with rate limiting by user ID

**No Database Migration Strategy:**
- Problem: Prisma schema changes require manual db:push; no version control for schema history
- Files: `prisma/schema.prisma`
- Blocks: Can't rollback schema changes; multi-user deployments risky
- Recommendation: Set up Prisma migrations folder with version control

## Test Coverage Gaps

**Auto-Onboarding Analysis - Untested:**
- What's not tested: Claude API response parsing, JSON repair logic, file parsing edge cases
- Files: `src/app/api/onboarding/auto/route.ts` (entire route)
- Risk: JSON parse failures silently fail; truncation repair untested with real Claude outputs
- Priority: High - core user flow

**API Response Validation - Untested:**
- What's not tested: Endpoints validate auth but not input shape (missing fields, wrong types)
- Files: All `src/app/api/*/route.ts` files
- Risk: Unexpected API input could cause Prisma errors or data corruption
- Priority: High - security & data integrity

**Transaction Categorization - Untested:**
- What's not tested: `src/lib/ai/categorize.ts` with actual Claude responses
- Files: `src/lib/ai/categorize.ts`
- Risk: Category assignment could fail silently if response format changes
- Priority: Medium - feature completeness

**Error Handling in Client Components - Untested:**
- What's not tested: Network failures, timeouts (like line 45 in dashboard-shell), malformed responses
- Files: `src/components/dashboard/add-modal.tsx`, `src/components/dashboard/import-modal.tsx`, etc.
- Risk: Users see "Something went wrong" with no details; hard to debug
- Priority: Medium - user experience

**Date Math Edge Cases - Untested:**
- What's not tested: Month/year boundary calculations, timezone issues, leap years
- Files: `src/lib/db/queries.ts` (lines 35-36), `src/app/api/onboarding/route.ts` (lines 118-121)
- Risk: Wrong dates for bills, budget calculations cross month boundaries incorrectly
- Priority: Medium - data accuracy

---

*Concerns audit: 2026-04-28*
