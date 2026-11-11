import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Madani Mushaf pages (604, 15 lines each) for the reader's page view, from
 * Quran.com. Pages, the chapter list and ayah→page lookups are cached on the
 * device, so a page read once opens offline.
 */

export interface PageWord {
  text: string;
  ayahKey: string; // "78:20"
  position: number; // word number within the ayah (1-based)
  isEnd: boolean; // the ayah-number marker
  ayah: number;
}

export interface PageLine {
  line: number; // 1-15
  words: PageWord[];
  surahStart?: number; // a surah begins on this line: draw its header (and Bismillah) above
}

export interface MushafPage {
  page: number;
  lines: PageLine[];
}

export interface ChapterInfo {
  arabic: string;
  pages: [number, number];
  bismillah: boolean;
}

const memory = new Map<number, MushafPage>();
let chapters: ChapterInfo[] | null = null;

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  try {
    const hit = await AsyncStorage.getItem(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    // fall through to the network
  }
  const value = await load();
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
  return value;
}

/** All 114 surahs: Arabic name, page range, whether a Bismillah opens it. */
export async function loadChapters(): Promise<ChapterInfo[]> {
  if (chapters) return chapters;
  chapters = await cached('aimprove.chapters.v1', async () => {
    const res = await fetch('https://api.quran.com/api/v4/chapters?language=id');
    if (!res.ok) throw new Error(`Couldn't load the surah list (HTTP ${res.status})`);
    const data = await res.json();
    return (data.chapters as any[]).map((c) => ({
      arabic: c.name_arabic || '',
      pages: [c.pages?.[0] ?? 1, c.pages?.[1] ?? 1] as [number, number],
      bismillah: Boolean(c.bismillah_pre),
    }));
  });
  return chapters;
}

export async function loadMushafPage(page: number): Promise<MushafPage> {
  const hit = memory.get(page);
  if (hit) return hit;
  const result = await cached(`aimprove.mushafpage.v1.${page}`, async () => {
    const res = await fetch(
      `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=text_uthmani,line_number&fields=chapter_id,verse_number&per_page=50`
    );
    if (!res.ok) throw new Error(`Couldn't load page ${page} (HTTP ${res.status})`);
    const data = await res.json();
    const lines = new Map<number, PageLine>();
    for (const v of data.verses as any[]) {
      const [s, a] = String(v.verse_key).split(':').map(Number);
      v.words.forEach((w: any, i: number) => {
        const ln = Math.min(15, Math.max(1, Number(w.line_number) || 1));
        const line = lines.get(ln) || { line: ln, words: [] };
        if (a === 1 && i === 0) line.surahStart = s;
        line.words.push({
          text: w.char_type_name === 'end' ? toArabicDigits(a) : w.text_uthmani,
          ayahKey: v.verse_key,
          position: w.position,
          isEnd: w.char_type_name === 'end',
          ayah: a,
        });
        lines.set(ln, line);
      });
    }
    return { page, lines: [...lines.values()].sort((x, y) => x.line - y.line) };
  });
  memory.set(page, result);
  return result;
}

/** The page an ayah is on. */
export async function pageOfAyah(ayahKey: string): Promise<number> {
  return cached(`aimprove.ayahpage.v1.${ayahKey}`, async () => {
    const res = await fetch(`https://api.quran.com/api/v4/verses/by_key/${ayahKey}?fields=page_number`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).verse?.page_number ?? 1;
  });
}

function toArabicDigits(n: number) {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}
