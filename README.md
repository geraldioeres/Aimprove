# Aimprove

A daily study tracker for two long-term goals:

- **Japanese**: WaniKani-style levels 1–60 (radicals, kanji, vocabulary) plus grammar cloze drills, with typed-answer reviews on a 9-stage SRS.
- **Quran Hafalan**: page-based memorisation of the 15-line Madani Mushaf (pages 1–604), moving each page from Sabaq to Sabqi to Manzil, with FSRS scheduling for long-term revision.

Both feed one daily queue on the **Today** screen.

Built with React Native + Expo (TypeScript, Expo Router). It runs on iOS, Android and the web. Progress is saved on the device and can optionally sync to Supabase.

## Features

**Today**
- Lessons and Reviews counts, with due items broken down by type
- Today's Quran pages (Sabaq, Sabqi, Manzil)
- A 24-hour review forecast

**Japanese**
- Levels 1–60 with WaniKani-style unlocking: radicals unlock kanji, and 90% of a level's kanji at Guru unlocks the next level
- Lessons with a short quiz, then typed reviews
- Reading answers are typed in romaji and converted to kana live; meaning answers tolerate small typos
- Item spread across SRS stages, recent mistakes, and critical items
- Reading passages with furigana; tap a word to add it to your reviews

**Quran**
- A 15-line Mushaf page reader with self-test modes (full page, first word only, hide all with tap to peek)
- Mistakes and peeks during a recitation set the FSRS grade:
  - 0 mistakes: Easy
  - 1–2: Good
  - 3–4: Hard
  - 5 or more: Again
- A configurable Sabqi window (5–20 days)
- A 604-page map coloured by stage, filterable by juz

## Getting started

Requirements: Node.js 18+ and npm. To run on a phone you'll also need the Expo Go app or an emulator.

```bash
npm install
npm start
```

From the Expo prompt, press `w` for web, `a` for Android or `i` for iOS. Or run one directly:

```bash
npm run web
```

The app works with no configuration: progress is stored on the device with AsyncStorage.

### Optional: Supabase sync

1. Create a Supabase project.
2. Run the SQL in `supabase/migrations/` in order (`001_initial_schema.sql`, then `002_full_wanikani_support.sql`).
3. Copy `.env.example` to `.env` and fill in your project URL and anon key:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Optionally upload the full level 1–60 curriculum with `npm run seed:supabase`.

You can also enter the URL and key in **Settings → Cloud sync** while the app is running, then sign in or create an account there. Each user's progress is kept private by row-level security.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run web` / `android` / `ios` | Start for one platform |
| `npm run build:web` | Export a static web build to `dist/` |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run build:wanikani` | Rebuild `src/data/wanikani-1-60.json` from public datasets |
| `npm run seed:supabase` | Upload the level 1–60 curriculum to Supabase |

> `scripts/seed-supabase.mjs` reads `.env` and the data file from the hard-coded path `d:/Aimprove`. Change those paths if your checkout is somewhere else.

## Project structure

```
app/
  (tabs)/            Today, Japanese, Quran and Settings tabs
  jp/                Lessons, Reviews and Reading screens
  mushaf/            Mushaf map and the page reader (page/[pageNumber])
src/
  data/              Japanese curriculum and Quran page data
  lib/               SRS (WaniKani stages, FSRS), romaji→kana, Supabase client
  store/             Zustand store: progress, queues, sync
  theme/             Design tokens, fonts, theme context
supabase/            SQL migrations and seed
scripts/             Curriculum build and Supabase seed scripts
```

## Data sources

- Quran page text and translations are fetched from the [Quran.com API](https://api.quran.com) when a page is opened. A few pages are bundled for offline use.
- The Japanese curriculum is built from public datasets: [kanji-data](https://github.com/davidluzgouveia/kanji-data) and [ebieki](https://github.com/fasiha/ebieki).

Aimprove is an independent project. It is not affiliated with WaniKani or Tofugu.

## Design

The UI is a minimal, light-only style inspired by WaniKani: flat white panels, square-ish corners, and solid item-type colour tiles. See [DESIGN.md](DESIGN.md) for the tokens and rules, and [IMPLEMENTATION.md](IMPLEMENTATION.md) for the original architecture plan.
