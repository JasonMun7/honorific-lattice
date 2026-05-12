#!/usr/bin/env node
/**
 * Updates filmData.json with corpus-derived basePower and socialDistance.
 * Only Spirited Away characters that appear in dyad_metrics.csv are touched;
 * all other characters (and all non-SA films) keep their existing values.
 *
 * ═══════════════════════════════════════════════════════════════
 * basePower FORMULA
 * ═══════════════════════════════════════════════════════════════
 *
 * basePower encodes how much upward deference a character *receives*
 * net of the upward deference they *give*. A character who is spoken
 * to formally by many people but speaks informally themselves scores
 * high; a character who defers to everyone scores low.
 *
 * Step 1 — received score
 *   Collect every directed dyad A→X where X is the character of interest.
 *   Group-addressed dyads (e.g. "group:bathhouse workers") are DECOMPOSED:
 *   each named member of the group receives the full dyad formality as a
 *   separate data point (all members heard the speech equally).
 *   Group memberships are defined in GROUP_MEMBERS_JA below.
 *
 *   received_score(X) = mean(f_values) × log(1 + N)
 *
 *   The log factor rewards *breadth* — a character spoken to formally
 *   by 5 different people scores higher than one addressed formally
 *   by only 1 person with the same average formality.
 *
 * Step 2 — given score
 *   Collect every directed dyad X→B (including group addressees, since
 *   giving formal speech to a group still costs deference capital).
 *
 *   given_score(X) = mean(f_values) × log(1 + N)
 *
 * Step 3 — net deference and scale
 *   net(X) = received_score(X) − given_score(X)
 *   basePower(X) = linear_scale(net(X), net_min, net_max, 0, 10)
 *   Rounded to one decimal place.
 *
 * Limitation: corpus-derived basePower reflects *conversational deference
 * received*, not strict narrative authority. Characters addressed formally
 * in few but intense interactions (e.g. BandaiKaeru by Chihiro) may score
 * higher than their institutional rank would suggest. See FINDINGS.md §11.
 *
 * ═══════════════════════════════════════════════════════════════
 * socialDistance FORMULA (from derive-dyad-metrics.mjs)
 * ═══════════════════════════════════════════════════════════════
 *
 * For directed link A→B, using formality values f_AB and f_BA from the corpus:
 *
 *   social_gap  = max(f_AB, f_BA)
 *   asymmetry   = max(0, f_AB − f_BA)
 *   raw_sD      = social_gap × 0.70 + asymmetry × 0.60 + 1.00
 *   socialDistance_AB = clamp(raw_sD, 1, 4)
 *
 * socialDistance is DIRECTIONAL — A→B and B→A can differ. In the
 * 3D visualization, both directed links exist as separate spring forces,
 * so the equilibrium distance between two nodes reflects the sum of
 * both directed social distances.
 *
 * How socialDistance is visualized (ForceGraph.jsx / honorificLinkMetrics.js):
 *   spring length : 6 + formality × 2.2 + socialDistance × 0.9
 *   line width    : 1.15 + formality × 0.85 + socialDistance × 0.28 + hier × 1.35
 *   dash size     : 0.38 + formality × 0.14 + socialDistance × 0.05
 *   gap size      : 0.14 + socialDistance × 0.07 + formality × 0.03
 *   opacity       : 0.34 + formality × 0.10 + socialDistance × 0.045 + hier × 0.12
 * Higher socialDistance → longer spring, wider/more opaque line, larger dashes.
 * ═══════════════════════════════════════════════════════════════
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Papa = require("papaparse");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Name maps
// ---------------------------------------------------------------------------

/** Japanese script names → English filmData.json node IDs */
const JA_TO_EN = {
  "千尋": "Chihiro",
  "湯婆婆": "Yubaba",
  "銭婆": "Zeniba",
  "ハク": "Haku",
  "釜爺": "Kamaji",
  "リン": "Lin",
  "顔無し": "NoFace",
  "顔無し(兄役)": "NoFace",
  "顔無し(青蛙)": "NoFace",
  "坊": "Boh",
  "番台蛙": "BandaiKaeru",
  "青蛙": "Aogaeru",
  "青蛙、": "Aogaeru",     // tagger variant with trailing punctuation
  "兄役": "Foreman",
  "父役": "Chichiyaku",
  "河の神": "RiverSpirit",
  "お白様": "RadishSpirit",
  "お父さん": "ChihiroFather",
  "お母さん": "ChihiroMother",
};

