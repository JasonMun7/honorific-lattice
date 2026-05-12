# Design rules (Honorific Lattice)

Concise conventions for UI, layout, and content. When in doubt, match existing components before extending them.

## Color

- **Source of truth:** Atlassian Design System dark palette as CSS variables in `[src/atlassian-dark.css](src/atlassian-dark.css)`, exposed to Tailwind as `ads.*` in `[tailwind.config.js](tailwind.config.js)`. Official reference: [Atlassian — Color foundations](https://atlassian.design/foundations/color).
- `**ads-text` / `ads-text-subtle` / `ads-text-subtlest`:** primary copy, secondary copy, and de-emphasized metadata. Prefer subtle tiers for supporting text so hierarchy stays clear on dark surfaces.
- `**ads-border` / `ads-border-bold` / `ads-border-selected`:** dividers, panel edges, and focus/selection affordances. Use `border-selected` only for active or emphasized selection states.
- `**ads-chart-*`:** categorical encoding in data visuals (e.g. graph materials in `[src/components/ForceGraph.jsx](src/components/ForceGraph.jsx)`). Use chart tokens when color carries **data meaning**, not UI state alone.
- **Semantic danger / success:** this repo does not currently wire ADS danger/success tokens in Tailwind. Do **not** repurpose `ads-chart-*` or `ads-icon-*` as “error red” without adding explicit semantic tokens and documenting them here. Prefer `ads-icon-information` / `ads-icon-brand` for informational emphasis only.

## Icons

- **Library:** `[@tabler/icons-react](https://tabler.io/icons)` only for UI icons (no mixing icon sets).
- **Imports:** named exports, `Icon*` prefix — e.g. `import { IconInfoCircle } from "@tabler/icons-react"`.
- **Sizing:** inline UI icons typically **16px** (`size={16}`) up to **20px** for slightly stronger emphasis; keep stroke weight consistent (`**stroke={1.5}`** aligns with Tabler’s default feel and ADS-style UI density).
- **Accessibility:** decorative icons beside visible text → `aria-hidden`. Standalone icon buttons or lone glyphs → meaningful `aria-label` (and avoid duplicating label text in surrounding copy).

## shadcn/ui (components + MCP)

- **Stack:** [shadcn/ui](https://ui.shadcn.com/) (Radix primitives + Tailwind). Config lives in `[components.json](components.json)`; generated primitives live under `[src/components/ui/](src/components/ui/)`. `**TooltipProvider`** wraps the app in `[src/main.jsx](src/main.jsx)`.
- **MCP workflow (required for adds):** use the **shadcn/ui MCP** server tool `**get_add_command_for_items`** with registry-prefixed ids (e.g. `@shadcn/card`, `@shadcn/tooltip`), then run the returned `npx shadcn@latest add …` command in the repo root so versions stay aligned with the registry.
- **Imports:** UI primitives from `@/components/ui/...` (Vite alias `@` → `src/` in `[vite.config.js](vite.config.js)` and `[jsconfig.json](jsconfig.json)`). Shared `cn()` in `[src/lib/utils.js](src/lib/utils.js)`.
- **Theming:** `html` carries `class="dark theme"` in `[index.html](index.html)` so shadcn CSS variables apply. **ADS tokens** (`ads-*`) remain the primary language for the 3D shell, top chrome, and panels; shadcn **Card** / **Tooltip** surfaces use `bg-card`, `text-muted-foreground`, etc., often combined with `border-ads-border` for consistency.
- **Cards:** use `[Card](src/components/ui/card.jsx)` + `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` for grouped panel content (e.g. character portrait + identity block in `[CharacterSidebar.jsx](src/components/CharacterSidebar.jsx)`).
- **Tooltips:** use `[Tooltip](src/components/ui/tooltip.jsx)` + `TooltipTrigger` + `TooltipContent` instead of native `title` for hovers. Icon-only controls may use `[IconTooltipButton](src/components/IconTooltipButton.jsx)` (`tooltip` string + `aria-label` + children).

## Minimal chrome & icon-first controls

- **Prefer icon buttons** for global actions (top bar, panel header, empty-state recovery). Use **shadcn `Tooltip`** (via `IconTooltipButton` or explicit `Tooltip`/`TooltipTrigger`/`TooltipContent`) for hover help — not raw `title` on icon-only controls.
- **Filter panel:** `[TopNavBar.jsx](src/components/TopNavBar.jsx)` uses `**IconFilter`** to open the **Filter** view in the right panel (character search + title toggles) and `**IconFilterX`** (only while a title filter is active) to **clear** all selected titles in one step. The panel header shows `**IconFilterX`** next to close whenever any titles are selected.
- **Copy vs chrome:** avoid stacking multiple paragraphs and text CTAs for the same failure mode (e.g. empty graph). Prefer **one line of context** plus **icons** with tooltips or a single status strip that points at the toolbar.

## Tooltip copy

- **Icon-only and icon-primary controls:** pass a full sentence into `**tooltip`** / `TooltipContent`: what the control does and, when helpful, the main consequence.
- **Do not** rely on tooltips for information that is required to complete a task; they are supplemental. Critical empty states should still include a minimal visible phrase or `role="status"` where appropriate.

## Spacing & layout

- **Panel padding:** `p-panel` / `px-panel` / `py-panel` — `**spacing.panel` = 1.5rem (24px)** in `[tailwind.config.js](tailwind.config.js)`. Use on sheet/drawer **headers**, methodology **body**, character sidebar **scroll body**, and primary buttons in empty states so content does not hug the edges.
- **Tight rail:** `px-panel-tight` (**1rem**) on the top bar; nav uses comfortable `gap-*` between icon buttons.
- **Sections:** `**mt-section` / `pt-section`** (**2rem**) above bordered blocks (Linked characters, Connections).
- **Stacks:** `**gap-stack` / `space-y-stack` / `mt-stack`** (**1rem**) between list rows, film strip rows, and stacked controls.
- **Max width:** top bar uses `max-w-[100vw]`; floating empty-state overlay uses `w-[min(92vw,24rem)]` with `p-panel`.

## Typography scale

Maps to Tailwind `fontSize.*` extensions and ADS text color tiers (`ads-text`, `ads-text-subtle`, `ads-text-subtlest`):


| Role                | Class                                                          | Notes                                                                                  |
| ------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| App / panel titles  | `text-panel-title`                                             | ~14px semibold; primary chrome headings (use with `px-panel` / `py-panel` for gutters) |
| Section headings    | `text-xs font-semibold uppercase tracking-wider text-ads-text` | rails in sidebars and methodology                                                      |
| Body in panels      | `text-panel-body` + `text-ads-text-subtle`                     | methodology prose                                                                      |
| Meta / captions     | `text-panel-meta` + subtle tier                                | filter summaries, timestamps                                                           |
| Nav label (visible) | `text-xs font-medium`                                          | optional text beside an icon (e.g. Full graph)                                         |


## Layout

- **Primary surface:** full-viewport **3D canvas** (`<Canvas>` in `[src/App.jsx](src/App.jsx)`) — the graph is the main artifact; HTML chrome stays minimal.
- **Top navigation:** `[src/components/TopNavBar.jsx](src/components/TopNavBar.jsx)` — `fixed` `top-0` `z-[100]`, Tabler **icon** actions with `**title` + `aria-label`**. Toggles the right panel between character context, **Filter** (`[FilmFilterPanelBody.jsx](src/components/FilmFilterPanelBody.jsx)`: character search + title list), and **methodology** (`[MethodologyPanelBody.jsx](src/components/MethodologyPanelBody.jsx)`) — one rail, no stacked sheets.
- **Right sidebar:** `[src/components/CharacterSidebar.jsx](src/components/CharacterSidebar.jsx)` — `fixed` `right-0` `z-[90]`, flush to the viewport edge; portrait, metadata, linked characters, connections. **Escape** closes the panel.
- **3D canvas shell:** `[src/components/GraphCanvasInner.jsx](src/components/GraphCanvasInner.jsx)` — camera, `OrbitControls`, lights, stars, and `[ForceGraph](src/components/ForceGraph.jsx)`. When a node is selected, the camera **lerps** toward the subgraph centroid; `Canvas` `**onPointerMissed`** (left click on empty space) clears selection to the full graph for the current filter.
- **Overlay pattern:** outer wrappers use `pointer-events-none` where the canvas must receive drags; interactive regions use `pointer-events-auto`.
- **Spacing:** Prefer `spacing.panel` tokens where panels share one gutter; otherwise Tailwind scale (`gap-*`, `mt-*`, etc.). Avoid arbitrary pixel strings unless a Three.js or canvas constraint requires it.

## Character portraits

- **Resolution order:** optional per-node `portrait` URL in `[src/data/filmData.json](src/data/filmData.json)`, then optional id → URL map in `[src/data/characterPortraitUrls.json](src/data/characterPortraitUrls.json)` (curated remote stills; may hotlink — UI falls back on error), then **DiceBear** `notionists-neutral` with `seed=node.id` via `[src/lib/characterAvatar.js](src/lib/characterAvatar.js)`. `[src/components/CharacterPortraitImg.jsx](src/components/CharacterPortraitImg.jsx)` swaps to DiceBear if the remote image fails to load.
- **Stand-ins:** DiceBear and any broken remote URLs are **illustrative**, not official Studio Ghibli promotional art — say so in UI copy near the image.
- `**<img>`:** `loading="lazy"`, `decoding="async"`, `referrerPolicy="no-referrer"` where hotlinking, descriptive `alt`.

## 3D graph encoding

- **Nodes:** `[src/components/ForceGraph.jsx](src/components/ForceGraph.jsx)` — every node is an **icosahedron**; **radius** scales with `basePower`. **Materials** use ADS **chart categorical** hex values from `[src/atlassian-dark.css](src/atlassian-dark.css)`: **cool** `#4688ec` (`--ads-color-chart-categorical-1`) below institutional apex, **warm** `#fca700` (`--ads-color-chart-categorical-4`) at `**basePower` ≥ 7** (apex / sovereign register). Emissive is a darker companion tint for depth.
- **Edges:** `three-stdlib` `**Line2`** + `**LineMaterial`** with `**dashed: true**`. Each frame updates endpoints from the simulation; `**dashOffset**` animates for a crawl/pulse whose speed scales with `formality` + `socialDistance`; **linewidth**, **dashSize**, **gapSize**, **opacity**, and **color** (neutral **slate gray** ramp, no information blue) encode the same pair of weights so ties read differently without relying on a single channel.
- **Neighborhood view:** with a selected node, only that node **and** endpoints of incident edges are rendered; all other meshes and edges are omitted so the canvas matches the sidebar’s local subgraph.

## Content

- **Filter UI:** `[FilmFilterPanelBody.jsx](src/components/FilmFilterPanelBody.jsx)` — search **characters** by name (matches the **current graph slice**, i.e. filtered nodes) and a **Titles** block with `[CourseFilmStrip.jsx](src/components/CourseFilmStrip.jsx)` (keyboard between rows). Title selections can always be toggled off even when the filtered graph is empty.

## Tone in docs and UI copy

- Prefer **short bullets** and **one idea per line** in contributor-facing docs.
- Link to canonical files: `[components.json](components.json)`, `[src/atlassian-dark.css](src/atlassian-dark.css)`, `[tailwind.config.js](tailwind.config.js)`, `[src/main.jsx](src/main.jsx)`, `[src/App.jsx](src/App.jsx)`, `[src/components/ForceGraph.jsx](src/components/ForceGraph.jsx)`, `[src/components/TopNavBar.jsx](src/components/TopNavBar.jsx)`, `[src/components/CharacterSidebar.jsx](src/components/CharacterSidebar.jsx)`, `[src/components/IconTooltipButton.jsx](src/components/IconTooltipButton.jsx)`, `[src/components/FilmFilterPanelBody.jsx](src/components/FilmFilterPanelBody.jsx)`, `[src/components/MethodologyPanelBody.jsx](src/components/MethodologyPanelBody.jsx)`, `[src/components/ui/](src/components/ui/)`.