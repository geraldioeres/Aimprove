-- ============================================================================
-- Migration 002: Support Full WaniKani Level 1-60 (8,855 items) & 604 Mushaf Pages
-- Run this in your Supabase SQL Editor so `npm run seed:supabase` can upload
-- all 8,855 WaniKani items & 604 Quran pages, and user_jp_assignments can sync
-- any Level 1-60 subject ID immediately.
-- ============================================================================

-- 1. Drop strict FK on user_jp_assignments so any Level 1-60 subject_id syncs cleanly
alter table public.user_jp_assignments
  drop constraint if exists user_jp_assignments_subject_id_fkey;

-- 2. Allow curriculum seeding on shared tables
drop policy if exists "Allow curriculum seed upsert jp_subjects" on public.jp_subjects;
create policy "Allow curriculum seed upsert jp_subjects" on public.jp_subjects
  for all using (true) with check (true);

drop policy if exists "Allow curriculum seed upsert quran_pages" on public.quran_pages;
create policy "Allow curriculum seed upsert quran_pages" on public.quran_pages
  for all using (true) with check (true);

