-- ============================================================================
-- Aimprove Cloud Database Schema (Supabase PostgreSQL + RLS)
-- ============================================================================

create extension if not exists "uuid-ossp";

-- 1. Shared Read-Only Curriculum: Japanese Subjects (Levels 1-60 Radicals, Kanji, Vocab, Grammar)
create table if not exists public.jp_subjects (
  id text primary key,
  level integer not null check (level between 1 and 60),
  kind text not null check (kind in ('radical', 'kanji', 'vocab', 'grammar')),
  characters text not null,
  meanings jsonb not null default '[]'::jsonb,        -- string[]
  readings jsonb not null default '[]'::jsonb,        -- string[] (hiragana)
  reading_type text,                                  -- 'onyomi' | 'kunyomi' | 'vocab' | 'cloze'
  component_ids jsonb not null default '[]'::jsonb,   -- prerequisite radical/kanji IDs
  amalgamation_ids jsonb not null default '[]'::jsonb,-- unlocked kanji/vocab IDs
  mnemonic text not null,
  reading_mnemonic text,
  pitch_accent text,
  jlpt_level text,
  grammar_structure text,
  context_sentences jsonb not null default '[]'::jsonb, -- [{ ja, furigana, en }]
  cloze_prompt jsonb,                                   -- { sentenceBefore, blankTarget, sentenceAfter, hint, fullTranslation }
  created_at timestamptz not null default now()
);

-- 2. Shared Read-Only Curriculum: Japanese Reading Passages (Sentence Mining)
create table if not exists public.jp_reading_passages (
  id text primary key,
  level integer not null,
  jlpt_level text not null,
  title_ja text not null,
  title_en text not null,
  paragraphs jsonb not null default '[]'::jsonb,      -- tokenized segments with furigana & dictionary lookup
  created_at timestamptz not null default now()
);

-- 3. Per-User Japanese SRS Assignments (WaniKani 9-Stage Progress)
create table if not exists public.user_jp_assignments (
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null references public.jp_subjects(id) on delete cascade,
  srs_stage smallint not null default 0 check (srs_stage between 0 and 9),
  unlocked_at timestamptz not null default now(),
  started_at timestamptz,
  next_review_at timestamptz,
  passed_guru boolean not null default false,
  burned_at timestamptz,
  correct_streak integer not null default 0,
  incorrect_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_id)
);

-- 4. Per-User Mined Sentence/Vocab Cards from Reading Passages
create table if not exists public.user_jp_mined_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_passage_id text references public.jp_reading_passages(id) on delete set null,
  characters text not null,
  reading text not null,
  meaning text not null,
  context_sentence_ja text not null,
  context_sentence_en text not null,
  srs_stage smallint not null default 1 check (srs_stage between 1 and 9),
  next_review_at timestamptz not null default (now() + interval '4 hours'),
  created_at timestamptz not null default now()
);

-- 5. Shared Read-Only Curriculum: 604-Page Madani Mushaf Metadata & 15-Line Layout
create table if not exists public.quran_pages (
  page_number smallint primary key check (page_number between 1 and 604),
  juz smallint not null check (juz between 1 and 30),
  hizb smallint not null check (hizb between 1 and 60),
  surah_Summary text not null,
  ayah_count smallint not null default 0,
  lines jsonb not null default '[]'::jsonb            -- 15-line Madani Mushaf word/ayah structure
);

-- 6. Per-User Quran Mushaf Page Progress (Sabaq -> Sabqi -> Manzil FSRS)
create table if not exists public.user_quran_page_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  page_number smallint not null check (page_number between 1 and 604),
  stage text not null default 'unstarted' check (stage in ('unstarted', 'sabaq', 'sabqi', 'manzil')),
  sabqi_days_completed smallint not null default 0,
  sabqi_target_days smallint not null default 7,
  stability numeric(6,2) not null default 0,
  difficulty numeric(4,2) not null default 5.0,
  reps integer not null default 0,
  lapses integer not null default 0,
  last_reviewed_at timestamptz,
  due_at timestamptz,
  last_mistake_count smallint not null default 0,
  flagged_ayah_keys jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, page_number)
);

-- 7. Per-User Immutable Review Log (Powers Analytics & History)
create table if not exists public.user_review_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (domain in ('japanese', 'quran')),
  item_id text not null,
  previous_stage text not null,
  new_stage text not null,
  mistakes smallint not null default 0,
  reviewed_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

alter table public.jp_subjects enable row level security;
alter table public.jp_reading_passages enable row level security;
alter table public.user_jp_assignments enable row level security;
alter table public.user_jp_mined_cards enable row level security;
alter table public.quran_pages enable row level security;
alter table public.user_quran_page_progress enable row level security;
alter table public.user_review_logs enable row level security;

-- Shared Curriculum: Readable by all authenticated and anon users
create policy "Public read jp_subjects" on public.jp_subjects for select using (true);
create policy "Public read jp_reading_passages" on public.jp_reading_passages for select using (true);
create policy "Public read quran_pages" on public.quran_pages for select using (true);

-- Per-User Tables: Strictly isolated to auth.uid()
create policy "Users manage own jp_assignments" on public.user_jp_assignments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own jp_mined_cards" on public.user_jp_mined_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own quran_page_progress" on public.user_quran_page_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own review_logs" on public.user_review_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

