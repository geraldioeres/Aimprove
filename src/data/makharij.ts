/**
 * Makharij al-huruf: where each Arabic letter is made.
 *
 * Follows the 17 makharij in 5 zones as set out by Ibn al-Jazari
 * (al-Muqaddimah). All English wording here is our own, written for young
 * learners. Diagram positions live in `src/components/MakhrajDiagram.tsx`,
 * keyed by makhraj id.
 */

export type ZoneId = 'jawf' | 'halq' | 'lisan' | 'shafatain' | 'khayshum';

export interface MakhrajZone {
  id: ZoneId;
  nameAr: string;
  translit: string;
  nameEn: string;
  blurb: string;
}

export interface Makhraj {
  /** 1–17, in the traditional order from the chest outwards. */
  id: number;
  zone: ZoneId;
  nameAr: string;
  nameEn: string;
}

export type SifahId =
  | 'hams'
  | 'jahr'
  | 'shiddah'
  | 'tawassut'
  | 'rakhawah'
  | 'istila'
  | 'istifal'
  | 'itbaq'
  | 'infitah'
  | 'idhlaq'
  | 'ismat'
  | 'safir'
  | 'qalqalah'
  | 'inhiraf'
  | 'takrir'
  | 'tafashshi'
  | 'istitalah'
  | 'ghunnah';

export interface Sifah {
  id: SifahId;
  nameAr: string;
  name: string;
  meaning: string;
}

/**
 * Reserved for a later recording of the letter. Only add files we have a
 * licence for, and keep the credit with the file.
 */
export interface LetterAudio {
  /** `require('../../assets/audio/ba.mp3')` or a remote URL. */
  source: number | string;
  credit: string;
  license: string;
}

export type LetterKind = 'consonant' | 'madd' | 'ghunnah';

export interface MakhrajLetter {
  id: string;
  glyph: string;
  nameAr: string;
  name: string;
  translit: string;
  kind: LetterKind;
  makhraj: number;
  /** Plain-language "how to say it". */
  tip: string;
  /** A short drill to find the point, e.g. the letter with sukun after hamza. */
  practice: string;
  sifat: SifahId[];
  note?: string;
  audio?: LetterAudio;
}

export const ZONES: MakhrajZone[] = [
  {
    id: 'jawf',
    nameAr: 'الجوف',
    translit: 'Al-Jawf',
    nameEn: 'The open space',
    blurb: 'The hollow of the mouth and throat. The long vowels come from here and nothing touches.',
  },
  {
    id: 'halq',
    nameAr: 'الحلق',
    translit: 'Al-Ḥalq',
    nameEn: 'The throat',
    blurb: 'Three points, from deep in the throat up to where it meets the mouth.',
  },
  {
    id: 'lisan',
    nameAr: 'اللسان',
    translit: 'Al-Lisān',
    nameEn: 'The tongue',
    blurb: 'Ten points along the tongue, from its back to its tip.',
  },
  {
    id: 'shafatain',
    nameAr: 'الشفتان',
    translit: 'Ash-Shafatān',
    nameEn: 'The lips',
    blurb: 'Two points made with the lips.',
  },
  {
    id: 'khayshum',
    nameAr: 'الخيشوم',
    translit: 'Al-Khayshūm',
    nameEn: 'The nose',
    blurb: 'The space behind the nose, where the hum of ghunnah rings.',
  },
];

