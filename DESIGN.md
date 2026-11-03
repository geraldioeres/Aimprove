# Aimprove Design System (WaniKani-inspired, minimalist)

A daily study tracker for Japanese (WaniKani-style SRS, levels 1–60) and Quran Hafalan (604-page Madani Mushaf). The look borrows WaniKani's working vocabulary: a light grey ground, white panels, flat square-ish corners, and solid item-type colour tiles with white glyphs. Everything else stays quiet so the colour tiles carry the meaning.

Light mode only.

## Principles
- **Colour means something.** Saturated colour is reserved for item types, memorisation stages, SRS stages, and right/wrong states. Chrome (buttons, tabs, filters) is black, white, and grey.
- **Flat and square.** 3–6px corners, 1px borders, no soft drop shadows, no gradients, no emoji.
- **One signature: the item tile.** A solid type colour, a 3px darker bottom lip (`TILE_LIP`), and a hard 1px shadow under the white glyph (`GLYPH_SHADOW`). Used for Lessons/Reviews blocks, subject tiles, item chips, stage tags, the Mushaf map cells, and primary buttons.

## Tokens (`src/theme/tokens.ts`)

### Surfaces and text
| Token | Value | Use |
|---|---|---|
| bgPrimary | `#F4F4F4` | App ground |
| bgSurface | `#FFFFFF` | Panels, inputs, unselected controls |
| bgMuted | `#F4F4F4` | Tracks, pressed rows |
| border | `#E1E1E1` | Panel borders, row dividers |
| borderStrong | `#C9C9C9` | Input and secondary-button borders |
| textPrimary | `#333333` | Body text; also the fill of selected chrome controls |
| textSecondary | `#555555` | Supporting text |
| textMuted | `#6E6E6E` | Hints, empty states |

### Item types (white text on solid fill)
| Token | Value |
|---|---|
| jpRadical | `#0082C8` |
| jpKanji | `#E0009A` |
| jpVocab | `#A000F0` |
| jpGrammar | `#00806F` |

Lessons use kanji pink, Reviews use radical blue (as on WaniKani).

### Quran stages
| Token | Value |
|---|---|
| quranSabaq | `#1E8A4C` |
| quranSabqi | `#B86400` |
| quranManzil | `#294DDB` |
| mushafPaper / mushafBorder | `#FFFEF9` / `#E3DDCB` |

### SRS stages
Apprentice `#DD0093`, Guru `#882D9E`, Master `#294DDB`, Enlightened `#0082C8`, Burned `#434343`.

### Semantic
success `#3B8F1C`, danger `#E0002B`, warning `#B86400`, each with a pale `*Bg` tint.

### Radii and spacing
`RADII`: xs 3, sm 4, md 5, lg 6, xl 8, pill 4 (buttons and tags stay square-ish), round 999 (true circles only).
`SPACING`: 4 / 8 / 14 / 20 / 28 / 40.

## Type
Noto Sans + Noto Sans JP (applied globally in `src/theme/fonts.ts`). Weights 400, 600, 700 only. Panel titles 16px/700, body 13–14px, meta 12px. Big counts use tabular numerals. Large kana/kanji glyphs render at weight 400 on colour bands, like WaniKani.

## Components
- **Lessons / Reviews blocks:** two equal solid tiles, label, big count, short hint. Empty state is a white panel with grey text.
- **Panel:** white, 1px border, 4px radius, 14px padding. Lists inside panels are divided rows, never nested boxes.
- **Selected control:** black fill (`textPrimary`) with white text; unselected is white with a 1px border.
- **Review screen:** edge-to-edge colour band with the character, a question bar underneath (dark for reading, light grey for meaning), and a centred answer field that turns solid green or red after grading.
- **Stage tag:** small solid tile in the stage colour with white text.

## Don'ts
No dark mode, no emoji as icons, no pill-shaped buttons, no coloured left borders, no soft shadows, no uppercase tracked labels above headings.
