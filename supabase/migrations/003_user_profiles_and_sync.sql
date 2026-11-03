-- ============================================================================
-- Migration 003: Per-user profile (streak days + settings) and tighter RLS
-- Safe to run multiple times in the Supabase SQL Editor.
-- ============================================================================

-- 1. One row per user for everything that isn't a single SRS item:
--    study_days powers the streak/stamp card, the rest are settings.
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_goal smallint not null default 10 check (daily_goal between 1 and 100),
  sabqi_window_days smallint not null default 7 check (sabqi_window_days between 3 and 20),
  current_jp_level smallint not null default 1 check (current_jp_level between 1 and 60),
  -- { "YYYY-MM-DD": items finished that local day }
  study_days jsonb not null default '{}'::jsonb check (jsonb_typeof(study_days) = 'object'),
  -- When daily_goal / sabqi_window_days were last changed (last change wins).
  settings_updated_at timestamptz not null default 'epoch',
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users manage own profile" on public.user_profiles;
create policy "Users manage own profile" on public.user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Merge two study_days maps, keeping the higher count for each day, so two
--    phones can't erase each other's streak days.
create or replace function public.merge_study_days(a jsonb, b jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(
      k,
      greatest(coalesce((a ->> k)::int, 0), coalesce((b ->> k)::int, 0))
    ),
    '{}'::jsonb
  )
  from (
    select jsonb_object_keys(coalesce(a, '{}'::jsonb)) as k
    union
    select jsonb_object_keys(coalesce(b, '{}'::jsonb))
  ) keys;
$$;

-- 3. Upsert the caller's own profile, merging instead of overwriting.
--    security invoker: runs as the signed-in user, so RLS still applies.
create or replace function public.upsert_user_profile(
  p_daily_goal integer,
  p_sabqi_window_days integer,
  p_current_jp_level integer,
  p_study_days jsonb,
  p_settings_updated_at timestamptz
)
returns public.user_profiles
language plpgsql
security invoker
set search_path = public
as $$
declare
  result public.user_profiles;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  insert into public.user_profiles as p (
    user_id, daily_goal, sabqi_window_days, current_jp_level,
    study_days, settings_updated_at, updated_at
  )
  values (
    auth.uid(),
    least(100, greatest(1, coalesce(p_daily_goal, 10))),
    least(20, greatest(3, coalesce(p_sabqi_window_days, 7))),
    least(60, greatest(1, coalesce(p_current_jp_level, 1))),
    coalesce(p_study_days, '{}'::jsonb),
    coalesce(p_settings_updated_at, 'epoch'),
    now()
  )
  on conflict (user_id) do update set
    daily_goal = case when excluded.settings_updated_at > p.settings_updated_at
      then excluded.daily_goal else p.daily_goal end,
    sabqi_window_days = case when excluded.settings_updated_at > p.settings_updated_at
      then excluded.sabqi_window_days else p.sabqi_window_days end,
    settings_updated_at = greatest(p.settings_updated_at, excluded.settings_updated_at),
    current_jp_level = greatest(p.current_jp_level, excluded.current_jp_level),
    study_days = public.merge_study_days(p.study_days, excluded.study_days),
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.upsert_user_profile(integer, integer, integer, jsonb, timestamptz) from public, anon;
grant execute on function public.upsert_user_profile(integer, integer, integer, jsonb, timestamptz) to authenticated;

-- 4. Close the RLS gap on shared curriculum: these policies let anyone with the
--    public anon key rewrite or delete every subject and Mushaf page. Seeding
--    now uses the service role key (scripts/seed-supabase.mjs), which bypasses
--    RLS, so clients only need read access.
drop policy if exists "Allow curriculum seed upsert jp_subjects" on public.jp_subjects;
drop policy if exists "Allow curriculum seed upsert quran_pages" on public.quran_pages;
