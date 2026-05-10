import { useEffect, useMemo, useState } from "react";
import {
  IconFilter,
  IconFilterX,
  IconInfoCircle,
  IconTopologyRing,
  IconX,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CharacterPortraitImg from "./CharacterPortraitImg.jsx";
import FilmFilterPanelBody from "./FilmFilterPanelBody.jsx";
import IconTooltipButton from "./IconTooltipButton.jsx";
import MethodologyPanelBody from "./MethodologyPanelBody.jsx";
import PanelListShell from "./PanelListShell.jsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SIDE_PANEL_WIDTH_CLASS } from "../lib/panelLayout.js";
import { DEFAULT_COURSE_FILM_ID } from "../lib/graphFilmFilter.js";

/** Max visible rows before "Show more" appears. */
const LIST_PREVIEW_COUNT = 5;

const panelHeaderIconBtn =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-ads-border text-ads-text-subtle transition-colors hover:border-ads-border-bold hover:bg-ads-surface-raised hover:text-ads-text focus:outline-none focus-visible:ring-2 focus-visible:ring-ads-border-selected";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   selected: object | null;
 *   nodes: Array<{ id: string; name: string }>;
 *   links: Array<{ source: string; target: string; formality: number; socialDistance: number; label: string }>;
 *   films: Array<{ id: string; titleDisplay: string; year: number }>;
 *   selectedFilmIds: string[];
 *   filmHasGraph: boolean;
 *   panelView: "character" | "films" | "methodology";
 *   onPanelViewChange: (view: "character" | "films" | "methodology") => void;
 *   methodologyTab: string;
 *   onMethodologyTabChange: (id: string) => void;
 *   sceneEvidence: object;
 *   onToggleFilmId: (id: string) => void;
 *   onClearFilmFilter: () => void;
 *   onPickCharacter: (id: string) => void;
 * }} props
 */
