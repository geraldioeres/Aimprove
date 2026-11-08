import { QuranPageProgress } from '../lib/srs-fsrs';

export interface MushafWord {
  id: string;
  ayahKey: string; // e.g., "1:1", "78:2"
  wordIndex: number;
  textUthmani: string;
  transliteration?: string;
  translationEn?: string;
  isEndMarker?: boolean;
  ayahNumber?: number;
}

export interface MushafLine {
  lineNumber: number; // 1 to 15
  lineType: 'surah_header' | 'bismillah' | 'ayah_line';
  surahNameArabic?: string;
  surahNameLatin?: string;
  words: MushafWord[];
}

export interface MushafAyahTranslation {
  ayahKey: string;
  ayahNumber: number;
  surahName: string;
  arabicText: string;
  translationId: string; // Indonesian (Kemenag)
  translationEn: string; // English (Saheeh International)
}

export interface MushafPageData {
  pageNumber: number; // 1 to 604
  juz: number; // 1 to 30
  hizb: number; // 1 to 60
  surahSummary: string;
  lines: MushafLine[]; // Up to 15 lines
  translations: MushafAyahTranslation[];
}

export interface MushafPageSummary {
  pageNumber: number;
  juz: number;
  hizb: number;
  surahSummary: string;
}

/**
 * Standard Madani Mushaf Juz starting pages (Pages 1 to 604 across 30 Juz)
 */
export const JUZ_START_PAGES: number[] = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182,
  201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

export function getJuzForPage(pageNumber: number): number {
  for (let i = JUZ_START_PAGES.length - 1; i >= 0; i--) {
    if (pageNumber >= JUZ_START_PAGES[i]) {
      return i + 1;
    }
  }
  return 1;
}

const NOTABLE_PAGE_SURAHS: Record<number, string> = {
  1: 'Al-Fatihah (1:1-7)',
  2: 'Al-Baqarah (2:1-5)',
  3: 'Al-Baqarah (2:6-16)',
  50: 'Ali Imran (3:1-9)',
  293: 'Al-Kahf (18:1-4)',
  440: 'Ya-Sin (36:1-12)',
  531: 'Ar-Rahman (55:1-16)',
  562: 'Al-Mulk (67:1-12)',
  582: 'An-Naba (78:1-30)',
  583: 'An-Naba / An-Nazi\'at',
  595: 'Al-Inshirah / At-Tin',
  596: 'Al-Alaq / Al-Qadr',
  598: 'Al-Adiyat / Al-Qari\'ah',
  600: 'Al-Humazah / Al-Fil / Quraysh',
  601: 'Al-Ma\'un / Al-Kawthar',
  602: 'Al-Kafirun / An-Nasr / Al-Masad',
  603: 'Al-Ikhlas / Al-Falaq',
  604: 'Al-Ikhlas / Al-Falaq / An-Nas',
};

export function getSurahSummaryForPage(pageNumber: number): string {
  if (NOTABLE_PAGE_SURAHS[pageNumber]) {
    return NOTABLE_PAGE_SURAHS[pageNumber];
  }
  const juz = getJuzForPage(pageNumber);
  if (juz === 30) return `Juz 'Amma (Page ${pageNumber})`;
  if (juz === 29) return `Juz Tabarak (Page ${pageNumber})`;
  if (pageNumber <= 49) return `Al-Baqarah (Page ${pageNumber})`;
  return `Juz ${juz} • Mushaf Page ${pageNumber}`;
}

export const ALL_604_PAGE_SUMMARIES: MushafPageSummary[] = Array.from(
  { length: 604 },
  (_, idx) => {
    const pageNumber = idx + 1;
    const juz = getJuzForPage(pageNumber);
    const hizb = Math.min(60, Math.max(1, Math.ceil((pageNumber / 604) * 60)));
    return {
      pageNumber,
      juz,
      hizb,
      surahSummary: getSurahSummaryForPage(pageNumber),
    };
  }
);

export function toArabicNumerals(num: number): string {
  const map = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num)
    .split('')
    .map((d) => map[Number(d)] ?? d)
    .join('');
}

/**
 * Fetches any of the 604 Madani Mushaf pages live from Quran.com v4 API
 * with exact line numbers (1-15), Uthmani word script, and Indonesian + English translations.
 */
export async function fetchMushafPageFromQuranApi(pageNumber: number): Promise<MushafPageData> {
  const url = `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?words=true&word_fields=text_uthmani,line_number&translations=33,20&fields=text_uthmani,chapter_id`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch Mushaf page ${pageNumber} (HTTP ${response.status})`);
  }

  const data = await response.json();
  const verses: any[] = data.verses || [];

  const lineBuckets: Record<number, MushafWord[]> = {};
  const translations: MushafAyahTranslation[] = [];

  for (const verse of verses) {
    const ayahKey: string = verse.verse_key;
    const ayahNum: number = verse.verse_number;
    const words: any[] = verse.words || [];

    for (const w of words) {
      const lineNum = Math.min(15, Math.max(1, Number(w.line_number) || 1));
      if (!lineBuckets[lineNum]) lineBuckets[lineNum] = [];
      const isEnd = w.char_type_name === 'end';
      lineBuckets[lineNum].push({
        id: `${ayahKey}-w${w.position}`,
        ayahKey,
        wordIndex: w.position,
        textUthmani: isEnd ? `﴿${toArabicNumerals(ayahNum)}﴾` : w.text_uthmani,
        translationEn: w.translation?.text,
        isEndMarker: isEnd,
        ayahNumber: isEnd ? ayahNum : undefined,
      });
    }

    const trList: any[] = verse.translations || [];
    const idTr = trList.find((t) => t.resource_id === 33)?.text || '';
    const enTr = trList.find((t) => t.resource_id === 20)?.text || '';

    translations.push({
      ayahKey,
      ayahNumber: ayahNum,
      surahName: `Surah ${ayahKey.split(':')[0]}`,
      arabicText: verse.text_uthmani || '',
      translationId: idTr.replace(/<[^>]+>/g, ''),
      translationEn: enTr.replace(/<[^>]+>/g, ''),
    });
  }

  const lines: MushafLine[] = Object.keys(lineBuckets)
    .map(Number)
    .sort((a, b) => a - b)
    .map((ln) => ({
      lineNumber: ln,
      lineType: 'ayah_line' as const,
      words: lineBuckets[ln],
    }));

  const summary = ALL_604_PAGE_SUMMARIES[pageNumber - 1] || {
    pageNumber,
    juz: getJuzForPage(pageNumber),
    hizb: 1,
    surahSummary: `Mushaf Page ${pageNumber}`,
  };

  return {
    pageNumber,
    juz: summary.juz,
    hizb: summary.hizb,
    surahSummary: summary.surahSummary,
    lines,
    translations,
  };
}

/** A fresh start: no pages started until the user sets a Sabaq page. */
export function buildInitialQuranProgress(): Record<number, QuranPageProgress> {
  return {};
}

