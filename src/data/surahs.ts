/** Surah names (Indonesian transliteration) and ayah counts, in Mushaf order. */
export const SURAHS: { name: string; ayahs: number }[] = [
  ['Al-Fatihah', 7], ['Al-Baqarah', 286], ["Ali 'Imran", 200], ['An-Nisa', 176], ["Al-Ma'idah", 120],
  ["Al-An'am", 165], ["Al-A'raf", 206], ['Al-Anfal', 75], ['At-Taubah', 129], ['Yunus', 109],
  ['Hud', 123], ['Yusuf', 111], ["Ar-Ra'd", 43], ['Ibrahim', 52], ['Al-Hijr', 99],
  ['An-Nahl', 128], ['Al-Isra', 111], ['Al-Kahf', 110], ['Maryam', 98], ['Taha', 135],
  ['Al-Anbiya', 112], ['Al-Hajj', 78], ["Al-Mu'minun", 118], ['An-Nur', 64], ['Al-Furqan', 77],
  ["Asy-Syu'ara", 227], ['An-Naml', 93], ['Al-Qasas', 88], ["Al-'Ankabut", 69], ['Ar-Rum', 60],
  ['Luqman', 34], ['As-Sajdah', 30], ['Al-Ahzab', 73], ['Saba', 54], ['Fatir', 45],
  ['Yasin', 83], ['As-Saffat', 182], ['Sad', 88], ['Az-Zumar', 75], ['Gafir', 85],
  ['Fussilat', 54], ['Asy-Syura', 53], ['Az-Zukhruf', 89], ['Ad-Dukhan', 59], ['Al-Jasiyah', 37],
  ['Al-Ahqaf', 35], ['Muhammad', 38], ['Al-Fath', 29], ['Al-Hujurat', 18], ['Qaf', 45],
  ['Az-Zariyat', 60], ['At-Tur', 49], ['An-Najm', 62], ['Al-Qamar', 55], ['Ar-Rahman', 78],
  ["Al-Waqi'ah", 96], ['Al-Hadid', 29], ['Al-Mujadilah', 22], ['Al-Hasyr', 24], ['Al-Mumtahanah', 13],
  ['As-Saff', 14], ["Al-Jumu'ah", 11], ['Al-Munafiqun', 11], ['At-Tagabun', 18], ['At-Talaq', 12],
  ['At-Tahrim', 12], ['Al-Mulk', 30], ['Al-Qalam', 52], ['Al-Haqqah', 52], ["Al-Ma'arij", 44],
  ['Nuh', 28], ['Al-Jinn', 28], ['Al-Muzzammil', 20], ['Al-Muddassir', 56], ['Al-Qiyamah', 40],
  ['Al-Insan', 31], ['Al-Mursalat', 50], ['An-Naba', 40], ["An-Nazi'at", 46], ["'Abasa", 42],
  ['At-Takwir', 29], ['Al-Infitar', 19], ['Al-Mutaffifin', 36], ['Al-Insyiqaq', 25], ['Al-Buruj', 22],
  ['At-Tariq', 17], ["Al-A'la", 19], ['Al-Gasyiyah', 26], ['Al-Fajr', 30], ['Al-Balad', 20],
  ['Asy-Syams', 15], ['Al-Lail', 21], ['Ad-Duha', 11], ['Asy-Syarh', 8], ['At-Tin', 8],
  ["Al-'Alaq", 19], ['Al-Qadr', 5], ['Al-Bayyinah', 8], ['Az-Zalzalah', 8], ["Al-'Adiyat", 11],
  ["Al-Qari'ah", 11], ['At-Takasur', 8], ["Al-'Asr", 3], ['Al-Humazah', 9], ['Al-Fil', 5],
  ['Quraisy', 4], ["Al-Ma'un", 7], ['Al-Kausar', 3], ['Al-Kafirun', 6], ['An-Nasr', 3],
  ['Al-Lahab', 5], ['Al-Ikhlas', 4], ['Al-Falaq', 5], ['An-Nas', 6],
].map(([name, ayahs]) => ({ name: name as string, ayahs: ayahs as number }));

/** Opens every surah except At-Taubah; in Al-Fatihah it is ayah 1. */
export const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';

/** Global index (0-based, Mushaf order) of each surah's first ayah. */
const SURAH_START: number[] = [];
{
  let total = 0;
  for (const s of SURAHS) {
    SURAH_START.push(total);
    total += s.ayahs;
  }
}

export const TOTAL_AYAHS = SURAHS.reduce((n, s) => n + s.ayahs, 0); // 6236

export interface AyahRef {
  index: number; // 0..6235
  surah: number; // 1..114
  ayah: number; // 1-based within the surah
  key: string; // "78:1"
}

export function ayahFromIndex(index: number): AyahRef {
  let surah = SURAHS.length;
  for (let i = 1; i < SURAH_START.length; i++) {
    if (SURAH_START[i] > index) {
      surah = i;
      break;
    }
  }
  const ayah = index - SURAH_START[surah - 1] + 1;
  return { index, surah, ayah, key: `${surah}:${ayah}` };
}

export function indexFromAyah(surah: number, ayah: number): number | null {
  const s = SURAHS[surah - 1];
  if (!s || ayah < 1 || ayah > s.ayahs) return null;
  return SURAH_START[surah - 1] + ayah - 1;
}

/** Ayah left in the surah that `index` belongs to, counting it. */
export function ayahsLeftInSurah(index: number): number {
  const ref = ayahFromIndex(index);
  return SURAHS[ref.surah - 1].ayahs - ref.ayah + 1;
}

/** "An-Naba 78:1–3", or "An-Naba 78:40" for one ayah. */
export function rangeLabel(from: number, count: number): string {
  const a = ayahFromIndex(from);
  const name = SURAHS[a.surah - 1].name;
  return count <= 1 ? `${name} ${a.key}` : `${name} ${a.key}–${a.ayah + count - 1}`;
}
