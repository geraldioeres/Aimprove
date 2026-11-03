/**
 * Arabic numbers as they appear in the Mushaf (the Eastern Arabic digits
 * ٠–٩), with their spoken names. Wording is our own, written for young
 * learners. Names are the plain counting forms (as when counting aloud).
 */

export interface ArabicDigit {
  value: number;
  glyph: string;
  nameAr: string;
  translit: string;
  english: string;
  /** How to recognise it, and what it is easy to mix up with. */
  tip: string;
}

export interface ArabicNumberWord {
  value: number;
  nameAr: string;
  translit: string;
}

export interface QuranNumberFact {
  value: number;
  label: string;
}

export const ARABIC_DIGITS: ArabicDigit[] = [
  { value: 0, glyph: '٠', nameAr: 'صِفْر', translit: 'ṣifr', english: 'zero', tip: 'Just a small dot. Don’t mix it up with ٥, the little circle, which is five.' },
  { value: 1, glyph: '١', nameAr: 'وَاحِد', translit: 'wāḥid', english: 'one', tip: 'A straight line, just like our 1.' },
  { value: 2, glyph: '٢', nameAr: 'اِثْنَان', translit: 'ithnān', english: 'two', tip: 'A tall line with one hook at the top.' },
  { value: 3, glyph: '٣', nameAr: 'ثَلَاثَة', translit: 'thalāthah', english: 'three', tip: 'Like two, but with two hooks at the top.' },
  { value: 4, glyph: '٤', nameAr: 'أَرْبَعَة', translit: 'arbaʿah', english: 'four', tip: 'Looks like a backwards 3, or the letter ع.' },
  { value: 5, glyph: '٥', nameAr: 'خَمْسَة', translit: 'khamsah', english: 'five', tip: 'A little circle. It looks like a zero, but it is five!' },
  { value: 6, glyph: '٦', nameAr: 'سِتَّة', translit: 'sittah', english: 'six', tip: 'Looks like our 7 flipped the other way.' },
  { value: 7, glyph: '٧', nameAr: 'سَبْعَة', translit: 'sabʿah', english: 'seven', tip: 'A V, open at the top like a cup.' },
  { value: 8, glyph: '٨', nameAr: 'ثَمَانِيَة', translit: 'thamāniyah', english: 'eight', tip: 'An upside-down V, like a little roof. Seven holds, eight covers.' },
  { value: 9, glyph: '٩', nameAr: 'تِسْعَة', translit: 'tisʿah', english: 'nine', tip: 'Looks just like our 9.' },
];

export const ARABIC_TENS: ArabicNumberWord[] = [
  { value: 10, nameAr: 'عَشَرَة', translit: 'ʿasharah' },
  { value: 20, nameAr: 'عِشْرُون', translit: 'ʿishrūn' },
  { value: 30, nameAr: 'ثَلَاثُون', translit: 'thalāthūn' },
  { value: 40, nameAr: 'أَرْبَعُون', translit: 'arbaʿūn' },
  { value: 50, nameAr: 'خَمْسُون', translit: 'khamsūn' },
  { value: 60, nameAr: 'سِتُّون', translit: 'sittūn' },
  { value: 70, nameAr: 'سَبْعُون', translit: 'sabʿūn' },
  { value: 80, nameAr: 'ثَمَانُون', translit: 'thamānūn' },
  { value: 90, nameAr: 'تِسْعُون', translit: 'tisʿūn' },
  { value: 100, nameAr: 'مِائَة', translit: 'miʾah' },
  { value: 1000, nameAr: 'أَلْف', translit: 'alf' },
];

/** Numbers learners meet while memorising (Hafs count, Madani Mushaf). */
export const QURAN_NUMBER_FACTS: QuranNumberFact[] = [
  { value: 114, label: 'surahs' },
  { value: 30, label: 'juz' },
  { value: 60, label: 'hizb' },
  { value: 604, label: 'pages' },
  { value: 6236, label: 'ayat' },
];

const ARABIC_TO_WESTERN: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  // Persian and Urdu forms
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

/** Keeps only digits from typed text, turning Arabic digits into 0–9. */
export function toWesternDigits(text: string): string {
  return text
    .split('')
    .map((ch) => ARABIC_TO_WESTERN[ch] ?? ch)
    .filter((ch) => ch >= '0' && ch <= '9')
    .join('');
}
