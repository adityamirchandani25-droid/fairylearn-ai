  -- supabase/schema.sql — the database setup for Fairylearn. Paste it into the Supabase SQL Editor once.
  --
  -- Accounts themselves (emails, passwords, sessions) are handled by Supabase Auth in its own
  -- auth.users table. This file adds one table for each learner's learning data.
  -- Run once in the Supabase SQL Editor. Auth is managed by Supabase Auth.
  -- One row per learner.
  --   user_id     — the learner's Supabase Auth id. "on delete cascade" removes this row
  --                 automatically when the account is deleted.
  --   answers     — the questionnaire answers as JSON, plus the saved path under "learning_plan".
  --                 JSON means the path format can change without a database migration.
  --   level       — the starting level; the check constraint only allows the four real levels.
  --   description — the short explanation of the path shown on the dashboard.
  --   updated_at  — when the row was last saved. The server also uses it to detect when two tabs
  --                 try to change the path at the same time.
  -- "if not exists" makes the script safe to run again.
  create table if not exists public.learning_profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    answers jsonb not null,
    level text not null check (level in ('Starter', 'Beginner', 'Medium', 'Expert')),
    description text not null default '',
    updated_at timestamptz not null default now()
  );
  -- Row-level security (RLS): the database itself checks every query, so a learner can only ever
  -- read or change their own row, even if a bug in the website asked for someone else's.
  -- Visitors who are not logged in ("anon") get no access at all. Logged-in learners
  -- ("authenticated") may read, create and update rows, but only through the policies below.
  -- Nobody can delete rows through the API.
  alter table public.learning_profiles enable row level security;
  revoke all on public.learning_profiles from anon;
  grant select, insert, update on public.learning_profiles to authenticated;
  -- Each policy is dropped first and then created again, so re-running the script updates it
  -- instead of failing because it already exists.
  -- auth.uid() is the id of the logged-in learner making the request.
  --   using (...)      — which existing rows the learner may see or change;
  --   with check (...) — what a new or updated row must satisfy, so nobody can create or move a
  --                      row into another learner's user_id.
  -- "(select auth.uid())" is written as a sub-select so Postgres works it out once per query
  -- instead of once per row, which is faster.
  drop policy if exists "Read own learning profile" on public.learning_profiles;
  create policy "Read own learning profile" on public.learning_profiles for select to authenticated using ((select auth.uid()) = user_id);
  drop policy if exists "Create own learning profile" on public.learning_profiles;
  create policy "Create own learning profile" on public.learning_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
  drop policy if exists "Update own learning profile" on public.learning_profiles;
  create policy "Update own learning profile" on public.learning_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
