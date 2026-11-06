// Builds src/data/quran-words.json: every word of the Quran grouped by
// dictionary form (lemma), counted, and split into 60 levels from most to
// least frequent.
//
// Inputs (download first, see src/data/QURAN-WORDS-NOTICE.md):
//   1. quran-morphology.txt  Quranic Arabic Corpus morphology (GPL v3),
//      https://github.com/mustafa0x/quran-morphology
//   2. words-id.json / words-en.json  word-by-word meanings from Quran.com:
//      { "2:255": [[text_uthmani, meaning], ...], ... }
//
// Usage: node scripts/build-quran-words.mjs <morphology.txt> <words-id.json> <words-en.json>

import fs from 'node:fs';

const [morphPath, idPath, enPath] = process.argv.slice(2);
if (!enPath) {
  console.error('usage: node scripts/build-quran-words.mjs <morphology.txt> <words-id.json> <words-en.json>');
  process.exit(1);
}

const qcId = JSON.parse(fs.readFileSync(idPath, 'utf8'));
const qcEn = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Strip harakat and Quranic marks to compare letters only.
const bare = (s) => s.replace(/[ً-ٰٟۖ-ۭـ]/g, '');

// --- Attached letters (prefixes) worth learning as items. Tags merged where
// the meaning a reader needs is the same.
const PREFIXES = [
  { id: 'pre:al', match: (lem, tag) => lem === 'ال', ar: 'ٱلْـ', label: 'Prefix', id_: 'kata sandang (al-)', en: 'the' },
  { id: 'pre:wa', match: (lem, tag) => lem === 'و' && tag !== 'P', ar: 'وَ', label: 'Prefix', id_: 'dan', en: 'and' },
  { id: 'pre:wa-oath', match: (lem, tag) => lem === 'و' && tag === 'P', ar: 'وَ', label: 'Prefix', id_: 'demi (sumpah)', en: 'by (oath)' },
  { id: 'pre:bi', match: (lem) => lem === 'ب', ar: 'بِـ', label: 'Prefix', id_: 'dengan, di, karena', en: 'with, by, in' },
  { id: 'pre:li', match: (lem, tag) => lem === 'ل' && tag === 'P', ar: 'لِـ', label: 'Prefix', id_: 'bagi, untuk, milik', en: 'for, to, belongs to' },
  { id: 'pre:la', match: (lem, tag) => lem === 'ل' && tag === 'EMPH', ar: 'لَـ', label: 'Prefix', id_: 'sungguh (penegas)', en: 'surely, indeed' },
  { id: 'pre:li-prp', match: (lem, tag) => lem === 'ل' && tag === 'PRP', ar: 'لِـ', label: 'Prefix', id_: 'agar, supaya', en: 'so that' },
  { id: 'pre:li-impv', match: (lem, tag) => lem === 'ل' && tag === 'IMPV', ar: 'لْـ', label: 'Prefix', id_: 'hendaklah', en: 'let (him / them)' },
  { id: 'pre:fa', match: (lem) => lem === 'ف', ar: 'فَـ', label: 'Prefix', id_: 'maka, lalu', en: 'so, then' },
  { id: 'pre:ka', match: (lem) => lem === 'ك', ar: 'كَـ', label: 'Prefix', id_: 'seperti', en: 'like, as' },
  { id: 'pre:a', match: (lem) => lem === 'أ', ar: 'أَ', label: 'Prefix', id_: 'apakah (pertanyaan)', en: 'is it…? (question)' },
  { id: 'pre:ya', match: (lem) => lem === 'ي', ar: 'يَٰٓ', label: 'Prefix', id_: 'wahai', en: 'O (calling someone)' },
  { id: 'pre:sa', match: (lem) => lem === 'س', ar: 'سَ', label: 'Prefix', id_: 'akan', en: 'will' },
  { id: 'pre:ta', match: (lem) => lem === 'ت', ar: 'تَ', label: 'Prefix', id_: 'demi (sumpah)', en: 'by (oath)' },
];

