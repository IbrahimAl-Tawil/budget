-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase-side auth glue for the profile-table pattern.
--
-- RUN THIS *AFTER* `prisma migrate deploy` has created the public schema (it
-- references public."User"). Apply it in the Supabase SQL Editor, or via the
-- Supabase CLI (`supabase db push` / migration apply).
--
-- What it does: when Supabase Auth creates a row in auth.users (signup), this
-- trigger creates the matching public."User" profile row with the SAME id. That
-- is the ONLY coupling between Supabase auth and our data — the public schema has
-- no foreign key into auth.users, so the database stays provider-portable (drop
-- this trigger and generate ids yourself to move off Supabase).
--
-- Note on RLS: RLS is ENABLED on every public table by the companion migration
-- 20260701000200_rls_lockdown.sql (run it after this one). All data access goes
-- through Prisma as the `postgres` role (table owner +
-- BYPASSRLS), so RLS never affects the app; per-user scoping is enforced in the
-- GraphQL resolvers (where: { userId }). This SECURITY DEFINER function likewise
-- runs as its owner and bypasses RLS. The publishable key is used ONLY for auth.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."User" (id, name, email, currency, "onboardingDone", "createdAt", "updatedAt")
  values (
    new.id::text,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    new.email,
    'CAD',
    false,
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
