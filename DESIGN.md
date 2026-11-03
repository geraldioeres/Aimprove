---
name: Aimprove
description: A daily attendance card for Japanese SRS study and Quran memorisation; every study day earns a red stamp.
colors:
  ink: "#16161A"
  desk: "#F3F2EE"
  card-stock: "#FFFFFF"
  rule-quiet: "#DCDAD3"
  text-secondary: "#46454D"
  text-muted: "#626169"
  hanko: "#E5402A"
  hanko-ink: "#C4301D"
  hanko-bg: "#FCE7E3"
  indigo: "#25348C"
  indigo-bg: "#E6E8F5"
  marigold: "#F2C230"
  marigold-bg: "#FDF3D3"
  jp-radical: "#1A6FD1"
  jp-kanji: "#D1267C"
  jp-vocab: "#7B3FD6"
  jp-grammar: "#0C7F65"
  quran-sabaq: "#1B7F45"
  quran-sabqi: "#AD5E00"
  quran-manzil: "#25348C"
  srs-burned: "#3A3A40"
  success: "#2E8540"
  success-bg: "#E3F3E6"
  danger: "#D3311F"
typography:
  display:
    fontFamily: "Zen Kaku Gothic New, sans-serif"
    fontSize: "56px"
    fontWeight: 900
    lineHeight: "62px"
    fontFeature: "tnum"
  headline:
    fontFamily: "Zen Kaku Gothic New, sans-serif"
    fontSize: "34px"
    fontWeight: 900
    lineHeight: "40px"
  title:
    fontFamily: "Zen Kaku Gothic New, sans-serif"
    fontSize: "17px"
    fontWeight: 900
  body-strong:
    fontFamily: "Zen Kaku Gothic New, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  body:
    fontFamily: "Zen Kaku Gothic New, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  label:
    fontFamily: "Zen Kaku Gothic New, sans-serif"
    fontSize: "12px"
    fontWeight: 700
rounded:
  xs: "4px"
  sm: "6px"
  lg: "8px"
  xl: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "28px"
  xxl: "40px"
components:
  card:
    backgroundColor: "{colors.card-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "16px"
  press-block-primary:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.card-stock}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
  press-block-lessons:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
  press-block-disabled:
    backgroundColor: "{colors.card-stock}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
  stage-tag:
    textColor: "{colors.card-stock}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    width: "66px"
  answer-input:
    backgroundColor: "{colors.card-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "56px"
  tab-bar-active:
    backgroundColor: "{colors.card-stock}"
    textColor: "{colors.indigo}"
  tab-bar-inactive:
    backgroundColor: "{colors.card-stock}"
    textColor: "{colors.text-muted}"
---

# Design System: Aimprove

## Overview

**Creative North Star: "The Attendance Card"**

Aimprove is a daily attendance card, in the line of a rajio taiso card or a pesantren setoran card. Each study day is a box, and a finished day gets a red hanko seal pressed into it. The interface is printed card stock laid on a faint warm-grey desk. Ink outlines draw the edges. Colour is reserved for meaning: red for stamps, indigo for the next action, marigold for Lessons, and solid fills for item types and memorisation stages.

Density is phone-first and steady: full-width cards, 16px gutters, big tabular counts, and short rows. Depth comes from printing, not lighting. Cards have a 2px ink edge, and pressable blocks have a thicker ink base that drops when pressed, like a rubber stamp block. No screen uses a soft shadow. The one moment of ceremony is the seal landing. Everything else, especially the Quran text, stays calm.

Light mode only (`DARK_PALETTE` is an alias of `LIGHT_PALETTE`).

