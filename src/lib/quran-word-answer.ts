import { QuranWord, QW_BY_LEVEL, QW_MAX_LEVEL, mainMeaning } from '../data/quran-words';

// Small words that don't decide whether an answer is right.
const STOP = new Set([
  'yang', 'dan', 'di', 'ke', 'itu', 'ini', 'the', 'a', 'an', 'of', 'to', 'is', 'be', 'are', 'was', 'and', 'in', 'on',
]);

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/[^a-z\u00C0-\u024F\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

const close = (a: string, b: string) => a === b || (a.length >= 5 && editDistance(a, b) <= Math.floor(a.length / 5));

/**
 * Checks a typed meaning, in Indonesian or English. Lenient: small typos are
 * fine, and one key word of a longer meaning counts ("berkata" for "dia berkata").
 */
export function checkWordMeaning(typed: string, word: QuranWord): boolean {
  const t = norm(typed);
  if (!t) return false;
  const answers = [...word.m, ...word.e].flatMap((m) => m.split(/[,;]/)).map(norm).filter(Boolean);
  for (const ans of answers) {
    if (close(t, ans)) return true;
    const keyWords = ans.split(' ').filter((w) => !STOP.has(w));
    if (!STOP.has(t) && keyWords.some((w) => close(t, w))) return true;
  }
  return false;
}

/**
 * Four options for "what does this mean?": the right one and three others of
 * the same kind from nearby levels, none sharing a meaning with the answer.
 */
export function meaningChoices(word: QuranWord, seed = 0): string[] {
  const right = mainMeaning(word);
  const taken = new Set([...word.m, ...word.e].map((m) => m.toLowerCase()));
  const pool: QuranWord[] = [];
  for (let d = 0; pool.length < 40 && d < QW_MAX_LEVEL; d++) {
    for (const l of d === 0 ? [word.l] : [word.l - d, word.l + d]) {
      for (const w of QW_BY_LEVEL[l] || []) {
        if (w.i !== word.i && w.p === word.p) pool.push(w);
      }
    }
  }
  // Fall back to any kind when a kind is rare (e.g. pronouns).
  if (pool.length < 3) for (const w of QW_BY_LEVEL[word.l] || []) if (w.i !== word.i) pool.push(w);

  const rand = mulberry(hash(word.i) + seed);
  const picks: string[] = [];
  const shuffled = [...pool].sort(() => rand() - 0.5);
  for (const w of shuffled) {
    const m = mainMeaning(w);
    if (!m || taken.has(m.toLowerCase()) || picks.includes(m)) continue;
    picks.push(m);
    if (picks.length === 3) break;
  }
  const all = [right, ...picks];
  return all.sort(() => rand() - 0.5);
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