export default function CharacterSidebar({
  open,
  onClose,
  selected,
  nodes,
  links,
  films,
  selectedFilmIds,
  filmHasGraph,
  panelView,
  onPanelViewChange,
  methodologyTab,
  onMethodologyTabChange,
  sceneEvidence,
  onToggleFilmId,
  onClearFilmFilter,
  onPickCharacter,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const nodeById = useMemo(() => {
    const m = new Map();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const connections = useMemo(() => {
    if (!selected?.id) return { in: [], out: [] };
    const id = selected.id;
    const incoming = [];
    const outgoing = [];
    for (const l of links) {
      const src = typeof l.source === "object" ? l.source.id : l.source;
      const tgt = typeof l.target === "object" ? l.target.id : l.target;
      if (tgt === id) {
        incoming.push({
          neighborId: src,
          neighborName: nodeById.get(src)?.name ?? src,
          direction: "in",
          ...l,
        });
      }
      if (src === id) {
        outgoing.push({
          neighborId: tgt,
          neighborName: nodeById.get(tgt)?.name ?? tgt,
          direction: "out",
          ...l,
        });
      }
    }
    return { in: incoming, out: outgoing };
  }, [selected, links, nodeById]);

  const neighborList = useMemo(() => {
    if (!selected?.id) return [];
    const m = new Map();
    for (const row of [...connections.in, ...connections.out]) {
      if (!m.has(row.neighborId)) {
        m.set(row.neighborId, {
          id: row.neighborId,
          name: row.neighborName,
        });
      }
    }
    return [...m.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
    );
  }, [selected, connections]);

  const filterSummary = useMemo(() => {
    const primaryId = selectedFilmIds[0] ?? DEFAULT_COURSE_FILM_ID;
    const title =
      films.find((f) => f.id === primaryId)?.titleDisplay ?? "Selected film";
    return {
      headline: title,
      detail: "Tagged nodes only.",
    };
  }, [selectedFilmIds, films]);

  const filmResetAvailable =
    (selectedFilmIds[0] ?? DEFAULT_COURSE_FILM_ID) !== DEFAULT_COURSE_FILM_ID;

  const [linkedListExpanded, setLinkedListExpanded] = useState(false);
  useEffect(() => {
    setLinkedListExpanded(false);
  }, [selected?.id]);

  if (!open) return null;

  const portraitAlt = selected
    ? `Portrait for ${selected.name} (curated or illustrative stand-in, not official Ghibli promotional art)`
    : "";

  return (
    <aside
      id="right-sidebar-panel"
      aria-label="Graph context, filter, and methodology"
      className="pointer-events-none fixed inset-y-0 right-0 z-[90] flex justify-end pt-20 pb-panel pr-0"
    >
      <div
        className={`pointer-events-auto flex h-full min-h-0 max-h-full flex-col overflow-hidden rounded-l-lg border border-ads-border border-r-0 bg-ads-surface-overlay shadow-2xl ${SIDE_PANEL_WIDTH_CLASS}`}
      >
        <div className="shrink-0 border-b border-ads-border px-panel py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-panel-title text-ads-text">
                  {panelView === "character"
                    ? "Character"
                    : panelView === "films"
                      ? "Filter"
                      : "Methodology"}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {filmResetAvailable ? (
                  <IconTooltipButton
                    tooltip="Reset film to Spirited Away"
                    aria-label="Reset film selection to Spirited Away"
                    onClick={onClearFilmFilter}
                    className={`${panelHeaderIconBtn} border-ads-border-selected/50 text-ads-text-selected hover:bg-ads-icon-brand/15`}
                  >
                    <IconFilterX size={18} stroke={1.5} aria-hidden />
                  </IconTooltipButton>
                ) : null}
                <IconTooltipButton
                  tooltip="Close panel"
                  aria-label="Close panel"
                  onClick={onClose}
                  className={panelHeaderIconBtn}
                >
                  <IconX size={18} stroke={1.5} aria-hidden />
                </IconTooltipButton>
              </div>
            </div>
            {panelView === "character" ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ads-text-subtlest">
                  Film filter
                </p>
                <p className="text-panel-meta leading-relaxed text-ads-text-subtle">
                  <span className="text-ads-text">{filterSummary.headline}</span>
                  {filmHasGraph ? (
                    <span className="text-ads-text-subtlest"> · {filterSummary.detail}</span>
                  ) : (
                    <span className="text-ads-text-subtlest"> · no match.</span>
                  )}
                </p>
              </div>
            ) : panelView === "films" ? (
              <p className="text-panel-meta leading-relaxed text-ads-text-subtle">
                Search characters by name, or tap a title to switch the graph to
                that film only. Use the toolbar reset to return to{" "}
                {films.find((f) => f.id === DEFAULT_COURSE_FILM_ID)?.titleDisplay ??
                  "Spirited Away"}
                .
              </p>
            ) : (
              <p className="text-panel-meta leading-relaxed text-ads-text-subtle">
                How edges encode stance, layout, and scene evidence.
              </p>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-panel pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-6">
          {panelView === "films" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <FilmFilterPanelBody
                films={films}
                nodes={nodes}
                selectedFilmIds={selectedFilmIds}
                onToggleFilmId={onToggleFilmId}
                graphIsEmpty={!filmHasGraph}
                onPickCharacter={onPickCharacter}
              />
            </div>
          ) : panelView === "methodology" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <MethodologyPanelBody
                tab={methodologyTab}
                onTabChange={onMethodologyTabChange}
                sceneEvidence={sceneEvidence}
              />
            </div>
          ) : !filmHasGraph ? (
            <div className="flex h-full min-h-[14rem] flex-col justify-center gap-5 text-center text-panel-meta text-ads-text-subtle">
              <p className="text-ads-text">
                Nothing to draw for this film filter.
              </p>
              <div
                className="mx-auto flex items-center justify-center gap-2"
                role="group"
                aria-label="Actions"
              >
                <IconTooltipButton
                  tooltip="Reset film to Spirited Away"
                  aria-label="Reset film selection to Spirited Away"
                  onClick={onClearFilmFilter}
                  className={`${panelHeaderIconBtn} border-ads-border-selected/50 text-ads-text-selected hover:bg-ads-icon-brand/15`}
                >
                  <IconFilterX size={20} stroke={1.5} aria-hidden />
                </IconTooltipButton>
                <IconTooltipButton
                  tooltip="Open filter"
                  aria-label="Open film filter"
                  onClick={() => onPanelViewChange("films")}
                  className={panelHeaderIconBtn}
                >
                  <IconFilter size={20} stroke={1.5} aria-hidden />
                </IconTooltipButton>
                <IconTooltipButton
                  tooltip="Open methodology"
                  aria-label="Open methodology"
                  onClick={() => onPanelViewChange("methodology")}
                  className={panelHeaderIconBtn}
                >
                  <IconInfoCircle size={20} stroke={1.5} aria-hidden />
                </IconTooltipButton>
              </div>
            </div>
          ) : selected ? (
            <div className="flex flex-col gap-7">
              <div className="flex items-center gap-panel rounded-md border border-ads-border-selected/40 bg-ads-surface-raised/80 px-panel py-3.5">
                <IconTopologyRing
                  size={16}
                  stroke={1.5}
                  className="shrink-0 text-ads-icon-information"
                  aria-hidden
                />
                <p className="text-panel-meta font-medium text-ads-text">Neighborhood</p>
              </div>
              <p className="text-panel-meta leading-relaxed text-ads-text-subtlest">
                Linked nodes only · <strong className="text-ads-text-subtle">Full graph</strong>{" "}
                clears selection and reframes the current film. Click a neighbor to focus.
              </p>

              <Card className="overflow-hidden border-ads-border/90 bg-card/90 text-card-foreground shadow-md ring-1 ring-ads-border/40">
                <CardContent className="p-0">
                  <CharacterPortraitImg
                    node={selected}
                    alt={portraitAlt}
                    className="aspect-square w-full object-cover object-top"
                  />
                </CardContent>
              </Card>
              <p className="text-panel-meta text-muted-foreground">
                Portrait may be illustrative when no still is available.
              </p>

              <Card className="border-ads-border/90 bg-card/90 text-card-foreground shadow-md ring-1 ring-ads-border/40">
                <CardHeader className="space-y-1 pb-2">
                  <CardTitle className="font-heading text-xl font-semibold leading-snug text-ads-text-selected">
                    {selected.name}
                  </CardTitle>
                  <CardDescription className="text-[10px] font-medium uppercase tracking-widest text-ads-text-subtle">
                    {selected.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <dl className="grid grid-cols-[minmax(0,6.5rem)_1fr] gap-x-3 gap-y-3 text-xs leading-snug">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-medium capitalize text-ads-text">
                      {selected.type}
                    </dd>
                    {selected.film ? (
                      <>
                        <dt className="text-muted-foreground">Film</dt>
                        <dd className="font-medium text-ads-text">{selected.film}</dd>
                      </>
                    ) : null}
                    <dt className="text-muted-foreground">Base power</dt>
                    <dd className="tabular-nums text-ads-text">
                      <span className="text-base font-semibold text-ads-text-selected">
                        {selected.basePower}
                      </span>
                      <span className="text-muted-foreground"> / 10</span>
                      <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                        hierarchy register
                      </span>
                    </dd>
                    <dt className="text-muted-foreground">Z target</dt>
                    <dd className="tabular-nums text-ads-text">
                      <span className="text-base font-semibold text-ads-text-selected">
                        {selected.zTarget}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                        social depth
                      </span>
                    </dd>
                  </dl>
                  {selected.notes ? (
                    <div className="rounded-lg border border-dashed border-ads-border-bold/35 bg-muted/40 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
                      {selected.notes}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <section className="mt-section flex flex-col gap-5 border-t border-ads-border pt-section">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ads-text">
                    Linked characters
                  </h3>
                  {neighborList.length > 0 ? (
                    <span className="shrink-0 text-[10px] font-medium tabular-nums text-ads-text-subtlest">
                      {neighborList.length} total
                    </span>
                  ) : null}
                </div>
                {neighborList.length ? (
                  <PanelListShell>
                    <ul className="flex flex-col gap-3.5">
                      {(linkedListExpanded
                        ? neighborList
                        : neighborList.slice(0, LIST_PREVIEW_COUNT)
                      ).map((n) => {
                        const neighborNode = nodeById.get(n.id) ?? {
                          id: n.id,
                          name: n.name,
                        };
                        return (
                          <li key={n.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-auto min-h-0 w-full justify-start gap-3 rounded-lg border border-ads-border/80 bg-ads-surface-raised/50 px-3.5 py-3.5 text-left text-[13px] font-medium leading-snug text-ads-text shadow-sm transition-[border-color,box-shadow,background-color] hover:border-ads-border-bold hover:bg-ads-surface-raised hover:shadow-md focus-visible:ring-2 focus-visible:ring-ads-border-selected"
                                  onClick={() => onPickCharacter(n.id)}
                                >
                                  <CharacterPortraitImg
                                    node={neighborNode}
                                    alt={`Portrait for ${n.name} (illustrative or curated, not official film art)`}
                                    className="h-10 w-10 shrink-0 rounded-lg border border-ads-border object-cover"
                                  />
                                  <span className="min-w-0 flex-1">{n.name}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="left"
                                sideOffset={8}
                                className="max-w-xs border border-ads-border/80 bg-ads-surface-overlay px-3 py-2 text-xs text-ads-text shadow-lg"
                              >
                                Focus graph on {n.name}
                              </TooltipContent>
                            </Tooltip>
                          </li>
                        );
                      })}
                    </ul>
                    {neighborList.length > LIST_PREVIEW_COUNT ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            className="mt-4 h-auto min-h-0 w-full justify-center rounded-lg border border-dashed border-ads-border-bold/35 bg-ads-surface-overlay/60 py-3 text-panel-meta font-medium text-ads-text-subtle transition-colors hover:border-ads-border-bold hover:bg-ads-surface-raised hover:text-ads-text focus-visible:ring-2 focus-visible:ring-ads-border-selected"
                            aria-expanded={linkedListExpanded}
                            onClick={() => setLinkedListExpanded((v) => !v)}
                          >
                            {linkedListExpanded
                              ? "Show less"
                              : `Show ${neighborList.length - LIST_PREVIEW_COUNT} more`}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          sideOffset={6}
                          className="max-w-xs border border-ads-border/80 bg-ads-surface-overlay px-3 py-2 text-xs text-ads-text shadow-lg"
                        >
                          {linkedListExpanded
                            ? "Collapse list"
                            : "Show all neighbors"}
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </PanelListShell>
                ) : (
                  <p className="text-panel-meta text-ads-text-subtlest">
                    No linked neighbors in this slice yet.
                  </p>
                )}
              </section>

              <section className="mt-section flex flex-col gap-5 border-t border-ads-border pt-section">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ads-text">
                  Connections (directed)
                </h3>
                <p className="text-panel-meta leading-relaxed text-ads-text-subtle">
                  One row per edge. Use <strong className="text-ads-text-subtle">Methodology</strong>{" "}
                  in this panel for how formality and social distance shape edges and the layout.
                </p>
                <div className="flex flex-col gap-6">
                <ConnectionBlock
                  title="Speech toward others"
                  rows={connections.out}
                  selectedName={selected.name}
                  perspective="out"
                  listResetKey={selected.id}
                  resolvePortraitNode={(id, name) => nodeById.get(id) ?? { id, name }}
                />
                <ConnectionBlock
                  title="Speech toward this character"
                  rows={connections.in}
                  selectedName={selected.name}
                  perspective="in"
                  listResetKey={selected.id}
                  resolvePortraitNode={(id, name) => nodeById.get(id) ?? { id, name }}
                />
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-4 text-panel-meta leading-relaxed text-ads-text-subtle">
              <p>
                <strong className="text-ads-text">Select a node</strong> for neighborhood
                view, links, and edge weights.
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function ConnectionBlock({
  title,
  rows,
  selectedName,
  perspective,
  listResetKey,
  resolvePortraitNode,
}) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(false);
  }, [listResetKey, rows.length]);

  if (!rows?.length) {
    return (
      <p className="mt-stack text-panel-meta text-ads-text-subtlest">
        {title}: none recorded
      </p>
    );
  }

  const needsToggle = rows.length > LIST_PREVIEW_COUNT;
  const visibleRows =
    expanded || !needsToggle ? rows : rows.slice(0, LIST_PREVIEW_COUNT);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-panel-meta font-semibold uppercase tracking-wider text-ads-text-subtlest">
          {title}
        </p>
        <span className="shrink-0 text-[10px] font-medium tabular-nums text-ads-text-subtlest">
          {rows.length} edge{rows.length === 1 ? "" : "s"}
        </span>
      </div>
      <PanelListShell>
        <ul className="flex flex-col gap-4">
          {visibleRows.map((row, i) => {
            const arrow =
              perspective === "out"
                ? `${selectedName} → ${row.neighborName}`
                : `${row.neighborName} → ${selectedName}`;
            return (
              <li
                key={`${row.neighborId}-${perspective}-${i}`}
                className="rounded-lg border border-ads-border/90 bg-ads-surface-raised/40 px-4 py-4 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <CharacterPortraitImg
                    node={resolvePortraitNode(row.neighborId, row.neighborName)}
                    alt={`Portrait for ${row.neighborName} (illustrative or curated)`}
                    className="mt-0.5 h-11 w-11 shrink-0 rounded-lg border border-ads-border object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="text-[12px] font-medium leading-snug text-ads-text">
                      {arrow}
                    </p>
                    <p className="text-[11px] leading-relaxed text-ads-text-subtle">
                      {row.label}
                    </p>
                    <p className="text-[10px] leading-relaxed text-ads-text-subtlest">
                      Honorific formality {row.formality} · Social distance{" "}
                      {row.socialDistance}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {needsToggle ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="mt-4 h-auto min-h-0 w-full justify-center rounded-lg border border-dashed border-ads-border-bold/35 bg-ads-surface-overlay/60 py-3 text-panel-meta font-medium text-ads-text-subtle transition-colors hover:border-ads-border-bold hover:bg-ads-surface-raised hover:text-ads-text focus-visible:ring-2 focus-visible:ring-ads-border-selected"
                aria-expanded={expanded}
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded
                  ? "Show less"
                  : `Show ${rows.length - LIST_PREVIEW_COUNT} more`}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={6}
              className="max-w-xs border border-ads-border/80 bg-ads-surface-overlay px-3 py-2 text-xs text-ads-text shadow-lg"
            >
              {expanded ? "Collapse list" : "Show all edges"}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </PanelListShell>
    </div>
  );
}
