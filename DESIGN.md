# Aimprove Design Direction

Reading this as: Mobile-first personal learning sanctuary for daily Japanese (Levels 1-60, Grammar, Reading) and Quran Hafalan (604-page Madani Mushaf) study, in a Calm Study Sanctuary editorial style, dial ENERGY 1 / RHYTHM 2 / MOTION 1.

## Identity & Mood
- **Concept**: A tactile desk with two cherished books: a Japanese Kanji/Grammar study ledger and a 15-line Madani Mushaf.
- **Dials**: `ENERGY 1 / RHYTHM 2 / MOTION 1`
  - **ENERGY 1 (Calm)**: High-focus study sessions require quiet surfaces with zero visual distraction.
  - **RHYTHM 2 (Balanced)**: Structured action cards on the Home Queue contrast with dense, authentic study surfaces (15-line Mushaf page view, full-width typed review prompt, 604-page heatmap grid).
  - **MOTION 1 (Minimal)**: Instant state transitions for fast keyboard/tap review throughput; no looping animations or decorative pulses.

## Color Palette (Both Light & Dark Modes Required)

### Warm Paper Light Mode (Default)
- **Background Primary**: `#FAF7F2` (Warm unbleached paper reduces eye strain during long reading and Mushaf recitation sessions)
- **Surface / Card**: `#FFFFFF` with `#E6E0D6` 1px border (Crisp separation for actionable study queues)
- **Surface Muted / Well**: `#F2ECE1` (Recessed surface for Mushaf page frame and 24-hour forecast tracks)
- **Text Primary**: `#18181B` (Contrast ratio > 14:1 on `#FAF7F2`, exceeding WCAG AAA)
- **Text Secondary**: `#52525B` (Contrast ratio > 6.5:1 on `#FAF7F2`, WCAG AA compliant)
- **Text Muted**: `#71717A` (Contrast ratio > 4.5:1 on `#FFFFFF`)

### Deep Ink Dark Mode
- **Background Primary**: `#111318` (Deep sumi-ink charcoal for night study without OLED smearing)
- **Surface / Card**: `#1A1D24` with `#2A2F3A` 1px border
- **Surface Muted / Well**: `#15181E`
- **Text Primary**: `#F4F1EA` (Warm parchment text on ink background, contrast > 13:1)
- **Text Secondary**: `#A1A1AA` (Contrast > 6:1)
- **Text Muted**: `#8E929F` (Contrast > 4.6:1)

### Domain & Functional Accents (3 Core + 1 Primary Accent Rule)
- **Japanese Domain Accent (Indigo / Crimson)**:
  - Radical: `#0369A1` (Light) / `#38BDF8` (Dark) — distinguishes building-block radicals
  - Kanji: `#BE123C` (Light) / `#FB7185` (Dark) — distinguishes Kanji prompts from vocabulary
  - Vocabulary & Grammar: `#4338CA` (Light) / `#818CF8` (Dark) — distinguishes compound words and grammar cloze items
- **Quran Hafalan Domain Accent (Emerald / Warm Amber)**:
  - Sabaq (New) / Active Recitation: `#047857` (Light) / `#34D399` (Dark) — signals active memorization
  - Sabqi (Recent 7-20d Consolidation): `#B45309` (Light) / `#FBBF24` (Dark) — signals short-term consolidation
  - Manzil (FSRS Long-Term): `#0F766E` (Light) / `#2DD4BF` (Dark) — signals long-term scheduled retention
- **Semantic Feedback**:
  - Pass / Correct: `#15803D`
  - Mistake / Hesitation / Again: `#B91C1C`

## Typography & Hierarchy (R-06, R-31)
- **Latin UI**: System Sans (`Inter` / `-apple-system` / `Segoe UI`) with `tabular-nums` on all counters, timers, and forecast bars so numbers align vertically.
- **Japanese Script**: `Noto Sans JP` / `Hiragino Kaku Gothic ProN` / `Yu Gothic` / `Meiryo` at 36px-56px in review prompts so stroke intersections remain legible on mobile screens.
- **Quranic Arabic Script**: `Amiri Quran` / `Scheherazade New` / `KFGQPC Uthman Taha Naskh` / `Traditional Arabic` with generous line-height (`1.85`) and `dir="rtl"` so harakat (vowel marks) and waqf symbols never clip.

## Written Design Decisions (R-31)
1. **Why Warm Paper & Deep Ink instead of pure white/black?**: Extended Kanji reading and 15-line Mushaf recitation cause glare on `#FFFFFF`; `#FAF7F2` and `#111318` mimic book paper and sumi ink.
2. **Why strict 8px/12px border radii (`sm: 6, md: 10, lg: 14`)?**: Differentiates interactive buttons (`8px`), input fields (`8px`), and domain queue containers (`12px`) without pill-shaping the UI.
3. **Why zero em-dashes in UI copy?**: Keeps microcopy direct, human, and scannable on mobile screens (R-02).
4. **Why domain-specific color coding for Radical/Kanji/Vocab and Sabaq/Sabqi/Manzil?**: During rapid typed reviews or Mushaf page selection, color immediately tells the learner what type of answer is expected (e.g., Kanji reading vs Vocabulary reading, or New Sabaq vs FSRS Manzil).

