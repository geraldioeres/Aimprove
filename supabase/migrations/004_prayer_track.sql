-- ============================================================================
-- Migration 004: Sync the ayah-by-prayer track across devices
-- Safe to run multiple times in the Supabase SQL Editor.
-- ============================================================================

-- One row per user. `state` holds the track (starting ayah, cursor, today's
-- finished and skipped slots, recent history, tajweed-colour preference).
-- Location and reminders stay on each device and are never stored here.
create table if not exists public.user_prayer_track (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  -- When the track last changed on whichever device wrote it (newest wins).
  updated_at timestamptz not null default 'epoch'
);

alter table public.user_prayer_track enable row level security;

drop policy if exists "Users manage own prayer track" on public.user_prayer_track;
create policy "Users manage own prayer track" on public.user_prayer_track
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Save the caller's track only if it is newer than the stored one, so an
-- older device can't overwrite progress made on another. Returns the row
-- that is kept, so the caller can adopt it when theirs was older.
-- security invoker: runs as the signed-in user, so RLS still applies.
create or replace function public.upsert_prayer_track(
  p_state jsonb,
  p_updated_at timestamptz
)
returns public.user_prayer_track
language plpgsql
security invoker
set search_path = public
as $$
declare
  result public.user_prayer_track;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  insert into public.user_prayer_track as t (user_id, state, updated_at)
  values (auth.uid(), coalesce(p_state, '{}'::jsonb), coalesce(p_updated_at, now()))
  on conflict (user_id) do update set
    state = case when excluded.updated_at > t.updated_at then excluded.state else t.state end,
    updated_at = greatest(t.updated_at, excluded.updated_at)
  returning * into result;

  return result;
end;
$$;

revoke all on function public.upsert_prayer_track(jsonb, timestamptz) from public, anon;
grant execute on function public.upsert_prayer_track(jsonb, timestamptz) to authenticated;
