import raw from '../data/jlpt-vocab.json';
import { INITIAL_JP_SUBJECTS, JPSubject } from '../data/jp-seed';

/**
 * JLPT drills: four-option questions modelled on the exam's vocabulary and
 * kanji sections, built from the JLPT word lists (jlpt-vocab.json) and the
 * JLPT-tagged kanji in the WaniKani data.
 */

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export const JLPT_LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export type DrillSection = 'kanji-reading' | 'writing' | 'vocab' | 'kanji';
export const DRILL_SECTIONS: DrillSection[] = ['kanji-reading', 'writing', 'vocab', 'kanji'];

export const SECTION_INFO: Record<DrillSection, { jp: string; title: string; about: string; ask: string }> = {
  'kanji-reading': {
    jp: '漢字読み',
    title: 'Kanji reading',
    about: 'Pick how a word written in kanji is read.',
    ask: 'How is this word read?',
  },
  writing: {
    jp: '表記',
    title: 'Writing',
    about: 'Pick the right kanji for a word written in kana.',
    ask: 'How is this written in kanji?',
  },
  vocab: {
    jp: '語彙',
    title: 'Vocabulary',
    about: 'Match words and meanings, both ways.',
    ask: 'What does this mean?',
  },
  kanji: {
    jp: '漢字',
    title: 'Kanji',
    about: "Meanings and on'yomi / kun'yomi of the level's kanji.",
    ask: 'What does this kanji mean?',
  },
};

export interface DrillQuestion {
  id: string;
  section: DrillSection;
  ask: string; // the question line
  prompt: string; // what's being asked about
  promptLang: 'ja' | 'en';
  options: string[];
  optionLang: 'ja' | 'en';
  answer: number; // index into options
  explain: string; // shown after answering, e.g. "新しい (あたらしい) new"
}

// --- Data --------------------------------------------------------------------

type Word = { expression: string; reading: string; meaning: string };
const VOCAB: Record<JlptLevel, Word[]> = Object.fromEntries(
  Object.entries(raw as unknown as Record<string, [string, string, string][]>).map(([lvl, list]) => [
    lvl,
    list.map(([expression, reading, meaning]) => ({ expression, reading, meaning })),
  ])
) as Record<JlptLevel, Word[]>;

const KANJI_CHAR = /[一-龯々]/;
const KANA_ONLY = /^[ぁ-ゖァ-ヺー]+$/;
const CLEAN_WORD = /^[一-龯々ぁ-ゖァ-ヺー]+$/;

/** Words fit for reading and writing questions: kanji + kana only, with kanji. */
const withKanji = (w: Word) => CLEAN_WORD.test(w.expression) && KANJI_CHAR.test(w.expression) && KANA_ONLY.test(w.reading);

const KANJI: JPSubject[] = INITIAL_JP_SUBJECTS.filter((s) => s.kind === 'kanji');
const kanjiByLevel = (level: JlptLevel) => KANJI.filter((k) => k.jlptLevel === level);
const cleanMeaning = (m: string) => m.replace(/^\^/, '');

// On'yomi -> kanji that share it, for "same sound, wrong kanji" distractors.
const KANJI_BY_ONYOMI = new Map<string, string[]>();
for (const k of KANJI) {
  for (const r of k.onyomi || []) {
    const list = KANJI_BY_ONYOMI.get(r) || [];
    list.push(k.characters);
    KANJI_BY_ONYOMI.set(r, list);
  }
}
const ONYOMI_OF = new Map(KANJI.map((k) => [k.characters, k.onyomi || []]));
const ALL_EXPRESSIONS = new Set(JLPT_LEVELS.flatMap((l) => VOCAB[l].map((w) => w.expression)));

export function levelCounts(level: JlptLevel) {
  return {
    words: VOCAB[level].length,
    wordsWithKanji: VOCAB[level].filter(withKanji).length,
    kanji: kanjiByLevel(level).length,
  };
}

// --- Helpers -----------------------------------------------------------------

const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = <T,>(xs: T[], n: number): T[] => shuffle(xs).slice(0, n);

/** Shuffle the right answer in among the wrong ones. */
function assemble(
  base: Omit<DrillQuestion, 'options' | 'answer'>,
  right: string,
  wrong: string[]
): DrillQuestion | null {
  const distinct = [...new Set(wrong.filter((w) => w && w !== right))].slice(0, 3);
  if (distinct.length < 3) return null;
  const options = shuffle([right, ...distinct]);
  return { ...base, options, answer: options.indexOf(right) };
}

