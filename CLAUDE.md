# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server with HMR at http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Serve dist/ locally
npm run clean:vite # Clear Vite's optimized-deps cache when stale
```

No test suite or linter is configured. There is no backend — the app is purely client-side.

To add multi-film character data to `src/data/filmData.json`:
```bash
node scripts/add-multifilm-characters.mjs
```

## Architecture

The app is a **3D force-directed graph** for exploring Japanese honorific register and social hierarchy in course films. All data ships as static JSON under `src/data/` — no API calls required (TMDB is optional for portraits).

### Data model (`src/data/filmData.json`)

- **Nodes**: characters with `basePower` (0–10, institutional rank), `zTarget` (uchi–soto relational depth), `film`, and optional `filmId`.
- **Links**: directed edges with `formality` and `socialDistance` (both numeric; higher = more honorific load / social stretch).
- **Film filter**: `src/lib/graphFilmFilter.js` maps node `film` strings to course film IDs (e.g. `"Spirited Away"` → `"spirited-away"`). Add new films to `FILM_TITLE_TO_COURSE_ID` there.

### Physics and encoding (`src/lib/honorificLinkMetrics.js`)

The link-distance formula is the canonical bridge between linguistic evidence and 3D layout:
```
base distance = 6 + formality × 2.2 + socialDistance × 0.9
hierarchy pull = 2.6 × hierarchySalience(link)
```
`hierarchySalience` combines upward-power direction, formality level, and stance visibility into a [0,1] score. **Y-axis** encodes `basePower` (vertical rank); **Z-axis** encodes `zTarget` (uchi–soto relational distance).

### Component tree

- **`src/App.jsx`** — all state: `selected` node, `filmFilterIds`, `rightPanelView`, `selectionPast/Future`, `fullGraphOverviewNonce`. No state lives in children except local UI state.
- **`src/components/GraphCanvasInner.jsx`** — inside `<Canvas>`; owns the camera lerp logic (focus → neighborhood centroid; Full Graph → bounds-fit), `OrbitControls`, welcome orbit, and idle auto-rotate. Reads simulation node positions from `userData.simNodes` on the scene object named `"force-graph-root"`.
- **`src/components/ForceGraph.jsx`** — d3-force-3d simulation; renders `NodeShape` (icosahedron) and `WeightedEdge` (three-stdlib `Line2` + `LineMaterial`). In neighborhood view, dims nodes/edges not incident to the selected node.
- **`src/components/CharacterSidebar.jsx`** — single right panel that multiplexes three views: `"character"` detail, `"films"` filter (`FilmFilterPanelBody`), and `"methodology"` tabs (`MethodologyPanelBody`). Controlled entirely by `App`.
- **`src/components/TopNavBar.jsx`** — fixed top bar with icon-only controls (back/forward history, Full Graph, Filter, Methodology toggle).

### Design system

- **Color source of truth**: CSS variables in `src/atlassian-dark.css` (Atlassian Design System dark palette), exposed to Tailwind as `ads.*` tokens in `tailwind.config.js`.
- **Node colors**: cool `#4688ec` for `basePower < 7`; warm `#fca700` for `basePower ≥ 7`.
- **Icons**: `@tabler/icons-react` only — named `Icon*` prefix, 16–20px, `stroke={1.5}`.
- **shadcn/ui**: primitives live in `src/components/ui/`. To add components, use the shadcn MCP `get_add_command_for_items` tool with registry-prefixed IDs, then run the returned `npx shadcn@latest add …` command. `TooltipProvider` wraps the app in `src/main.jsx`.
- **Spacing tokens**: `p-panel` (1.5rem), `px-panel-tight` (1rem), `mt-section` (2rem), `gap-stack` (1rem) — defined in `tailwind.config.js`.
- **Path alias**: `@` → `src/` (configured in both `vite.config.js` and `jsconfig.json`).

### Portrait fallback chain

`src/components/CharacterPortraitImg.jsx` tries in order: (1) `portrait` URL in node data, (2) `src/data/characterPortraitUrls.json`, (3) DiceBear `notionists-neutral` via `src/lib/characterAvatar.js`.

### Environment

`.env.example` documents optional TMDB keys (`VITE_TMDB_READ_TOKEN` or `VITE_TMDB_API_KEY`). The app runs without them.
