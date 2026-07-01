-- ─────────────────────────────────────────────────────────────────────────────
-- RLS lockdown for the Prisma-backed / profile-table architecture.
--
-- RUN THIS *AFTER* `prisma migrate deploy` (it locks down the tables Prisma made).
-- Idempotent — safe to re-run. Apply in the Supabase SQL Editor or via psql:
--   psql "$DIRECT_URL" -f supabase/migrations/20260701000200_rls_lockdown.sql
--
-- WHY THIS EXISTS
-- Supabase's default privileges granted the `anon` and `authenticated` roles FULL
-- CRUD on every table Prisma created in `public`. Those roles back the *public*
-- publishable key (shipped to the browser) through Supabase's auto-exposed Data
-- API (PostgREST at /rest/v1). With RLS off, anyone holding the publishable key
-- could read/write/delete every user's data directly — bypassing GraphQL.
--
-- THE MODEL
-- This app never touches these tables via the Data API. ALL data access is Prisma
-- over the privileged `postgres` role, which OWNS the tables and has BYPASSRLS —
-- so it is completely unaffected by anything below. Per-user scoping is enforced
-- in the GraphQL resolvers (where: { userId }). We therefore apply two independent
-- locks against the public API roles:
--   1) ENABLE ROW LEVEL SECURITY on every table (with no permissive policy → deny
--      all for non-bypass roles), and
--   2) REVOKE the blanket anon/authenticated grants (Data API → permission denied).
--
-- We do NOT FORCE row level security (that would subject the owner too and break
-- Prisma), and we deliberately add NO auth.uid() policies: the Data API is not a
-- supported access path here, so per-user policies would be dead, untested surface.
--
-- IF YOU LATER WANT DIRECT CLIENT DATA-API ACCESS
-- Keep the `authenticated` grant on the relevant table and add per-user policies,
-- e.g. (every table below carries a `userId`; User itself is keyed on the auth id):
--   create policy "own rows" on public."Transaction" for all to authenticated
--     using  ((select auth.uid())::text = "userId")
--     with check ((select auth.uid())::text = "userId");
--   create policy "own row"  on public."User" for all to authenticated
--     using  ((select auth.uid())::text = id)
--     with check ((select auth.uid())::text = id);
-- Leave `anon` denied. `service_role` (the secret key) keeps BYPASSRLS regardless.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  t text;
  app_tables text[] := array[
    'User', 'Account', 'PlaidItem', 'PlaidLinkEvent', 'Category', 'Transaction',
    'Goal', 'GoalAllocation', 'Subscription', 'Bill', 'Budget', 'Insight',
    'BankStatement', '_prisma_migrations'
  ];
begin
  foreach t in array app_tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('revoke all on public.%I from anon, authenticated;', t);
  end loop;
end
$$;