**Key Characteristics:**
- White card stock (#FFFFFF) on a warm-grey desk (#F3F2EE), never cream.
- 2px ink (#16161A) edges and 6px cut corners on every card, input and block.
- One typeface, Zen Kaku Gothic New, at four weights, for both Latin and Japanese.
- The red hanko seal is the only celebratory device, and the red is reserved for it.
- Pressable blocks have a 5px ink base that drops 3px on press.

## Colors

The palette is ink on white with a few saturated colours. Each saturated colour has exactly one job.

### Primary
- **Indigo Ink** (indigo): the primary action and selection colour. It fills the Reviews block and primary buttons (white text), marks today's box (dashed outline and weekday label), tints the active tab, colours text links ("Mushaf map"), fills the goal bar until the goal is met, and fills the stage-change chip after a review. It also serves as the Manzil stage colour.

### Secondary
- **Hanko Red** (hanko): seal ink. It is used only for `StampSeal` strokes, the met-goal fill of the daily goal bar, and the legacy `streakFlame` alias.
- **Hanko Text Red** (hanko-ink): a darker red for small text, used for the streak line on the stamp card ("12-day streak"). It is darker because the seal red is too light for 15px text.

### Tertiary
- **Lessons Marigold** (marigold): the Lessons block fill, always with ink text and an ink arrow. Never put white text on it.
- **Item types** (jp-radical, jp-kanji, jp-vocab, jp-grammar): solid fills that carry white glyphs on review prompts, item chips and level columns. Each has a pale `*Bg` tint in `tokens.ts` for quiet backgrounds.
- **Quran stages** (quran-sabaq green, quran-sabqi amber, quran-manzil indigo): solid stage tags with white 12px/700 labels in setoran rows, on the Mushaf map and on the page header.
- **SRS groups** reuse the item and indigo hues (apprentice = kanji pink, guru = vocab violet, master = indigo, enlightened = radical blue), and burned is srs-burned charcoal.

### Neutral
- **Ink** (ink): all primary text, card edges, input outlines, pressable bases, the header and tab-bar rules, and the tab badge fill.
- **Desk** (desk): the screen ground. It is also `bgMuted`, so pressed rows and the submit-button well darken to the desk colour.
- **Card Stock** (card-stock): card, input, header and tab-bar surfaces.
- **Quiet Rule** (rule-quiet): hairline dividers inside cards, the outline of disabled blocks, future day boxes, and Mushaf line rules.
- **Secondary / Muted Text** (text-secondary, text-muted): supporting lines, hints, empty states and inactive tabs.
- **System states** (success, danger): success marks "Unlocked for lessons" and auth feedback. Danger is used only for system failures such as sync errors, a missing page, or a lesson-quiz alert. It is never used to grade the learner.

### Named Rules
**The Seal Owns the Red Rule.** Hanko red appears only as seal ink, the streak text, and the met-goal bar. Never use it for buttons, badges, links or errors.

**The Ink Verdict Rule.** A wrong answer is drawn in ink: an ink-ringed ✕ and "Not quite" on a white card, with a short shake. A correct answer gets a slammed 正 seal. Never colour a learner's mistake red.

**The One Job Rule.** Indigo means "act here / you are here", and marigold means Lessons. Neither colour is used as decoration.

## Typography

**Display Font:** Zen Kaku Gothic New (system sans-serif fallback on web)
**Body Font:** Zen Kaku Gothic New
**Label Font:** Zen Kaku Gothic New

**Character:** A single gothic family covers Latin, kana and kanji, so English labels and Japanese glyphs share one voice. `fonts.ts` patches `Text` and `TextInput` globally to map each numeric weight onto one of four loaded cuts (400 / 500 / 700 / 900). A screen never sets `fontFamily` per weight.

### Hierarchy
- **Display** (900, 56px / 62px, tabular): the big counts on the Reviews and Lessons blocks. Glyph prompts and modal glyphs reach 44–48px at the same weight.
- **Headline** (900, 34px / 40px): screen titles such as "Today" and the review summary headline.
- **Title** (900, 17px): card titles ("Week 12", "Setoran today", "Coming up") and block labels (16px). The navigation header title is 18px/900.
- **Body strong** (700, 15px): row titles such as "Page 582 · An-Naba", plus links and action text (14px/700).
- **Body** (500, 13–14px): notes, dates, hints and the goal sentence.
- **Label** (700, 11–12px): stage tags, weekday labels, tab labels and badge numbers. Sentence case.

### Named Rules
**The Heavy Ink Rule.** Headings and counts use the 900 Black cut, and supporting text drops to 500. Two weights per card carry the hierarchy, so a colour change is never needed to do it.

**The Tabular Count Rule.** Every number that ticks (streak, goal fraction, due counts, forecast deltas) uses `tabular-nums`.

## Layout

The layout is a single column of full-width cards on the desk. Screen padding is 16px horizontal, and cards stack with 16px gaps. At 760px and wider (web preview, tablets), Today splits into two equal columns inside a centred 1040px container with 24px padding. Focused flows (review, lessons) centre a 720px body.

The spacing scale is 4 / 8 / 14 / 20 / 28 / 40. Cards use 16px padding inside. Rows are at least 60px tall (setoran) or 36px (forecast). Pressable targets are at least 44–48px. The two launch blocks sit side by side with a 12px gap and a minimum height of 150px. The stamp card's seven day boxes share a row with 6px gaps at a 0.7 aspect ratio.

## Elevation & Depth

Depth is printed, not lit. There are no soft shadows: the tab bar explicitly sets `elevation: 0` and `shadowOpacity: 0`, and headers hide their shadow. Surfaces separate by ink outline against the desk. The only depth cue is the pressable block's thickened bottom edge, which is an ink border and not a shadow.

### Named Rules
**The Stamp Block Rule.** Anything you can press as a primary action has a 2px ink outline with a 5px ink bottom edge (`TILE_LIP`). On press, the bottom edge drops to 2px and the block moves down 3px (`PRESSED_BASE`). Disabled blocks go flat: a 2px quiet-rule outline, white fill and muted text, with no base.

**The Printed Edge Rule.** Static containers (cards, the review result, inputs) use a flat 2px ink edge (`CARD_EDGE`) and never get the thick base. A thick base means "press me".

## Shapes

Corners are cut card-stock corners, softly rounded but never pills. Use 6px for cards, blocks, inputs and banners, 4px for day boxes and stage tags, and 3px for the goal-bar track. `RADII.pill` is deliberately 6px. Fully round shapes are kept for the setoran slot circle and the badge.

Line weight carries meaning. 2px ink is an edge. 1.5px is a day box or the goal-bar track. 1px quiet rule is a divider. Dashed lines mark something that is still open: today's unstamped box (2px dashed indigo), the empty seal slot on a setoran row (1.5px dashed circle), the "Choose a new Sabaq page" row (1.5px dashed ink), and the dividers between setoran rows. Data rows such as the forecast and Mushaf lines use solid hairlines.

## Components

### Buttons (Press Blocks)
Press blocks feel tactile and blocky, like a rubber stamp handle.
- **Shape:** 6px corners, 2px ink outline, 5px ink base (`PressBlock` / `TILE_LIP`).
- **Primary:** indigo fill with white 900 label, used for Reviews, "Next", and lesson primary buttons.
- **Lessons:** marigold fill with ink label and ink arrow.
- **Item-coloured:** kanji, level and lesson actions may take their item-type fill with white text.
- **Pressed:** the base drops to 2px and the block moves down 3px. There is no opacity fade.
- **Disabled:** flat white with a quiet-rule outline and muted text ("All caught up").
- **Secondary:** a white block with a 2px ink outline and ink text, without the thick base ("Hide item info").
- **Text link:** indigo, 14px/700, with `hitSlop` 10.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** card stock on the desk.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 2px ink (`CARD_EDGE`).
- **Internal Padding:** 16px. Card heads put a 17px/900 title against a right-aligned link or 12px meta line on a shared baseline.

### Chips / Tags
- **Stage tag:** a solid stage colour with a white 12px/700 sentence-case label, 66px wide, 4px corners.
- **Stage-change chip:** indigo fill with white text, showing transitions such as "Guru → Master".
- **Item chips:** solid item-type fill with a white glyph and the stamp-block base.

### Inputs / Fields
- **Style:** white field with a 2px ink outline, 6px corners, at least 56px tall, with 22px centred ink text. The submit well inside is a desk-grey 44px square with an ink arrow.
- **Error:** no colour change. The field shakes in 55ms steps (skipped under reduce motion), and the result card below gives the verdict in ink.

### Navigation
- **Tab bar:** white with a 2px ink top rule. Labels are 11px/700, and the bar is 60px plus the safe-area inset. Active tabs are indigo and inactive tabs are muted. Count badges are ink with white 11px/700 numbers.
- **Header:** white with a 2px ink bottom rule, an 18px/900 title, and no shadow.

### Stamp Card (signature)
This is this week's attendance card. The head row has "Week N" (17px/900 ink) and the streak in hanko-ink red. Below it are seven day boxes:
- **Past day:** 1.5px ink outline.
- **Today:** dashed indigo, 2px, until it is stamped.
- **Future day:** quiet-rule outline.

Unstamped past days show their item count in muted text. Under the boxes is a goal sentence with a tabular "n/goal" fraction, then a 10px bar with a 1.5px ink outline that fills indigo and turns hanko red once the goal is met.

### Stamp Seal (signature)
The seal is an SVG drawn on a 100×100 grid. A broken ring is made of four arcs with uneven stroke widths (6.1–7.9) and two hairline gaps. Inside it is a squared seal-style glyph: 済 ("done") for days and setoran pages, or 正 ("correct") for right answers. It renders at 0.94 opacity.

Each seed (a day key or item key) hashes to its own tilt (−6° to −20°) and five white speckle voids, so a week of stamps looks hand-pressed rather than cloned. On `slam`, the seal waits 180ms, then over 420ms it scales from 2.2× to 1×, rotates from tilt −26° to its tilt, and fades in, with an exponential ease-out. Native builds fire a medium haptic when it lands. Reduce motion shows it already in place. The seal is hidden from accessibility because the card's summary label carries the meaning.

Sizes in use:
- 28–32px in the stamp card.
- 34px on setoran rows.
- 44px on a correct answer.
- 148px on the review summary.

Today's seal slams only once per session.

### Setoran Row
Each row has a stage tag, a 15px/700 page and surah title, and a 12px muted note on the left, with a dashed slot circle or a 34px 済 seal on the right. Rows are at least 60px tall and separated by dashed quiet-rule lines. Pressing a row tints it to the desk colour.

## Do's and Don'ts

### Do:
- **Do** put every surface on white card stock (#FFFFFF) with a 2px ink edge and 6px corners, on the #F3F2EE desk.
- **Do** give every primary pressable the stamp-block base (2px ink outline, 5px ink bottom edge, drop 3px on press), and make disabled blocks flat with a quiet-rule outline.
- **Do** keep hanko red for seals, the streak line (in hanko-ink) and the met-goal bar.
- **Do** mark open or to-do slots with dashed lines, and done ones with a seal.
- **Do** use Zen Kaku Gothic New at 900 for headings and counts, 700 for row titles and labels, and 500 for notes. Use tabular numerals on every count.
- **Do** respect reduce motion: seals appear in place and the wrong-answer shake is skipped.
- **Do** keep the Mushaf page and Quran text calm, with no seals, slams or celebration over the text.

### Don't:
- **Don't** use red to grade the learner. Wrong answers are an ink ✕ and "Not quite".
- **Don't** use soft drop shadows, glows or gradients. Depth comes from the ink base only.
- **Don't** use a cream or yellowed ground. The desk is a faint warm grey (#F3F2EE) and cards are pure white.
- **Don't** add a second typeface or a mascot, XP or confetti layer. The seal is the only reward.
- **Don't** put white text on marigold.
- **Don't** add a dark mode palette. The world is light only.
