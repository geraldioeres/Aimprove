-- ============================================================================
-- Migration 005: Quran words (vocabulary SRS by frequency) synced per word
-- Safe to run multiple times in the Supabase SQL Editor.
-- ============================================================================

-- One row per started word. Words that are unlocked but not yet learned are
-- worked out on each device and never stored here.
create table if not exists public.user_quran_words (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id text not null,
  stage smallint not null check (stage between 0 and 9),
  next_review_at timestamptz,
  passed_guru boolean not null default false,
  started_at timestamptz,
  burned_at timestamptz,
  -- When this word last changed on whichever device wrote it (newest wins).
  updated_at timestamptz not null default 'epoch',
  primary key (user_id, word_id)
);

alter table public.user_quran_words enable row level security;

drop policy if exists "Users manage own quran words" on public.user_quran_words;
create policy "Users manage own quran words" on public.user_quran_words
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Save a batch of words, each only if it is newer than the stored row, so an
-- older device can't overwrite progress made on another.
-- security invoker: runs as the signed-in user, so RLS still applies.
create or replace function public.upsert_quran_words(p_rows jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  insert into public.user_quran_words as t
    (user_id, word_id, stage, next_review_at, passed_guru, started_at, burned_at, updated_at)
  select auth.uid(), r.word_id, r.stage, r.next_review_at, r.passed_guru, r.started_at, r.burned_at,
         coalesce(r.updated_at, now())
  from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as r(
    word_id text,
    stage smallint,
    next_review_at timestamptz,
    passed_guru boolean,
    started_at timestamptz,
    burned_at timestamptz,
    updated_at timestamptz
  )
  where r.word_id is not null
  on conflict (user_id, word_id) do update set
    stage = excluded.stage,
    next_review_at = excluded.next_review_at,
    passed_guru = excluded.passed_guru,
    started_at = excluded.started_at,
    burned_at = excluded.burned_at,
    updated_at = excluded.updated_at
  where excluded.updated_at > t.updated_at;
end;
$$;

revoke all on function public.upsert_quran_words(jsonb) from public, anon;
grant execute on function public.upsert_quran_words(jsonb) to authenticated;