/** English node IDs → Japanese (derived from JA_TO_EN, primary form only) */
const EN_TO_JA = {};
for (const [ja, en] of Object.entries(JA_TO_EN)) {
  if (!EN_TO_JA[en]) EN_TO_JA[en] = ja; // first/canonical mapping wins
}

/** Group addressees → Japanese member names */
const GROUP_MEMBERS_JA = {
  "group:arriving guests":          ["河の神", "お白様"],
  "group:bathhouse guests":         ["河の神", "お白様"],
  "group:bathhouse visitors":       ["河の神", "お白様"],
  "group:bathhouse workers":        ["リン", "兄役", "青蛙", "番台蛙"],
  "group:bathhouse staff":          ["リン", "兄役", "青蛙", "番台蛙"],
  "group:workers":                  ["リン", "兄役", "青蛙", "番台蛙"],
  "group:family":                   ["千尋", "お父さん", "お母さん"],
  "group:family in car":            ["千尋", "お父さん", "お母さん"],
  "group:湯婆婆 and associates":     ["湯婆婆"],
};

// ---------------------------------------------------------------------------
// Load dyad metrics
// ---------------------------------------------------------------------------

const metricsPath = path.join(ROOT, "src/data/dyad_metrics.csv");
const { data: dyads } = Papa.parse(
  fs.readFileSync(metricsPath, "utf-8"),
  { header: true, skipEmptyLines: true }
);

// Build lookup: "speaker|addressee" → { formality, socialDistance }
const dyadLookup = new Map();
for (const d of dyads) {
  dyadLookup.set(`${d.speaker}|${d.addressee}`, {
    formality: Number(d.formality),
    socialDistance: Number(d.socialDistance),
  });
}

// ---------------------------------------------------------------------------
// Compute basePower per character
// ---------------------------------------------------------------------------

/** received[jaName] = array of formality values directed at this character */
const received = {};
/** given[jaName] = array of formality values this character directed outward */
const given = {};

const ALL_JA = new Set(Object.keys(JA_TO_EN));

function ensureChar(ja) {
  if (!received[ja]) received[ja] = [];
  if (!given[ja]) given[ja] = [];
}

for (const d of dyads) {
  const { speaker, addressee, formality } = d;
  const f = Number(formality);

  // given: attribute to speaker
  const spk = speaker.trim();
  if (ALL_JA.has(spk)) {
    ensureChar(spk);
    given[spk].push(f);
  }

  // received: attribute to addressee(s)
  const addr = addressee.trim();
  const members = GROUP_MEMBERS_JA[addr] ?? (ALL_JA.has(addr) ? [addr] : null);
  if (members) {
    for (const m of members) {
      if (ALL_JA.has(m)) {
        ensureChar(m);
        received[m].push(f);
      }
    }
  }
}

