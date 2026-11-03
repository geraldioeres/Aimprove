export type ThemeMode = 'light';

export interface ThemePalette {
  mode: ThemeMode;
  bgPrimary: string;
  bgSurface: string;
  bgMuted: string;
  bgElevated: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Stamp card world
  ink: string;
  hanko: string; // stamp red: seals and streaks only
  hankoInk: string; // stamp red for small text
  hankoBg: string;
  indigo: string; // primary action ink
  indigoBg: string;
  marigold: string; // lessons
  marigoldBg: string;
  // Japanese item types. Solid fills carry white glyphs; *Bg is the quiet tint.
  jpRadical: string;
  jpRadicalBg: string;
  jpKanji: string;
  jpKanjiBg: string;
  jpVocab: string;
  jpVocabBg: string;
  jpGrammar: string;
  jpGrammarBg: string;
  // Quran memorisation stages
  quranSabaq: string;
  quranSabaqBg: string;
  quranSabqi: string;
  quranSabqiBg: string;
  quranManzil: string;
  quranManzilBg: string;
  mushafPaper: string;
  mushafBorder: string;
  // SRS stage groups
  srsApprentice: string;
  srsGuru: string;
  srsMaster: string;
  srsEnlightened: string;
  srsBurned: string;
  // Legacy aliases kept so older screens still resolve
  streakFlame: string;
  streakFlameBg: string;
  progressFluid: string;
  progressFluidBg: string;
  // Semantic
  success: string;
  successBg: string;
  danger: string;
  dangerBg: string;
  warning: string;
  warningBg: string;
}

const INK = '#16161A';
const HANKO = '#E5402A';
const INDIGO = '#25348C';
const MARIGOLD = '#F2C230';

export const LIGHT_PALETTE: ThemePalette = {
  mode: 'light',
  bgPrimary: '#F3F2EE', // the desk the card sits on
  bgSurface: '#FFFFFF', // card stock
  bgMuted: '#F3F2EE',
  bgElevated: '#FFFFFF',
  border: '#DCDAD3', // quiet row dividers inside a card
  borderStrong: INK, // card edges, inputs, buttons
  textPrimary: INK,
  textSecondary: '#46454D',
  textMuted: '#626169',
  ink: INK,
  hanko: HANKO,
  hankoInk: '#C4301D',
  hankoBg: '#FCE7E3',
  indigo: INDIGO,
  indigoBg: '#E6E8F5',
  marigold: MARIGOLD,
  marigoldBg: '#FDF3D3',
  jpRadical: '#1A6FD1',
  jpRadicalBg: '#E3EEFB',
  jpKanji: '#D1267C',
  jpKanjiBg: '#FBE4F0',
  jpVocab: '#7B3FD6',
  jpVocabBg: '#EFE6FB',
  jpGrammar: '#0C7F65',
  jpGrammarBg: '#DFF2EC',
  quranSabaq: '#1B7F45',
  quranSabaqBg: '#E1F2E7',
  quranSabqi: '#AD5E00',
  quranSabqiBg: '#FAEBD8',
  quranManzil: INDIGO,
  quranManzilBg: '#E6E8F5',
  mushafPaper: '#FFFFFF',
  mushafBorder: '#DCDAD3',
  srsApprentice: '#D1267C',
  srsGuru: '#7B3FD6',
  srsMaster: INDIGO,
  srsEnlightened: '#1A6FD1',
  srsBurned: '#3A3A40',
  streakFlame: HANKO,
  streakFlameBg: '#FCE7E3',
  progressFluid: INDIGO,
  progressFluidBg: '#E6E8F5',
  success: '#2E8540',
  successBg: '#E3F3E6',
  danger: '#D3311F',
  dangerBg: '#FCE7E3',
  warning: '#AD5E00',
  warningBg: '#FAEBD8',
};

// Light only. Kept as an alias so imports elsewhere keep compiling.
export const DARK_PALETTE = LIGHT_PALETTE;

// Card-stock corners: soft enough to feel printed and cut, never pill-shaped.
export const RADII = {
  xs: 4,
  sm: 6,
  md: 6,
  lg: 8,
  xl: 10,
  pill: 6,
  round: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

/** A card's printed edge: 2px ink outline. */
export const CARD_EDGE = {
  borderWidth: 2,
  borderColor: INK,
} as const;

/**
 * The pressable signature: 2px ink outline with a thicker ink base, like a
 * rubber stamp's block. On press the base drops (see PRESSED_BASE).
 */
export const TILE_LIP = {
  borderWidth: 2,
  borderColor: INK,
  borderBottomWidth: 5,
} as const;

export const PRESSED_BASE = {
  borderBottomWidth: 2,
  transform: [{ translateY: 3 }],
} as const;

// The old glyph shadow is retired; kept empty so imports still compile.
export const GLYPH_SHADOW = {} as const;
