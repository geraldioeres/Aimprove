import { WaniKaniStage } from '../lib/srs-wanikani';

export type JPSubjectKind = 'radical' | 'kanji' | 'vocab' | 'grammar';

export interface JPContextSentence {
  ja: string;
  furigana: string;
  en: string;
}

export interface JPClozePrompt {
  sentenceBefore: string;
  blankTarget: string; // Expected hiragana/kanji answer
  acceptedInputs: string[]; // Accepted hiragana readings
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
  readings: string[]; // Hiragana readings (empty for radicals)
  readingType?: 'onyomi' | 'kunyomi' | 'vocab' | 'cloze';
  componentIds: string[]; // Prerequisite radical IDs (for kanji) or kanji IDs (for vocab)
  amalgamationIds: string[]; // Dependent kanji/vocab IDs unlocked when this reaches Guru I
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

export const INITIAL_JP_SUBJECTS: JPSubject[] = [
  // ==========================================================================
  // LEVEL 1: RADICALS (Building Blocks)
  // ==========================================================================
  {
    id: 'rad-ground',
    level: 1,
    kind: 'radical',
    characters: '一',
    meanings: ['Ground', 'One'],
    readings: [],
    componentIds: [],
    amalgamationIds: ['kan-ichi', 'kan-san', 'kan-ue', 'kan-shita'],
    mnemonic: 'A single horizontal stroke lying flat like the ground beneath your feet.',
    contextSentences: [],
  },
  {
    id: 'rad-person',
    level: 1,
    kind: 'radical',
    characters: '人',
    meanings: ['Person'],
    readings: [],
    componentIds: [],
    amalgamationIds: ['kan-hito', 'kan-oii', 'kan-nyuu'],
    mnemonic: 'Two legs striding forward in profile represent a walking person.',
    contextSentences: [],
  },
  {
    id: 'rad-mouth',
    level: 1,
    kind: 'radical',
    characters: '口',
    meanings: ['Mouth'],
    readings: [],
    componentIds: [],
    amalgamationIds: ['kan-kuchi', 'kan-gen'],
    mnemonic: 'A wide-open square box shaped like an open mouth.',
    contextSentences: [],
  },
  {
    id: 'rad-sun',
    level: 1,
    kind: 'radical',
    characters: '日',
    meanings: ['Sun', 'Day'],
    readings: [],
    componentIds: [],
    amalgamationIds: ['kan-hi', 'kan-mei'],
    mnemonic: 'A bright window looking out at the sun with a horizon line across the middle.',
    contextSentences: [],
  },
  {
    id: 'rad-tree',
    level: 1,
    kind: 'radical',
    characters: '木',
    meanings: ['Tree', 'Wood'],
    readings: [],
    componentIds: [],
    amalgamationIds: ['kan-ki', 'kan-hon', 'kan-yasumu'],
    mnemonic: 'A sturdy trunk with branches reaching out and roots anchored below.',
    contextSentences: [],
  },
  {
    id: 'rad-mountain',
    level: 1,
    kind: 'radical',
    characters: '山',
    meanings: ['Mountain'],
    readings: [],
    componentIds: [],
    amalgamationIds: ['kan-yama'],
    mnemonic: 'Three sharp rocky peaks rising out of the earth.',
    contextSentences: [],
  },
  {
    id: 'rad-river',
    level: 1,
    kind: 'radical',
    characters: '川',
    meanings: ['River', 'Stream'],
    readings: [],
    componentIds: [],
    amalgamationIds: ['kan-kawa'],
    mnemonic: 'Three flowing currents of water streaming side by side.',
    contextSentences: [],
  },
  {
    id: 'rad-power',
    level: 1,
    kind: 'radical',
    characters: '力',
    meanings: ['Power', 'Strength'],
    readings: [],
    componentIds: [],
    amalgamationIds: ['kan-chikara', 'kan-otoko'],
    mnemonic: 'A flexed arm muscle showing raw physical strength and power.',
    contextSentences: [],
  },

  // ==========================================================================
  // LEVEL 1: KANJI (Unlocked when component Radicals reach Guru I)
  // ==========================================================================
  {
    id: 'kan-ichi',
    level: 1,
    kind: 'kanji',
    characters: '一',
    meanings: ['One'],
    readings: ['いち', 'ひと'],
    readingType: 'onyomi',
    componentIds: ['rad-ground'],
    amalgamationIds: ['voc-ichi', 'voc-hitotsu', 'voc-hitori'],
    mnemonic: 'One single stroke resting on the ground means One.',
    readingMnemonic: 'Your skin itches (いち) in exactly one spot.',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '一から始めましょう。', furigana: 'いちからはじめましょう。', en: 'Let us start from one.' },
    ],
  },
  {
    id: 'kan-hito',
    level: 1,
    kind: 'kanji',
    characters: '人',
    meanings: ['Person', 'Human'],
    readings: ['にん', 'じん', 'ひと'],
    readingType: 'onyomi',
    componentIds: ['rad-person'],
    amalgamationIds: ['voc-hito', 'voc-hitori', 'voc-nihonjin'],
    mnemonic: 'The person radical is identical to the kanji for Person.',
    readingMnemonic: 'Imagine a ninja (にん) who is a stealthy person.',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: 'あの人は誰ですか。', furigana: 'あのひとはだれですか。', en: 'Who is that person?' },
    ],
  },
  {
    id: 'kan-ue',
    level: 1,
    kind: 'kanji',
    characters: '上',
    meanings: ['Above', 'Up'],
    readings: ['じょう', 'うえ'],
    readingType: 'onyomi',
    componentIds: ['rad-ground'],
    amalgamationIds: ['voc-ue', 'voc-jouzu'],
    mnemonic: 'A marker standing above the flat ground line means Above or Up.',
    readingMnemonic: 'Joe (じょう) climbed all the way above the clouds.',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '机の上に本があります。', furigana: 'つくえのうえにほんがあります。', en: 'There is a book on top of the desk.' },
    ],
  },
  {
    id: 'kan-shita',
    level: 1,
    kind: 'kanji',
    characters: '下',
    meanings: ['Below', 'Down', 'Under'],
    readings: ['か', 'げ', 'した'],
    readingType: 'onyomi',
    componentIds: ['rad-ground'],
    amalgamationIds: ['voc-shita', 'voc-chikatetsu'],
    mnemonic: 'Everything hanging beneath the ground line points Below.',
    readingMnemonic: 'A car (か) is parked down below the bridge.',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '椅子の下を見てください。', furigana: 'いすのしたをみてください。', en: 'Please look under the chair.' },
    ],
  },
  {
    id: 'kan-kuchi',
    level: 1,
    kind: 'kanji',
    characters: '口',
    meanings: ['Mouth', 'Opening'],
    readings: ['こう', 'く', 'くち'],
    readingType: 'onyomi',
    componentIds: ['rad-mouth'],
    amalgamationIds: ['voc-kuchi', 'voc-iriguchi'],
    mnemonic: 'The mouth radical directly forms the kanji for Mouth.',
    readingMnemonic: 'Construction workers (こう) shout loudly with their mouths.',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '口を大きく開けてください。', furigana: 'くちをおおきくあけてください。', en: 'Please open your mouth wide.' },
    ],
  },
  {
    id: 'kan-hi',
    level: 1,
    kind: 'kanji',
    characters: '日',
    meanings: ['Sun', 'Day'],
    readings: ['にち', 'じつ', 'ひ', 'び'],
    readingType: 'onyomi',
    componentIds: ['rad-sun'],
    amalgamationIds: ['voc-hi', 'voc-mainichi', 'voc-nihonjin'],
    mnemonic: 'The sun radical is the kanji for Sun and Day.',
    readingMnemonic: 'Spending a sunny day at the beach is niche (にち) bliss.',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '今日はいい天気ですね。', furigana: 'きょうはいいてんきですね。', en: 'The weather is fine today, is it not?' },
    ],
  },
  {
    id: 'kan-yama',
    level: 1,
    kind: 'kanji',
    characters: '山',
    meanings: ['Mountain'],
    readings: ['さん', 'やま'],
    readingType: 'onyomi',
    componentIds: ['rad-mountain'],
    amalgamationIds: ['voc-yama', 'voc-fujisan'],
    mnemonic: 'Three mountain peaks form the kanji Mountain.',
    readingMnemonic: 'The sun (さん) rises behind the mountain peak.',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '週末に山へ登ります。', furigana: 'しゅうまつにやまへのぼります。', en: 'I will climb a mountain on the weekend.' },
    ],
  },
  {
    id: 'kan-kawa',
    level: 1,
    kind: 'kanji',
    characters: '川',
    meanings: ['River'],
    readings: ['かわ', 'せん'],
    readingType: 'kunyomi',
    componentIds: ['rad-river'],
    amalgamationIds: ['voc-kawa'],
    mnemonic: 'Three flowing streams make a River.',
    readingMnemonic: 'A car wash (かわ) right next to the river.',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: 'この川の水はとてもきれいです。', furigana: 'このかわのみずはとてもきれいです。', en: 'The water in this river is very clean.' },
    ],
  },
  {
    id: 'kan-chikara',
    level: 1,
    kind: 'kanji',
    characters: '力',
    meanings: ['Power', 'Strength'],
    readings: ['りょく', 'りき', 'ちから'],
    readingType: 'onyomi',
    componentIds: ['rad-power'],
    amalgamationIds: ['voc-chikara'],
    mnemonic: 'A flexed muscle represents Power and Strength.',
    readingMnemonic: 'You rock (りょく) boulders with sheer power.',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '力を合わせて頑張ろう。', furigana: 'ちからをあわせてがんばろう。', en: 'Let us combine our strength and do our best.' },
    ],
  },

  // ==========================================================================
  // LEVEL 1: VOCABULARY (Unlocked when component Kanji reach Guru I)
  // ==========================================================================
  {
    id: 'voc-hitotsu',
    level: 1,
    kind: 'vocab',
    characters: '一つ',
    meanings: ['One Thing', 'One'],
    readings: ['ひとつ'],
    readingType: 'vocab',
    componentIds: ['kan-ichi'],
    amalgamationIds: [],
    mnemonic: 'The kanji One followed by つ is the native Japanese counter for One Thing (ひとつ).',
    pitchAccent: '尾高 [2] ひとつ',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: 'りんごを一つください。', furigana: 'りんごをひとつください。', en: 'Please give me one apple.' },
    ],
  },
  {
    id: 'voc-hito',
    level: 1,
    kind: 'vocab',
    characters: '人',
    meanings: ['Person', 'People'],
    readings: ['ひと'],
    readingType: 'vocab',
    componentIds: ['kan-hito'],
    amalgamationIds: [],
    mnemonic: 'Standing alone as a word, 人 uses its kunyomi reading ひと (person).',
    pitchAccent: '平板 [0] ひと',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: 'あの人は優しいです。', furigana: 'あのひとはやさしいです。', en: 'That person is kind.' },
    ],
  },
  {
    id: 'voc-hitori',
    level: 1,
    kind: 'vocab',
    characters: '一人',
    meanings: ['One Person', 'Alone'],
    readings: ['ひとり'],
    readingType: 'vocab',
    componentIds: ['kan-ichi', 'kan-hito'],
    amalgamationIds: [],
    mnemonic: 'One (ひと) + Person takes the special counter reading り -> ひとり (One Person / Alone).',
    pitchAccent: '中高 [2] ひとり',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '一人で図書館へ行きました。', furigana: 'ひとりでとしょかんへいきました。', en: 'I went to the library alone.' },
    ],
  },
  {
    id: 'voc-ue',
    level: 1,
    kind: 'vocab',
    characters: '上',
    meanings: ['Above', 'Up', 'Top'],
    readings: ['うえ'],
    readingType: 'vocab',
    componentIds: ['kan-ue'],
    amalgamationIds: [],
    mnemonic: 'As a standalone noun, 上 is read うえ (above / on top).',
    pitchAccent: '平板 [0] うえ',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '棚の上に猫がいます。', furigana: 'たなのうえにねこがいます。', en: 'There is a cat on top of the shelf.' },
    ],
  },
  {
    id: 'voc-shita',
    level: 1,
    kind: 'vocab',
    characters: '下',
    meanings: ['Below', 'Under', 'Down'],
    readings: ['した'],
    readingType: 'vocab',
    componentIds: ['kan-shita'],
    amalgamationIds: [],
    mnemonic: 'Standalone 下 uses its kunyomi reading した (below / underneath).',
    pitchAccent: '平板 [0] した',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '木の下で休みましょう。', furigana: 'きのしたでやすみましょう。', en: 'Let us rest under the tree.' },
    ],
  },
  {
    id: 'voc-kuchi',
    level: 1,
    kind: 'vocab',
    characters: '口',
    meanings: ['Mouth'],
    readings: ['くち'],
    readingType: 'vocab',
    componentIds: ['kan-kuchi'],
    amalgamationIds: [],
    mnemonic: 'Standalone 口 uses its native kunyomi reading くち (mouth).',
    pitchAccent: '平板 [0] くち',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '口に合う料理です。', furigana: 'くちにあうりょうりです。', en: 'It is a dish that suits my taste.' },
    ],
  },
  {
    id: 'voc-yama',
    level: 1,
    kind: 'vocab',
    characters: '山',
    meanings: ['Mountain'],
    readings: ['やま'],
    readingType: 'vocab',
    componentIds: ['kan-yama'],
    amalgamationIds: [],
    mnemonic: 'Standalone 山 uses its kunyomi reading やま (mountain).',
    pitchAccent: '尾高 [2] やま',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '遠くに高い山が見えます。', furigana: 'とおくにたかいやまがみえます。', en: 'A tall mountain is visible in the distance.' },
    ],
  },
  {
    id: 'voc-kawa',
    level: 1,
    kind: 'vocab',
    characters: '川',
    meanings: ['River'],
    readings: ['かわ'],
    readingType: 'vocab',
    componentIds: ['kan-kawa'],
    amalgamationIds: [],
    mnemonic: 'Standalone 川 is read かわ (river).',
    pitchAccent: '尾高 [2] かわ',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '川の近くを散歩しました。', furigana: 'かわのちかくをさんぽしました。', en: 'I took a walk near the river.' },
    ],
  },
  {
    id: 'voc-chikara',
    level: 1,
    kind: 'vocab',
    characters: '力',
    meanings: ['Power', 'Strength', 'Ability'],
    readings: ['ちから'],
    readingType: 'vocab',
    componentIds: ['kan-chikara'],
    amalgamationIds: [],
    mnemonic: 'Standalone 力 is read ちから (power / strength).',
    pitchAccent: '尾高 [3] ちから',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '日本語の力がついてきた。', furigana: 'にほんごのちからがついてきた。', en: 'My Japanese ability has been improving.' },
    ],
  },

  // ==========================================================================
  // LEVEL 2: KANJI & VOCAB (Progressive Unlock when Level 1 Kanji reach Guru I)
  // ==========================================================================
  {
    id: 'kan-hon',
    level: 2,
    kind: 'kanji',
    characters: '本',
    meanings: ['Book', 'Origin', 'Real'],
    readings: ['ほん', 'もと'],
    readingType: 'onyomi',
    componentIds: ['rad-tree', 'rad-ground'],
    amalgamationIds: ['voc-hon', 'voc-nihonjin'],
    mnemonic: 'Mark the roots at the bottom of a Tree (木) with a Ground line (一) to show the Origin and the paper used to make a Book.',
    readingMnemonic: 'Home (ほん) is where your favorite books live.',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '毎日日本語の本を読みます。', furigana: 'まいにちにほんごのほんをよみます。', en: 'I read Japanese books every day.' },
    ],
  },
  {
    id: 'kan-yasumu',
    level: 2,
    kind: 'kanji',
    characters: '休',
    meanings: ['Rest', 'Holiday'],
    readings: ['きゅう', 'やす'],
    readingType: 'onyomi',
    componentIds: ['rad-person', 'rad-tree'],
    amalgamationIds: ['voc-yasumu'],
    mnemonic: 'A Person (亻) leaning against a Tree (木) is taking a Rest.',
    readingMnemonic: 'Look at that cute (きゅう) deer resting under the tree.',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '明日は学校が休みです。', furigana: 'あしたはがっこうがやすみです。', en: 'School is closed for a holiday tomorrow.' },
    ],
  },
  {
    id: 'voc-hon',
    level: 2,
    kind: 'vocab',
    characters: '本',
    meanings: ['Book'],
    readings: ['ほん'],
    readingType: 'vocab',
    componentIds: ['kan-hon'],
    amalgamationIds: [],
    mnemonic: 'Standalone 本 means Book and uses the onyomi reading ほん.',
    pitchAccent: '頭高 [1] ほん',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: 'この本はとても面白いです。', furigana: 'このほんはとてもおもしろいです。', en: 'This book is very interesting.' },
    ],
  },
  {
    id: 'voc-nihonjin',
    level: 2,
    kind: 'vocab',
    characters: '日本人',
    meanings: ['Japanese Person', 'Japanese People'],
    readings: ['にほんじん'],
    readingType: 'vocab',
    componentIds: ['kan-hi', 'kan-hon', 'kan-hito'],
    amalgamationIds: [],
    mnemonic: 'Sun (日) + Origin (本) = Japan (日本), plus Person (人) = Japanese Person (にほんじん).',
    pitchAccent: '中高 [4] にほんじん',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '日本人の友達と会話しました。', furigana: 'にほんじんのともだちとかいわしました。', en: 'I had a conversation with my Japanese friend.' },
    ],
  },
  {
    id: 'voc-yasumu',
    level: 2,
    kind: 'vocab',
    characters: '休む',
    meanings: ['To Rest', 'To Take A Day Off'],
    readings: ['やすむ'],
    readingType: 'vocab',
    componentIds: ['kan-yasumu'],
    amalgamationIds: [],
    mnemonic: 'Ends with む, making it the verb To Rest (やすむ).',
    pitchAccent: '中高 [2] やすむ',
    jlptLevel: 'N5',
    contextSentences: [
      { ja: '少し休んでから続けましょう。', furigana: 'すこしやすんでからつづけましょう。', en: 'Let us rest a little before continuing.' },
    ],
  },

  // ==========================================================================
  // GRAMMAR REFERENCE & CLOZE DRILLS (JLPT N5 - N3)
  // ==========================================================================
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
    mnemonic: 'Combines the て-form of an action with いる (to exist) to express that an action is currently in progress or exists as an ongoing state.',
    contextSentences: [
      { ja: '今、日本語を勉強しています。', furigana: 'いま、にほんごをべんきょうしています。', en: 'I am studying Japanese right now.' },
      { ja: '窓が開いています。', furigana: 'まどがあいています。', en: 'The window is open.' },
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
    mnemonic: 'Literally: "If I do not do [X], it will not do." Expresses obligation or necessity.',
    contextSentences: [
      { ja: '毎日復習しなければなりません。', furigana: 'まいにちふくしゅうしなければなりません。', en: 'I must review every day.' },
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
    mnemonic: 'Directs your deliberate action (する) toward a target manner or habit (ように).',
    contextSentences: [
      { ja: '毎日少しでも暗記するようにしています。', furigana: 'まいにちすこしでもあんきするようにしています。', en: 'I make a habit of memorizing even a little every day.' },
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
    level: 2,
    kind: 'grammar',
    characters: '〜ために',
    meanings: ['In Order To', 'For The Sake Of'],
    readings: ['ために'],
    readingType: 'cloze',
    componentIds: [],
    amalgamationIds: [],
    jlptLevel: 'N4',
    grammarStructure: 'Verb (Dictionary form) / Noun + の + ために',
    mnemonic: 'Marks a clear purpose or goal (ため) toward which your action is aimed (に).',
    contextSentences: [
      { ja: '日本の小説を読むために漢字を学びます。', furigana: 'にほんのしょうせつをよむためにかんじをまなびます。', en: 'I study kanji in order to read Japanese novels.' },
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
];

export const INITIAL_JP_READING_PASSAGES: JPReadingPassage[] = [
  {
    id: 'read-morning-study',
    level: 1,
    jlptLevel: 'N5',
    titleJa: '朝の静かな勉強',
    titleEn: 'Quiet Morning Study',
    summary: 'A short reflection on building a calm daily study habit by the river and mountains.',
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
          { surface: '起きます', reading: 'おきます', baseForm: '起きる', meaning: 'to wake up', jlpt: 'N5' },
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
          { surface: '日本語', reading: 'にほんご', meaning: 'Japanese language', jlpt: 'N5' },
          { surface: 'の' },
          { surface: '本', reading: 'ほん', meaning: 'book', jlpt: 'N5' },
          { surface: 'が' },
          { surface: 'あります', reading: 'あります', baseForm: 'ある', meaning: 'to exist (inanimate)', jlpt: 'N5' },
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
          { surface: '静かな', reading: 'しずかな', meaning: 'quiet / peaceful', jlpt: 'N5' },
          { surface: '川', reading: 'かわ', meaning: 'river', jlpt: 'N5' },
          { surface: 'が' },
          { surface: '見えます', reading: 'みえます', baseForm: '見える', meaning: 'to be visible', jlpt: 'N4' },
          { surface: '。' },
        ],
      },
      {
        id: 's4',
        ja: '少しずつ続けることが本当の力になります。',
        en: 'Continuing little by little becomes true strength.',
        tokens: [
          { surface: '少しずつ', reading: 'すこしずつ', meaning: 'little by little', jlpt: 'N4' },
          { surface: '続ける', reading: 'つづける', meaning: 'to continue / keep up', jlpt: 'N4' },
          { surface: 'こと' },
          { surface: 'が' },
          { surface: '本当', reading: 'ほんとう', meaning: 'truth / real', jlpt: 'N5' },
          { surface: 'の' },
          { surface: '力', reading: 'ちから', meaning: 'power / strength / ability', jlpt: 'N5' },
          { surface: 'に' },
          { surface: 'なります', reading: 'なります', baseForm: 'なる', meaning: 'to become', jlpt: 'N5' },
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
    summary: 'How spaced repetition turns fragile short-term impressions into lasting recall.',
    sentences: [
      {
        id: 'm1',
        ja: '新しい言葉を覚えるとき、一度だけではすぐに忘れてしまいます。',
        en: 'When memorizing new words, if you only do it once, you quickly forget them.',
        tokens: [
          { surface: '新しい', reading: 'あたらしい', meaning: 'new', jlpt: 'N5' },
          { surface: '言葉', reading: 'ことば', meaning: 'word / language', jlpt: 'N5' },
          { surface: 'を' },
          { surface: '覚える', reading: 'おぼえる', meaning: 'to memorize / remember', jlpt: 'N5' },
          { surface: 'とき、' },
          { surface: '一度', reading: 'いちど', meaning: 'once / one time', jlpt: 'N4' },
          { surface: 'だけでは' },
          { surface: 'すぐに', reading: 'すぐに', meaning: 'immediately / soon', jlpt: 'N5' },
          { surface: '忘れて', reading: 'わすれて', baseForm: '忘れる', meaning: 'to forget', jlpt: 'N5' },
          { surface: 'しまいます', reading: 'しまいます', baseForm: 'しまう', meaning: 'to end up doing regrettably', jlpt: 'N4' },
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
          { surface: '直前', reading: 'ちょくぜん', meaning: 'just before / right before', jlpt: 'N3' },
          { surface: 'に' },
          { surface: '思い出す', reading: 'おもいだす', meaning: 'to recall / call to mind', jlpt: 'N4' },
          { surface: '練習', reading: 'れんしゅう', meaning: 'practice / training', jlpt: 'N5' },
          { surface: 'をすると、' },
          { surface: '記憶', reading: 'きおく', meaning: 'memory / retention', jlpt: 'N3' },
          { surface: 'は' },
          { surface: '深く', reading: 'ふかく', baseForm: '深い', meaning: 'deep', jlpt: 'N4' },
          { surface: 'なります。' },
        ],
      },
    ],
  },
];

/**
 * Generates initial user assignments so that:
 * - Level 1 Radicals & some Kanji/Grammar are active in Apprentice/Guru with realistic due times
 * - Remaining Level 1 items are ready in the Lesson Queue
 * - Level 2 items are locked or ready to unlock when Level 1 items hit Guru I
 */
export function buildInitialJPAssignments(now: Date = new Date()): Record<string, UserJPAssignment> {
  const pastOneHour = new Date(now.getTime() - 3600 * 1000).toISOString();
  const inTwoHours = new Date(now.getTime() + 2 * 3600 * 1000).toISOString();
  const inFourHours = new Date(now.getTime() + 4 * 3600 * 1000).toISOString();
  const inEightHours = new Date(now.getTime() + 8 * 3600 * 1000).toISOString();
  const inTwelveHours = new Date(now.getTime() + 12 * 3600 * 1000).toISOString();

  const map: Record<string, UserJPAssignment> = {};

  // Radicals: 5 already Guru I (so dependent Kanji are unlocked!), 3 due now in Apprentice
  const guruRadicals = ['rad-ground', 'rad-person', 'rad-mouth', 'rad-sun', 'rad-mountain'];
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

  // 3 Radicals due right now for review!
  const dueRadicals = ['rad-tree', 'rad-river', 'rad-power'];
  for (const id of dueRadicals) {
    map[id] = {
      subjectId: id,
      srsStage: 3, // Apprentice III
      unlockedAt: pastOneHour,
      startedAt: pastOneHour,
      nextReviewAt: pastOneHour, // Due now!
      passedGuru: false,
      burnedAt: null,
      correctStreak: 3,
      incorrectCount: 0,
    };
  }

  // Kanji unlocked by the Guru radicals: 4 in Apprentice (3 due now, 1 in 2h), 3 in Lesson queue
  const dueKanji = ['kan-ichi', 'kan-hito', 'kan-ue'];
  for (const id of dueKanji) {
    map[id] = {
      subjectId: id,
      srsStage: 2, // Apprentice II
      unlockedAt: pastOneHour,
      startedAt: pastOneHour,
      nextReviewAt: pastOneHour, // Due now!
      passedGuru: false,
      burnedAt: null,
      correctStreak: 2,
      incorrectCount: 0,
    };
  }

  map['kan-shita'] = {
    subjectId: 'kan-shita',
    srsStage: 4, // Apprentice IV (one step from Guru I!)
    unlockedAt: pastOneHour,
    startedAt: pastOneHour,
    nextReviewAt: inTwoHours,
    passedGuru: false,
    burnedAt: null,
    correctStreak: 4,
    incorrectCount: 0,
  };

  // Unlocked Kanji waiting in Lesson Queue (srsStage = 0)
  for (const id of ['kan-kuchi', 'kan-hi', 'kan-yama']) {
    map[id] = {
      subjectId: id,
      srsStage: 0, // Available Lesson!
      unlockedAt: pastOneHour,
      startedAt: null,
      nextReviewAt: null,
      passedGuru: false,
      burnedAt: null,
      correctStreak: 0,
      incorrectCount: 0,
    };
  }

  // Vocab items: 2 due now, 2 upcoming, 2 in Lesson queue
  map['voc-hitotsu'] = {
    subjectId: 'voc-hitotsu',
    srsStage: 1,
    unlockedAt: pastOneHour,
    startedAt: pastOneHour,
    nextReviewAt: pastOneHour, // Due now!
    passedGuru: false,
    burnedAt: null,
    correctStreak: 1,
    incorrectCount: 0,
  };

  map['voc-hito'] = {
    subjectId: 'voc-hito',
    srsStage: 2,
    unlockedAt: pastOneHour,
    startedAt: pastOneHour,
    nextReviewAt: inFourHours,
    passedGuru: false,
    burnedAt: null,
    correctStreak: 2,
    incorrectCount: 0,
  };

  map['voc-ue'] = {
    subjectId: 'voc-ue',
    srsStage: 0, // Available Lesson!
    unlockedAt: pastOneHour,
    startedAt: null,
    nextReviewAt: null,
    passedGuru: false,
    burnedAt: null,
    correctStreak: 0,
    incorrectCount: 0,
  };

  // Grammar items: 1 due now, 1 upcoming in 8h, 2 in Lesson queue
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

  map['gram-you-ni-suru'] = {
    subjectId: 'gram-you-ni-suru',
    srsStage: 0, // Available Lesson!
    unlockedAt: pastOneHour,
    startedAt: null,
    nextReviewAt: null,
    passedGuru: false,
    burnedAt: null,
    correctStreak: 0,
    incorrectCount: 0,
  };

  return map;
}

