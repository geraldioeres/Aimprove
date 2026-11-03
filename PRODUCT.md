# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

One shared React Native (Expo) design runs on iOS and Android phones; the web build is a secondary preview. The visual language is shared across both OSes, but each one's native behaviour is respected: safe areas, back navigation, touch targets and system type scaling.

## Users

Young Muslims (Gen Z, students and young adults) who are both learning Japanese and memorising the Quran. They want a single daily habit app that handles both on their phone, in short sessions that fit around school, work and the daily prayers.

## Product Purpose

Aimprove turns two long-term goals into one daily queue:
- **Japanese:** WaniKani-style levels 1–60 with typed-answer reviews on a 9-stage SRS, plus grammar drills and reading passages.
- **Quran Hafalan:** page-by-page memorisation of the 604-page Madani Mushaf, with each page moving through Sabaq, then Sabqi, then Manzil.

Success means the user comes back every day, clears what's due, and sees steady progress on both goals.

## Positioning

It is the only app that schedules Japanese SRS and Quran memorisation (Sabaq / Sabqi / Manzil, with FSRS for long-term revision) in the same daily plan. Mistake counts from a recitation set the next review automatically.

## Operating Context

- Short sessions on a phone, often several times a day.
- Japanese reviews are typed: romaji is converted to kana as you type.
- Quran recitation is self-tested on a 15-line Mushaf page with peek modes. The user counts their own mistakes, often alongside a teacher or murajaah partner.
- Revision is scheduled for the morning (due from 05:00, around Fajr).

## Capabilities and Constraints

- Works offline by default (local storage), with optional Supabase sync.
- Japanese curriculum: radicals, kanji and vocabulary for levels 1–60, plus grammar. Quran page text comes from the Quran.com API.
- Streaks and a daily goal must be counted from real review history, never faked.
- Terminology to keep: Sabaq, Sabqi, Manzil, Mushaf, Juz; Radical, Kanji, Vocabulary; Apprentice, Guru, Master, Enlightened, Burned.

## Brand Commitments

- The name is Aimprove.
- The voice is casual and encouraging, but without forced slang.
- The Quran is treated with respect:
  - Streaks and celebrations may acknowledge Quran progress.
  - The Mushaf page and the Quran text stay calm: no confetti, jokes or playful effects over the text.
- It is not affiliated with WaniKani or Tofugu, so it must not copy their branding.

## Evidence on Hand

- The app code, the Japanese curriculum data (`src/data/wanikani-1-60.json`) and the Quran page data.
- There are no users, testimonials or metrics yet. None should be invented.

## Product Principles

1. **Daily return over cramming.** Design for coming back tomorrow: real streaks, a clear daily goal, short wins.
2. **One queue, two goals.** Japanese and Quran sit side by side, but neither is buried.
3. **Honest progress.** Every count, streak and stage reflects real data.
4. **Reverence where it belongs.** The energy is for the study habit; the Quran text itself stays calm.

## Accessibility & Inclusion

- Arabic (RTL) and Japanese text must render correctly.
- Touch targets should be at least 44pt.
- Contrast should be at least 4.5:1 for text.
- Motion should respect the OS's reduce-motion setting.
