// Builds src/data/jlpt-vocab.json from the JLPT vocabulary lists in
// jamsinclair/open-anki-jlpt-decks (MIT, based on Jonathan Waller's JLPT
// lists): https://github.com/jamsinclair/open-anki-jlpt-decks
//
// Usage: node scripts/build-jlpt-vocab.mjs <folder with n5.csv … n1.csv>

import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/build-jlpt-vocab.mjs <folder with n5.csv … n1.csv>');
  process.exit(1);
}

// Minimal CSV parser: commas, double-quoted fields, "" escapes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows;
}

// "to meet, to see, to encounter, …" -> the first three senses, kept short.
function shortMeaning(m) {
  const parts = m
    .split(/[,;]/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  let out = '';
  for (const p of parts.slice(0, 3)) {
    const next = out ? `${out}, ${p}` : p;
    if (next.length > 48 && out) break;
    out = next;
  }
  return out;
}

const out = {};
const seen = new Set();
for (const n of [5, 4, 3, 2, 1]) {
  const rows = parseCsv(fs.readFileSync(path.join(dir, `n${n}.csv`), 'utf8'));
  const header = rows.shift();
  const ix = (name) => header.indexOf(name);
  const list = [];
  for (const r of rows) {
    const expression = (r[ix('expression')] || '').trim();
    const reading = (r[ix('reading')] || '').trim();
    const meaning = shortMeaning(r[ix('meaning')] || '');
    if (!expression || !reading || !meaning) continue;
    const key = `${expression}|${reading}`;
    if (seen.has(key)) continue; // keep each word at its easiest level
    seen.add(key);
    list.push([expression, reading, meaning]);
  }
  out[`N${n}`] = list;
}

fs.writeFileSync('src/data/jlpt-vocab.json', JSON.stringify(out));
console.log(
  Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])),
  fs.statSync('src/data/jlpt-vocab.json').size,
  'bytes'
);