export const MAKHARIJ: Makhraj[] = [
  { id: 1, zone: 'jawf', nameAr: 'الجوف', nameEn: 'The empty space of the mouth and throat' },
  { id: 2, zone: 'halq', nameAr: 'أقصى الحلق', nameEn: 'The deepest part of the throat, nearest the chest' },
  { id: 3, zone: 'halq', nameAr: 'وسط الحلق', nameEn: 'The middle of the throat' },
  { id: 4, zone: 'halq', nameAr: 'أدنى الحلق', nameEn: 'The top of the throat, nearest the mouth' },
  {
    id: 5,
    zone: 'lisan',
    nameAr: 'أقصى اللسان مع ما فوقه من الحنك الأعلى',
    nameEn: 'The very back of the tongue against the soft palate above it',
  },
  {
    id: 6,
    zone: 'lisan',
    nameAr: 'أقصى اللسان أسفل مخرج القاف قليلًا',
    nameEn: 'The back of the tongue, a little forward of qāf',
  },
  {
    id: 7,
    zone: 'lisan',
    nameAr: 'وسط اللسان مع ما يحاذيه من الحنك الأعلى',
    nameEn: 'The middle of the tongue against the hard palate',
  },
  {
    id: 8,
    zone: 'lisan',
    nameAr: 'إحدى حافتي اللسان أو كلتاهما مع ما يحاذيهما من الأضراس العليا',
    nameEn: 'One or both sides of the tongue against the upper back teeth',
  },
  {
    id: 9,
    zone: 'lisan',
    nameAr: 'أدنى حافتي اللسان إلى منتهى طرفه مع لثة الأسنان العليا',
    nameEn: 'The front edges of the tongue, up to the tip, against the upper gums',
  },
  {
    id: 10,
    zone: 'lisan',
    nameAr: 'طرف اللسان تحت مخرج اللام قليلًا',
    nameEn: 'The tip of the tongue, just in front of lām’s point',
  },
  {
    id: 11,
    zone: 'lisan',
    nameAr: 'طرف اللسان مع ظهره قريبًا من مخرج النون',
    nameEn: 'The tip and a little of the top of the tongue, close to nūn’s point',
  },
  {
    id: 12,
    zone: 'lisan',
    nameAr: 'طرف اللسان مع أصول الثنايا العليا',
    nameEn: 'The tip of the tongue against the roots of the upper front teeth',
  },
  {
    id: 13,
    zone: 'lisan',
    nameAr: 'طرف اللسان مع أطراف الثنايا العليا',
    nameEn: 'The tip of the tongue against the edges of the upper front teeth',
  },
  {
    id: 14,
    zone: 'lisan',
    nameAr: 'طرف اللسان مع ما فوق الثنايا السفلى',
    nameEn: 'The tip of the tongue just above the lower front teeth',
  },
  {
    id: 15,
    zone: 'shafatain',
    nameAr: 'بطن الشفة السفلى مع أطراف الثنايا العليا',
    nameEn: 'The inside of the lower lip against the edges of the upper front teeth',
  },
  { id: 16, zone: 'shafatain', nameAr: 'الشفتان', nameEn: 'Both lips together' },
  { id: 17, zone: 'khayshum', nameAr: 'الخيشوم', nameEn: 'The nasal cavity' },
];

export const SIFAT: Record<SifahId, Sifah> = {
  hams: { id: 'hams', nameAr: 'الهمس', name: 'Hams', meaning: 'Breathy: air keeps flowing' },
  jahr: { id: 'jahr', nameAr: 'الجهر', name: 'Jahr', meaning: 'Voiced: the breath is held back' },
  shiddah: { id: 'shiddah', nameAr: 'الشدة', name: 'Shiddah', meaning: 'Strong: the sound stops short' },
  tawassut: { id: 'tawassut', nameAr: 'التوسط', name: 'Tawassuṭ', meaning: 'In between: the sound half flows' },
  rakhawah: { id: 'rakhawah', nameAr: 'الرخاوة', name: 'Rakhāwah', meaning: 'Soft: the sound keeps flowing' },
  istila: { id: 'istila', nameAr: 'الاستعلاء', name: 'Istiʿlāʾ', meaning: 'Heavy: the back of the tongue rises' },
  istifal: { id: 'istifal', nameAr: 'الاستفال', name: 'Istifāl', meaning: 'Light: the tongue stays low' },
  itbaq: { id: 'itbaq', nameAr: 'الإطباق', name: 'Iṭbāq', meaning: 'Covered: the tongue presses up to the roof' },
  infitah: { id: 'infitah', nameAr: 'الانفتاح', name: 'Infitāḥ', meaning: 'Open: a gap stays under the roof' },
  idhlaq: { id: 'idhlaq', nameAr: 'الإذلاق', name: 'Idhlāq', meaning: 'Quick: made easily at the lips or tongue tip' },
  ismat: { id: 'ismat', nameAr: 'الإصمات', name: 'Iṣmāt', meaning: 'Held: made with more effort' },
  safir: { id: 'safir', nameAr: 'الصفير', name: 'Ṣafīr', meaning: 'Whistle: a sharp hiss of air' },
  qalqalah: { id: 'qalqalah', nameAr: 'القلقلة', name: 'Qalqalah', meaning: 'Echo: a small bounce when it has sukun' },
  inhiraf: { id: 'inhiraf', nameAr: 'الانحراف', name: 'Inḥirāf', meaning: 'Leaning: the sound slides toward another point' },
  takrir: { id: 'takrir', nameAr: 'التكرير', name: 'Takrīr', meaning: 'Repeat: the tongue wants to roll, so keep it to one tap' },
  tafashshi: { id: 'tafashshi', nameAr: 'التفشي', name: 'Tafashshī', meaning: 'Spreading: the air fans out in the mouth' },
  istitalah: { id: 'istitalah', nameAr: 'الاستطالة', name: 'Istiṭālah', meaning: 'Stretching: the sound runs along the tongue’s side' },
  ghunnah: { id: 'ghunnah', nameAr: 'الغنة', name: 'Ghunnah', meaning: 'Hum: a sound that rings in the nose' },
};

