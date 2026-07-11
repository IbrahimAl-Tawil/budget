-- Lock down the Stripe webhook event log at the database layer.
--
-- `StripeEvent` stores raw Stripe webhook payloads (billing internals) and must
-- never be reachable through Supabase's data API. Enabling RLS with NO policies
-- denies all access to the `anon` and `authenticated` PostgREST roles, while the
-- app's Prisma connection (the table-owning Postgres role) bypasses RLS as usual.
ALTER TABLE "StripeEvent" ENABLE ROW LEVEL SECURITY;
