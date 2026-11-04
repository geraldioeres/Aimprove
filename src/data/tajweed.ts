/**
 * Tajweed rules as taught in Indonesian TPQ and pesantren, with the class
 * names Quran.com uses to mark them in `text_uthmani_tajweed`, so marked
 * ayah text can be coloured and linked back to its rule here.
 *
 * Colours follow the common tajweed-Mushaf families (orange ghunnah, greens
 * for idgham, purples for ikhfa, blues for mad, red qalqalah, grey for
 * letters not pronounced), darkened so each reads at 3:1 or more on white.
 */

export type TajweedGroup = 'nun' | 'mim' | 'ghunnah' | 'idgham' | 'qalqalah' | 'mad' | 'lam';

export const TAJWEED_GROUPS: { id: TajweedGroup; title: string; arabic: string; intro: string }[] = [
  {
    id: 'nun',
    title: 'Nun sukun & tanwin',
    arabic: 'النون الساكنة والتنوين',
    intro: 'What happens when نْ or a tanwin (ـًـٍـٌ) meets the next letter.',
  },
  {
    id: 'mim',
    title: 'Mim sukun',
    arabic: 'الميم الساكنة',
    intro: 'What happens when مْ meets the next letter.',
  },
  {
    id: 'ghunnah',
    title: 'Ghunnah',
    arabic: 'الغنة',
    intro: 'A humming sound through the nose.',
  },
  {
    id: 'idgham',
    title: 'Other idgham',
    arabic: 'الإدغام',
    intro: 'Two letters that sound close or share a makhraj merge into one.',
  },
  {
    id: 'qalqalah',
    title: 'Qalqalah',
    arabic: 'القلقلة',
    intro: 'A small bounce on certain letters when they carry sukun.',
  },
  {
    id: 'mad',
    title: 'Mad (lengthening)',
    arabic: 'المد',
    intro: 'How long to hold a vowel. One harakat is about one finger bend.',
  },
  {
    id: 'lam',
    title: 'Alif lam & hamzah',
    arabic: 'أل والهمزة',
    intro: 'Letters that are read or left silent.',
  },
];

export interface TajweedRule {
  id: string;
  group: TajweedGroup;
  name: string; // Indonesian name
  arabic: string;
  apiClass?: string; // Quran.com tajweed class, when marked there
  color: string;
  when: string;
  how: string;
  letters?: string[];
  length?: string; // for mad rules
  example: { key: string; parts: [string, string, string]; note?: string };
}

