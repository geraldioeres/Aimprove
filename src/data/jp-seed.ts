import { WaniKaniStage } from '../lib/srs-wanikani';
import fullWaniKaniDataset from './wanikani-1-60.json';

export type JPSubjectKind = 'radical' | 'kanji' | 'vocab' | 'grammar';

export interface JPContextSentence {
  ja: string;
  furigana: string;
  en: string;
}

export interface JPClozePrompt {
  sentenceBefore: string;
  blankTarget: string;
  acceptedInputs: string[];
  sentenceAfter: string;
  nuanceHint: string;
  fullTranslation: string;
}

export interface JPSubject {
  id: string;
  level: number; // 1 to 60
  kind: JPSubjectKind;
  characters: string;
  meanings: string[];
  readings: string[];
  readingType?: 'onyomi' | 'kunyomi' | 'vocab' | 'cloze';
  componentIds: string[];
  amalgamationIds: string[];
  mnemonic: string;
  readingMnemonic?: string;
  pitchAccent?: string;
  jlptLevel?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  grammarStructure?: string;
  contextSentences: JPContextSentence[];
  clozePrompt?: JPClozePrompt;
}

export interface JPReadingToken {
  surface: string;
  reading?: string;
  meaning?: string;
  baseForm?: string;
  jlpt?: string;
}

export interface JPReadingSentence {
  id: string;
  ja: string;
  en: string;
  tokens: JPReadingToken[];
}

export interface JPReadingPassage {
  id: string;
  level: number;
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2';
  titleJa: string;
  titleEn: string;
  summary: string;
  sentences: JPReadingSentence[];
}

export interface UserJPAssignment {
  subjectId: string;
  srsStage: WaniKaniStage;
  unlockedAt: string;
  startedAt: string | null;
  nextReviewAt: string | null;
  passedGuru: boolean;
  burnedAt: string | null;
  correctStreak: number;
  incorrectCount: number;
}

export interface UserJPMinedCard {
  id: string;
  sourcePassageId: string;
  characters: string;
  reading: string;
  meaning: string;
  contextSentenceJa: string;
  contextSentenceEn: string;
  srsStage: WaniKaniStage;
  nextReviewAt: string | null;
  createdAt: string;
}

