# Budget — Smart Connected Budgeting

## What This Is

A personal budgeting app that transforms from a static display layer into a smart, connected financial assistant. Users import transactions and the app auto-calculates budgets, auto-allocates surplus money to savings goals, and proactively surfaces insights — all with smart defaults the user can override.

## Core Value

The app does the thinking so the user doesn't have to — surplus flows to goals, spending updates budgets, subscriptions flag themselves, and notifications guide better decisions.

## Requirements

### Validated

- ✓ User registration and login with email/password — existing
- ✓ JWT session management with persistent login — existing
- ✓ Onboarding wizard (budget target, currency, accounts) — existing
- ✓ Dashboard with tabbed navigation (overview, transactions, goals, subscriptions, accounts) — existing
- ✓ Transaction import via CSV and PDF with AI categorization — existing
- ✓ Manual transaction entry — existing
- ✓ Category management with icons and colors — existing
- ✓ Savings goals with target amounts and deadlines — existing
- ✓ Subscription tracking with recurring detection — existing
- ✓ Bill tracking with due dates and urgency flags — existing
- ✓ Budget per category per month — existing
- ✓ AI-generated insights (static, display-only) — existing
- ✓ Account management with balances — existing
- ✓ Spending breakdown by category with charts — existing
- ✓ Settings page for budget target, currency, categories — existing

### Active

- [ ] Auto-calculate account balances from transaction history (not manual entry)
- [ ] Auto-update budget progress as transactions are imported/added
- [ ] Surplus detection at month-end based on income vs spending
- [ ] Smart surplus allocation to goals based on priority (auto with override)
- [ ] Subscription change detection (price increases, unused services)
- [ ] In-app notification center with notification history
- [ ] Spending pace alerts (e.g., "80% of dining budget used with 10 days left")
- [ ] Goal milestone notifications (e.g., "Vacation fund hit 50%")
- [ ] Subscription warnings (price changes, inactivity flags)
- [ ] AI-powered saving tips based on spending patterns
- [ ] Connected data flow: transactions → budgets → surplus → goals
- [ ] Goal progress auto-tracking from allocated surplus

### Out of Scope

- Email/push notifications — in-app only for now
- Bank API integrations (Plaid, etc.) — manual import is sufficient
- OAuth login — email/password works
- Mobile app — web-first
- Multi-currency support — single currency per user
- Shared/family budgets — single user only

## Context

This is a brownfield project. The app already has a full Next.js 16 stack with Prisma/SQLite, NextAuth, and Anthropic Claude integration. The current architecture is a server-rendered dashboard with client-side tab navigation. AI is already used for transaction categorization, PDF parsing, and insight generation — but insights are static and disconnected from the rest of the system.

The key architectural shift is from "store and display" to "observe, compute, and act." Features that currently exist as isolated CRUD need to become interconnected — transactions should ripple through budgets, budgets should feed surplus calculations, and surplus should flow to goals.

## Constraints

- **Database**: SQLite via better-sqlite3 — no background jobs or cron, so automation must be triggered by user actions (import, page load, etc.)
- **AI costs**: Anthropic API calls cost money — batch and cache where possible, don't call AI on every page load
- **No external services**: No email service, no push notification provider — in-app notifications only
- **Existing schema**: Must evolve current Prisma schema, not replace it — users have existing data

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Smart defaults with override | User wants automation but not loss of control | — Pending |
| In-app notifications only | Keep scope manageable, add email later if needed | — Pending |
| Trigger automation on user actions | SQLite has no background worker; compute on import/page load | — Pending |
| Priority-based goal allocation | Surplus splits across goals by user-defined priority weights | — Pending |

---
*Last updated: 2026-04-28 after initialization*
