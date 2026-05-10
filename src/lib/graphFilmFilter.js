/**
 * Map film display strings on nodes to course film ids.
 * Optional per-node filmId overrides when you add multi-film graph data later.
 */
export const FILM_TITLE_TO_COURSE_ID = {
  "Spirited Away": "spirited-away",
};

/** Default single-film selection on load; reset target for the film toolbar control. */
export const DEFAULT_COURSE_FILM_ID = "spirited-away";

/**
 * @param {{ film?: string; filmId?: string }} node
 * @returns {string | null}
 */
export function nodeCourseFilmId(node) {
  if (node.filmId) return node.filmId;
  if (node.film && FILM_TITLE_TO_COURSE_ID[node.film])
    return FILM_TITLE_TO_COURSE_ID[node.film];
  return null;
}

/**
 * Filter graph to nodes whose course film tag matches any id in the list.
 * Callers typically pass a non-empty id list (single film at a time). Empty array
 * still means no film filter (entire encoded graph), for safety or legacy paths.
 *
 * @param {Array<object>} allNodes
 * @param {Array<object>} allLinks
 * @param {string[]} courseFilmIds — matches course film ids from the catalog
 */
export function filterGraphByCourseFilmIds(allNodes, allLinks, courseFilmIds) {
  const ids = Array.isArray(courseFilmIds) ? courseFilmIds : [];
  if (ids.length === 0) {
    return { nodes: [...allNodes], links: [...allLinks] };
  }
  const idSet = new Set(ids);
  const nodes = allNodes.filter((n) => {
    const nid = nodeCourseFilmId(n);
    return nid != null && idSet.has(nid);
  });
  const nodeIds = new Set(nodes.map((n) => n.id));
  const links = allLinks.filter((l) => {
    const s = typeof l.source === "object" ? l.source.id : l.source;
    const t = typeof l.target === "object" ? l.target.id : l.target;
    return nodeIds.has(s) && nodeIds.has(t);
  });
  return { nodes, links };
}

/**
 * @param {Array<object>} allNodes
 * @param {Array<object>} allLinks
 * @param {string} courseFilmId — single course film id
 */
export function filterGraphByFilm(allNodes, allLinks, courseFilmId) {
  return filterGraphByCourseFilmIds(allNodes, allLinks, [courseFilmId]);
}

/**
 * Course film ids that appear on at least one node (encoded graph catalog).
 *
 * @param {Array<object>} nodes
 * @returns {string[]}
 */
export function courseFilmIdsWithNodes(nodes) {
  const s = new Set();
  for (const n of nodes) {
    const id = nodeCourseFilmId(n);
    if (id) s.add(id);
  }
  return [...s].sort();
}