export const GRAMMAR_SUBJECTS: JPSubject[] = [
  {
    id: 'gram-te-iru',
    level: 1,
    kind: 'grammar',
    characters: '〜ている',
    meanings: ['Ongoing Action', 'Resultant State'],
    readings: ['ている', 'ています'],
    readingType: 'cloze',
    componentIds: [],
    amalgamationIds: [],
    jlptLevel: 'N5',
    grammarStructure: 'Verb (て-form) + いる / います',
    mnemonic:
      'Combines the て-form of an action with いる (to exist) to express that an action is currently in progress or exists as an ongoing state.',
    contextSentences: [
      {
        ja: '今、日本語を勉強しています。',
        furigana: 'いま、にほんごをべんきょうしています。',
        en: 'I am studying Japanese right now.',
      },
      {
        ja: '窓が開いています。',
        furigana: 'まどがあいています。',
        en: 'The window is open.',
      },
    ],
    clozePrompt: {
      sentenceBefore: '毎日、この静かな部屋で本を読ん',
      blankTarget: 'でいる',
      acceptedInputs: ['でいる', 'でいます'],
      sentenceAfter: '。',
      nuanceHint: 'ongoing / habitual action (読む -> んで + いる)',
      fullTranslation: 'Every day, I am reading books in this quiet room.',
    },
  },
  {
    id: 'gram-nakereba-naranai',
    level: 1,
    kind: 'grammar',
    characters: '〜なければならない',
    meanings: ['Must Do', 'Have To Do'],
    readings: ['なければならない', 'なければなりません'],
    readingType: 'cloze',
    componentIds: [],
    amalgamationIds: [],
    jlptLevel: 'N5',
    grammarStructure: 'Verb (ない-stem) + なければならない',
    mnemonic:
      'Literally: "If I do not do [X], it will not do." Expresses obligation or necessity.',
    contextSentences: [
      {
        ja: '毎日復習しなければなりません。',
        furigana: 'まいにちふくしゅうしなければなりません。',
        en: 'I must review every day.',
      },
    ],
    clozePrompt: {
      sentenceBefore: '明日は朝早く起き',
      blankTarget: 'なければならない',
      acceptedInputs: ['なければならない', 'なければなりません', 'なきゃいけない'],
      sentenceAfter: '。',
      nuanceHint: 'must / have to (起きる -> 起き + なければならない)',
      fullTranslation: 'Tomorrow I have to wake up early in the morning.',
    },
  },
  {
    id: 'gram-you-ni-suru',
    level: 2,
    kind: 'grammar',
    characters: '〜ようにする',
    meanings: ['To Make An Effort To', 'To Try To'],
    readings: ['ようにする', 'ようにしています'],
    readingType: 'cloze',
    componentIds: [],
    amalgamationIds: [],
    jlptLevel: 'N4',
    grammarStructure: 'Verb (Dictionary / ない-form) + ようにする',
    mnemonic:
      'Directs your deliberate action (する) toward a target manner or habit (ように).',
    contextSentences: [
      {
        ja: '毎日少しでも暗記するようにしています。',
        furigana: 'まいにちすこしでもあんきするようにしています。',
        en: 'I make a habit of memorizing even a little every day.',
      },
    ],
    clozePrompt: {
      sentenceBefore: '毎朝、新しい漢字を十個覚える',
      blankTarget: 'ようにしている',
      acceptedInputs: ['ようにする', 'ようにしている', 'ようにしています'],
      sentenceAfter: '。',
      nuanceHint: 'make a conscious effort / habit (ように + する/している)',
      fullTranslation: 'Every morning, I make sure to memorize ten new kanji.',
    },
  },
  {
    id: 'gram-tame-ni',
    level: 3,
    kind: 'grammar',
    characters: '〜ために',
    meanings: ['In Order To', 'For The Sake Of'],
    readings: ['ために'],
    readingType: 'cloze',
    componentIds: [],
    amalgamationIds: [],
    jlptLevel: 'N4',
    grammarStructure: 'Verb (Dictionary form) / Noun + の + ために',
    mnemonic:
      'Marks a clear purpose or goal (ため) toward which your action is aimed (に).',
    contextSentences: [
      {
        ja: '日本の小説を読むために漢字を学びます。',
        furigana: 'にほんのしょうせつをよむためにかんじをまなびます。',
        en: 'I study kanji in order to read Japanese novels.',
      },
    ],
    clozePrompt: {
      sentenceBefore: '忘れない',
      blankTarget: 'ために',
      acceptedInputs: ['ために'],
      sentenceAfter: '、ノートに書き留めました。',
      nuanceHint: 'in order to / so as not to forget',
      fullTranslation: 'In order not to forget, I wrote it down in my notebook.',
    },
  },
  {
    id: 'gram-ni-tsurete',
    level: 11,
    kind: 'grammar',
    characters: '〜につれて',
    meanings: ['As X Changes, Y Also Changes', 'In Proportion To'],
    readings: ['につれて'],
    readingType: 'cloze',
    componentIds: [],
    amalgamationIds: [],
    jlptLevel: 'N3',
    grammarStructure: 'Verb (Dictionary form) / Noun + につれて',
    mnemonic:
      'From 連れる (to take along): as one change happens, it brings a proportional change along with it.',
    contextSentences: [
      {
        ja: 'レベルが上がるにつれて、読める本が増えます。',
        furigana: 'れべるがあがるにつれて、よめるほんがふえます。',
        en: 'As your level goes up, the books you can read increase.',
      },
    ],
    clozePrompt: {
      sentenceBefore: '時間が経つ',
      blankTarget: 'につれて',
      acceptedInputs: ['につれて'],
      sentenceAfter: '、記憶が定着していく。',
      nuanceHint: 'as time passes / in proportion to',
      fullTranslation: 'As time passes, the memory becomes firmly established.',
    },
  },
  {
    id: 'gram-ni-souinai',
    level: 21,
    kind: 'grammar',
    characters: '〜に相違ない',
    meanings: ['Without A Doubt', 'Must Be'],
    readings: ['にそういない'],
    readingType: 'cloze',
    componentIds: [],
    amalgamationIds: [],
    jlptLevel: 'N2',
    grammarStructure: 'Plain Form + に相違ない',
    mnemonic:
      '相違 (discrepancy/difference) + ない (none): there is no discrepancy in concluding X.',
    contextSentences: [
      {
        ja: '彼の努力は実を結ぶに相違ない。',
        furigana: 'かれのどりょくはみをむすぶにそういない。',
        en: 'His efforts will bear fruit without a doubt.',
      },
    ],
    clozePrompt: {
      sentenceBefore: 'この計画は成功する',
      blankTarget: 'にそういない',
      acceptedInputs: ['にそういない'],
      sentenceAfter: '。',
      nuanceHint: 'without a doubt / formal conviction (に相違ない)',
      fullTranslation: 'This plan will succeed without a doubt.',
    },
  },
];

