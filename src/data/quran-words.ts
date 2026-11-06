import raw from './quran-words.json';

/**
 * Every word of the Quran grouped by dictionary form (lemma), counted, and
 * split into 60 levels from most to least frequent. Built by
 * scripts/build-quran-words.mjs from the Quranic Arabic Corpus (GPL v3) and
 * Quran.com's word-by-word meanings; see QURAN-WORDS-NOTICE.md.
 */
export interface QuranWord {
  i: string; // stable id: "V:قالَ", "pre:wa", "pron:3MP"
  a: string; // Arabic, as shown
  p: 'Noun' | 'Verb' | 'Particle' | 'Name' | 'Adjective' | 'Pronoun' | 'Prefix';
  r: string; // root letters, spaced ("ق و ل"), or ''
  n: number; // times it appears in the Quran
  l: number; // level 1-60
  m: string[]; // Indonesian meanings, best first
  e: string[]; // English meanings, best first
  f: [string, number][]; // most common written forms with counts
  x: string[]; // example word locations "surah:ayah:word"
}

interface Dataset {
  version: number;
  total: number;
  levels: { size: number; coverage: number }[];
  items: QuranWord[];
}

const data = raw as unknown as Dataset;

export const QW_ITEMS: QuranWord[] = data.items;
export const QW_TOTAL = data.total; // all counted word pieces
export const QW_LEVELS = data.levels; // coverage = % of the Quran known after this level
export const QW_MAX_LEVEL = data.levels.length;

export const QW_BY_ID: Record<string, QuranWord> = {};
export const QW_BY_LEVEL: Record<number, QuranWord[]> = {};
for (const w of QW_ITEMS) {
  QW_BY_ID[w.i] = w;
  (QW_BY_LEVEL[w.l] ||= []).push(w);
}

/** "berkata" for prompts; the first Indonesian meaning. */
export const mainMeaning = (w: QuranWord) => w.m[0] || w.e[0] || '';

/** Short label for the kind of word. */
export const KIND_LABEL: Record<QuranWord['p'], string> = {
  Noun: 'Noun',
  Verb: 'Verb',
  Particle: 'Particle',
  Name: 'Name',
  Adjective: 'Adjective',
  Pronoun: 'Pronoun',
  Prefix: 'Attached letter',
};
