/**
 * Optional headshots from The Movie Database (TMDB) credits when no curated URL exists.
 * Set `VITE_TMDB_READ_ACCESS_TOKEN` (Bearer) and/or `VITE_TMDB_API_KEY` in `.env`.
 * https://developer.themoviedb.org/docs/getting-started
 */

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185";

/** Course film title → TMDB movie id (numeric string). Extend as you add films. */
const FILM_TITLE_TO_TMDB_ID = {
  "Spirited Away": "129",
};

/** Extra phrases to match TMDB `cast[].character` (English credits) to graph node ids. */
const NODE_ID_MATCH_HINTS = {
  NoFace: ["kaonashi", "no-face", "no face"],
  RiverSpirit: ["river spirit", "stink spirit"],
  ChihiroFather: ["akio", "chihiro's father", "chihiros father"],
  ChihiroMother: ["yuko", "ichiyuko", "chihiro's mother", "chihiros mother"],
  BandaiKaeru: ["bandai", "chicken"],
  OtoriSama: ["otori", "duck"],
  GoldCustomerSpirit: ["gold", "customer", "patron"],
  SeaGhostGuest: ["slime", "sea ghost", "guest"],
  BathhouseDoorman: ["doorman", "bridge", "gate"],
  AssistantGreeter: ["greeter", "entry", "lobby"],
  KitchenWorker: ["kitchen"],
  BathhouseClerk: ["clerk", "corridor", "room staff"],
  BoilerOiler: ["boiler", "oiler"],
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