// The traditional memory phrases for each group of letters.
const HAMS = 'فحثهشخصسكت';
const SHIDDAH = 'ءجدقطبكت';
const TAWASSUT = 'لنعمر';
const ISTILA = 'خصضغطقظ';
const ITBAQ = 'صضطظ';
const IDHLAQ = 'فرمنلب';
const EXTRAS: [SifahId, string][] = [
  ['safir', 'صزس'],
  ['qalqalah', 'قطبجد'],
  ['inhiraf', 'لر'],
  ['takrir', 'ر'],
  ['tafashshi', 'ش'],
  ['istitalah', 'ض'],
  ['ghunnah', 'نم'],
];

function consonantSifat(glyph: string): SifahId[] {
  const out: SifahId[] = [
    HAMS.includes(glyph) ? 'hams' : 'jahr',
    SHIDDAH.includes(glyph) ? 'shiddah' : TAWASSUT.includes(glyph) ? 'tawassut' : 'rakhawah',
    ISTILA.includes(glyph) ? 'istila' : 'istifal',
    ITBAQ.includes(glyph) ? 'itbaq' : 'infitah',
    IDHLAQ.includes(glyph) ? 'idhlaq' : 'ismat',
  ];
  for (const [id, letters] of EXTRAS) if (letters.includes(glyph)) out.push(id);
  return out;
}

const MADD_SIFAT: SifahId[] = ['jahr', 'rakhawah', 'istifal', 'infitah', 'ismat'];

type LetterInput = Omit<MakhrajLetter, 'sifat' | 'kind' | 'practice'> &
  Partial<Pick<MakhrajLetter, 'kind' | 'practice' | 'sifat'>>;

function letter(input: LetterInput): MakhrajLetter {
  const kind = input.kind ?? 'consonant';
  return {
    ...input,
    kind,
    practice: input.practice ?? `أَ${input.glyph}ْ`,
    sifat: input.sifat ?? (kind === 'madd' ? MADD_SIFAT : kind === 'ghunnah' ? [] : consonantSifat(input.glyph)),
  };
}

