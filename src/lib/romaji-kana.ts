/**
 * Built-in Romaji-to-Hiragana IME converter and WaniKani-style fuzzy English meaning matcher.
 */

const ROMAJI_TO_HIRAGANA: Record<string, string> = {
  a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
  ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ',
  kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',
  sa: 'さ', shi: 'し', si: 'し', su: 'す', se: 'せ', so: 'そ',
  sha: 'しゃ', shu: 'しゅ', sho: 'しょ', sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
  ta: 'た', chi: 'ち', ti: 'ち', tsu: 'つ', tu: 'つ', te: 'て', to: 'と',
  cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ', tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',
  na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
  nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ',
  ha: 'は', hi: 'ひ', fu: 'ふ', hu: 'ふ', he: 'へ', ho: 'ほ',
  hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ',
  ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も',
  mya: 'みゃ', myu: 'みゅ', myo: 'みょ',
  ya: 'や', yu: 'ゆ', yo: 'よ',
  ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ',
  rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',
  wa: 'わ', wo: 'を', nn: 'ん', "n'": 'ん',
  ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
  gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',
  za: 'ざ', ji: 'じ', zi: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
  ja: 'じゃ', ju: 'じゅ', jo: 'じょ', jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ',
  da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',
  dya: 'ぢゃ', dyu: 'ぢゅ', dyo: 'ぢょ',
  ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ',
  bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
  pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
  pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ',
  fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ',
  xtu: 'っ', xtsu: 'っ', ltu: 'っ',
  xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ',
  xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ',
  '-': 'ー',
};

const CONSONANTS = new Set([
  'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm',
  'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z',
]);

/**
 * Converts live romaji input into Hiragana while leaving trailing partial romaji intact
 * so the user can keep typing naturally (just like WaniKani's input field).
 */
export function convertRomajiToHiraganaLive(input: string): string {
  const lower = input.toLowerCase();
  let result = '';
  let i = 0;

  while (i < lower.length) {
    const ch = lower[i];

    // Already kana or Japanese punctuation
    if (ch.charCodeAt(0) > 127) {
      result += input[i];
      i++;
      continue;
    }

    // Handle double consonant -> っ (except 'nn')
    if (
      i + 1 < lower.length &&
      ch === lower[i + 1] &&
      CONSONANTS.has(ch)
    ) {
      result += 'っ';
      i++;
      continue;
    }

    // Handle 'n' followed by a consonant that is not 'y' or apostrophe
    if (
      ch === 'n' &&
      i + 1 < lower.length &&
      CONSONANTS.has(lower[i + 1]) &&
      lower[i + 1] !== 'y'
    ) {
      result += 'ん';
      i++;
      continue;
    }

    // Try 4, 3, 2, 1 char chunks
    let matched = false;
    for (let len = 4; len >= 1; len--) {
      if (i + len <= lower.length) {
        const chunk = lower.slice(i, i + len);
        if (ROMAJI_TO_HIRAGANA[chunk]) {
          result += ROMAJI_TO_HIRAGANA[chunk];
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      result += lower[i];
      i++;
    }
  }

  return result;
}

/**
 * Finalizes any trailing single 'n' into 'ん' upon hitting Enter/Submit.
 */
export function finalizeKanaInput(input: string): string {
  const converted = convertRomajiToHiraganaLive(input.trim());
  if (converted.endsWith('n')) {
    return converted.slice(0, -1) + 'ん';
  }
  return converted;
}

/**
 * Levenshtein edit distance for WaniKani-style English meaning typo tolerance.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function normalizeEnglish(str: string): string {
  return str
    .toLowerCase()
    .replace(/^to\s+/, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface AnswerCheckResult {
  isCorrect: boolean;
  isSlightlyOff?: boolean;
  matchedTarget?: string;
}

export function checkEnglishMeaning(
  userInput: string,
  acceptedMeanings: string[]
): AnswerCheckResult {
  const cleanUser = normalizeEnglish(userInput);
  if (!cleanUser) return { isCorrect: false };

  for (const target of acceptedMeanings) {
    const cleanTarget = normalizeEnglish(target);
    if (cleanUser === cleanTarget) {
      return { isCorrect: true, isSlightlyOff: false, matchedTarget: target };
    }

    const maxAllowedDistance =
      cleanTarget.length <= 3 ? 0 : cleanTarget.length <= 6 ? 1 : 2;
    const dist = levenshteinDistance(cleanUser, cleanTarget);
    if (dist <= maxAllowedDistance) {
      return { isCorrect: true, isSlightlyOff: true, matchedTarget: target };
    }
  }

  return { isCorrect: false };
}

export function checkJapaneseReading(
  userInput: string,
  acceptedReadings: string[]
): AnswerCheckResult {
  const finalized = finalizeKanaInput(userInput).replace(/\s+/g, '');
  if (!finalized) return { isCorrect: false };

  for (const reading of acceptedReadings) {
    const cleanTarget = reading.trim().replace(/\s+/g, '');
    if (finalized === cleanTarget) {
      return { isCorrect: true, matchedTarget: reading };
    }
  }

  return { isCorrect: false };
}