// --- Pronouns, standalone (هُوَ) and attached (ـهُ), grouped by person.
// Verb endings (ـوا، ـونَ، ـتُمْ…) are grammar, not vocabulary, so they're left out.
const PRONOUNS = {
  '3MS': { ar: 'هُوَ · ـهُ', id_: 'dia (laki-laki), -nya', en: 'he, him, his, it' },
  '3FS': { ar: 'هِىَ · ـهَا', id_: 'dia (perempuan), -nya', en: 'she, her, it' },
  '3MP': { ar: 'هُمْ · ـهُمْ', id_: 'mereka', en: 'they, them, their' },
  '3FP': { ar: 'هُنَّ · ـهُنَّ', id_: 'mereka (perempuan)', en: 'they, them (women)' },
  '3D': { ar: 'هُمَا · ـهُمَا', id_: 'mereka berdua', en: 'they both' },
  '2MS': { ar: 'أَنتَ · ـكَ', id_: 'engkau, -mu', en: 'you, your (one man)' },
  '2FS': { ar: 'أَنتِ · ـكِ', id_: 'engkau (perempuan), -mu', en: 'you, your (one woman)' },
  '2MP': { ar: 'أَنتُمْ · ـكُمْ', id_: 'kalian, -mu (banyak)', en: 'you, your (many)' },
  '2FP': { ar: 'أَنتُنَّ · ـكُنَّ', id_: 'kalian (perempuan)', en: 'you, your (women)' },
  '2D': { ar: 'أَنتُمَا · ـكُمَا', id_: 'kalian berdua', en: 'you both' },
  '1S': { ar: 'أَنَا · ـى', id_: 'aku, -ku', en: 'I, me, my' },
  '1P': { ar: 'نَحْنُ · ـنَا', id_: 'kami, kita', en: 'we, us, our' },
};
const PRONOUN_SUFFIX_LETTERS = new Set(['ه', 'هم', 'ها', 'هن', 'هما', 'ك', 'كم', 'كمو', 'كما', 'كن', 'نا', 'ى', 'ي', 'نى', 'ني', 'يه']);
const personKey = (p) => (p === '3MD' || p === '3FD' ? '3D' : p);

