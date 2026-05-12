/**
 * Honorific / keigo stance on a directed edge (speaker → addressee) is encoded as
 * `formality` and `socialDistance` in filmData.json. We combine those with
 * institutional rank (`basePower` on nodes) so physics and line styling emphasize
 * ties where deferral aligns with upward power — the clearest hierarchy signals.
 */

/**
 * @param {object} link — d3-mutated link with object `source` / `target` nodes
 * @returns {number} in [0, 1]
 */
export function hierarchySalience(link) {
  const s = link.source;
  const t = link.target;
  if (!s || !t || typeof s === "string" || typeof t === "string") return 0;

  const f = Number(link.formality) || 0;
  const sd = Number(link.socialDistance) || 0;
  const ps = Number(s.basePower) || 0;
  const pt = Number(t.basePower) || 0;

  const upward = Math.min(1, Math.max(0, pt - ps) / 9);
  const deferral = Math.min(1, f / 3.5);
  const alongPowerGradient = deferral * (0.12 + 0.88 * upward);
  const stanceVisibility = Math.min(1, (f * 0.35 + sd * 0.12) / 1.6);

  return Math.min(1, alongPowerGradient * 0.72 + stanceVisibility * 0.42);
}

/**
 * Scene methodology: longer springs for higher formality / social stretch.
 * Hierarchy salience shortens the spring a bit so subordinate→superior deferral
 * pulls the pair together in 3D while still respecting the base scales.
 *
 * @param {object} link
 * @returns {number}
 */
export function honorificLinkDistance(link) {
  const sd = Number(link.socialDistance) || 1;
  return Math.max(4.2, 6 + sd * 2.5);
}

/**
 * Stronger simulation springs on salient hierarchy edges tighten the layout
 * along power-relevant dyads.
 *
 * @param {object} link
 * @returns {number}
 */
export function honorificLinkStrength(link) {
  const hi = hierarchySalience(link);
  return 0.3 + hi * 0.52;
}