export const TAJWEED_RULES: TajweedRule[] = [
  // --- Nun sukun & tanwin
  {
    id: 'izhar-halqi',
    group: 'nun',
    name: 'Izhar Halqi',
    arabic: 'إظهار حلقي',
    color: '#0F6F7A',
    when: 'Nun sukun or tanwin meets one of the six throat letters.',
    how: 'Read the nun clearly, with no hum and no merging.',
    letters: ['ء', 'ه', 'ع', 'ح', 'غ', 'خ'],
    example: { key: '2:62', parts: ['مَ', 'نْ ءَا', 'مَنَ'] },
  },
  {
    id: 'idgham-bighunnah',
    group: 'nun',
    name: 'Idgham Bighunnah',
    arabic: 'إدغام بغنة',
    apiClass: 'idgham_ghunnah',
    color: '#0E7F68',
    when: 'Nun sukun or tanwin meets ي ن م و (in two separate words).',
    how: 'Merge the nun into the next letter and hum for 2 harakat.',
    letters: ['ي', 'ن', 'م', 'و'],
    example: { key: '2:8', parts: ['مَ', 'ن يَ', 'قُولُ'] },
  },
  {
    id: 'idgham-bilaghunnah',
    group: 'nun',
    name: 'Idgham Bilaghunnah',
    arabic: 'إدغام بلا غنة',
    apiClass: 'idgham_wo_ghunnah',
    color: '#2E7D12',
    when: 'Nun sukun or tanwin meets ل or ر.',
    how: 'Merge the nun completely into the ل or ر, with no hum.',
    letters: ['ل', 'ر'],
    example: { key: '2:2', parts: ['هُ', 'دًى لِّ', 'لْمُتَّقِينَ'] },
  },
  {
    id: 'iqlab',
    group: 'nun',
    name: 'Iqlab',
    arabic: 'إقلاب',
    apiClass: 'iqlab',
    color: '#0B6FA4',
    when: 'Nun sukun or tanwin meets ب. Often shown with a small mim (ۢ).',
    how: 'Change the nun into a light mim, lips closed, and hum for 2 harakat.',
    letters: ['ب'],
    example: { key: '2:27', parts: ['مِ', 'نۢ بَ', 'عْدِ'] },
  },
  {
    id: 'ikhfa-haqiqi',
    group: 'nun',
    name: 'Ikhfa Haqiqi',
    arabic: 'إخفاء حقيقي',
    apiClass: 'ikhafa',
    color: '#8A1FA0',
    when: 'Nun sukun or tanwin meets one of the 15 remaining letters.',
    how: 'Hide the nun between clear and merged, humming for 2 harakat, tongue ready for the next letter.',
    letters: ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'],
    example: { key: '2:22', parts: ['وَأَ', 'نتُ', 'مْ تَعْلَمُونَ'] },
  },

  // --- Mim sukun
  {
    id: 'ikhfa-syafawi',
    group: 'mim',
    name: 'Ikhfa Syafawi',
    arabic: 'إخفاء شفوي',
    apiClass: 'ikhafa_shafawi',
    color: '#B0179A',
    when: 'Mim sukun meets ب.',
    how: 'Close the lips lightly on the mim and hum for 2 harakat before the ب.',
    letters: ['ب'],
    example: { key: '105:4', parts: ['تَرْمِيهِ', 'م بِ', 'حِجَارَةٍ'] },
  },
  {
    id: 'idgham-mimi',
    group: 'mim',
    name: 'Idgham Mimi',
    arabic: 'إدغام ميمي',
    apiClass: 'idgham_shafawi',
    color: '#4E8A10',
    when: 'Mim sukun meets another م.',
    how: 'Merge the two mims into one with shaddah and hum for 2 harakat.',
    letters: ['م'],
    example: { key: '2:249', parts: ['كَ', 'م مِّ', 'ن فِئَةٍ'] },
  },
  {
    id: 'izhar-syafawi',
    group: 'mim',
    name: 'Izhar Syafawi',
    arabic: 'إظهار شفوي',
    color: '#0F6F7A',
    when: 'Mim sukun meets any letter other than م or ب.',
    how: 'Read the mim clearly with closed lips, no hum. Take extra care before و and ف.',
    example: { key: '105:1', parts: ['أَلَ', 'مْ تَ', 'رَ'] },
  },

  // --- Ghunnah
  {
    id: 'ghunnah-musyaddadah',
    group: 'ghunnah',
    name: 'Ghunnah Musyaddadah',
    arabic: 'غنة مشددة',
    apiClass: 'ghunnah',
    color: '#C25E00',
    when: 'A نّ or مّ (with shaddah).',
    how: 'Hold the hum through the nose for 2 harakat.',
    letters: ['نّ', 'مّ'],
    example: { key: '78:1', parts: ['عَ', 'مَّ', ''] },
  },

  // --- Other idgham
  {
    id: 'idgham-mutajanisain',
    group: 'idgham',
    name: 'Idgham Mutajanisain',
    arabic: 'إدغام متجانسين',
    apiClass: 'idgham_mutajanisayn',
    color: '#5F5F66',
    when: 'Two letters from the same makhraj but different sifat meet, the first with sukun (e.g. د→ت, ت→ط, ذ→ظ).',
    how: 'Merge the first letter into the second.',
    example: { key: '2:256', parts: ['قَ', 'د تَّ', 'بَيَّنَ'] },
  },
  {
    id: 'idgham-mutaqaribain',
    group: 'idgham',
    name: 'Idgham Mutaqaribain',
    arabic: 'إدغام متقاربين',
    apiClass: 'idgham_mutaqaribayn',
    color: '#5F5F66',
    when: 'Two letters with close makhraj meet, the first with sukun (e.g. ق→ك, ل→ر).',
    how: 'Merge the first letter into the second.',
    example: { key: '77:20', parts: ['نَخْلُ', 'قكُّ', 'م'] },
  },

  // --- Qalqalah
  {
    id: 'qalqalah',
    group: 'qalqalah',
    name: 'Qalqalah',
    arabic: 'قلقلة',
    apiClass: 'qalaqah',
    color: '#B5122E',
    when: 'One of ق ط ب ج د carries sukun. Sughra in the middle of a word, kubra when you stop on it.',
    how: 'Give the letter a short bounce. Stronger (kubra) when stopping at the end of an ayah.',
    letters: ['ق', 'ط', 'ب', 'ج', 'د'],
    example: { key: '112:1', parts: ['قُلْ هُوَ ٱللَّهُ أَحَ', 'دٌ', ''], note: 'Kubra when you stop here: أَحَدْ' },
  },

  // --- Mad
  {
    id: 'mad-thabii',
    group: 'mad',
    name: "Mad Thabi'i",
    arabic: 'مد طبيعي',
    apiClass: 'madda_normal',
    color: '#3A64D8',
    when: 'Alif after fathah, waw sukun after dhammah, or ya sukun after kasrah, with no hamzah or sukun after it.',
    how: 'Hold the vowel for 2 harakat.',
    length: '2 harakat',
    example: { key: '1:4', parts: ['', 'مَـٰ', 'لِكِ يَوْمِ ٱلدِّينِ'] },
  },
  {
    id: 'mad-wajib-muttasil',
    group: 'mad',
    name: 'Mad Wajib Muttasil',
    arabic: 'مد واجب متصل',
    apiClass: 'madda_obligatory',
    color: '#1E3AA8',
    when: 'A mad letter is followed by hamzah in the same word.',
    how: 'Hold for 4 or 5 harakat. It must be lengthened.',
    length: '4–5 harakat',
    example: { key: '78:1', parts: ['عَمَّ يَتَسَ', 'آ', 'ءَلُونَ'] },
  },
  {
    id: 'mad-jaiz-munfasil',
    group: 'mad',
    name: 'Mad Jaiz Munfasil',
    arabic: 'مد جائز منفصل',
    apiClass: 'madda_permissible',
    color: '#2F3FD8',
    when: 'A mad letter at the end of a word is followed by hamzah at the start of the next word.',
    how: 'Hold for 2, 4 or 5 harakat; keep the same length throughout your recitation.',
    length: '2, 4 or 5 harakat',
    example: { key: '2:4', parts: ['بِمَ', 'آ', ' أُنزِلَ إِلَيْكَ'] },
  },
  {
    id: 'mad-aridh-lissukun',
    group: 'mad',
    name: "Mad 'Aridh Lissukun",
    arabic: 'مد عارض للسكون',
    apiClass: 'madda_permissible',
    color: '#2F3FD8',
    when: 'A mad letter comes just before the last letter of an ayah where you stop.',
    how: 'When stopping, hold for 2, 4 or 6 harakat.',
    length: '2, 4 or 6 harakat',
    example: { key: '1:2', parts: ['رَبِّ ٱلْعَـٰلَمِ', 'ي', 'نَ'], note: 'When you stop: ٱلْعَـٰلَمِينْ' },
  },
  {
    id: 'mad-lazim',
    group: 'mad',
    name: 'Mad Lazim',
    arabic: 'مد لازم',
    apiClass: 'madda_necessary',
    color: '#0B1780',
    when: 'A mad letter is followed by a fixed sukun or shaddah, or in the opening letters such as الٓمٓ.',
    how: 'Always hold for 6 harakat.',
    length: '6 harakat',
    example: { key: '1:7', parts: ['وَلَا ٱلضَّ', 'آ', 'لِّينَ'] },
  },
  {
    id: 'mad-iwadh',
    group: 'mad',
    name: "Mad 'Iwadh",
    arabic: 'مد عوض',
    color: '#3A64D8',
    when: 'You stop on a word ending in fathatain (ـً), except on ta marbutah (ة).',
    how: 'Drop the tanwin and read a plain alif for 2 harakat.',
    length: '2 harakat',
    example: { key: '4:17', parts: ['عَلِيمً', 'ا', ''], note: 'When you stop: عَلِيمَا' },
  },
  {
    id: 'mad-shilah',
    group: 'mad',
    name: 'Mad Shilah Qashirah',
    arabic: 'مد صلة قصيرة',
    color: '#3A64D8',
    when: 'The pronoun ه sits between two voweled letters and the next letter is not hamzah.',
    how: 'Lengthen the ه (هُۥ / هِۦ) for 2 harakat.',
    length: '2 harakat',
    example: { key: '84:15', parts: ['إِنَّ رَبَّ', 'هُۥ', ' كَانَ بِهِۦ بَصِيرًا'] },
  },

  // --- Alif lam & hamzah
  {
    id: 'alif-lam-qamariyah',
    group: 'lam',
    name: 'Alif Lam Qamariyah',
    arabic: 'أل القمرية',
    color: '#0F6F7A',
    when: 'Alif lam meets one of the 14 qamariyah letters.',
    how: 'Read the lam clearly with sukun.',
    letters: ['ا', 'ب', 'غ', 'ح', 'ج', 'ك', 'و', 'خ', 'ف', 'ع', 'ق', 'ي', 'م', 'ه'],
    example: { key: '54:1', parts: ['وَٱنشَقَّ ', 'ٱلْ', 'قَمَرُ'] },
  },
  {
    id: 'alif-lam-syamsiyah',
    group: 'lam',
    name: 'Alif Lam Syamsiyah',
    arabic: 'أل الشمسية',
    apiClass: 'laam_shamsiyah',
    color: '#6F6F75',
    when: 'Alif lam meets one of the 14 syamsiyah letters, which then carries shaddah.',
    how: 'Do not read the lam; go straight into the doubled letter.',
    letters: ['ت', 'ث', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ل', 'ن'],
    example: { key: '91:1', parts: ['وَٱ', 'ل', 'شَّمْسِ وَضُحَىٰهَا'] },
  },
  {
    id: 'hamzah-washal',
    group: 'lam',
    name: 'Hamzah Washal',
    arabic: 'همزة الوصل',
    apiClass: 'ham_wasl',
    color: '#6F6F75',
    when: 'An alif with a small ص above (ٱ) at the start of a word.',
    how: 'Skip it when joining from the previous word; pronounce it only when starting from that word.',
    example: { key: '1:6', parts: ['', 'ٱ', 'هْدِنَا ٱلصِّرَٰطَ'] },
  },
  {
    id: 'huruf-tidak-dibaca',
    group: 'lam',
    name: 'Huruf tidak dibaca',
    arabic: 'الحروف الساكتة',
    apiClass: 'slnt',
    color: '#6F6F75',
    when: 'A letter written in the Mushaf but not pronounced, often marked with a small circle (۟), like the alif after waw jama‘ah.',
    how: 'Leave it silent.',
    example: { key: '2:14', parts: ['قَالُوٓ', 'ا۟', ' ءَامَنَّا'] },
  },
];

export const TAJWEED_BY_ID: Record<string, TajweedRule> = Object.fromEntries(
  TAJWEED_RULES.map((r) => [r.id, r])
);

/** Quran.com tajweed class → our rule (first match; mad jaiz covers 'aridh too). */
export const TAJWEED_BY_CLASS: Record<string, TajweedRule> = {};
for (const r of TAJWEED_RULES) {
  if (r.apiClass && !TAJWEED_BY_CLASS[r.apiClass]) TAJWEED_BY_CLASS[r.apiClass] = r;
}

export interface TajweedSegment {
  text: string;
  rule?: TajweedRule;
}

/** Split Quran.com's `text_uthmani_tajweed` HTML into coloured segments. */
export function parseTajweed(html: string): TajweedSegment[] {
  const out: TajweedSegment[] = [];
  const re = /<tajweed class=([a-z_]+)>(.*?)<\/tajweed>|<span class=end>.*?<\/span>|<[^>]+>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m.index > last) out.push({ text: html.slice(last, m.index) });
    if (m[1]) out.push({ text: m[2], rule: TAJWEED_BY_CLASS[m[1]] });
    last = re.lastIndex;
  }
  if (last < html.length) out.push({ text: html.slice(last) });
  // Merge neighbours without a rule and trim the trailing space before the ayah marker.
  const merged: TajweedSegment[] = [];
  for (const s of out) {
    const prev = merged[merged.length - 1];
    if (prev && !prev.rule && !s.rule) prev.text += s.text;
    else merged.push({ ...s });
  }
  if (merged.length) {
    const tail = merged[merged.length - 1];
    if (!tail.rule) tail.text = tail.text.replace(/\s+$/, '');
  }
  return merged.filter((s) => s.text.length > 0);
}