// --- Read the corpus into words: location "s:a:w" -> segments.
const words = new Map();
for (const line of fs.readFileSync(morphPath, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const [loc, form, pos, feat] = line.split('\t');
  const parts = loc.split(':');
  const wordLoc = parts.slice(0, 3).join(':');
  const f = feat.split('|');
  const lem = (f.find((x) => x.startsWith('LEM:')) || '').slice(4);
  const root = (f.find((x) => x.startsWith('ROOT:')) || '').slice(5);
  if (!words.has(wordLoc)) words.set(wordLoc, []);
  words.get(wordLoc).push({ form, pos, tag: f[0], feats: f, lem, root, pref: f.includes('PREF'), suff: f.includes('SUFF') });
}

const items = new Map(); // id -> item
const order = []; // first-seen order, for ties
function item(id, init) {
  if (!items.has(id)) {
    items.set(id, { id, count: 0, occ: [], forms: new Map(), occMeaning: new Map(), looseOcc: [], looseId: new Map(), looseEn: new Map(), dictId: new Map(), dictEn: new Map(), bareMeanings: new Map(), bareEn: new Map(), anyMeanings: new Map(), anyEn: new Map(), ...init });
    order.push(id);
  }
  return items.get(id);
}
const bump = (map, k) => k && map.set(k, (map.get(k) || 0) + 1);
const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();

// Meaning variants: "Tuhan/Pemelihara" -> two; "(the) Lord" -> "Lord"; "dia berkata" -> "berkata".
const ID_PRONOUNS = /^(dia|ia|mereka|kami|kita|kamu|engkau|kalian|aku)\s+(?=\S)/i;
const EN_PRONOUNS = /^(he|she|it|they|we|you|i)\s+(?=\S)/i;
function variants(text, lang) {
  return text
    .split('/')
    .map((v) => v.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim())
    .map((v) => v.replace(lang === 'id' ? ID_PRONOUNS : EN_PRONOUNS, ''))
    .map((v) => (lang === 'en' && v !== 'Allah' ? v.charAt(0).toLowerCase() + v.slice(1) : v))
    .filter((v) => v.length > 0 && v.length < 60);
}
const addVariants = (map, text, lang) => {
  for (const v of variants(text, lang)) map.set(v, (map.get(v) || 0) + 1);
};

let mismatched = 0;
const badVerses = new Set(); // ayah where the corpus and Quran.com split words differently
for (const [wordLoc, segs] of words) {
  const [s, a, w] = wordLoc.split(':');
  const verseKey = `${s}:${a}`;
  const tokId = qcId[verseKey]?.[+w - 1];
  const tokEn = qcEn[verseKey]?.[+w - 1];
  if (!tokId || bare(tokId[0]).replace(/[^ء-ي]/g, '') !== bare(segs.map((x) => x.form).join('')).replace(/[^ء-ي]/g, '')) {
    mismatched++;
    badVerses.add(verseKey);
  }
  const aligned = !badVerses.has(verseKey);
  const text = tokId?.[0] || segs.map((x) => x.form).join('');
  const meaningId = clean(tokId?.[1]);
  const meaningEn = clean(tokEn?.[1]);
  const hasAffix = segs.some((x) => x.pref || (x.suff && x.tag === 'PRON'));
  const stems = segs.filter((x) => !x.pref && !x.suff);

  const record = (it, lem) => {
    it.count++;
    bump(it.forms, text);
    // Fallback for words that only appear in ayah that don't line up.
    it.looseOcc.push(wordLoc);
    addVariants(it.looseId, meaningId, 'id');
    addVariants(it.looseEn, meaningEn, 'en');
    if (!aligned) return; // otherwise meanings and examples only from words that line up
    it.occ.push(wordLoc);
    it.occMeaning.set(wordLoc, meaningId.toLowerCase());
    addVariants(it.anyMeanings, meaningId, 'id');
    addVariants(it.anyEn, meaningEn, 'en');
    if (!hasAffix && stems.length === 1) {
      addVariants(it.bareMeanings, meaningId, 'id');
      addVariants(it.bareEn, meaningEn, 'en');
      // The dictionary form standing alone, e.g. قَالَ for قالَ.
      if (lem && bare(text) === bare(lem)) {
        addVariants(it.dictId, meaningId, 'id');
        addVariants(it.dictEn, meaningEn, 'en');
      }
    }
  };

  for (const seg of segs) {
    if (seg.pref) {
      const p = PREFIXES.find((x) => x.match(seg.lem, seg.tag));
      if (p) record(item(p.id, { ar: p.ar, label: p.label, fixedId: p.id_, fixedEn: p.en, root: '' }));
      continue;
    }
    const person = personKey(seg.feats[seg.feats.length - 1]);
    if (seg.tag === 'PRON' && PRONOUNS[person]) {
      // Standalone pronouns, or attached ones that are object/possessive.
      if (!seg.suff || PRONOUN_SUFFIX_LETTERS.has(bare(seg.form))) {
        const p = PRONOUNS[person];
        record(item(`pron:${person}`, { ar: p.ar, label: 'Pronoun', fixedId: p.id_, fixedEn: p.en, root: '' }));
      }
      continue;
    }
    if (seg.suff || !seg.lem) continue;
    const label =
      seg.pos === 'V' ? 'Verb' : seg.pos === 'P' ? 'Particle' : seg.feats.includes('PN') ? 'Name' : seg.feats.includes('ADJ') ? 'Adjective' : 'Noun';
    record(item(`${seg.pos}:${seg.lem}`, { ar: seg.lem, label, root: seg.root }), seg.lem);
  }
}

const top = (map, n) => [...map.entries()].sort((x, y) => y[1] - x[1]).slice(0, n);

// Up to three meanings, best first. Uses the first pool with enough data;
// rare variants (under 15% of the best) are dropped.
function pickMeanings(...pools) {
  const sum = (m) => [...m.values()].reduce((a, b) => a + b, 0);
  // The dictionary-form pool only counts when it isn't a rare spelling
  // (at least a quarter as common as the word on its own).
  const [dict, ...rest] = pools;
  const usable = sum(dict) >= 3 && sum(dict) >= 0.25 * sum(rest[0]) ? pools : rest;
  const pool = usable.find((m) => sum(m) >= 3) || usable.find((m) => m.size) || new Map();
  const ranked = top(pool, 8);
  if (!ranked.length) return [];
  const seen = new Set();
  return ranked
    .filter(([, n]) => n >= ranked[0][1] * 0.15)
    .map(([m]) => m)
    .filter((m) => !seen.has(m.toLowerCase()) && seen.add(m.toLowerCase()))
    .slice(0, 3);
}
const verseLen = (verseKey) => qcId[verseKey]?.length || 999;

const list = [...items.values()]
  .map((it, i) => ({ it, first: order.indexOf(it.id) }))
  .sort((x, y) => y.it.count - x.it.count || x.first - y.first)
  .map((x) => x.it);

// Level sizes: small early levels, then bigger ones; 60 levels in all.
const sizes = [];
for (let l = 1; l <= 10; l++) sizes.push(20);
for (let l = 11; l <= 30; l++) sizes.push(40);
const rest = list.length - sizes.reduce((a, b) => a + b, 0);
for (let l = 31; l <= 60; l++) sizes.push(Math.floor(rest / 30) + (l - 31 < rest % 30 ? 1 : 0));

const total = list.reduce((n, it) => n + it.count, 0);
const out = { version: 1, total, levels: [], items: [] };
let idx = 0;
let covered = 0;
for (let l = 1; l <= 60; l++) {
  const levelItems = list.slice(idx, idx + sizes[l - 1]);
  idx += sizes[l - 1];
  for (const it of levelItems) {
    covered += it.count;
    // Meaning: the most common translation of the word on its own; fall back to any occurrence.
    const meanings = it.fixedId ? [it.fixedId] : pickMeanings(it.dictId, it.bareMeanings, it.anyMeanings, it.looseId);
    const meaningsEn = it.fixedEn ? [it.fixedEn] : pickMeanings(it.dictEn, it.bareEn, it.anyEn, it.looseEn);
    if (!it.occ.length) it.occ = it.looseOcc;
    // Two examples in different ayah: where the word carries its main meaning,
    // in an ayah of about 4-12 words (enough context, quick to read).
    const seen = new Set();
    const key = (meanings[0] || '').toLowerCase().split(/[,(]/)[0].trim();
    const score = (loc, verse) => {
      const len = verseLen(verse);
      const fits = key && (it.occMeaning.get(loc) || '').includes(key) ? 0 : 100;
      return fits + (len < 4 ? 4 - len : len > 12 ? len - 12 : 0);
    };
    const examples = [...new Set(it.occ)]
      .map((loc) => ({ loc, verse: loc.split(':').slice(0, 2).join(':') }))
      .sort((x, y) => score(x.loc, x.verse) - score(y.loc, y.verse) || verseLen(x.verse) - verseLen(y.verse))
      .filter((x) => !seen.has(x.verse) && seen.add(x.verse))
      .slice(0, 2)
      .map((x) => x.loc);
    out.items.push({
      i: it.id,
      a: it.ar,
      p: it.label,
      r: it.root ? [...it.root].join(' ') : '',
      n: it.count,
      l,
      m: meanings.filter(Boolean),
      e: meaningsEn.filter(Boolean),
      f: top(it.forms, 3).map(([text, n]) => [text, n]),
      x: examples,
    });
  }
  out.levels.push({ size: levelItems.length, coverage: Math.round((1000 * covered) / total) / 10 });
}

fs.writeFileSync('src/data/quran-words.json', JSON.stringify(out));
console.log({
  items: out.items.length,
  total,
  mismatchedWords: mismatched,
  coverage: out.levels.map((x, i) => `${i + 1}:${x.coverage}`).filter((_, i) => [0, 4, 9, 19, 29, 39, 59].includes(i)),
  bytes: fs.statSync('src/data/quran-words.json').size,
});
