/**
 * Fetch TMDB portrait URLs for all character nodes and write them into
 * src/data/characterPortraitUrls.json.
 *
 * Existing curated URLs are preserved unless --force is passed.
 *
 * Usage:
 *   node scripts/fetch-tmdb-portraits.mjs
 *   node scripts/fetch-tmdb-portraits.mjs --force      # overwrite existing entries
 *   node scripts/fetch-tmdb-portraits.mjs --dry-run    # show matches without writing
 *
 * Reads VITE_TMDB_READ_ACCESS_TOKEN (Bearer) or VITE_TMDB_API_KEY (v3) from .env.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// ── .env loader ──────────────────────────────────────────────────────────────
const envPath = path.join(root, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "").trim();
    }
  }
}

const TOKEN = process.env.VITE_TMDB_READ_ACCESS_TOKEN;
const API_KEY = process.env.VITE_TMDB_API_KEY;
const FORCE = process.argv.includes("--force");
const DRY_RUN = process.argv.includes("--dry-run");

if (!TOKEN && !API_KEY) {
  console.error(
    "Error: set VITE_TMDB_READ_ACCESS_TOKEN or VITE_TMDB_API_KEY in .env"
  );
  process.exit(1);
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185";

// Animated films where TMDB returns voice-actor headshots instead of character art.
// Their curated character URLs are already in characterPortraitUrls.json; skip here.
const SKIP_TMDB_FILMS = new Set(["Spirited Away", "Millennium Actress"]);

// ── String helpers ───────────────────────────────────────────────────────────
function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacriticals (ō→o, etc.)
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // remove parentheticals like "(Hausu)"
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Strip film-prefix from node IDs like "rashomon_Tajomaru" → "Tajomaru"
// and split camelCase like "ChihiroFather" → "Chihiro Father"
function nodeIdToWords(id) {
  return String(id || "")
    .replace(/^[a-z]+_/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");
}

// ── TMDB fetch ───────────────────────────────────────────────────────────────
async function tmdbFetch(endpoint) {
  const base = "https://api.themoviedb.org/3";
  const sep = endpoint.includes("?") ? "&" : "?";
  const url = TOKEN
    ? `${base}${endpoint}`
    : `${base}${endpoint}${sep}api_key=${encodeURIComponent(API_KEY)}`;
  const headers = { Accept: "application/json" };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return res.json();
}

async function searchMovieId(title, year) {
  const q = new URLSearchParams({ query: title, year: String(year), language: "en-US", page: "1" });
  const data = await tmdbFetch(`/search/movie?${q}`);
  const results = data?.results;
  if (!results?.length) return null;
  // Prefer exact year match, otherwise take top result
  const exact = results.find((r) => r.release_date?.startsWith(String(year)));
  return String((exact ?? results[0]).id);
}

async function fetchCredits(movieId) {
  const data = await tmdbFetch(`/movie/${movieId}/credits`);
  return Array.isArray(data?.cast) ? data.cast : [];
}

// ── Match hints ──────────────────────────────────────────────────────────────
// Extra phrases to match TMDB `cast[].character` text to graph node IDs.
// Spirited Away is animated — its nodes are handled by curated Wikia URLs or
// the runtime TMDB fallback in tmdbCastPortraits.js; no hints needed here.
const HINTS = {
  // Rashōmon — TMDB credits list actor names; character names are often untranslated
  rashomon_Tajomaru: ["tajomaru", "bandit"],
  rashomon_Takehiro: ["takehiro", "samurai", "husband"],
  rashomon_Masako: ["masako", "wife", "woman"],
  rashomon_Woodcutter: ["woodcutter", "kichijiro"],
  rashomon_Priest: ["priest", "monk"],
  rashomon_Commoner: ["commoner"],

  // I Was Born, But…
  bornbut_Taro: ["taro", "older brother", "eldest son"],
  bornbut_Jiro: ["jiro", "younger brother"],
  bornbut_Father: ["father", "dad", "yoshi"],
  bornbut_Mother: ["mother", "mom"],
  bornbut_Teacher: ["teacher", "yamamoto"],
  bornbut_BullyBossSon: ["boss", "son", "bully"],

  // Late Spring
  latespring_Noriko: ["noriko"],
  latespring_Shukichi: ["shukichi", "father", "professor somiya"],
  latespring_AuntMasa: ["masa", "aunt", "matchmaker"],
  latespring_ProfessorHattori: ["hattori"],
  latespring_MrsTaguchi: ["taguchi"],
  latespring_MissMiwa: ["miwa", "aya"],

  // The Mourning Forest
  mourning_Machiko: ["machiko"],
  mourning_Shigeki: ["shigeki"],
  mourning_Nurse: ["nurse"],
  mourning_NeighborFarmer: ["farmer", "neighbor"],
  mourning_FuneralOfficiant: ["officiant", "funeral", "rite"],
  mourning_ForestGuide: ["guide", "forest"],

  // Millennium Actress
  millennium_Chiyoko: ["chiyoko", "fujiwara"],
  millennium_Genya: ["genya", "tachibana", "documentarian", "interviewer"],
  millennium_Eiko: ["eiko", "shimao", "rival"],
  millennium_Kyoji: ["kyoji", "ida", "producer", "studio"],
  millennium_Mino: ["mino", "assistant", "driver"],
  millennium_Interviewer: ["interviewer", "host"],

  // Tampopo
  tampopo_Tampopo: ["tampopo"],
  tampopo_Goro: ["goro"],
  tampopo_Pisuken: ["pisuken", "gun", "pistolero"],
  tampopo_Chu: ["chu", "ramen master", "sensei"],
  tampopo_Shohei: ["shohei"],
  tampopo_OilMerchant: ["oil merchant"],

  // Funeral Parade of Roses
  roses_Eddie: ["eddie"],
  roses_Leda: ["leda"],
  roses_Gonda: ["gonda", "boss"],
  roses_Sabu: ["sabu", "lieutenant"],
  roses_FilmDirector: ["director"],
  roses_RiotPolice: ["police", "riot", "captain"],

  // House (Hausu)
  house_Gorgeous: ["gorgeous", "oshare"],
  house_Auntie: ["auntie", "aunt", "oba"],
  house_KungFu: ["kung fu", "kungfu"],
  house_Fantasy: ["fantasy", "fanta"],
  house_Prof: ["prof", "me", "glasses"],
  house_Mac: ["mac", "musician"],

  // Ringu
  ringu_Reiko: ["reiko", "asakawa"],
  ringu_Ryuji: ["ryuji", "takayama"],
  ringu_Yoichi: ["yoichi"],
  ringu_Sadako: ["sadako", "yamamura", "ghost", "well"],
  ringu_Okazaki: ["okazaki"],
  ringu_Takashi: ["takashi", "grandfather"],

  // Kamome Diner
  kamome_Sachie: ["sachie", "harada", "owner"],
  kamome_Midori: ["midori"],
  kamome_Masako: ["masako"],
  kamome_Matsushima: ["matsushima"],
  kamome_RealEstate: ["real estate", "agent", "broker"],
  kamome_Postman: ["postman", "mailman"],

  // One Cut of the Dead
  onecut_Takayuki: ["takayuki", "higuchi", "director"],
  onecut_Chinatsu: ["chinatsu", "kawasumi"],
  onecut_Ko: ["ko", "actor"],
  onecut_Harumi: ["harumi"],
  onecut_Mitsu: ["mitsu", "producer"],
  onecut_ZombieHorde: ["zombie", "horde", "extras", "chorus"],
};

// ── Character matching ───────────────────────────────────────────────────────
function collectPhrases(node) {
  const out = new Set();
  const add = (s) => {
    const n = norm(s);
    if (n.length >= 2) out.add(n);
  };
  add(node.name);
  add(node.id);
  add(nodeIdToWords(node.id));
  for (const h of HINTS[node.id] ?? []) add(h);
  return [...out];
}

function bestCastMatch(node, cast) {
  const phrases = collectPhrases(node);
  if (!phrases.length || !cast.length) return null;
  let best = null;
  let bestScore = 0;
  for (const row of cast) {
    if (!row?.profile_path) continue;
    const bucket = norm([row.character, row.name].filter(Boolean).join(" "));
    if (!bucket) continue;
    for (const phrase of phrases) {
      if (phrase.length < 3) continue;
      let score = 0;
      if (bucket === phrase) score = 120;
      else if (bucket.includes(phrase) || phrase.includes(bucket)) score = 100;
      else {
        const pw = phrase.split(" ").filter((w) => w.length > 2);
        const bw = bucket.split(" ").filter((w) => w.length > 2);
        const hit = pw.filter((w) => bw.some((b) => b.includes(w) || w.includes(b))).length;
        if (hit > 0) score = 40 + hit * 15;
      }
      if (score > bestScore) {
        bestScore = score;
        best = row.profile_path;
      }
    }
  }
  return bestScore >= 40 ? best : null;
}

// ── Film → TMDB ID resolution ────────────────────────────────────────────────
// Match filmData `film` string to a courseFilms entry using normalized comparison.
function matchCourseFilm(filmName, courseFilms) {
  const nf = norm(filmName);
  let best = null;
  let bestScore = 0;
  for (const cf of courseFilms) {
    const nc = norm(cf.title);
    if (nc === nf) return cf; // exact match
    // Partial: check word overlap
    const fw = nf.split(" ").filter((w) => w.length > 1);
    const cw = nc.split(" ").filter((w) => w.length > 1);
    const [shorter, longer] = fw.length <= cw.length ? [fw, cw] : [cw, fw];
    if (!shorter.length) continue;
    const hits = shorter.filter((w) =>
      longer.some((l) => l.includes(w) || w.includes(l))
    ).length;
    const score = hits / shorter.length;
    if (score > bestScore) {
      bestScore = score;
      best = cf;
    }
  }
  return bestScore >= 0.6 ? best : null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const filmData = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/filmData.json"), "utf8")
);
const courseFilms = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/courseFilms.json"), "utf8")
);
const portraits = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/characterPortraitUrls.json"), "utf8")
);

if (DRY_RUN) console.log("=== DRY RUN — no files will be written ===\n");

// Group nodes by film string
const nodesByFilm = new Map();
for (const node of filmData.nodes) {
  const key = node.film ?? "unknown";
  if (!nodesByFilm.has(key)) nodesByFilm.set(key, []);
  nodesByFilm.get(key).push(node);
}

const knownIds = { "Spirited Away": "129", "Millennium Actress": "968100" };
let added = 0;
let skipped = 0;
let missed = 0;

for (const [filmName, nodes] of nodesByFilm) {
  if (SKIP_TMDB_FILMS.has(filmName)) {
    console.log(`\nSkipping "${filmName}" (animated — curated URLs already set)`);
    skipped += nodes.length;
    continue;
  }

  const cf = matchCourseFilm(filmName, courseFilms);
  if (!cf) {
    console.warn(`⚠  No course-film match for "${filmName}" — skipping`);
    missed += nodes.length;
    continue;
  }

  let movieId = knownIds[filmName];
  if (!movieId) {
    process.stdout.write(`Searching TMDB for "${cf.title}" (${cf.year})… `);
    movieId = await searchMovieId(cf.title, cf.year);
    if (!movieId) {
      console.log("not found");
      missed += nodes.length;
      continue;
    }
    console.log(`ID ${movieId}`);
    knownIds[filmName] = movieId;
  } else {
    console.log(`\n"${filmName}" — using known TMDB ID ${movieId}`);
  }

  process.stdout.write(`Fetching credits… `);
  const cast = await fetchCredits(movieId);
  console.log(`${cast.length} cast members`);

  for (const node of nodes) {
    if (!FORCE && portraits[node.id]) {
      skipped++;
      continue;
    }
    const profilePath = bestCastMatch(node, cast);
    if (profilePath) {
      const url = `${TMDB_IMAGE_BASE}${profilePath}`;
      console.log(`  ✓  ${node.id} → ${url}`);
      if (!DRY_RUN) portraits[node.id] = url;
      added++;
    } else {
      console.log(`  ✗  ${node.id} — no match`);
      missed++;
    }
  }
}

if (!DRY_RUN) {
  fs.writeFileSync(
    path.join(root, "src/data/characterPortraitUrls.json"),
    `${JSON.stringify(portraits, null, 2)}\n`
  );
}

console.log(
  `\n${DRY_RUN ? "[dry run] " : ""}Done: ${added} added, ${skipped} skipped (already had URL), ${missed} unmatched.`
);