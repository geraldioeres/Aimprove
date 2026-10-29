export type ThemeMode = 'light' | 'dark';

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
  // Japanese Domain Accents (Indigo / Crimson / Sky)
  jpRadical: string;
  jpRadicalBg: string;
  jpKanji: string;
  jpKanjiBg: string;
  jpVocab: string;
  jpVocabBg: string;
  jpGrammar: string;
  jpGrammarBg: string;
  // Quran Domain Accents (Emerald / Warm Amber / Teal)
  quranSabaq: string;
  quranSabaqBg: string;
  quranSabqi: string;
  quranSabqiBg: string;
  quranManzil: string;
  quranManzilBg: string;
  mushafPaper: string;
  mushafBorder: string;
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
  bgPrimary: '#FAF7F2',
  bgSurface: '#FFFFFF',
  bgMuted: '#F2ECE1',
  bgElevated: '#FFFFFF',
  border: '#E5DEC9',
  borderStrong: '#CFC5AE',
  textPrimary: '#18181B',
  textSecondary: '#4A4A52',
  textMuted: '#686873',
  jpRadical: '#0369A1',
  jpRadicalBg: '#E0F2FE',
  jpKanji: '#BE123C',
  jpKanjiBg: '#FFE4E6',
  jpVocab: '#4338CA',
  jpVocabBg: '#E0E7FF',
  jpGrammar: '#6D28D9',
  jpGrammarBg: '#EDE9FE',
  quranSabaq: '#047857',
  quranSabaqBg: '#D1FAE5',
  quranSabqi: '#B45309',
  quranSabqiBg: '#FEF3C7',
  quranManzil: '#0F766E',
  quranManzilBg: '#CCFBF1',
  mushafPaper: '#FDFBF7',
  mushafBorder: '#D6C7A9',
  success: '#15803D',
  successBg: '#DCFCE7',
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
  warning: '#B45309',
  warningBg: '#FEF3C7',
};

export const DARK_PALETTE: ThemePalette = {
  mode: 'dark',
  bgPrimary: '#111318',
  bgSurface: '#1A1D24',
  bgMuted: '#15181E',
  bgElevated: '#222630',
  border: '#2A2F3A',
  borderStrong: '#3B4252',
  textPrimary: '#F4F1EA',
  textSecondary: '#B4B7C2',
  textMuted: '#8E929F',
  jpRadical: '#38BDF8',
  jpRadicalBg: '#0C2D48',
  jpKanji: '#FB7185',
  jpKanjiBg: '#3B121D',
  jpVocab: '#818CF8',
  jpVocabBg: '#1E1B4B',
  jpGrammar: '#C084FC',
  jpGrammarBg: '#2E1065',
  quranSabaq: '#34D399',
  quranSabaqBg: '#063628',
  quranSabqi: '#FBBF24',
  quranSabqiBg: '#3D2607',
  quranManzil: '#2DD4BF',
  quranManzilBg: '#083330',
  mushafPaper: '#181B22',
  mushafBorder: '#353B49',
  success: '#4ADE80',
  successBg: '#09331B',
  danger: '#F87171',
  dangerBg: '#3D1414',
  warning: '#FBBF24',
  warningBg: '#3D2607',
};

export const RADII = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

