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

function tokenizeArabicAyahToWords(
  ayahKey: string,
  ayahNumber: number,
  arabicSentence: string
): MushafWord[] {
  const parts = arabicSentence.trim().split(/\s+/);
  const words: MushafWord[] = parts.map((part, idx) => ({
    id: `${ayahKey}-w${idx + 1}`,
    ayahKey,
    wordIndex: idx + 1,
    textUthmani: part,
  }));
  words.push({
    id: `${ayahKey}-end`,
    ayahKey,
    wordIndex: parts.length + 1,
    textUthmani: `﴿${toArabicNumerals(ayahNumber)}﴾`,
    isEndMarker: true,
    ayahNumber,
  });
  return words;
}

export function toArabicNumerals(num: number): string {
  const map = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num)
    .split('')
    .map((d) => map[Number(d)] ?? d)
    .join('');
}

/**
 * Rich built-in 15-line Madani Mushaf pages for instant offline rendering
 */
export const SEEDED_MUSHAF_PAGES: Record<number, MushafPageData> = {
  1: {
    pageNumber: 1,
    juz: 1,
    hizb: 1,
    surahSummary: 'Surah Al-Fatihah (1:1-7)',
    lines: [
      {
        lineNumber: 1,
        lineType: 'surah_header',
        surahNameArabic: 'سُورَةُ ٱلْفَاتِحَةِ',
        surahNameLatin: 'Surah Al-Fatihah (The Opening)',
        words: [],
      },
      {
        lineNumber: 2,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords('1:1', 1, 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'),
      },
      {
        lineNumber: 3,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords('1:2', 2, 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ'),
      },
      {
        lineNumber: 4,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords('1:3', 3, 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'),
      },
      {
        lineNumber: 5,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords('1:4', 4, 'مَـٰلِكِ يَوْمِ ٱلدِّينِ'),
      },
      {
        lineNumber: 6,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords('1:5', 5, 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ'),
      },
      {
        lineNumber: 7,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords('1:6', 6, 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ'),
      },
      {
        lineNumber: 8,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords(
          '1:7',
          7,
          'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ'
        ),
      },
    ],
    translations: [
      {
        ayahKey: '1:1',
        ayahNumber: 1,
        surahName: 'Al-Fatihah',
        arabicText: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
        translationId: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.',
        translationEn: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
      },
      {
        ayahKey: '1:2',
        ayahNumber: 2,
        surahName: 'Al-Fatihah',
        arabicText: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ',
        translationId: 'Segala puji bagi Allah, Tuhan seluruh alam,',
        translationEn: '[All] praise is [due] to Allah, Lord of the worlds -',
      },
      {
        ayahKey: '1:3',
        ayahNumber: 3,
        surahName: 'Al-Fatihah',
        arabicText: 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
        translationId: 'Yang Maha Pengasih, Maha Penyayang,',
        translationEn: 'The Entirely Merciful, the Especially Merciful,',
      },
      {
        ayahKey: '1:4',
        ayahNumber: 4,
        surahName: 'Al-Fatihah',
        arabicText: 'مَـٰلِكِ يَوْمِ ٱلدِّينِ',
        translationId: 'Pemilik hari pembalasan.',
        translationEn: 'Sovereign of the Day of Recompense.',
      },
      {
        ayahKey: '1:5',
        ayahNumber: 5,
        surahName: 'Al-Fatihah',
        arabicText: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        translationId: 'Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami mohon pertolongan.',
        translationEn: 'It is You we worship and You we ask for help.',
      },
      {
        ayahKey: '1:6',
        ayahNumber: 6,
        surahName: 'Al-Fatihah',
        arabicText: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
        translationId: 'Tunjukilah kami jalan yang lurus,',
        translationEn: 'Guide us to the straight path -',
      },
      {
        ayahKey: '1:7',
        ayahNumber: 7,
        surahName: 'Al-Fatihah',
        arabicText: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
        translationId: '(yaitu) jalan orang-orang yang telah Engkau beri nikmat kepadanya; bukan (jalan) mereka yang dimurkai, dan bukan (pula jalan) mereka yang sesat.',
        translationEn: 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.',
      },
    ],
  },

  2: {
    pageNumber: 2,
    juz: 1,
    hizb: 1,
    surahSummary: 'Surah Al-Baqarah (2:1-5)',
    lines: [
      {
        lineNumber: 1,
        lineType: 'surah_header',
        surahNameArabic: 'سُورَةُ ٱلْبَقَرَةِ',
        surahNameLatin: 'Surah Al-Baqarah (The Cow)',
        words: [],
      },
      {
        lineNumber: 2,
        lineType: 'bismillah',
        words: [],
      },
      {
        lineNumber: 3,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('2:1', 1, 'الٓمٓ'),
          ...tokenizeArabicAyahToWords('2:2', 2, 'ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ'),
        ],
      },
      {
        lineNumber: 4,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords(
          '2:3',
          3,
          'ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقْنَـٰهُمْ يُنفِقُونَ'
        ),
      },
      {
        lineNumber: 5,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords(
          '2:4',
          4,
          'وَٱلَّذِينَ يُؤْمِنُونَ بِمَآ أُنزِلَ إِلَيْكَ وَمَآ أُنزِلَ مِن قَبْلِكَ وَبِٱلْـَٔاخِرَةِ هُمْ يُوقِنُونَ'
        ),
      },
      {
        lineNumber: 6,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords(
          '2:5',
          5,
          'أُو۟لَـٰٓئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُو۟لَـٰٓئِكَ هُمُ ٱلْمُفْلِحُونَ'
        ),
      },
    ],
    translations: [
      {
        ayahKey: '2:1',
        ayahNumber: 1,
        surahName: 'Al-Baqarah',
        arabicText: 'الٓمٓ',
        translationId: 'Alif Lam Mim.',
        translationEn: 'Alif, Lam, Meem.',
      },
      {
        ayahKey: '2:2',
        ayahNumber: 2,
        surahName: 'Al-Baqarah',
        arabicText: 'ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ',
        translationId: 'Kitab (Al-Qur\'an) ini tidak ada keraguan padanya; petunjuk bagi mereka yang bertakwa,',
        translationEn: 'This is the Book about which there is no doubt, a guidance for those conscious of Allah -',
      },
      {
        ayahKey: '2:3',
        ayahNumber: 3,
        surahName: 'Al-Baqarah',
        arabicText: 'ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقْنَـٰهُمْ يُنفِقُونَ',
        translationId: '(yaitu) mereka yang beriman kepada yang gaib, melaksanakan salat, dan menginfakkan sebagian rezeki yang Kami berikan kepada mereka,',
        translationEn: 'Who believe in the unseen, establish prayer, and spend out of what We have provided for them,',
      },
      {
        ayahKey: '2:4',
        ayahNumber: 4,
        surahName: 'Al-Baqarah',
        arabicText: 'وَٱلَّذِينَ يُؤْمِنُونَ بِمَآ أُنزِلَ إِلَيْكَ وَمَآ أُنزِلَ مِن قَبْلِكَ وَبِٱلْـَٔاخِرَةِ هُمْ يُوقِنُونَ',
        translationId: 'dan mereka yang beriman kepada (Al-Qur\'an) yang diturunkan kepadamu (Muhammad) dan (kitab-kitab) yang telah diturunkan sebelum engkau, dan mereka yakin akan adanya akhirat.',
        translationEn: 'And who believe in what has been revealed to you, [O Muhammad], and what was revealed before you, and of the Hereafter they are certain [in faith].',
      },
      {
        ayahKey: '2:5',
        ayahNumber: 5,
        surahName: 'Al-Baqarah',
        arabicText: 'أُو۟لَـٰٓئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُو۟لَـٰٓئِكَ هُمُ ٱلْمُفْلِحُونَ',
        translationId: 'Merekalah yang mendapat petunjuk dari Tuhannya, dan mereka itulah orang-orang yang beruntung.',
        translationEn: 'Those are upon [right] guidance from their Lord, and it is those who are the successful.',
      },
    ],
  },

  582: {
    pageNumber: 582,
    juz: 30,
    hizb: 59,
    surahSummary: 'Surah An-Naba (78:1-30)',
    lines: [
      {
        lineNumber: 1,
        lineType: 'surah_header',
        surahNameArabic: 'سُورَةُ النَّبَإِ',
        surahNameLatin: 'Surah An-Naba (The Tidings)',
        words: [],
      },
      {
        lineNumber: 2,
        lineType: 'bismillah',
        words: [],
      },
      {
        lineNumber: 3,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('78:1', 1, 'عَمَّ يَتَسَآءَلُونَ'),
          ...tokenizeArabicAyahToWords('78:2', 2, 'عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ'),
          ...tokenizeArabicAyahToWords('78:3', 3, 'ٱلَّذِى هُمْ فِيهِ مُخْتَلِفُونَ'),
        ],
      },
      {
        lineNumber: 4,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('78:4', 4, 'كَلَّا سَيَعْلَمُونَ'),
          ...tokenizeArabicAyahToWords('78:5', 5, 'ثُمَّ كَلَّا سَيَعْلَمُونَ'),
          ...tokenizeArabicAyahToWords('78:6', 6, 'أَلَمْ نَجْعَلِ ٱلْأَرْضَ مِهَـٰدًا'),
        ],
      },
      {
        lineNumber: 5,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('78:7', 7, 'وَٱلْجِبَالَ أَوْتَادًا'),
          ...tokenizeArabicAyahToWords('78:8', 8, 'وَخَلَقْنَـٰكُمْ أَزْوَٰجًا'),
          ...tokenizeArabicAyahToWords('78:9', 9, 'وَجَعَلْنَا نَوْمَكُمْ سُبَاتًا'),
        ],
      },
      {
        lineNumber: 6,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('78:10', 10, 'وَجَعَلْنَا ٱلَّيْلَ لِبَاسًا'),
          ...tokenizeArabicAyahToWords('78:11', 11, 'وَجَعَلْنَا ٱلنَّهَارَ مَعَاشًا'),
        ],
      },
      {
        lineNumber: 7,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('78:12', 12, 'وَبَنَيْنَا فَوْقَكُمْ سَبْعًا شِدَادًا'),
          ...tokenizeArabicAyahToWords('78:13', 13, 'وَجَعَلْنَا سِرَاجًا وَهَّاجًا'),
        ],
      },
      {
        lineNumber: 8,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('78:14', 14, 'وَأَنزَلْنَا مِنَ ٱلْمُعْصِرَٰتِ مَآءً ثَجَّاجًا'),
          ...tokenizeArabicAyahToWords('78:15', 15, 'لِّنُخْرِجَ بِهِۦ حَبًّا وَنَبَاتًا'),
        ],
      },
      {
        lineNumber: 9,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('78:16', 16, 'وَجَنَّـٰتٍ أَلْفَافًا'),
          ...tokenizeArabicAyahToWords('78:17', 17, 'إِنَّ يَوْمَ ٱلْفَصْلِ كَانَ مِيقَـٰتًا'),
        ],
      },
    ],
    translations: [
      {
        ayahKey: '78:1',
        ayahNumber: 1,
        surahName: 'An-Naba',
        arabicText: 'عَمَّ يَتَسَآءَلُونَ',
        translationId: 'Tentang apakah mereka saling bertanya-tanya?',
        translationEn: 'About what are they asking one another?',
      },
      {
        ayahKey: '78:2',
        ayahNumber: 2,
        surahName: 'An-Naba',
        arabicText: 'عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ',
        translationId: 'Tentang berita yang besar (hari kebangkitan),',
        translationEn: 'About the great news -',
      },
      {
        ayahKey: '78:3',
        ayahNumber: 3,
        surahName: 'An-Naba',
        arabicText: 'ٱلَّذِى هُمْ فِيهِ مُخْتَلِفُونَ',
        translationId: 'yang dalam hal itu mereka berselisih.',
        translationEn: 'That over which they are in disagreement.',
      },
      {
        ayahKey: '78:6',
        ayahNumber: 6,
        surahName: 'An-Naba',
        arabicText: 'أَلَمْ نَجْعَلِ ٱلْأَرْضَ مِهَـٰدًا',
        translationId: 'Bukankah Kami telah menjadikan bumi sebagai hamparan,',
        translationEn: 'Have We not made the earth a resting place?',
      },
      {
        ayahKey: '78:7',
        ayahNumber: 7,
        surahName: 'An-Naba',
        arabicText: 'وَٱلْجِبَالَ أَوْتَادًا',
        translationId: 'dan gunung-gunung sebagai pasak?',
        translationEn: 'And the mountains as stakes?',
      },
    ],
  },

  602: {
    pageNumber: 602,
    juz: 30,
    hizb: 60,
    surahSummary: 'Al-Kafirun (109), An-Nasr (110), Al-Masad (111)',
    lines: [
      {
        lineNumber: 1,
        lineType: 'surah_header',
        surahNameArabic: 'سُورَةُ ٱلْكَافِرُونَ',
        surahNameLatin: 'Surah Al-Kafirun (The Disbelievers)',
        words: [],
      },
      { lineNumber: 2, lineType: 'bismillah', words: [] },
      {
        lineNumber: 3,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('109:1', 1, 'قُلْ يَـٰٓأَيُّهَا ٱلْكَـٰفِرُونَ'),
          ...tokenizeArabicAyahToWords('109:2', 2, 'لَآ أَعْبُدُ مَا تَعْبُدُونَ'),
        ],
      },
      {
        lineNumber: 4,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('109:3', 3, 'وَلَآ أَنتُمْ عَـٰبِدُونَ مَآ أَعْبُدُ'),
          ...tokenizeArabicAyahToWords('109:4', 4, 'وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ'),
        ],
      },
      {
        lineNumber: 5,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('109:5', 5, 'وَلَآ أَنتُمْ عَـٰبِدُونَ مَآ أَعْبُدُ'),
          ...tokenizeArabicAyahToWords('109:6', 6, 'لَكُمْ دِينُكُمْ وَلِىَ دِينِ'),
        ],
      },
      {
        lineNumber: 6,
        lineType: 'surah_header',
        surahNameArabic: 'سُورَةُ ٱلنَّصْرِ',
        surahNameLatin: 'Surah An-Nasr (The Divine Support)',
        words: [],
      },
      { lineNumber: 7, lineType: 'bismillah', words: [] },
      {
        lineNumber: 8,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('110:1', 1, 'إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ'),
          ...tokenizeArabicAyahToWords('110:2', 2, 'وَرَأَيْتَ ٱلنَّاسَ يَدْخُلُونَ فِى دِينِ ٱللَّهِ أَفْوَاجًا'),
        ],
      },
      {
        lineNumber: 9,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords(
          '110:3',
          3,
          'فَسَبِّحْ بِحَمْدِ رَبِّكَ وَٱسْتَغْفِرْهُ ۚ إِنَّهُۥ كَانَ تَوَّابًۢا'
        ),
      },
      {
        lineNumber: 10,
        lineType: 'surah_header',
        surahNameArabic: 'سُورَةُ ٱلْمَسَدِ',
        surahNameLatin: 'Surah Al-Masad (The Palm Fiber)',
        words: [],
      },
      { lineNumber: 11, lineType: 'bismillah', words: [] },
      {
        lineNumber: 12,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('111:1', 1, 'تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ'),
          ...tokenizeArabicAyahToWords('111:2', 2, 'مَآ أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ'),
        ],
      },
      {
        lineNumber: 13,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('111:3', 3, 'سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ'),
          ...tokenizeArabicAyahToWords('111:4', 4, 'وَٱمْرَأَتُهُۥ حَمَّالَةَ ٱلْحَطَبِ'),
          ...tokenizeArabicAyahToWords('111:5', 5, 'فِى جِيدِهَا حَبْلٌ مِّن مَّسَدٍۢ'),
        ],
      },
    ],
    translations: [
      {
        ayahKey: '109:1',
        ayahNumber: 1,
        surahName: 'Al-Kafirun',
        arabicText: 'قُلْ يَـٰٓأَيُّهَا ٱلْكَـٰفِرُونَ',
        translationId: 'Katakanlah (Muhammad), "Wahai orang-orang kafir!"',
        translationEn: 'Say, "O disbelievers,"',
      },
      {
        ayahKey: '109:6',
        ayahNumber: 6,
        surahName: 'Al-Kafirun',
        arabicText: 'لَكُمْ دِينُكُمْ وَلِىَ دِينِ',
        translationId: 'Untukmu agamamu, dan untukku agamaku."',
        translationEn: 'For you is your religion, and for me is my religion."',
      },
      {
        ayahKey: '110:1',
        ayahNumber: 1,
        surahName: 'An-Nasr',
        arabicText: 'إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ',
        translationId: 'Apabila telah datang pertolongan Allah dan kemenangan,',
        translationEn: 'When the victory of Allah has come and the conquest,',
      },
      {
        ayahKey: '111:1',
        ayahNumber: 1,
        surahName: 'Al-Masad',
        arabicText: 'تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ',
        translationId: 'Binasalah kedua tangan Abu Lahab dan benar-benar binasa dia!',
        translationEn: 'May the hands of Abu Lahab be ruined, and ruined is he.',
      },
    ],
  },

  604: {
    pageNumber: 604,
    juz: 30,
    hizb: 60,
    surahSummary: 'Al-Ikhlas (112), Al-Falaq (113), An-Nas (114)',
    lines: [
      {
        lineNumber: 1,
        lineType: 'surah_header',
        surahNameArabic: 'سُورَةُ ٱلْإِخْلَاصِ',
        surahNameLatin: 'Surah Al-Ikhlas (The Sincerity)',
        words: [],
      },
      { lineNumber: 2, lineType: 'bismillah', words: [] },
      {
        lineNumber: 3,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('112:1', 1, 'قُلْ هُوَ ٱللَّهُ أَحَدٌ'),
          ...tokenizeArabicAyahToWords('112:2', 2, 'ٱللَّهُ ٱلصَّمَدُ'),
        ],
      },
      {
        lineNumber: 4,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('112:3', 3, 'لَمْ يَلِدْ وَلَمْ يُولَدْ'),
          ...tokenizeArabicAyahToWords('112:4', 4, 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ'),
        ],
      },
      {
        lineNumber: 5,
        lineType: 'surah_header',
        surahNameArabic: 'سُورَةُ ٱلْفَلَقِ',
        surahNameLatin: 'Surah Al-Falaq (The Daybreak)',
        words: [],
      },
      { lineNumber: 6, lineType: 'bismillah', words: [] },
      {
        lineNumber: 7,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('113:1', 1, 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ'),
          ...tokenizeArabicAyahToWords('113:2', 2, 'مِن شَرِّ مَا خَلَقَ'),
        ],
      },
      {
        lineNumber: 8,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('113:3', 3, 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ'),
          ...tokenizeArabicAyahToWords('113:4', 4, 'وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ'),
        ],
      },
      {
        lineNumber: 9,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords('113:5', 5, 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ'),
      },
      {
        lineNumber: 10,
        lineType: 'surah_header',
        surahNameArabic: 'سُورَةُ ٱلنَّاسِ',
        surahNameLatin: 'Surah An-Nas (Mankind)',
        words: [],
      },
      { lineNumber: 11, lineType: 'bismillah', words: [] },
      {
        lineNumber: 12,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('114:1', 1, 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ'),
          ...tokenizeArabicAyahToWords('114:2', 2, 'مَلِكِ ٱلنَّاسِ'),
          ...tokenizeArabicAyahToWords('114:3', 3, 'إِلَـٰهِ ٱلنَّاسِ'),
        ],
      },
      {
        lineNumber: 13,
        lineType: 'ayah_line',
        words: [
          ...tokenizeArabicAyahToWords('114:4', 4, 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ'),
          ...tokenizeArabicAyahToWords('114:5', 5, 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ'),
        ],
      },
      {
        lineNumber: 14,
        lineType: 'ayah_line',
        words: tokenizeArabicAyahToWords('114:6', 6, 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ'),
      },
    ],
    translations: [
      {
        ayahKey: '112:1',
        ayahNumber: 1,
        surahName: 'Al-Ikhlas',
        arabicText: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
        translationId: 'Katakanlah (Muhammad), "Dialah Allah, Yang Maha Esa.',
        translationEn: 'Say, "He is Allah, [who is] One,',
      },
      {
        ayahKey: '112:2',
        ayahNumber: 2,
        surahName: 'Al-Ikhlas',
        arabicText: 'ٱللَّهُ ٱلصَّمَدُ',
        translationId: 'Allah tempat meminta segala sesuatu.',
        translationEn: 'Allah, the Eternal Refuge.',
      },
      {
        ayahKey: '113:1',
        ayahNumber: 1,
        surahName: 'Al-Falaq',
        arabicText: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ',
        translationId: 'Katakanlah, "Aku berlindung kepada Tuhan yang menguasai subuh (fajar),',
        translationEn: 'Say, "I seek refuge in the Lord of daybreak',
      },
      {
        ayahKey: '114:1',
        ayahNumber: 1,
        surahName: 'An-Nas',
        arabicText: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ',
        translationId: 'Katakanlah, "Aku berlindung kepada Tuhannya manusia,',
        translationEn: 'Say, "I seek refuge in the Lord of mankind,',
      },
    ],
  },
};

/**
 * Fetches any of the 604 Madani Mushaf pages live from Quran.com v4 API
 * with exact line numbers (1-15), Uthmani word script, and Indonesian + English translations.
 */
export async function fetchMushafPageFromQuranApi(pageNumber: number): Promise<MushafPageData> {
  if (SEEDED_MUSHAF_PAGES[pageNumber]) {
    return SEEDED_MUSHAF_PAGES[pageNumber];
  }

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

/**
 * Generates initial Quran Hafalan page progress so the user immediately sees:
 * - Page 582 (An-Naba) as active Sabaq (new memorization)
 * - Pages 602 & 603 in Sabqi (recent 7-day consolidation window, due today)
 * - Pages 1 (Al-Fatihah), 2 (Al-Baqarah 1-5), and 604 (Al-Ikhlas/Falaq/Nas) in Manzil (FSRS long-term revision)
 */
export function buildInitialQuranProgress(now: Date = new Date()): Record<number, QuranPageProgress> {
  const pastDue = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
  const inSixHours = new Date(now.getTime() + 6 * 3600 * 1000).toISOString();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString();

  return {
    // Active Sabaq (New Memorization Target)
    582: {
      pageNumber: 582,
      stage: 'sabaq',
      sabqiDaysCompleted: 0,
      sabqiTargetDays: 7,
      stability: 0.5,
      difficulty: 5.5,
      reps: 1,
      lapses: 0,
      lastReviewedAt: pastDue,
      dueAt: pastDue, // Due today!
      lastMistakeCount: 2,
      flaggedAyahKeys: ['78:12'],
    },
    // Active Sabqi (Recent Consolidation Window - 7 days)
    602: {
      pageNumber: 602,
      stage: 'sabqi',
      sabqiDaysCompleted: 4,
      sabqiTargetDays: 7,
      stability: 3.5,
      difficulty: 4.8,
      reps: 4,
      lapses: 0,
      lastReviewedAt: pastDue,
      dueAt: pastDue, // Due today!
      lastMistakeCount: 1,
      flaggedAyahKeys: ['109:4'],
    },
    603: {
      pageNumber: 603,
      stage: 'sabqi',
      sabqiDaysCompleted: 6,
      sabqiTargetDays: 7,
      stability: 4.5,
      difficulty: 4.2,
      reps: 6,
      lapses: 0,
      lastReviewedAt: pastDue,
      dueAt: inSixHours,
      lastMistakeCount: 0,
      flaggedAyahKeys: [],
    },
    // Active Manzil (Long-Term FSRS Revision)
    1: {
      pageNumber: 1,
      stage: 'manzil',
      sabqiDaysCompleted: 7,
      sabqiTargetDays: 7,
      stability: 28,
      difficulty: 2.5,
      reps: 14,
      lapses: 0,
      lastReviewedAt: pastDue,
      dueAt: inThreeDays,
      lastMistakeCount: 0,
      flaggedAyahKeys: [],
    },
    2: {
      pageNumber: 2,
      stage: 'manzil',
      sabqiDaysCompleted: 7,
      sabqiTargetDays: 7,
      stability: 9.5,
      difficulty: 4.6,
      reps: 9,
      lapses: 0,
      lastReviewedAt: pastDue,
      dueAt: pastDue, // Due today in Manzil!
      lastMistakeCount: 1,
      flaggedAyahKeys: ['2:3'],
    },
    604: {
      pageNumber: 604,
      stage: 'manzil',
      sabqiDaysCompleted: 7,
      sabqiTargetDays: 7,
      stability: 18,
      difficulty: 3.1,
      reps: 11,
      lapses: 0,
      lastReviewedAt: pastDue,
      dueAt: pastDue, // Due today in Manzil!
      lastMistakeCount: 0,
      flaggedAyahKeys: [],
    },
  };
}

