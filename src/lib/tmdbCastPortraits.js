/**
 * Optional headshots from The Movie Database (TMDB) credits when no curated URL exists.
 * Set `VITE_TMDB_READ_ACCESS_TOKEN` (Bearer) and/or `VITE_TMDB_API_KEY` in `.env`.
 * https://developer.themoviedb.org/docs/getting-started
 */

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185";

/**
 * Course film title (must match node.film in filmData.json) → TMDB movie id.
 * Animated films are intentionally excluded — TMDB returns voice-actor headshots,
 * not character art. Spirited Away and Millennium Actress use curated Wikia URLs.
 */
const FILM_TITLE_TO_TMDB_ID = {
  "Rashōmon": "548",
  "I Was Born, But…": "28268",
  "Late Spring": "20530",
  "The Mourning Forest": "2010",
  "Tampopo": "11830",
  "Funeral Parade of Roses": "1556",
  "House (Hausu)": "25623",
  "Ringu": "2671",
  "Kamome Diner": "25657",
  "One Cut of the Dead": "513434",
};

/** Extra phrases to match TMDB `cast[].character` (English credits) to graph node ids. */
const NODE_ID_MATCH_HINTS = {
  // Rashōmon
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
  house_Prof: ["prof", "glasses"],
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
  onecut_ZombieHorde: ["zombie", "horde", "extras"],
};

let creditsCache = new Map();

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function camelToWords(id) {
  return String(id || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");
}

function collectNodePhrases(node) {
  const out = new Set();
  const add = (s) => {
    const n = norm(s);
    if (n.length >= 2) out.add(n);
  };
  add(node?.name);
  add(node?.id);
  add(camelToWords(node?.id));
  const hints = NODE_ID_MATCH_HINTS[node?.id];
  if (hints) for (const h of hints) add(h);
  return [...out];
}

function bestCastMatch(node, cast) {
  const phrases = collectNodePhrases(node);
  if (!phrases.length || !cast?.length) return null;

  let best = null;
  let bestScore = 0;

  for (const row of cast) {
    const path = row?.profile_path;
    if (!path || typeof path !== "string") continue;

    const bucket = norm([row.character, row.name].filter(Boolean).join(" "));
    if (!bucket.length) continue;

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
        best = path;
      }
    }
  }

  return bestScore >= 40 ? best : null;
}

async function fetchCredits(movieId, signal) {
  if (creditsCache.has(movieId)) return creditsCache.get(movieId);

  const token = import.meta.env?.VITE_TMDB_READ_ACCESS_TOKEN;
  const apiKey = import.meta.env?.VITE_TMDB_API_KEY;
  if (!token && !apiKey) {
    creditsCache.set(movieId, null);
    return null;
  }

  let url = `https://api.themoviedb.org/3/movie/${movieId}/credits`;
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (apiKey) url += `?api_key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { headers, signal });
  if (!res.ok) {
    creditsCache.set(movieId, null);
    return null;
  }
  const data = await res.json();
  const cast = Array.isArray(data?.cast) ? data.cast : [];
  creditsCache.set(movieId, cast);
  return cast;
}

/**
 * @param {{ id: string; name?: string; film?: string }} node
 * @param {AbortSignal} [signal]
 * @returns {Promise<string | null>} HTTPS image URL or null
 */
export async function resolveTmdbPortraitUrl(node, signal) {
  const film = node?.film;
  const movieId = film ? FILM_TITLE_TO_TMDB_ID[film] : null;
  if (!movieId) return null;

  const cast = await fetchCredits(movieId, signal);
  if (!cast?.length) return null;

  const path = bestCastMatch(node, cast);
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}${path}`;
}
