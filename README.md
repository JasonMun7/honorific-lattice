# Honorific Lattice

A **Vite + React** app with a **3D force-directed graph** (React Three Fiber, `d3-force-3d`) for exploring honorifics and social hierarchy in course films. Nodes encode power and stance; edges encode directed **formality** and **social distance** from your evidence. The right panel shows character detail, a **film filter** (single-film focus when that film has graph data), and **methodology** tabs; a **course film strip** at the bottom links the syllabus lineup to local posters in `public/posters/`.

Click nodes to inspect neighbors and scene-backed counts. Orbit the camera with drag; use the toolbar for history, full graph, filters, and the side panel. Data ships as JSON under `src/data/` (no backend required).

For **design tokens, icons, and UI conventions**, see [DESIGN.md](DESIGN.md). For **title, pitch, research question, evidence-to-graph notes, and reflection scaffolding**, see [PROJECT_FRAMING.md](PROJECT_FRAMING.md)—keep long-form copy there so this file stays a short runbook.

## Prerequisites

- **Node.js** — active **LTS** (v20+ recommended).
- **npm** — included with Node.

## Quick start

```bash
git clone <YOUR_REPO_URL>
cd honorific-lattice
npm install
npm run dev
```

Open **http://localhost:5173** (or the URL Vite prints if the port is in use).

## Optional environment

The app runs without a `.env` file. To load **TMDB** cast photos when a character has no URL in `src/data/characterPortraitUrls.json`, copy the commented keys from [`.env.example`](.env.example) and add your read token or v3 API key.

## Character portraits

Portrait URLs live in `src/data/characterPortraitUrls.json` keyed by node `id`. Manually paste any image URL there to override the placeholder. For the 10 live-action course films the runtime fallback in `src/lib/tmdbCastPortraits.js` will also attempt a TMDB cast match at runtime for any node with no entry. Animated films (Spirited Away, Millennium Actress) are excluded from TMDB since it only carries voice-actor headshots rather than character art.

To pre-fetch and bake TMDB URLs for all live-action films at once:

```bash
npm run fetch:portraits          # add missing entries, keep existing
npm run fetch:portraits:force    # overwrite all entries
npm run fetch:portraits:dry      # preview without writing
```

Requires `VITE_TMDB_READ_ACCESS_TOKEN` or `VITE_TMDB_API_KEY` in `.env`.

## npm scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run fetch:portraits` | Fetch TMDB portrait URLs for all live-action film nodes |
| `npm run fetch:portraits:force` | Same, overwriting existing entries |
| `npm run fetch:portraits:dry` | Preview matches without writing |

## Deploy

Import as a **Vite** project (build: `npm run build`, output **`dist`**). For GitHub Pages under a subpath, set `VITE_BASE=/your-repo-name/` when building; see [`vite.config.js`](vite.config.js) (`base` reads `process.env.VITE_BASE ?? "/"`).

## License / assets

Course / personal use—credit Studio Ghibli (and similar) when you quote footage or dialogue. Posters in `public/posters/` come from Wikipedia / Wikimedia thumbnails; follow each file’s license on Wikimedia if you republish.
