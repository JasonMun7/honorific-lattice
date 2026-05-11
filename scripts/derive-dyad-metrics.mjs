#!/usr/bin/env node
/**
 * Derives `formality` and `socialDistance` for each speaker→addressee dyad
 * from polite-marker counts produced by count-polite.mjs.
 *
 * ═══════════════════════════════════════════════════════════════
 * FORMULA DOCUMENTATION
 * ═══════════════════════════════════════════════════════════════
 *
 * ── Step 1: Per-line polite load ────────────────────────────────
 * Combine the five marker categories by register level:
 *
 *   load = gozaimasu_count × 3   (teichōgo — very formal)
 *         + honorific_verb_count × 2   (sonkeigo — honors addressee)
 *         + humble_verb_count   × 2   (kenjōgo  — lowers speaker)
 *         + masu_count          × 1   (teineigo  — polite stem)
 *         + desu_count          × 0.5 (teineigo  — polite copula)
 *
 * Weights reflect the hierarchy of Japanese register levels.
 * Lines addressed to "self", "unknown", or "" are excluded.
 *
 * ── Step 2: Raw formality per directed dyad A→B ─────────────────
 *
 *   raw_AB = mean(load) over all lines where speaker=A, addressee=B
 *
 * A dyad with fewer than MIN_LINES lines is still included but
 * marked with low_sample=true as a reliability flag.
 *
 * ── Step 3: Formality (0–3 scale) ───────────────────────────────
 * Normalize using the 95th-percentile of all raw scores as ceiling,
 * so the most formal dyads in the corpus approach 3:
 *
 *   formality_AB = min(3,  raw_AB / p95 × 3)
 *
 * p95 is corpus-derived and logged at runtime. Using p95 rather
 * than max prevents a single outlier line from compressing all
 * other dyads toward zero.
 *
 * ── Step 4: Social distance (1–4 scale, directed A→B) ───────────
 * Social distance encodes objective social stretch in the interaction.
 * It depends on both directions of the dyad:
 *
 *   f_AB  = formality(A→B)        (computed above)
 *   f_BA  = formality(B→A)        (0 if B never speaks to A)
 *
 *   social_gap  = max(f_AB, f_BA)
 *               captures the deepest hierarchy signal in the dyad —
 *               whichever speaker faces the steeper upward climb.
 *
 *   asymmetry_AB = max(0, f_AB − f_BA)
 *               rewards one-sided deferral: A speaking up while B
 *               speaks down signals a clear power differential.
 *
 *   raw_sD_AB = social_gap × 0.70 + asymmetry_AB × 0.60 + 1.00
 *
 *   socialDistance_AB = clamp(raw_sD_AB, 1, 4)
 *
 * The +1 floor ensures even plain-speech dyads carry minimum distance,
 * consistent with the existing data (minimum observed sD = 1.0).
 *
 * Coefficients (0.70, 0.60) were chosen so that a maximally asymmetric
 * dyad (f_AB=3, f_BA=0) yields raw_sD = 3×0.7 + 3×0.6 + 1 = 4.9 → 4,
 * matching the hand-coded Chihiro→Yubaba value.
 * ═══════════════════════════════════════════════════════════════
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Papa = require("papaparse");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const inputFile =
  args[0] || path.resolve(__dirname, "../src/data/script_tagged_polite.csv");
const outputFile =
  args[1] || path.resolve(__dirname, "../src/data/dyad_metrics.csv");

const MIN_LINES = 3; // flag dyads below this as low_sample

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------
const content = fs.readFileSync(inputFile, "utf-8");
const { data: rows } = Papa.parse(content, { header: true, skipEmptyLines: true });
console.log(`Loaded ${rows.length} lines from ${path.basename(inputFile)}`);

// ---------------------------------------------------------------------------
// Step 1 — per-line polite load
// ---------------------------------------------------------------------------
const WEIGHTS = {
  gozaimasu_count: 3,
  honorific_verb_count: 2,
  humble_verb_count: 2,
  masu_count: 1,
  desu_count: 0.5,
};

function politeLoad(row) {
  let load = 0;
  for (const [col, w] of Object.entries(WEIGHTS)) {
    load += (Number(row[col]) || 0) * w;
  }
  return load;
}

// ---------------------------------------------------------------------------
// Step 2 — aggregate by dyad
// ---------------------------------------------------------------------------
const EXCLUDE_ADDRESSEES = new Set(["self", "unknown", ""]);

const dyadMap = new Map();
for (const row of rows) {
  const speaker = (row.speaker || "").trim();
  const addressee = (row.addressee || "").trim();
  if (!speaker || EXCLUDE_ADDRESSEES.has(addressee.toLowerCase())) continue;

  const key = `${speaker}|${addressee}`;
  if (!dyadMap.has(key)) {
    dyadMap.set(key, { speaker, addressee, loads: [] });
  }
  dyadMap.get(key).loads.push(politeLoad(row));
}

const dyads = [];
for (const { speaker, addressee, loads } of dyadMap.values()) {
  const line_count = loads.length;
  const raw_formality = loads.reduce((a, b) => a + b, 0) / line_count;
  dyads.push({ speaker, addressee, line_count, raw_formality });
}

// ---------------------------------------------------------------------------
// Step 3 — scale to formality 0–3
// ---------------------------------------------------------------------------
const sortedRaws = dyads.map((d) => d.raw_formality).sort((a, b) => a - b);
const p95idx = Math.floor(sortedRaws.length * 0.95);
const p95 = sortedRaws[p95idx] || 1; // fallback to 1 if corpus is tiny
const SCALE = 3 / p95;

console.log(
  `Raw formality — p95: ${p95.toFixed(4)}, scale: ×${SCALE.toFixed(4)},` +
    ` max: ${sortedRaws[sortedRaws.length - 1].toFixed(4)}`
);

for (const d of dyads) {
  d.formality = Math.min(3, d.raw_formality * SCALE);
}

// Build lookup: "speaker|addressee" → formality
const fLookup = new Map(dyads.map((d) => [`${d.speaker}|${d.addressee}`, d.formality]));

// ---------------------------------------------------------------------------
// Step 4 — social distance
// ---------------------------------------------------------------------------
for (const d of dyads) {
  const f_AB = d.formality;
  const f_BA = fLookup.get(`${d.addressee}|${d.speaker}`) ?? 0;

  const social_gap = Math.max(f_AB, f_BA);
  const asymmetry = Math.max(0, f_AB - f_BA);
  const raw_sD = social_gap * 0.7 + asymmetry * 0.6 + 1.0;

  d.formality_reverse = round(f_BA, 3);
  d.socialDistance = round(Math.min(4, Math.max(1, raw_sD)), 3);
  d.formality = round(f_AB, 3);
  d.raw_formality = round(d.raw_formality, 4);
  d.low_sample = d.line_count < MIN_LINES;
}

// Sort by formality descending
dyads.sort((a, b) => b.formality - a.formality || b.socialDistance - a.socialDistance);

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
const csv = Papa.unparse(dyads);
fs.writeFileSync(outputFile, csv, "utf-8");
console.log(`\nWritten ${path.basename(outputFile)} (${dyads.length} dyads)`);

// Print summary table
const nonZero = dyads.filter((d) => d.formality > 0);
console.log(`\nDyads with formality > 0: ${nonZero.length} / ${dyads.length}`);
console.log(
  "\n" +
    "speaker".padEnd(14) +
    "addressee".padEnd(24) +
    "n".padStart(4) +
    "  formality".padStart(11) +
    "  f_reverse".padStart(12) +
    "  sD".padStart(6) +
    "  low_sample"
);
console.log("─".repeat(80));
for (const d of dyads.filter((d) => d.formality > 0)) {
  console.log(
    d.speaker.padEnd(14) +
      d.addressee.padEnd(24) +
      String(d.line_count).padStart(4) +
      String(d.formality.toFixed(3)).padStart(11) +
      String(d.formality_reverse.toFixed(3)).padStart(12) +
      String(d.socialDistance.toFixed(3)).padStart(6) +
      (d.low_sample ? "  ⚠ low" : "")
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function round(n, decimals) {
  return parseFloat(n.toFixed(decimals));
}