export const MAKHRAJ_LETTERS: MakhrajLetter[] = [
  // 1 · Al-Jawf
  letter({
    id: 'alif-madd',
    glyph: 'ا',
    nameAr: 'ألف مد',
    name: 'Alif (long ā)',
    translit: 'ā',
    kind: 'madd',
    makhraj: 1,
    practice: 'بَا',
    tip: 'A long “aa” after a fatḥah. Nothing touches: open your mouth and let the sound ride on your breath until the count ends.',
    note: 'Alif sounds heavy or light depending on the letter before it.',
  }),
  letter({
    id: 'waw-madd',
    glyph: 'و',
    nameAr: 'واو مد',
    name: 'Wāw (long ū)',
    translit: 'ū',
    kind: 'madd',
    makhraj: 1,
    practice: 'بُو',
    tip: 'A long “oo” after a ḍammah, when the wāw has sukun. Round your lips, but nothing touches inside the mouth.',
  }),
  letter({
    id: 'ya-madd',
    glyph: 'ي',
    nameAr: 'ياء مد',
    name: 'Yāʾ (long ī)',
    translit: 'ī',
    kind: 'madd',
    makhraj: 1,
    practice: 'بِي',
    tip: 'A long “ee” after a kasrah, when the yāʾ has sukun. The sound flows out of the open mouth with nothing touching.',
  }),

  // 2–4 · Al-Halq
  letter({
    id: 'hamzah',
    glyph: 'ء',
    nameAr: 'همزة',
    name: 'Hamzah',
    translit: 'ʾ',
    makhraj: 2,
    practice: 'أَأْ',
    tip: 'From the very bottom of the throat. Shut the throat for a moment, then let go with a little catch, like the break in “uh-oh”.',
  }),
  letter({
    id: 'ha',
    glyph: 'ه',
    nameAr: 'هاء',
    name: 'Hāʾ',
    translit: 'h',
    makhraj: 2,
    tip: 'Same deep spot as hamzah, but stay open and breathe out gently, like fogging up a window.',
  }),
  letter({
    id: 'ayn',
    glyph: 'ع',
    nameAr: 'عين',
    name: 'ʿAyn',
    translit: 'ʿ',
    makhraj: 3,
    tip: 'From the middle of the throat. Squeeze it a little while your voice keeps going. It should feel snug, never choked.',
  }),
  letter({
    id: 'hha',
    glyph: 'ح',
    nameAr: 'حاء',
    name: 'Ḥāʾ',
    translit: 'ḥ',
    makhraj: 3,
    tip: 'Same middle spot as ʿayn, with no voice: push out a sharp, smooth breath, like after a mouthful of something spicy.',
  }),
  letter({
    id: 'ghayn',
    glyph: 'غ',
    nameAr: 'غين',
    name: 'Ghayn',
    translit: 'gh',
    makhraj: 4,
    tip: 'From the top of the throat, near the mouth. Make a soft gargle with your voice on.',
  }),
  letter({
    id: 'kha',
    glyph: 'خ',
    nameAr: 'خاء',
    name: 'Khāʾ',
    translit: 'kh',
    makhraj: 4,
    tip: 'Same spot as ghayn, with no voice: a scratchy breath, like the “ch” in Scottish “loch”.',
  }),

  // 5–14 · Al-Lisan
  letter({
    id: 'qaf',
    glyph: 'ق',
    nameAr: 'قاف',
    name: 'Qāf',
    translit: 'q',
    makhraj: 5,
    tip: 'The very back of the tongue presses the soft part at the back of the roof. Deeper and fuller than an English “k”.',
  }),
  letter({
    id: 'kaf',
    glyph: 'ك',
    nameAr: 'كاف',
    name: 'Kāf',
    translit: 'k',
    makhraj: 6,
    tip: 'A little further forward than qāf. The back of the tongue taps the roof, then lets a light puff of air out, like “k” in “kite”.',
  }),
  letter({
    id: 'jim',
    glyph: 'ج',
    nameAr: 'جيم',
    name: 'Jīm',
    translit: 'j',
    makhraj: 7,
    tip: 'The middle of the tongue presses the hard roof of the mouth. Say it firmly, like “j” in “jam”, without sliding into “zh”.',
  }),
  letter({
    id: 'shin',
    glyph: 'ش',
    nameAr: 'شين',
    name: 'Shīn',
    translit: 'sh',
    makhraj: 7,
    tip: 'The middle of the tongue rises close to the roof, and the air spreads out across the mouth, like “sh” in “ship”.',
  }),
  letter({
    id: 'ya',
    glyph: 'ي',
    nameAr: 'ياء',
    name: 'Yāʾ',
    translit: 'y',
    makhraj: 7,
    tip: 'The middle of the tongue lifts toward the roof, like “y” in “yes”.',
    note: 'With sukun after a fatḥah (as in بَيْت) it softens into a līn sound from the same place.',
  }),
  letter({
    id: 'dad',
    glyph: 'ض',
    nameAr: 'ضاد',
    name: 'Ḍād',
    translit: 'ḍ',
    makhraj: 8,
    tip: 'One side of the tongue (or both) presses along the upper back teeth while the tongue stays raised. The sound stretches along the side and comes out heavy.',
    note: 'The left side is the more common way, the right side is harder, and both together is hardest.',
  }),
  letter({
    id: 'lam',
    glyph: 'ل',
    nameAr: 'لام',
    name: 'Lām',
    translit: 'l',
    makhraj: 9,
    tip: 'The front edges of the tongue, right up to the tip, touch the gum ridge behind the upper teeth. The air slips round the sides, like “l” in “lamp”.',
  }),
  letter({
    id: 'nun',
    glyph: 'ن',
    nameAr: 'نون',
    name: 'Nūn',
    translit: 'n',
    makhraj: 10,
    tip: 'The tip of the tongue touches the gum just behind the upper front teeth, and the sound hums through the nose.',
  }),
  letter({
    id: 'ra',
    glyph: 'ر',
    nameAr: 'راء',
    name: 'Rāʾ',
    translit: 'r',
    makhraj: 11,
    tip: 'The tip of the tongue, using a bit of its top, taps the gum ridge just behind nūn’s spot. One tap only, no long roll.',
  }),
  letter({
    id: 'ta',
    glyph: 'ت',
    nameAr: 'تاء',
    name: 'Tāʾ',
    translit: 't',
    makhraj: 12,
    tip: 'The tip of the tongue presses where the upper front teeth meet the gum, then lets go with a light puff of air.',
  }),
  letter({
    id: 'dal',
    glyph: 'د',
    nameAr: 'دال',
    name: 'Dāl',
    translit: 'd',
    makhraj: 12,
    tip: 'Same spot as tāʾ, with your voice on and no puff of air, like “d” in “door”.',
  }),
  letter({
    id: 'tta',
    glyph: 'ط',
    nameAr: 'طاء',
    name: 'Ṭāʾ',
    translit: 'ṭ',
    makhraj: 12,
    tip: 'Same spot as tāʾ, but lift the whole tongue up to the roof so it comes out full and heavy.',
  }),
  letter({
    id: 'tha',
    glyph: 'ث',
    nameAr: 'ثاء',
    name: 'Thāʾ',
    translit: 'th',
    makhraj: 13,
    tip: 'The tongue tip touches the bottom edges of the upper front teeth and air slips out, like “th” in “think”.',
  }),
  letter({
    id: 'dhal',
    glyph: 'ذ',
    nameAr: 'ذال',
    name: 'Dhāl',
    translit: 'dh',
    makhraj: 13,
    tip: 'Same as thāʾ with your voice on, like “th” in “this”.',
  }),
  letter({
    id: 'zza',
    glyph: 'ظ',
    nameAr: 'ظاء',
    name: 'Ẓāʾ',
    translit: 'ẓ',
    makhraj: 13,
    tip: 'Same spot as dhāl, but raise the tongue to the roof so the sound is thick and heavy.',
  }),
  letter({
    id: 'sad',
    glyph: 'ص',
    nameAr: 'صاد',
    name: 'Ṣād',
    translit: 'ṣ',
    makhraj: 14,
    tip: 'The tongue tip sits just above the lower front teeth with a thin gap, and the tongue is raised. A deep, heavy whistle.',
  }),
  letter({
    id: 'zay',
    glyph: 'ز',
    nameAr: 'زاي',
    name: 'Zāy',
    translit: 'z',
    makhraj: 14,
    tip: 'Same spot as sīn with your voice on: a buzzing “z”, like a bee.',
  }),
  letter({
    id: 'sin',
    glyph: 'س',
    nameAr: 'سين',
    name: 'Sīn',
    translit: 's',
    makhraj: 14,
    tip: 'The tongue tip sits just above the lower front teeth and air whistles through the gap, like “s” in “sun”. Keep it light.',
  }),

  // 15–16 · Ash-Shafatain
  letter({
    id: 'fa',
    glyph: 'ف',
    nameAr: 'فاء',
    name: 'Fāʾ',
    translit: 'f',
    makhraj: 15,
    tip: 'Rest the edges of your upper front teeth on the inside of your lower lip and blow, like “f” in “fish”.',
  }),
  letter({
    id: 'ba',
    glyph: 'ب',
    nameAr: 'باء',
    name: 'Bāʾ',
    translit: 'b',
    makhraj: 16,
    tip: 'Press both lips together firmly, then open them with your voice on, like “b” in “ball”.',
  }),
  letter({
    id: 'mim',
    glyph: 'م',
    nameAr: 'ميم',
    name: 'Mīm',
    translit: 'm',
    makhraj: 16,
    tip: 'Close both lips gently and hum through the nose, like “m” in “moon”.',
  }),
  letter({
    id: 'waw',
    glyph: 'و',
    nameAr: 'واو',
    name: 'Wāw',
    translit: 'w',
    makhraj: 16,
    tip: 'Round your lips into a small circle without closing them, like “w” in “water”.',
    note: 'With sukun after a fatḥah (as in خَوْف) it softens into a līn sound from the same place.',
  }),

  // 17 · Al-Khayshum
  letter({
    id: 'ghunnah',
    glyph: 'نّ',
    nameAr: 'الغنة',
    name: 'Ghunnah',
    translit: 'nn / mm',
    kind: 'ghunnah',
    makhraj: 17,
    practice: 'إِنَّ · ثُمَّ',
    tip: 'The hum in nūn and mīm, strongest when they carry a shaddah. It rings in the nose: pinch your nose and the hum stops.',
    note: 'Ghunnah is a sound quality, not a letter of its own. It belongs to nūn and mīm.',
  }),
];

export function getMakhraj(id: number): Makhraj {
  const m = MAKHARIJ.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown makhraj ${id}`);
  return m;
}

export function lettersInZone(zone: ZoneId): MakhrajLetter[] {
  return MAKHRAJ_LETTERS.filter((l) => getMakhraj(l.makhraj).zone === zone);
}
