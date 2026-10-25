  -- Run once in the Supabase SQL Editor. Auth is managed by Supabase Auth.
  create table if not exists public.learning_profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    answers jsonb not null,
    level text not null check (level in ('Starter', 'Beginner', 'Medium', 'Expert')),
    description text not null default '',
    updated_at timestamptz not null default now()
  );
  alter table public.learning_profiles enable row level security;
  revoke all on public.learning_profiles from anon;
  grant select, insert, update on public.learning_profiles to authenticated;
  drop policy if exists "Read own learning profile" on public.learning_profiles;
  create policy "Read own learning profile" on public.learning_profiles for select to authenticated using ((select auth.uid()) = user_id);
  drop policy if exists "Create own learning profile" on public.learning_profiles;
  create policy "Create own learning profile" on public.learning_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
  drop policy if exists "Update own learning profile" on public.learning_profiles;
  create policy "Update own learning profile" on public.learning_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