// --- Near-miss readings (the exam's favourite traps) ---------------------------

const VOICE: Record<string, string[]> = {
  か: ['が'], き: ['ぎ'], く: ['ぐ'], け: ['げ'], こ: ['ご'],
  さ: ['ざ'], し: ['じ'], す: ['ず'], せ: ['ぜ'], そ: ['ぞ'],
  た: ['だ'], て: ['で'], と: ['ど'],
  は: ['ば', 'ぱ'], ひ: ['び', 'ぴ'], ふ: ['ぶ', 'ぷ'], へ: ['べ', 'ぺ'], ほ: ['ぼ', 'ぽ'],
};
for (const [plain, voiced] of Object.entries({ ...VOICE })) for (const v of voiced) VOICE[v] = [plain];
const O_ROW = new Set('おこごそぞとどのほぼぽもよろょ'.split(''));
const U_ROW = new Set('うくぐすずつぬふぶぷむゆるゅ'.split(''));
const GEMINATE_BEFORE = new Set('かきくけこさしすせそたちつてとぱぴぷぺぽ'.split(''));
const SMALL_TO_BIG: Record<string, string> = { ゃ: 'や', ゅ: 'ゆ', ょ: 'よ' };

function nearMissReadings(reading: string): string[] {
  const out = new Set<string>();
  const chars = [...reading];
  chars.forEach((c, i) => {
    const swap = (s: string) => out.add([...chars.slice(0, i), s, ...chars.slice(i + 1)].join(''));
    for (const v of VOICE[c] || []) swap(v); // voicing
    if (SMALL_TO_BIG[c]) swap(SMALL_TO_BIG[c]); // きょう -> きよう
    // Small っ, the way it really appears: く/つ/ち/き before a k/s/t/p sound
    // becomes っ (がくこう → がっこう), and an existing っ goes back to つ/く.
    if (c === 'っ') {
      swap('つ');
      swap('く');
    }
    if (c === 'う' && i > 0 && (O_ROW.has(chars[i - 1]) || U_ROW.has(chars[i - 1]))) {
      out.add([...chars.slice(0, i), ...chars.slice(i + 1)].join('')); // drop long vowel
    }
    const next = chars[i + 1];
    if (next && c !== 'う' && (O_ROW.has(c) || U_ROW.has(c)) && next !== 'う' && next !== 'ー') {
      out.add([...chars.slice(0, i + 1), 'う', ...chars.slice(i + 1)].join('')); // add long vowel
    }
    if (i > 0 && next && GEMINATE_BEFORE.has(next) && 'くつちき'.includes(c)) swap('っ'); // never word-initial
  });
  out.delete(reading);
  return [...out];
}

// --- Question makers -------------------------------------------------------------

function readingQuestion(w: Word, level: JlptLevel): DrillQuestion | null {
  let wrong = pick(nearMissReadings(w.reading), 3);
  if (wrong.length < 3) {
    // Two small changes still look like the word; prefer that to unrelated readings.
    const second = nearMissReadings(w.reading).flatMap(nearMissReadings).filter((r) => r !== w.reading && !wrong.includes(r));
    wrong = [...wrong, ...pick(second, 3 - wrong.length)];
  }
  if (wrong.length < 3) {
    // Top up with readings of other words of the same length.
    const others = VOCAB[level].filter((o) => o.reading !== w.reading && o.reading.length === w.reading.length && KANA_ONLY.test(o.reading));
    wrong = [...wrong, ...pick(others, 6).map((o) => o.reading)];
  }
  return assemble(
    {
      id: `r:${w.expression}`,
      section: 'kanji-reading',
      ask: SECTION_INFO['kanji-reading'].ask,
      prompt: w.expression,
      promptLang: 'ja',
      optionLang: 'ja',
      explain: `${w.expression} (${w.reading}) ${w.meaning}`,
    },
    w.reading,
    wrong
  );
}

