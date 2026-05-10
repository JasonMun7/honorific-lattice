import portraitUrls from "../data/characterPortraitUrls.json";

const base = String(import.meta.env.BASE_URL ?? "/");
const baseWithSlash = base.endsWith("/") ? base : `${base}/`;

/** Shared static asset when no curated portrait URL exists or the image fails to load. */
export const CHARACTER_PORTRAIT_FALLBACK_URL = `${baseWithSlash}posters/placeholder.svg`;

/** True when the URL is the shared local placeholder (TMDB upgrade may still apply). */
export function isCharacterPortraitFallbackUrl(url) {
  return typeof url === "string" && url === CHARACTER_PORTRAIT_FALLBACK_URL;
}

/**
 * Character portrait URLs: optional per-node `portrait` in filmData, then
 * optional curated map in `characterPortraitUrls.json`, then shared placeholder.
 *
 * @param {{ id: string; name?: string; portrait?: string | null }} node
 * @returns {string}
 */
export function getCharacterPortraitUrl(node) {
  if (node.portrait && typeof node.portrait === "string" && node.portrait.length > 0) {
    return node.portrait;
  }
  const mapped = portraitUrls[node.id];
  if (mapped && typeof mapped === "string" && mapped.length > 0) {
    return mapped;
  }
  return CHARACTER_PORTRAIT_FALLBACK_URL;
}
