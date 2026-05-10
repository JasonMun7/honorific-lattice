import { useCallback, useEffect, useState } from "react";
import {
  CHARACTER_PORTRAIT_FALLBACK_URL,
  getCharacterPortraitUrl,
  isCharacterPortraitFallbackUrl,
} from "../lib/characterAvatar.js";
import { resolveTmdbPortraitUrl } from "../lib/tmdbCastPortraits.js";

/**
 * Curated / per-node URL first, then optional TMDB cast photo when env keys are set,
 * then shared placeholder. On image error, falls back to the same placeholder.
 *
 * @param {{ id: string; name?: string; portrait?: string | null; film?: string }} node
 * @param {string} [className]
 * @param {string} alt
 */
export default function CharacterPortraitImg({ node, className = "", alt }) {
  const primary = getCharacterPortraitUrl(node);
  const [src, setSrc] = useState(primary);

  useEffect(() => {
    const next = getCharacterPortraitUrl(node);
    setSrc(next);
  }, [node.id, node.portrait, node.name, node.film]);

  useEffect(() => {
    const curated = getCharacterPortraitUrl(node);
    if (!isCharacterPortraitFallbackUrl(curated)) return;

    const hasTmdbAuth =
      Boolean(import.meta.env?.VITE_TMDB_READ_ACCESS_TOKEN) ||
      Boolean(import.meta.env?.VITE_TMDB_API_KEY);
    if (!hasTmdbAuth || !node?.film) return;

    const ac = new AbortController();
    resolveTmdbPortraitUrl(node, ac.signal)
      .then((url) => {
        if (url) setSrc(url);
      })
      .catch(() => {});
    return () => ac.abort();
  }, [node]);

  const onError = useCallback(() => {
    setSrc((current) =>
      current !== CHARACTER_PORTRAIT_FALLBACK_URL ? CHARACTER_PORTRAIT_FALLBACK_URL : current,
    );
  }, []);

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onError={onError}
    />
  );
}
