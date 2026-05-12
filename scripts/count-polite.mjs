#!/usr/bin/env node
/**
 * Adds polite-speech marker count columns to a tagged script CSV.
 *
 * New columns:
 *   masu_count          – ます-stem endings (ます, ました, まして, ません, ましょう, ませ)
 *   desu_count          – です copula forms (です, でした, でしょう, etc.)
 *   gozaimasu_count     – ございます family (very formal / keigo)
 *   honorific_verb_count – sonkeigo verbs (いらっしゃる, おっしゃる, なさる, くださる, …)
 *   humble_verb_count   – kenjōgo verbs (いたす, 申す, 参る, おります, いただく, …)
 *   total_polite_count  – non-overlapping count via unified regex
 *   polite_density      – total_polite_count / character length of line
 *
 * Usage:
 *   node scripts/count-polite.mjs [input.csv] [output.csv]
 *   node scripts/count-polite.mjs src/data/script_tagged.csv
 */

import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const Papa = require("papaparse");

// ---------------------------------------------------------------------------
// Pattern definitions — longest alternatives listed first within each group
// so the regex engine greedily matches the most specific form.
// ---------------------------------------------------------------------------

const CATEGORY_PATTERNS = {
  // Teineigo: polite verb endings (masu-stem)
  masu_count: /ませんでした|ましょうか|ましょう|ません|ました|まして|ます|ませ/g,

  // Teineigo: desu copula
  desu_count: /でした|でしょうか|でしょう|ですが|ですね|ですよ|ですか|です/g,

  // Formal / teichōgo: gozaimasu family
  // (ございます also ends in ます — kept separate for category granularity)
  gozaimasu_count: /ございませんでした|ございません|ございました|ございます/g,

  // Sonkeigo: honorific verbs directed upward at the addressee
  honorific_verb_count:
    /いらっしゃいませ|いらっしゃいます|いらっしゃいました|いらっしゃる|いらっしゃい|おっしゃいます|おっしゃいました|おっしゃる|おっしゃい|なさいます|なさいました|なさる|なさい|くださいます|くださいました|くださいませ|くださる|ください|召し上がります|召し上がる|ご覧になります|ご覧になる/g,

  // Kenjōgo: humble verbs that lower the speaker
  humble_verb_count:
    /申し上げます|申し上げました|申し上げる|いたします|いたしました|いたす|申します|申しました|まいります|まいりました|まいる|おります|おりました|いただきます|いただきました|いただく/g,
};

// Unified regex for non-overlapping total count.
// Union of all alternatives above, longest-first within each class.
const TOTAL_PATTERN =
  /ございませんでした|ございません|ございました|ございます|いらっしゃいませ|いらっしゃいます|いらっしゃいました|いらっしゃる|いらっしゃい|おっしゃいます|おっしゃいました|おっしゃる|おっしゃい|申し上げます|申し上げました|申し上げる|いたします|いたしました|いたす|申します|申しました|まいります|まいりました|まいる|おります|おりました|いただきます|いただきました|いただく|なさいます|なさいました|なさる|なさい|くださいます|くださいました|くださいませ|くださる|ください|召し上がります|召し上がる|ご覧になります|ご覧になる|ませんでした|ましょうか|ましょう|ません|ました|まして|ます|ませ|でした|でしょうか|でしょう|ですが|ですね|ですよ|ですか|です/g;

// ---------------------------------------------------------------------------
// Core counter
// ---------------------------------------------------------------------------

function countMatches(text, pattern) {
  const re = new RegExp(pattern.source, pattern.flags);
  const m = text.match(re);
  return m ? m.length : 0;
}

function analyzePoliteMarkers(line) {
  const counts = {};
  for (const [key, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    counts[key] = countMatches(line, pattern);
  }

  const totalMatches = line.match(new RegExp(TOTAL_PATTERN.source, TOTAL_PATTERN.flags));
  counts.total_polite_count = totalMatches ? totalMatches.length : 0;

  const charLen = line.replace(/\s/g, "").length;
  counts.polite_density =
    charLen > 0 ? (counts.total_polite_count / charLen).toFixed(4) : "0.0000";

  return counts;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const inputFile =
  args[0] ||
  path.resolve(__dirname, "../src/data/script_tagged.csv");
const outputFile =
  args[1] || inputFile.replace(/\.csv$/i, "_polite.csv");

console.log(`Reading  ${inputFile}`);
const content = fs.readFileSync(inputFile, "utf-8");
const { data: rows, errors } = Papa.parse(content, {
  header: true,
  skipEmptyLines: true,
});

if (errors.length) {
  console.warn(`Parse warnings: ${errors.length}`);
}

const enriched = rows.map((row) => {
  const markers = analyzePoliteMarkers(row.line || "");
  return { ...row, ...markers };
});

const csv = Papa.unparse(enriched);
fs.writeFileSync(outputFile, csv, "utf-8");
console.log(`Written  ${outputFile}`);
console.log(`Rows     ${enriched.length}`);

// Aggregate stats
const agg = {};
const keys = [...Object.keys(CATEGORY_PATTERNS), "total_polite_count"];
for (const k of keys) agg[k] = 0;

for (const row of enriched) {
  for (const k of keys) agg[k] += Number(row[k]);
}

console.log("\nAggregate counts across all lines:");
for (const [k, v] of Object.entries(agg)) {
  console.log(`  ${k.padEnd(22)} ${v}`);
}

const nonZero = enriched.filter((r) => Number(r.total_polite_count) > 0).length;
console.log(`\nLines with ≥1 polite marker: ${nonZero} / ${enriched.length}`);