/**
 * Full WaniKani Level 1-60 Curriculum (478 Radicals + 2,026 Kanji + 6,345 Vocab + JLPT Grammar = 8,855 Subjects)
 */
export const INITIAL_JP_SUBJECTS: JPSubject[] = [
  ...(fullWaniKaniDataset as JPSubject[]),
  ...GRAMMAR_SUBJECTS,
];

export const INITIAL_JP_READING_PASSAGES: JPReadingPassage[] = [
  {
    id: 'read-morning-study',
    level: 1,
    jlptLevel: 'N5',
    titleJa: '朝の静かな勉強',
    titleEn: 'Quiet Morning Study',
    summary:
      'A short reflection on building a calm daily study habit by the river and mountains.',
    sentences: [
      {
        id: 's1',
        ja: '私は毎朝、日が昇る前に起きます。',
        en: 'Every morning, I wake up before the sun rises.',
        tokens: [
          { surface: '私', reading: 'わたし', meaning: 'I / me', jlpt: 'N5' },
          { surface: 'は' },
          { surface: '毎朝', reading: 'まいあさ', meaning: 'every morning', jlpt: 'N5' },
          { surface: '、' },
          { surface: '日', reading: 'ひ', meaning: 'sun / day', jlpt: 'N5' },
          { surface: 'が' },
          { surface: '昇る', reading: 'のぼる', meaning: 'to rise / to ascend', jlpt: 'N4' },
          { surface: '前', reading: 'まえ', meaning: 'before / in front of', jlpt: 'N5' },
          { surface: 'に' },
          {
            surface: '起きます',
            reading: 'おきます',
            baseForm: '起きる',
            meaning: 'to wake up',
            jlpt: 'N5',
          },
          { surface: '。' },
        ],
      },
      {
        id: 's2',
        ja: '机の上にはお茶が一つと、日本語の本があります。',
        en: 'On top of the desk, there is one cup of tea and a Japanese book.',
        tokens: [
          { surface: '机', reading: 'つくえ', meaning: 'desk', jlpt: 'N5' },
          { surface: 'の' },
          { surface: '上', reading: 'うえ', meaning: 'above / on top', jlpt: 'N5' },
          { surface: 'には' },
          { surface: 'お茶', reading: 'おちゃ', meaning: 'tea', jlpt: 'N5' },
          { surface: 'が' },
          { surface: '一つ', reading: 'ひとつ', meaning: 'one thing', jlpt: 'N5' },
          { surface: 'と、' },
          {
            surface: '日本語',
            reading: 'にほんご',
            meaning: 'Japanese language',
            jlpt: 'N5',
          },
          { surface: 'の' },
          { surface: '本', reading: 'ほん', meaning: 'book', jlpt: 'N5' },
          { surface: 'が' },
          {
            surface: 'あります',
            reading: 'あります',
            baseForm: 'ある',
            meaning: 'to exist (inanimate)',
            jlpt: 'N5',
          },
          { surface: '。' },
        ],
      },
      {
        id: 's3',
        ja: '窓から遠い山と静かな川が見えます。',
        en: 'From the window, distant mountains and a quiet river are visible.',
        tokens: [
          { surface: '窓', reading: 'まど', meaning: 'window', jlpt: 'N5' },
          { surface: 'から' },
          { surface: '遠い', reading: 'とおい', meaning: 'distant / far', jlpt: 'N5' },
          { surface: '山', reading: 'やま', meaning: 'mountain', jlpt: 'N5' },
          { surface: 'と' },
          {
            surface: '静かな',
            reading: 'しずかな',
            meaning: 'quiet / peaceful',
            jlpt: 'N5',
          },
          { surface: '川', reading: 'かわ', meaning: 'river', jlpt: 'N5' },
          { surface: 'が' },
          {
            surface: '見えます',
            reading: 'みえます',
            baseForm: '見える',
            meaning: 'to be visible',
            jlpt: 'N4',
          },
          { surface: '。' },
        ],
      },
      {
        id: 's4',
        ja: '少しずつ続けることが本当の力になります。',
        en: 'Continuing little by little becomes true strength.',
        tokens: [
          {
            surface: '少しずつ',
            reading: 'すこしずつ',
            meaning: 'little by little',
            jlpt: 'N4',
          },
          {
            surface: '続ける',
            reading: 'つづける',
            meaning: 'to continue / keep up',
            jlpt: 'N4',
          },
          { surface: 'こと' },
          { surface: 'が' },
          { surface: '本当', reading: 'ほんとう', meaning: 'truth / real', jlpt: 'N5' },
          { surface: 'の' },
          {
            surface: '力',
            reading: 'ちから',
            meaning: 'power / strength / ability',
            jlpt: 'N5',
          },
          { surface: 'に' },
          {
            surface: 'なります',
            reading: 'なります',
            baseForm: 'なる',
            meaning: 'to become',
            jlpt: 'N5',
          },
          { surface: '。' },
        ],
      },
    ],
  },
  {
    id: 'read-memory-craft',
    level: 2,
    jlptLevel: 'N4',
    titleJa: '記憶と復習の習慣',
    titleEn: 'The Habit of Memory and Review',
    summary:
      'How spaced repetition turns fragile short-term impressions into lasting recall.',
    sentences: [
      {
        id: 'm1',
        ja: '新しい言葉を覚えるとき、一度だけではすぐに忘れてしまいます。',
        en: 'When memorizing new words, if you only do it once, you quickly forget them.',
        tokens: [
          { surface: '新しい', reading: 'あたらしい', meaning: 'new', jlpt: 'N5' },
          { surface: '言葉', reading: 'ことば', meaning: 'word / language', jlpt: 'N5' },
          { surface: 'を' },
          {
            surface: '覚える',
            reading: 'おぼえる',
            meaning: 'to memorize / remember',
            jlpt: 'N5',
          },
          { surface: 'とき、' },
          { surface: '一度', reading: 'いちど', meaning: 'once / one time', jlpt: 'N4' },
          { surface: 'だけでは' },
          {
            surface: 'すぐに',
            reading: 'すぐに',
            meaning: 'immediately / soon',
            jlpt: 'N5',
          },
          {
            surface: '忘れて',
            reading: 'わすれて',
            baseForm: '忘れる',
            meaning: 'to forget',
            jlpt: 'N5',
          },
          {
            surface: 'しまいます',
            reading: 'しまいます',
            baseForm: 'しまう',
            meaning: 'to end up doing regrettably',
            jlpt: 'N4',
          },
          { surface: '。' },
        ],
      },
      {
        id: 'm2',
        ja: 'しかし、忘れる直前に思い出す練習をすると、記憶は深くなります。',
        en: 'However, if you practice recalling right before forgetting, the memory deepens.',
        tokens: [
          { surface: 'しかし、' },
          { surface: '忘れる', reading: 'わすれる', meaning: 'to forget', jlpt: 'N5' },
          {
            surface: '直前',
            reading: 'ちょくぜん',
            meaning: 'just before / right before',
            jlpt: 'N3',
          },
          { surface: 'に' },
          {
            surface: '思い出す',
            reading: 'おもいだす',
            meaning: 'to recall / call to mind',
            jlpt: 'N4',
          },
          {
            surface: '練習',
            reading: 'れんしゅう',
            meaning: 'practice / training',
            jlpt: 'N5',
          },
          { surface: 'をすると、' },
          {
            surface: '記憶',
            reading: 'きおく',
            meaning: 'memory / retention',
            jlpt: 'N3',
          },
          { surface: 'は' },
          {
            surface: '深く',
            reading: 'ふかく',
            baseForm: '深い',
            meaning: 'deep',
            jlpt: 'N4',
          },
          { surface: 'なります。' },
        ],
      },
    ],
  },
];

