# Testing Patterns

**Analysis Date:** 2026-04-28

## Test Framework

**Runner:**
- Not detected - No test framework configured
- No Jest, Vitest, or other test runner in `package.json`

**Assertion Library:**
- Not detected - No testing framework configured

**Run Commands:**
```bash
npm run lint              # Only linting currently supported
npm run build             # Type checking via Next.js build
```

## Test File Organization

**Current State:**
- No test files found in codebase
- No `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files

**Recommended Structure (not currently implemented):**
- Co-located tests: `[feature].test.ts` next to `[feature].ts`
- API tests: `src/app/api/__tests__/[endpoint].test.ts`
- Component tests: `src/components/[name].test.tsx` alongside `src/components/[name].tsx`

## Test Structure

**Not Applicable**
- No existing test suites to reference for patterns

## Mocking

**Framework:**
- Not detected - No testing setup in place

**Patterns:**
- Not applicable - No tests to provide examples

**What to Mock (recommended):**
- Prisma client calls (use dependency injection or mock module)
- Anthropic AI SDK calls (mock responses for categorization, insights)
- Next.js authentication via `auth()` function
- External API calls

**What NOT to Mock:**
- Utility functions (`cn()`, `fmt()`, formatting helpers)
- Type definitions and interfaces
- Local state management in components

## Fixtures and Factories

**Test Data:**
- No test fixtures currently implemented
- Recommended location: `src/lib/__fixtures__/` or `src/__tests__/fixtures/`

**Current Data Patterns (from codebase):**
- `src/lib/data.ts` contains mock data objects (TRANSACTIONS, GOALS, BILLS, etc.)
- Could be repurposed for testing if tests are added

**Example structure (recommended):**
```typescript
// src/__tests__/fixtures/transaction.ts
export const mockTransaction = {
  id: "tx-1",
  name: "Grocery Store",
  category: "Groceries",
  date: "2026-04-28",
  amount: -50.00,
  icon: "shopping-cart",
  color: "#e8f4ed",
};

// src/__tests__/fixtures/user.ts
export const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  onboardingDone: true,
};
```

## Coverage

**Requirements:**
- Not enforced - No test setup exists

**Recommended Approach:**
- No coverage targets set; suggest establishing baseline when tests are added

## Test Types (Recommended Setup)

**Unit Tests:**
- Scope: Utility functions, formatters, helpers
- Approach: Pure function testing with multiple inputs
- Examples to test:
  - `src/lib/utils.ts` - `cn()` function with various classNames
  - `src/lib/format.ts` - `fmt()` and `fmtShort()` with different currencies
  - `src/lib/db/seed-categories.ts` - Category data structures
  - `src/lib/ai/categorize.ts` - Transaction categorization logic

**Integration Tests:**
- Scope: Database operations, API routes, server actions
- Approach: Test with mocked Prisma, auth layer
- Examples to test:
  - `src/app/api/transactions/route.ts` - GET/POST operations with auth
  - `src/app/api/auth/register/route.ts` - User registration flow
  - `src/lib/db/queries.ts` - Complex data aggregation functions
  - `src/lib/actions/dashboard.ts` - Server action authentication and data fetching

**E2E Tests:**
- Not currently configured
- Would benefit testing full user flows (login → onboarding → dashboard navigation)

## Component Testing (Recommended)

**Patterns to test:**
- Props rendering: `src/components/dashboard/tx-row.tsx` with different transaction states
- User interaction: Modal open/close, form submission
- State management: Modal form state and error handling

**Example (recommended structure):**
```typescript
// src/components/dashboard/__tests__/tx-row.test.tsx
import { TxRow } from "../tx-row";
import { mockTransaction } from "@/__tests__/fixtures/transaction";

describe("TxRow", () => {
  it("renders transaction with correct amount color", () => {
    // test income (positive) vs expense (negative) colors
  });

  it("calls onDoubleClick when clicked", () => {
    // test double-click handler
  });

  it("formats amount with correct currency", () => {
    // test fmt() with different currencies
  });
});
```

## API Testing (Recommended)

**Patterns:**
```typescript
// src/app/api/__tests__/transactions.test.ts
describe("POST /api/transactions", () => {
  it("creates transaction with valid input", async () => {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test",
        amount: 100,
        category: "Groceries",
        type: "debit",
      }),
    });
    expect(response.status).toBe(201);
  });

  it("returns 401 without authentication", async () => {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(401);
  });

  it("returns 400 with missing required fields", async () => {
    // test validation
  });
});
```

## Async Testing

**Pattern (recommended):**
```typescript
// For server actions
it("fetches overview with valid user", async () => {
  const data = await fetchOverview(4, 2026);
  expect(data).toHaveProperty("netWorth");
});

// For API routes
it("handles async database operations", async () => {
  const response = await POST(mockRequest);
  const data = await response.json();
  expect(data.id).toBeDefined();
});
```

## Error Testing

**Pattern (recommended):**
```typescript
// src/app/api/__tests__/transactions.test.ts
it("returns 400 when name is missing", async () => {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 100 }),
  });
  const data = await response.json();
  expect(response.status).toBe(400);
  expect(data.error).toBe("Name and amount are required");
});

it("returns 500 on unexpected database error", async () => {
  // mock prisma.transaction.create to throw
  const response = await POST(mockRequest);
  expect(response.status).toBe(500);
  expect(data.error).toBe("Internal server error");
});
```

## Authentication Testing (Recommended)

**Pattern for server actions:**
```typescript
it("throws error when user is not authenticated", async () => {
  // mock auth() to return null
  expect(() => fetchOverview(4, 2026)).rejects.toThrow("Unauthorized");
});
```

**Pattern for API routes:**
```typescript
it("returns 401 without valid token", async () => {
  // mock getApiUser to return null
  const response = await GET(mockRequestWithoutAuth);
  expect(response.status).toBe(401);
});
```

## Database Testing (Recommended)

**Pattern with Prisma mocking:**
```typescript
import { prismaMock } from "@/__mocks__/prisma";

it("aggregates spending by category correctly", async () => {
  prismaMock.transaction.findMany.mockResolvedValue([
    { name: "Groceries", amount: -50, category: { name: "Groceries" } },
    { name: "Rent", amount: -1000, category: { name: "Housing" } },
  ]);

  const result = await getDashboardOverview("user-1", 4, 2026);
  expect(result.spendingByCategory).toHaveLength(2);
});
```

## AI/LLM Testing (Recommended)

**Pattern for categorization:**
```typescript
it("categorizes transactions correctly", async () => {
  const transactions = [
    { name: "Costco", amount: -100, date: "2026-04-28" },
    { name: "Salary", amount: 5000, date: "2026-04-01" },
  ];

  const result = await categorizeTransactions(transactions, []);
  expect(result[0].category).toBe("Groceries");
  expect(result[1].category).toBe("Income");
});
```

## Current Testing Gaps

**Critical Areas Without Tests:**
- `src/lib/db/queries.ts` - Complex data aggregation with 100+ lines
- `src/app/api/transactions/route.ts` - Core transaction CRUD operations
- `src/app/api/auth/register/route.ts` - User registration flow
- `src/lib/ai/categorize.ts` - AI categorization logic with batch processing
- All components - No component tests exist

**High Priority for Coverage:**
1. Authentication flows (register, login, session handling)
2. API route validation and error handling
3. Database query accuracy (spending calculations, date filtering)
4. AI categorization and recurring detection

---

*Testing analysis: 2026-04-28*
