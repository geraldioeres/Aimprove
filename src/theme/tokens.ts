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
  // Japanese Domain Accents (Waterllama Pastel-Pop)
  jpRadical: string;
  jpRadicalBg: string;
  jpKanji: string;
  jpKanjiBg: string;
  jpVocab: string;
  jpVocabBg: string;
  jpGrammar: string;
  jpGrammarBg: string;
  // Quran Domain Accents (Waterllama Fresh Pastels)
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
  jpRadical: '#0284C7',
  jpRadicalBg: '#E0F2FE',
  jpKanji: '#F43F5E',
  jpKanjiBg: '#FFE4E6',
  jpVocab: '#8B5CF6',
  jpVocabBg: '#EDE9FE',
  jpGrammar: '#D97706',
  jpGrammarBg: '#FEF3C7',
  quranSabaq: '#059669',
  quranSabaqBg: '#D1FAE5',
  quranSabqi: '#D97706',
  quranSabqiBg: '#FEF3C7',
  quranManzil: '#0891B2',
  quranManzilBg: '#CFFAFE',
  mushafPaper: '#FCFBF7',
  mushafBorder: '#DCD4C2',
  streakFlame: '#FF5733',
  streakFlameBg: '#FFE9E4',
  progressFluid: '#38BDF8',
  progressFluidBg: '#E0F2FE',
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
  jpRadical: '#38BDF8',
  jpRadicalBg: '#083344',
  jpKanji: '#FB7185',
  jpKanjiBg: '#4C0519',
  jpVocab: '#A78BFA',
  jpVocabBg: '#2E1065',
  jpGrammar: '#FBBF24',
  jpGrammarBg: '#451A03',
  quranSabaq: '#34D399',
  quranSabaqBg: '#064E3B',
  quranSabqi: '#FBBF24',
  quranSabqiBg: '#451A03',
  quranManzil: '#22D3EE',
  quranManzilBg: '#164E63',
  mushafPaper: '#1A1D27',
  mushafBorder: '#353B4E',
  streakFlame: '#FF6B4A',
  streakFlameBg: '#451509',
  progressFluid: '#38BDF8',
  progressFluidBg: '#083344',
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
