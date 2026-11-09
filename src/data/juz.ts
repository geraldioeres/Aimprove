import { ayahFromIndex, indexFromAyah, SURAHS, TOTAL_AYAHS } from './surahs';

/** Where each of the 30 juz starts (surah, ayah), from Quran.com's juz map. */
export const JUZ_START: [number, number][] = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

export interface JuzPart {
  surah: number;
  from: number; // first ayah of this surah inside the juz
  to: number; // last ayah
}

/** The surahs (or parts of surahs) a juz covers, in order. */
export function juzParts(juz: number): JuzPart[] {
  const [s, a] = JUZ_START[juz - 1];
  const start = indexFromAyah(s, a)!;
  const end = juz < 30 ? indexFromAyah(...JUZ_START[juz])! - 1 : TOTAL_AYAHS - 1;
  const parts: JuzPart[] = [];
  let i = start;
  while (i <= end) {
    const ref = ayahFromIndex(i);
    const last = Math.min(SURAHS[ref.surah - 1].ayahs, ref.ayah + (end - i));
    parts.push({ surah: ref.surah, from: ref.ayah, to: last });
    i += last - ref.ayah + 1;
  }
  return parts;
}

/** "Al-Baqarah 142 – 252" or "Al-Mulk – Al-Mursalat" for a whole-surah span. */
export function juzLabel(juz: number): string {
  const parts = juzParts(juz);
  const first = parts[0];
  const last = parts[parts.length - 1];
  const name = (n: number) => SURAHS[n - 1].name;
  if (parts.length === 1) return `${name(first.surah)} ${first.from}–${first.to}`;
  const head = first.from === 1 ? name(first.surah) : `${name(first.surah)} ${first.from}`;
  const whole = last.to === SURAHS[last.surah - 1].ayahs;
  const tail = whole ? name(last.surah) : `${name(last.surah)} ${last.to}`;
  return `${head} – ${tail}`;
}
