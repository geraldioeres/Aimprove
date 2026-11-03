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

export const LIGHT_PALETTE: ThemePalette = {
  mode: 'light',
  bgPrimary: '#F4F4F4',
  bgSurface: '#FFFFFF',
  bgMuted: '#F4F4F4',
  bgElevated: '#FFFFFF',
  border: '#E1E1E1',
  borderStrong: '#C9C9C9',
  textPrimary: '#333333',
  textSecondary: '#555555',
  textMuted: '#6E6E6E',
  jpRadical: '#0082C8',
  jpRadicalBg: '#E3F3FC',
  jpKanji: '#E0009A',
  jpKanjiBg: '#FCE4F4',
  jpVocab: '#A000F0',
  jpVocabBg: '#F3E4FD',
  jpGrammar: '#00806F',
  jpGrammarBg: '#E0F2EF',
  quranSabaq: '#1E8A4C',
  quranSabaqBg: '#E3F3E9',
  quranSabqi: '#B86400',
  quranSabqiBg: '#FBEEDC',
  quranManzil: '#294DDB',
  quranManzilBg: '#E6EBFB',
  mushafPaper: '#FFFEF9',
  mushafBorder: '#E3DDCB',
  srsApprentice: '#DD0093',
  srsGuru: '#882D9E',
  srsMaster: '#294DDB',
  srsEnlightened: '#0082C8',
  srsBurned: '#434343',
  streakFlame: '#E0009A',
  streakFlameBg: '#FCE4F4',
  progressFluid: '#0082C8',
  progressFluidBg: '#E3F3FC',
  success: '#3B8F1C',
  successBg: '#E8F5E0',
  danger: '#E0002B',
  dangerBg: '#FDE4E8',
  warning: '#B86400',
  warningBg: '#FBEEDC',
};

// Light only. Kept as an alias so imports elsewhere keep compiling.
export const DARK_PALETTE = LIGHT_PALETTE;

// Flat, square-ish corners. `pill` is used for buttons and tags, which stay
// nearly square in this system; `round` is for true circles and count badges.
export const RADII = {
  xs: 3,
  sm: 4,
  md: 5,
  lg: 6,
  xl: 8,
  pill: 4,
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

/**
 * The item-tile signature: a solid type colour with a darker bottom lip and
 * a hard 1px shadow under the white glyph.
 */
export const TILE_LIP = {
  borderBottomWidth: 3,
  borderBottomColor: 'rgba(0,0,0,0.22)',
} as const;

export const GLYPH_SHADOW = {
  textShadowColor: 'rgba(0,0,0,0.28)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 0,
} as const;