/**
 * Generates initial user assignments for Level 1 WaniKani items:
 * - 6 Level 1 Radicals at Guru I (unlocking their Level 1 Kanji)
 * - 4 Level 1 Radicals due now in Apprentice III
 * - 6 Remaining Level 1 Radicals waiting in the Lesson Queue
 * - Dependent Level 1 Kanji & Vocab active in Apprentice + Lesson Queue
 */
export function buildInitialJPAssignments(
  now: Date = new Date()
): Record<string, UserJPAssignment> {
  const pastOneHour = new Date(now.getTime() - 3600 * 1000).toISOString();
  const inTwoHours = new Date(now.getTime() + 2 * 3600 * 1000).toISOString();
  const inFourHours = new Date(now.getTime() + 4 * 3600 * 1000).toISOString();
  const inEightHours = new Date(now.getTime() + 8 * 3600 * 1000).toISOString();
  const inTwelveHours = new Date(now.getTime() + 12 * 3600 * 1000).toISOString();

  const map: Record<string, UserJPAssignment> = {};

  // 1. Level 1 Radicals at Guru I (so their dependent Level 1 Kanji are unlocked!)
  const guruRadicals = [
    'rad-ground',
    'rad-person',
    'rad-mouth',
    'rad-mountain',
    'rad-river',
    'rad-toe',
  ];
  for (const id of guruRadicals) {
    map[id] = {
      subjectId: id,
      srsStage: 5, // Guru I
      unlockedAt: pastOneHour,
      startedAt: pastOneHour,
      nextReviewAt: inTwelveHours,
      passedGuru: true,
      burnedAt: null,
      correctStreak: 5,
      incorrectCount: 0,
    };
  }

  // 2. Level 1 Radicals due right now for review!
  const dueRadicals = ['rad-power', 'rad-big', 'rad-woman', 'rad-two'];
  for (const id of dueRadicals) {
    map[id] = {
      subjectId: id,
      srsStage: 4, // Apprentice IV -> 1 correct review promotes them to Guru I and unlocks their Kanji!
      unlockedAt: pastOneHour,
      startedAt: pastOneHour,
      nextReviewAt: pastOneHour,
      passedGuru: false,
      burnedAt: null,
      correctStreak: 4,
      incorrectCount: 0,
    };
  }

  // 3. Remaining Level 1 Radicals in Lesson Queue
  const lessonRadicals = [
    'rad-construction',
    'rad-cross',
    'rad-enter',
    'rad-fins',
    'rad-nine',
    'rad-seven',
  ];
  for (const id of lessonRadicals) {
    map[id] = {
      subjectId: id,
      srsStage: 0,
      unlockedAt: pastOneHour,
      startedAt: null,
      nextReviewAt: null,
      passedGuru: false,
      burnedAt: null,
      correctStreak: 0,
      incorrectCount: 0,
    };
  }

  // 4. Level 1 Kanji unlocked by the Guru Radicals
  for (const id of ['kan-一', 'kan-人', 'kan-上']) {
    map[id] = {
      subjectId: id,
      srsStage: 2, // Due now!
      unlockedAt: pastOneHour,
      startedAt: pastOneHour,
      nextReviewAt: pastOneHour,
      passedGuru: false,
      burnedAt: null,
      correctStreak: 2,
      incorrectCount: 0,
    };
  }

  map['kan-下'] = {
    subjectId: 'kan-下',
    srsStage: 4,
    unlockedAt: pastOneHour,
    startedAt: pastOneHour,
    nextReviewAt: inTwoHours,
    passedGuru: false,
    burnedAt: null,
    correctStreak: 4,
    incorrectCount: 0,
  };

  for (const id of ['kan-口', 'kan-山', 'kan-川']) {
    map[id] = {
      subjectId: id,
      srsStage: 0, // Available in Lesson Queue
      unlockedAt: pastOneHour,
      startedAt: null,
      nextReviewAt: null,
      passedGuru: false,
      burnedAt: null,
      correctStreak: 0,
      incorrectCount: 0,
    };
  }

  // 5. Starter Level 1 Vocab & Grammar
  map['voc-一つ'] = {
    subjectId: 'voc-一つ',
    srsStage: 1,
    unlockedAt: pastOneHour,
    startedAt: pastOneHour,
    nextReviewAt: pastOneHour, // Due now!
    passedGuru: false,
    burnedAt: null,
    correctStreak: 1,
    incorrectCount: 0,
  };

  map['voc-人'] = {
    subjectId: 'voc-人',
    srsStage: 2,
    unlockedAt: pastOneHour,
    startedAt: pastOneHour,
    nextReviewAt: inFourHours,
    passedGuru: false,
    burnedAt: null,
    correctStreak: 2,
    incorrectCount: 0,
  };

  map['voc-上'] = {
    subjectId: 'voc-上',
    srsStage: 0, // Available in Lesson Queue
    unlockedAt: pastOneHour,
    startedAt: null,
    nextReviewAt: null,
    passedGuru: false,
    burnedAt: null,
    correctStreak: 0,
    incorrectCount: 0,
  };

  map['gram-te-iru'] = {
    subjectId: 'gram-te-iru',
    srsStage: 2,
    unlockedAt: pastOneHour,
    startedAt: pastOneHour,
    nextReviewAt: pastOneHour, // Due now!
    passedGuru: false,
    burnedAt: null,
    correctStreak: 2,
    incorrectCount: 0,
  };

  map['gram-nakereba-naranai'] = {
    subjectId: 'gram-nakereba-naranai',
    srsStage: 3,
    unlockedAt: pastOneHour,
    startedAt: pastOneHour,
    nextReviewAt: inEightHours,
    passedGuru: false,
    burnedAt: null,
    correctStreak: 3,
    incorrectCount: 0,
  };

  return map;
}
