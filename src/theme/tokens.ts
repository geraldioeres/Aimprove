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
  // Japanese domain accents (single blue ramp plus slate)
  jpRadical: string;
  jpRadicalBg: string;
  jpKanji: string;
  jpKanjiBg: string;
  jpVocab: string;
  jpVocabBg: string;
  jpGrammar: string;
  jpGrammarBg: string;
  // Quran stage accents (same blue ramp)
  quranSabaq: string;
  quranSabaqBg: string;
  quranSabqi: string;
  quranSabqiBg: string;
  quranManzil: string;
  quranManzilBg: string;
  mushafPaper: string;
  mushafBorder: string;
  // Habit & Progress Accents
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
  bgPrimary: '#F8F6F0',
  bgSurface: '#FFFFFF',
  bgMuted: '#EFECE4',
  bgElevated: '#FFFFFF',
  border: '#E5E0D4',
  borderStrong: '#D1C9B8',
  textPrimary: '#1E1E24',
  textSecondary: '#5C5C66',
  textMuted: '#7A7A88',
  jpRadical: '#2563EB',
  jpRadicalBg: '#E8F0FE',
  jpKanji: '#1E40AF',
  jpKanjiBg: '#E8F0FE',
  jpVocab: '#1D4ED8',
  jpVocabBg: '#E8F0FE',
  jpGrammar: '#475569',
  jpGrammarBg: '#EEF1F5',
  quranSabaq: '#1E40AF',
  quranSabaqBg: '#E8F0FE',
  quranSabqi: '#2563EB',
  quranSabqiBg: '#E8F0FE',
  quranManzil: '#4B7BEC',
  quranManzilBg: '#E8F0FE',
  mushafPaper: '#FCFBF7',
  mushafBorder: '#DCD4C2',
  streakFlame: '#2563EB',
  streakFlameBg: '#E8F0FE',
  progressFluid: '#5B93F5',
  progressFluidBg: '#E8F0FE',
  success: '#10B981',
  successBg: '#D1FAE5',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
};

export const DARK_PALETTE: ThemePalette = {
  mode: 'dark',
  bgPrimary: '#13151D',
  bgSurface: '#1C1F2B',
  bgMuted: '#242838',
  bgElevated: '#282D3E',
  border: '#2E3447',
  borderStrong: '#3D455D',
  textPrimary: '#F5F5F8',
  textSecondary: '#A9AFC2',
  textMuted: '#7D849B',
  jpRadical: '#6B9BF5',
  jpRadicalBg: '#1B2744',
  jpKanji: '#4F7FE8',
  jpKanjiBg: '#1B2744',
  jpVocab: '#5B8BF0',
  jpVocabBg: '#1B2744',
  jpGrammar: '#94A3B8',
  jpGrammarBg: '#232A3A',
  quranSabaq: '#4F7FE8',
  quranSabaqBg: '#1B2744',
  quranSabqi: '#6B9BF5',
  quranSabqiBg: '#1B2744',
  quranManzil: '#8FB1F7',
  quranManzilBg: '#1B2744',
  mushafPaper: '#1A1D27',
  mushafBorder: '#353B4E',
  streakFlame: '#6B9BF5',
  streakFlameBg: '#1B2744',
  progressFluid: '#5B93F5',
  progressFluidBg: '#1B2744',
  success: '#34D399',
  successBg: '#064E3B',
  danger: '#F87171',
  dangerBg: '#450A0A',
  warning: '#FBBF24',
  warningBg: '#451A03',
};

export const RADII = {
  xs: 8,
  sm: 14,
  md: 20,
  lg: 26,
  xl: 32,
  pill: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;
