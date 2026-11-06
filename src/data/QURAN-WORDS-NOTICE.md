# Quran words data

`quran-words.json` lists every word of the Quran grouped by dictionary form
(lemma), with its root, how often it appears, its most common written forms,
Indonesian and English meanings, and two example ayah. Items are sorted from
most to least frequent and split into 60 levels.

## Sources

- **Lemmas, roots and parts of speech:** the
  [Quranic Arabic Corpus](https://corpus.quran.com) morphology v0.4, by Kais
  Dukes, via the corrected fork at
  [mustafa0x/quran-morphology](https://github.com/mustafa0x/quran-morphology).
  It is licensed under the **GNU General Public License v3**, and so is the
  derived `quran-words.json`.
- **Meanings:** the most common word-by-word translation of each word on
  [Quran.com](https://quran.com) (API v4), Indonesian and English.
  Meanings for attached letters and pronouns are hand-written in
  `scripts/build-quran-words.mjs`.

## Rebuilding

1. Download `quran-morphology.txt` from the fork above.
2. Download the word-by-word meanings for every ayah from
   `https://api.quran.com/api/v4/verses/by_chapter/{surah}?words=true&word_fields=text_uthmani&language={id|en}&per_page=50&page={n}`
   into two files shaped as `{ "2:255": [[text_uthmani, meaning], ...] }`.
3. Run `node scripts/build-quran-words.mjs quran-morphology.txt words-id.json words-en.json`.

Item ids (`V:قالَ`, `pre:wa`, `pron:3MP`) are stored with each user's progress,
so keep them stable when rebuilding.