function logWeightedScore(values) {
  if (!values || values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return mean * Math.log(1 + values.length);
}

const netDeference = {};
const allJaChars = new Set([...Object.keys(received), ...Object.keys(given)]);

for (const ja of allJaChars) {
  const r = logWeightedScore(received[ja] ?? []);
  const g = logWeightedScore(given[ja] ?? []);
  netDeference[ja] = r - g;
}

// Scale to 0–10 using min/max across characters with an English mapping
const mappedNets = Object.entries(netDeference)
  .filter(([ja]) => JA_TO_EN[ja])
  .map(([, net]) => net);

const netMin = Math.min(...mappedNets);
const netMax = Math.max(...mappedNets);

function scaleToPower(net) {
  if (netMax === netMin) return 5;
  return Math.round(((net - netMin) / (netMax - netMin)) * 100) / 10; // 0–10, 1dp
}

const corpusBasePower = {};
for (const [ja, net] of Object.entries(netDeference)) {
  const en = JA_TO_EN[ja];
  if (en) corpusBasePower[en] = scaleToPower(net);
}

// ---------------------------------------------------------------------------
// Update filmData.json
// ---------------------------------------------------------------------------

const filmDataPath = path.join(ROOT, "src/data/filmData.json");
const filmData = JSON.parse(fs.readFileSync(filmDataPath, "utf-8"));

let nodesUpdated = 0;
let linksUpdated = 0;

// Nodes — basePower
for (const node of filmData.nodes) {
  const newBP = corpusBasePower[node.id];
  if (newBP !== undefined) {
    const old = node.basePower;
    node.basePower = newBP;
    console.log(`  node ${node.id.padEnd(18)} basePower ${String(old).padStart(4)} → ${newBP}`);
    nodesUpdated++;
  }
}

// Links — socialDistance
for (const link of filmData.links) {
  const srcJa = EN_TO_JA[link.source];
  const tgtJa = EN_TO_JA[link.target];
  if (!srcJa || !tgtJa) continue;

  const entry = dyadLookup.get(`${srcJa}|${tgtJa}`);
  if (!entry) continue;

  const oldSd = link.socialDistance;
  link.socialDistance = round(entry.socialDistance, 2);
  console.log(
    `  link ${link.source.padEnd(14)} → ${link.target.padEnd(16)} sD ${String(oldSd).padStart(5)} → ${link.socialDistance}`
  );
  linksUpdated++;
}

// ---------------------------------------------------------------------------
// Add missing reverse links for SA character pairs
//
// For each directed link A→B where B→A does not exist and both endpoints
// have Japanese name mappings, we synthesize the reverse link:
//
//   formality    : dyad_metrics formality(B→A) if the dyad appears in the
//                  corpus; 0 otherwise (no polite speech observed).
//
//   socialDistance : dyad_metrics socialDistance(B→A) if available;
//                  otherwise the floor value of 1.0, since we cannot
//                  infer social stretch from an unobserved interaction.
//
//   label        : auto-generated to indicate register level and origin.
//
// This makes socialDistance fully dyadic: every pair with at least one
// directed link now has BOTH directions represented.
// ---------------------------------------------------------------------------

const SA_IDS = new Set(Object.keys(EN_TO_JA));
const existingLinkKeys = new Set(filmData.links.map((l) => `${l.source}|${l.target}`));

const reverseLinkLabels = (f, srcEn, tgtEn) => {
  if (f >= 2) return `Corpus: formal reply (${srcEn}→${tgtEn})`;
  if (f >= 0.5) return `Corpus: polite acknowledgment (${srcEn}→${tgtEn})`;
  return `Corpus: plain speech (${srcEn}→${tgtEn})`;
};

let reverseAdded = 0;
const toAdd = [];

for (const link of filmData.links) {
  if (!SA_IDS.has(link.source) || !SA_IDS.has(link.target)) continue;
  const revKey = `${link.target}|${link.source}`;
  if (existingLinkKeys.has(revKey)) continue; // already exists

  const tgtJa = EN_TO_JA[link.target];
  const srcJa = EN_TO_JA[link.source];
  if (!tgtJa || !srcJa) continue;

  const revEntry = dyadLookup.get(`${tgtJa}|${srcJa}`);
  const revF = revEntry ? round(revEntry.formality, 2) : 0;
  const revSd = revEntry ? round(revEntry.socialDistance, 2) : 1;
  const hasData = !!revEntry;

  toAdd.push({
    source: link.target,
    target: link.source,
    formality: revF,
    label: reverseLinkLabels(revF, link.target, link.source),
    socialDistance: revSd,
  });

  console.log(
    `  ADD ${link.target.padEnd(14)} → ${link.source.padEnd(14)}` +
    ` f=${String(revF).padEnd(5)} sD=${revSd}` +
    (hasData ? "" : "  [no corpus data → floor sD=1]")
  );
  reverseAdded++;
}

filmData.links.push(...toAdd);

// Write
fs.writeFileSync(filmDataPath, JSON.stringify(filmData, null, 2) + "\n", "utf-8");

console.log(
  `\nDone. Nodes updated: ${nodesUpdated}  Links updated: ${linksUpdated}  Reverse links added: ${reverseAdded}`
);

// Summary table
console.log("\nCorpus basePower (sorted high→low):");
const sorted = Object.entries(corpusBasePower).sort((a, b) => b[1] - a[1]);
for (const [en, bp] of sorted) {
  const netStr = netDeference[EN_TO_JA[en]]?.toFixed(3) ?? "—";
  console.log(`  ${en.padEnd(18)} basePower=${String(bp).padStart(5)}  net=${netStr}`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function round(n, d) { return parseFloat(n.toFixed(d)); }
