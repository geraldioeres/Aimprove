import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

async function loadEnv() {
  try {
    const raw = await fs.readFile(path.resolve('d:/Aimprove/.env'), 'utf8');
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

async function main() {
  const env = await loadEnv();
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const rawJson = await fs.readFile(
    path.resolve('d:/Aimprove/src/data/wanikani-1-60.json'),
    'utf8'
  );
  const subjects = JSON.parse(rawJson);

  console.log(`Uploading ${subjects.length} WaniKani Level 1-60 subjects to Supabase (${url})...`);

  const BATCH_SIZE = 500;
  for (let i = 0; i < subjects.length; i += BATCH_SIZE) {
    const chunk = subjects.slice(i, i + BATCH_SIZE).map((s) => ({
      id: s.id,
      level: s.level,
      kind: s.kind,
      characters: s.characters,
      meanings: s.meanings,
      readings: s.readings,
      reading_type: s.readingType || null,
      component_ids: s.componentIds || [],
      amalgamation_ids: s.amalgamationIds || [],
      mnemonic: s.mnemonic,
      reading_mnemonic: s.readingMnemonic || null,
      jlpt_level: s.jlptLevel || null,
      grammar_structure: s.grammarStructure || null,
      context_sentences: s.contextSentences || [],
    }));

    const { error } = await supabase.from('jp_subjects').upsert(chunk, {
      onConflict: 'id',
    });

    if (error) {
      console.error(
        `\nBatch upload stopped at item ${i}: ${error.message}\n` +
          `-> Run supabase/migrations/002_full_wanikani_support.sql in your Supabase SQL Editor first, then re-run: npm run seed:supabase`
      );
      process.exit(1);
    }

    console.log(`  Uploaded ${Math.min(i + BATCH_SIZE, subjects.length)} / ${subjects.length} subjects`);
  }

  console.log('Successfully seeded all WaniKani Level 1-60 subjects to Supabase!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

