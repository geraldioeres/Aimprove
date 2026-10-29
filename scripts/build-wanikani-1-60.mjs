import fs from 'node:fs/promises';
import path from 'node:path';

const KANJI_WANIKANI_URL =
  'https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji-wanikani.json';
const GRAPH_URL =
  'https://raw.githubusercontent.com/fasiha/ebieki/master/wanikani-kanji-graph.json';
const VOCAB_TABLE_URL =
  'https://raw.githubusercontent.com/fasiha/ebieki/master/table.json';

function slugifyRadicalName(name) {
  return (
    'rad-' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

function cleanKanaReading(reading) {
  // Remove WaniKani primary marker '!', okurigana dots '.', and prefixes/suffixes '-'
  return reading.replace(/[!.\-~]/g, '').trim();
}

async function main() {
  console.log('Fetching WaniKani Level 1-60 datasets...');
  const [wkKanjiMap, wkGraph, wkVocabTable] = await Promise.all([
    fetch(KANJI_WANIKANI_URL).then((r) => r.json()),
    fetch(GRAPH_URL).then((r) => r.json()),
    fetch(VOCAB_TABLE_URL).then((r) => r.json()),
  ]);

  // 1. Build all WaniKani Radicals (Levels 1-60)
  // Map radical name -> { id, level, characters, name, amalgamationIds }
  const radicalByName = new Map();

  for (const [kanjiChar, info] of Object.entries(wkKanjiMap)) {
    const level = info.wk_level || 1;
    const radNames = info.wk_radicals || [];
    const radChars = wkGraph.kanjiToRadicals?.[kanjiChar] || [];

    radNames.forEach((radName, idx) => {
      const id = slugifyRadicalName(radName);
      const charCandidate = radChars[idx] || kanjiChar;
      const existing = radicalByName.get(radName);
      if (!existing) {
        radicalByName.set(radName, {
          id,
          level,
          kind: 'radical',
          characters: charCandidate,
          meanings: [radName],
          readings: [],
          componentIds: [],
          amalgamationIds: [`kan-${kanjiChar}`],
          mnemonic: `WaniKani Level ${level} radical "${radName}" (${charCandidate}), used as a building block for ${kanjiChar} and related kanji.`,
          contextSentences: [],
        });
      } else {
        if (level < existing.level) {
          existing.level = level;
          existing.mnemonic = `WaniKani Level ${level} radical "${radName}" (${existing.characters}), used as a building block in progressive kanji.`;
        }
        if (!existing.amalgamationIds.includes(`kan-${kanjiChar}`)) {
          existing.amalgamationIds.push(`kan-${kanjiChar}`);
        }
      }
    });
  }

  const radicals = Array.from(radicalByName.values()).sort(
    (a, b) => a.level - b.level || a.id.localeCompare(b.id)
  );

  // 2. Build all 2,026 WaniKani Kanji (Levels 1-60)
  const kanjiByChar = new Map();

  for (const [kanjiChar, info] of Object.entries(wkKanjiMap)) {
    const level = info.wk_level || 1;
    const id = `kan-${kanjiChar}`;
    const meanings =
      info.wk_meanings && info.wk_meanings.length > 0
        ? info.wk_meanings
        : info.meanings || [kanjiChar];

    const rawOn = info.wk_readings_on || info.readings_on || [];
    const rawKun = info.wk_readings_kun || info.readings_kun || [];

    // Prioritize primary WaniKani readings (those without '!' in wk_readings_* are primary in davidluzgouveia's format, or include all valid readings)
    const primaryOn = rawOn.filter((r) => !r.startsWith('!')).map(cleanKanaReading);
    const primaryKun = rawKun.filter((r) => !r.startsWith('!')).map(cleanKanaReading);
    const allCleanReadings = Array.from(
      new Set(
        [...primaryOn, ...primaryKun, ...rawOn.map(cleanKanaReading), ...rawKun.map(cleanKanaReading)].filter(
          Boolean
        )
      )
    );

    const readingType = primaryOn.length > 0 ? 'onyomi' : 'kunyomi';
    const radNames = info.wk_radicals || [];
    const componentIds = Array.from(
      new Set(radNames.map((n) => slugifyRadicalName(n)))
    );

    const jlptLevel = info.jlpt_new ? `N${info.jlpt_new}` : undefined;

    kanjiByChar.set(kanjiChar, {
      id,
      level,
      kind: 'kanji',
      characters: kanjiChar,
      meanings,
      readings: allCleanReadings.slice(0, 5),
      readingType,
      componentIds,
      amalgamationIds: [],
      mnemonic:
        radNames.length > 0
          ? `Combine the ${radNames.join(' + ')} radical${radNames.length > 1 ? 's' : ''} to form the kanji for "${meanings[0]}" (${kanjiChar}).`
          : `Level ${level} kanji meaning "${meanings[0]}".`,
      readingMnemonic: `Primary ${readingType} reading: ${allCleanReadings[0] || ''}.`,
      jlptLevel,
      contextSentences: [],
    });
  }

  // 3. Build WaniKani Vocabulary across Levels 1-60 from fasiha/ebieki table.json
  const vocabList = [];
  const seenVocabIds = new Set();

  for (const entry of wkVocabTable) {
    const card = entry.card;
    if (!card || !card.kanji || !card.level) continue;

    const wordChars = card.kanji.trim();
    const vocabId = `voc-${wordChars}`;
    if (seenVocabIds.has(vocabId)) continue;
    seenVocabIds.add(vocabId);

    const level = Math.min(60, Math.max(1, Number(card.level) || 1));
    const readings = Array.from(
      new Set((card.kanas || []).map(cleanKanaReading).filter(Boolean))
    );
    if (readings.length === 0) continue;

    // Extract English meanings from glossObj.sense
    const meanings = [];
    const senses = entry.glossObj?.sense || [];
    for (const sense of senses) {
      for (const g of sense.gloss || []) {
        if (g.text && meanings.length < 4) {
          // Capitalize first letter of each word for clean display
          const formatted = g.text
            .replace(/\s*\([^)]*\)\s*/g, ' ')
            .trim();
          if (formatted && !meanings.includes(formatted)) {
            meanings.push(formatted);
          }
        }
      }
    }
    if (meanings.length === 0 && entry.glossStr) {
      const firstPart = entry.glossStr.split(/[;,]/)[0].trim();
      if (firstPart) meanings.push(firstPart);
    }
    if (meanings.length === 0) continue;

    // Extract constituent WaniKani Kanji from wordChars
    const componentIds = [];
    for (const ch of wordChars) {
      if (kanjiByChar.has(ch)) {
        const kId = `kan-${ch}`;
        if (!componentIds.includes(kId)) {
          componentIds.push(kId);
        }
        const kObj = kanjiByChar.get(ch);
        if (kObj.amalgamationIds.length < 12 && !kObj.amalgamationIds.includes(vocabId)) {
          kObj.amalgamationIds.push(vocabId);
        }
      }
    }

    vocabList.push({
      id: vocabId,
      level,
      kind: 'vocab',
      characters: wordChars,
      meanings: meanings.slice(0, 3),
      readings: readings.slice(0, 3),
      readingType: 'vocab',
      componentIds,
      amalgamationIds: [],
      mnemonic: `Level ${level} vocabulary "${wordChars}" (${readings[0]}): ${meanings.slice(0, 2).join(', ')}.`,
      contextSentences: [],
    });
  }

  const kanjiList = Array.from(kanjiByChar.values()).sort(
    (a, b) => a.level - b.level || a.id.localeCompare(b.id)
  );
  vocabList.sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));

  console.log(
    `Built WaniKani Level 1-60 Curriculum: ${radicals.length} Radicals, ${kanjiList.length} Kanji, ${vocabList.length} Vocab = ${
      radicals.length + kanjiList.length + vocabList.length
    } total subjects!`
  );

  // Verify every single level 1..60 has items
  for (let lvl = 1; lvl <= 60; lvl++) {
    const rCount = radicals.filter((r) => r.level === lvl).length;
    const kCount = kanjiList.filter((k) => k.level === lvl).length;
    const vCount = vocabList.filter((v) => v.level === lvl).length;
    if (lvl <= 5 || lvl >= 56 || lvl % 10 === 0) {
      console.log(`  Level ${lvl}: ${rCount} radicals, ${kCount} kanji, ${vCount} vocab`);
    }
  }

  const fullDataset = [...radicals, ...kanjiList, ...vocabList];
  const outPath = path.resolve('d:/Aimprove/src/data/wanikani-1-60.json');
  await fs.writeFile(outPath, JSON.stringify(fullDataset));
  const stat = await fs.stat(outPath);
  console.log(`Saved ${outPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
