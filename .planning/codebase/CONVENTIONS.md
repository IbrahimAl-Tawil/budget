# Coding Conventions

**Analysis Date:** 2026-04-28

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `src/components/dashboard/TxRow.tsx` becomes `tx-row.tsx`)
- Utilities: camelCase with `.ts` extension (e.g., `src/lib/utils.ts`, `src/lib/format.ts`)
- API routes: kebab-case in directory structure (e.g., `src/app/api/auth/register/route.ts`)
- Pages: directory-based routing with `page.tsx` (e.g., `src/app/dashboard/page.tsx`)
- Modals/Components: descriptive kebab-case (e.g., `add-modal.tsx`, `tx-row.tsx`, `glass-card.tsx`)

**Functions:**
- camelCase for all functions (e.g., `getDashboardOverview`, `formatDate`, `categorizeTransactions`)
- Async functions follow same camelCase convention (e.g., `fetchOverview`, `detectRecurringExpenses`)
- Server actions: camelCase with "fetch" prefix (e.g., `fetchOverview`, `fetchTransactions`)
- Helper functions: descriptive, semantic names (e.g., `getApiUser`, `formatDate`, `cn`)

**Variables:**
- camelCase for all variables and constants (e.g., `categorySpend`, `monthlyIncome`, `isPending`)
- Component props use PascalCase for interface names (e.g., `AddTransactionModalProps`)
- State variables: descriptive camelCase (e.g., `startDate`, `endDate`, `categoryId`)
- Maps/Records: UPPER_SNAKE_CASE for data constants (e.g., `CATEGORY_ICON_MAP`, `ACCOUNT_GRADIENTS`, `MONTH_NAMES`)

**Types:**
- Interface names: PascalCase (e.g., `TransactionView`, `DashboardOverview`, `SpendCategory`)
- Type aliases: PascalCase (e.g., `Tab`)
- Generic types: follow PascalCase (e.g., `ClassValue`)

## Code Style

**Formatting:**
- No explicit Prettier config found; uses default Next.js conventions
- Spaces: 2-space indentation (observed in all files)
- Line length: No strict limit observed, but functions stay readable
- Semicolons: Always used at end of statements
- Quotes: Double quotes in imports, template literals for interpolation

**Linting:**
- ESLint config: `eslint.config.mjs` uses Next.js presets
- Rules: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Run with: `npm run lint`

## Import Organization

**Order:**
1. External libraries (React, Next.js, third-party packages)
2. Internal absolute imports using `@/` alias
3. Relative imports (rare in this codebase)

**Examples from codebase:**

```typescript
// src/lib/db/queries.ts
import { prisma } from "./prisma";
import type {
  DashboardOverview,
  SpendCategory,
  GoalView,
  // ...
} from "@/lib/types";
```

```typescript
// src/components/dashboard/tx-row.tsx
"use client";

import type { TransactionView } from "@/lib/types";
import { fmt } from "@/lib/format";
import { TxIcon } from "./tx-icon";
```

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- Used consistently throughout codebase for cross-module imports

## Error Handling

**Patterns:**
- Try-catch blocks in async functions for error handling (e.g., `src/app/api/transactions/route.ts`)
- Silent catches with fallback values in components (e.g., `src/components/dashboard/add-modal.tsx` line 44-56)
- API errors returned as JSON responses with status codes (401, 400, 409, 500)
- Promise.all with .catch() chains for parallel data fetching (e.g., `src/app/dashboard/page.tsx` lines 18-26)
- User-facing error messages returned in response body (e.g., "Unauthorized", "Name and amount are required")
- Graceful fallbacks to empty/default values (e.g., `.catch(() => [])`, `.catch(() => null)`)

**Example pattern:**
```typescript
// src/app/api/transactions/route.ts
try {
  const body = await request.json();
  // validation
  if (!name || amount === undefined) {
    return Response.json(
      { error: "Name and amount are required" },
      { status: 400 }
    );
  }
  // operations
  const transaction = await prisma.transaction.create({ /* ... */ });
  return Response.json(transaction, { status: 201 });
} catch (error) {
  console.error("Create transaction error:", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
```

## Logging

**Framework:** Native `console.error()` for error logging

**Patterns:**
- Error logging used in API routes and async operations (e.g., `console.error("Create transaction error:", error)`)
- Descriptive error messages with context
- No structured logging framework detected

**When to log:**
- API errors caught in try-catch blocks
- External service failures (AI API calls)

## Comments

**When to Comment:**
- Comments are sparse; code is generally self-documenting
- No TODO/FIXME/HACK comments found in codebase
- Minimal JSDoc usage; only where types aren't sufficient

**JSDoc/TSDoc:**
- Not heavily used in this codebase
- Focus on TypeScript types for documentation
- Interface definitions serve as primary documentation (e.g., `src/lib/types.ts`)

## Function Design

**Size:** Functions typically 10-50 lines; larger functions (50-100+ lines) exist for complex data transformation

**Parameters:**
- Individual parameters for simple functions (e.g., `getDashboardOverview(userId: string, month: number, year: number)`)
- Options object pattern for functions with many optional parameters (e.g., `fetchTransactions(options: { page?: number; search?: string; month?: number; year?: number })`)
- Destructuring used for props and object parameters

**Return Values:**
- Async functions return typed Promises (e.g., `Promise<DashboardOverview>`)
- API routes return `Response.json()` for consistency
- Functions return typed interfaces/arrays for data operations
- Null/empty returns for error cases with fallback handling

## Module Design

**Exports:**
- Named exports preferred (e.g., `export async function getDashboardOverview()`)
- All utility functions exported explicitly
- Single default export only in config files or route handlers

**Barrel Files:**
- Not used in this codebase
- Each module imports directly from source files

## Project-Specific Patterns

**Server Actions:**
- Located in `src/lib/actions/` directory
- Marked with `"use server"` directive
- Wrap database queries with authentication check
- Generic wrapper functions that extract userId and call database queries (e.g., `fetchOverview`, `fetchTransactions`)

**API Routes:**
- Located in `src/app/api/` directory following Next.js App Router conventions
- Authenticate using `getApiUser()` helper from `@/lib/api-auth.ts`
- Return JSON responses with appropriate HTTP status codes
- Validation before database operations

**Component Props:**
- Props interfaces defined locally above component function
- Optional props use `?` syntax (e.g., `currency?: string`)
- Destructuring in function parameters

**Type Organization:**
- Shared view types in `src/lib/types.ts`
- Request/response shapes defined inline in route files
- Validation types in AI processing files

---

*Convention analysis: 2026-04-28*