function writingQuestion(w: Word, level: JlptLevel): DrillQuestion | null {
  const chars = [...w.expression];
  const kanjiPositions = chars.map((c, i) => (KANJI_CHAR.test(c) && c !== '々' ? i : -1)).filter((i) => i >= 0);
  const candidates = new Set<string>();
  const levelKanji = kanjiByLevel(level).map((k) => k.characters);
  for (const i of shuffle(kanjiPositions)) {
    // Same on'yomi first (the classic trap), then any kanji from the level.
    const sameSound = (ONYOMI_OF.get(chars[i]) || []).flatMap((r) => KANJI_BY_ONYOMI.get(r) || []);
    for (const k of [...shuffle(sameSound), ...pick(levelKanji, 8)]) {
      if (k === chars[i]) continue;
      const alt = [...chars.slice(0, i), k, ...chars.slice(i + 1)].join('');
      if (!ALL_EXPRESSIONS.has(alt)) candidates.add(alt); // never another real word
      if (candidates.size >= 6) break;
    }
  }
  return assemble(
    {
      id: `w:${w.expression}`,
      section: 'writing',
      ask: SECTION_INFO.writing.ask,
      prompt: w.reading,
      promptLang: 'ja',
      optionLang: 'ja',
      explain: `${w.reading} → ${w.expression} ${w.meaning}`,
    },
    w.expression,
    pick([...candidates], 3)
  );
}

const isVerb = (w: Word) => /^to /.test(w.meaning);

function vocabQuestion(w: Word, level: JlptLevel): DrillQuestion | null {
  const sameKind = VOCAB[level].filter((o) => o.expression !== w.expression && isVerb(o) === isVerb(w) && o.meaning !== w.meaning);
  const others = pick(sameKind, 6);
  const toMeaning = Math.random() < 0.6;
  return toMeaning
    ? assemble(
        {
          id: `v:${w.expression}`,
          section: 'vocab',
          ask: 'What does this mean?',
          prompt: w.expression,
          promptLang: 'ja',
          optionLang: 'en',
          explain: `${w.expression} (${w.reading}) ${w.meaning}`,
        },
        w.meaning,
        others.map((o) => o.meaning)
      )
    : assemble(
        {
          id: `v2:${w.expression}`,
          section: 'vocab',
          ask: 'Which word means this?',
          prompt: w.meaning,
          promptLang: 'en',
          optionLang: 'ja',
          explain: `${w.expression} (${w.reading}) ${w.meaning}`,
        },
        w.expression,
        others.map((o) => o.expression)
      );
}

function kanjiQuestion(k: JPSubject, level: JlptLevel): DrillQuestion | null {
  const pool = kanjiByLevel(level).filter((o) => o.characters !== k.characters);
  const readings = [...(k.onyomi || []), ...(k.kunyomi || [])];
  const explain = `${k.characters}: ${k.meanings.map(cleanMeaning).join(', ')} · on ${(k.onyomi || []).join('、') || '–'} · kun ${(k.kunyomi || []).join('、') || '–'}`;
  if (readings.length && Math.random() < 0.4) {
    const right = readings[Math.floor(Math.random() * readings.length)];
    const wrong = pick(pool, 12)
      .flatMap((o) => [...(o.onyomi || []), ...(o.kunyomi || [])])
      .filter((r) => !readings.includes(r));
    return assemble(
      { id: `kr:${k.characters}`, section: 'kanji', ask: 'Which is a reading of this kanji?', prompt: k.characters, promptLang: 'ja', optionLang: 'ja', explain },
      right,
      pick(wrong, 3)
    );
  }
  const right = cleanMeaning(k.meanings[0]);
  const wrong = pick(pool, 6).map((o) => cleanMeaning(o.meanings[0]));
  return assemble(
    { id: `km:${k.characters}`, section: 'kanji', ask: SECTION_INFO.kanji.ask, prompt: k.characters, promptLang: 'ja', optionLang: 'en', explain },
    right,
    wrong
  );
}

function questionsFor(section: DrillSection, level: JlptLevel, count: number): DrillQuestion[] {
  const out: DrillQuestion[] = [];
  const make =
    section === 'kanji'
      ? shuffle(kanjiByLevel(level)).map((k) => () => kanjiQuestion(k, level))
      : shuffle(VOCAB[level].filter(section === 'vocab' ? () => true : withKanji)).map((w) => () =>
          section === 'kanji-reading' ? readingQuestion(w, level) : section === 'writing' ? writingQuestion(w, level) : vocabQuestion(w, level)
        );
  for (const m of make) {
    const q = m();
    if (q) out.push(q);
    if (out.length >= count) break;
  }
  return out;
}

/** A drill: one section (15 questions) or a mixed mini test (5 from each). */
export function buildDrill(level: JlptLevel, section: DrillSection | 'mixed'): DrillQuestion[] {
  if (section !== 'mixed') return questionsFor(section, level, 15);
  // Grouped by section, like the real paper.
  return DRILL_SECTIONS.flatMap((s) => questionsFor(s, level, 5));
}
