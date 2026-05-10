import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconFilter, IconFilterX } from "@tabler/icons-react";
import { Canvas } from "@react-three/fiber";
import CharacterSidebar from "./components/CharacterSidebar.jsx";
import IconTooltipButton from "./components/IconTooltipButton.jsx";
import GraphCanvasInner from "./components/GraphCanvasInner.jsx";
import TopNavBar from "./components/TopNavBar.jsx";
import courseFilms from "./data/courseFilms.json";
import filmData from "./data/filmData.json";
import sceneEvidence from "./data/sceneEvidence.json";
import {
  DEFAULT_COURSE_FILM_ID,
  filterGraphByCourseFilmIds,
  nodeCourseFilmId,
} from "./lib/graphFilmFilter.js";

export default function App() {
  const [selected, setSelected] = useState(null);
  const [selectionPast, setSelectionPast] = useState([]);
  const [selectionFuture, setSelectionFuture] = useState([]);
  /** Always at least one course film id; default is Spirited Away only. */
  const [filmFilterIds, setFilmFilterIds] = useState(() => [
    DEFAULT_COURSE_FILM_ID,
  ]);
  const [characterPanelOpen, setCharacterPanelOpen] = useState(true);
  /** Single right panel: character detail, film filter, or methodology (no stacked modals). */
  const [rightPanelView, setRightPanelView] = useState("character");
  const [methodologyTab, setMethodologyTab] = useState("method");
  /** Bumps when the graph should frame the whole layout. Starts at 1 so first paint matches Full graph zoom. */
  const [fullGraphOverviewNonce, setFullGraphOverviewNonce] = useState(1);

  const filteredGraph = useMemo(
    () =>
      filterGraphByCourseFilmIds(filmData.nodes, filmData.links, filmFilterIds),
    [filmFilterIds],
  );

  const graphPayload = useMemo(
    () => ({
      nodes: filteredGraph.nodes,
      links: filteredGraph.links,
    }),
    [filteredGraph],
  );

  /** Switch to exactly one course film (same poster keeps that film selected). */
  const toggleFilmId = useCallback((id) => {
    setFilmFilterIds([id]);
  }, []);

  const clearFilmFilter = useCallback(() => {
    setFilmFilterIds([DEFAULT_COURSE_FILM_ID]);
  }, []);

  const filmFilterKey = filmFilterIds[0] ?? DEFAULT_COURSE_FILM_ID;

  const filmFilterFrameSkipRef = useRef(true);
  useEffect(() => {
    if (filmFilterFrameSkipRef.current) {
      filmFilterFrameSkipRef.current = false;
      return;
    }
    setFullGraphOverviewNonce((n) => n + 1);
  }, [filmFilterKey]);

  useEffect(() => {
    setSelectionPast([]);
    setSelectionFuture([]);
  }, [filmFilterIds]);

  useEffect(() => {
    if (!selected?.id) return;
    const stillHere = filteredGraph.nodes.some((n) => n.id === selected.id);
    if (!stillHere) {
      setSelected(null);
      setSelectionPast([]);
      setSelectionFuture([]);
    }
  }, [filteredGraph.nodes, selected?.id]);

  const handleFilmNavClick = useCallback(() => {
    if (characterPanelOpen && rightPanelView === "films") {
      setCharacterPanelOpen(false);
      return;
    }
    setCharacterPanelOpen(true);
    setRightPanelView("films");
  }, [characterPanelOpen, rightPanelView]);

  const handleMethodologyNavClick = useCallback(() => {
    if (characterPanelOpen && rightPanelView === "methodology") {
      setCharacterPanelOpen(false);
      return;
    }
    setMethodologyTab("method");
    setCharacterPanelOpen(true);
    setRightPanelView("methodology");
  }, [characterPanelOpen, rightPanelView]);

  const canvasGl = useMemo(() => ({ antialias: true }), []);
  const canvasDpr = useMemo(() => [1, 2], []);

  const selectNodeById = useCallback(
    (id) => {
      const n = filmData.nodes.find((x) => x.id === id);
      if (!n) return;
      const nid = nodeCourseFilmId(n);
      if (nid == null || !filmFilterIds.includes(nid)) return;
      setCharacterPanelOpen(true);
      setRightPanelView("character");
      if (selected?.id === id) return;
      if (selected?.id) {
        setSelectionPast((p) => [...p, selected.id]);
      }
      setSelectionFuture([]);
      setSelected(n);
    },
    [filmFilterIds, selected?.id],
  );

  const pickNode = selectNodeById;

  const goToFullGraph = useCallback((options = {}) => {
    const { closeCharacterPanel = false } = options;
    if (selected?.id) {
      setSelectionPast((p) => [...p, selected.id]);
    }
    setSelectionFuture([]);
    setSelected(null);
    if (closeCharacterPanel) setCharacterPanelOpen(false);
    setFullGraphOverviewNonce((n) => n + 1);
  }, [selected?.id]);

  const selectionBack = useCallback(() => {
    if (selected?.id) {
      if (selectionPast.length > 0) {
        const prevId = selectionPast[selectionPast.length - 1];
        setSelectionPast((p) => p.slice(0, -1));
        setSelectionFuture((f) => [...f, selected.id]);
        const n = filmData.nodes.find((x) => x.id === prevId);
        setSelected(n ?? null);
        return;
      }
      setSelectionFuture((f) => [...f, selected.id]);
      setSelected(null);
      return;
    }
    if (selectionPast.length > 0) {
      const prevId = selectionPast[selectionPast.length - 1];
      setSelectionPast((p) => p.slice(0, -1));
      const n = filmData.nodes.find((x) => x.id === prevId);
      setSelected(n ?? null);
    }
  }, [selected, selectionPast]);

  const selectionForward = useCallback(() => {
    if (selectionFuture.length === 0) return;
    const nextId = selectionFuture[selectionFuture.length - 1];
    setSelectionFuture((f) => f.slice(0, -1));
    if (selected?.id) {
      setSelectionPast((p) => [...p, selected.id]);
    }
    const n = filmData.nodes.find((x) => x.id === nextId);
    setSelected(n ?? null);
  }, [selected, selectionFuture]);

  const canGoSelectionBack =
    Boolean(selected?.id) || selectionPast.length > 0;
  const canGoSelectionForward = selectionFuture.length > 0;

  const filmHasGraph = filteredGraph.nodes.length > 0;

  /** Show reset control when viewing a film other than the default. */
  const filmResetAvailable =
    (filmFilterIds[0] ?? DEFAULT_COURSE_FILM_ID) !== DEFAULT_COURSE_FILM_ID;

  const overlayIconBtn =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-ads-border text-ads-text-subtle transition-colors hover:border-ads-border-bold hover:bg-ads-surface-raised hover:text-ads-text focus:outline-none focus-visible:ring-2 focus-visible:ring-ads-border-selected";

  return (
    <div className="relative h-full w-full">
      <TopNavBar
        characterPanelOpen={characterPanelOpen}
        onCharacterPanelToggle={() => setCharacterPanelOpen((o) => !o)}
        filmFilterOpen={characterPanelOpen && rightPanelView === "films"}
        onFilmFilterToggle={handleFilmNavClick}
        filmFilterActive={filmResetAvailable}
        onClearFilmFilter={clearFilmFilter}
        methodologyOpen={characterPanelOpen && rightPanelView === "methodology"}
        onMethodology={handleMethodologyNavClick}
        onShowFullGraph={() => goToFullGraph({ closeCharacterPanel: true })}
        canGoSelectionBack={canGoSelectionBack}
        canGoSelectionForward={canGoSelectionForward}
        onSelectionBack={selectionBack}
        onSelectionForward={selectionForward}
      />

      <CharacterSidebar
        open={characterPanelOpen}
        onClose={() => setCharacterPanelOpen(false)}
        selected={selected}
        nodes={graphPayload.nodes}
        links={graphPayload.links}
        films={courseFilms}
        selectedFilmIds={filmFilterIds}
        filmHasGraph={filmHasGraph}
        panelView={rightPanelView}
        onPanelViewChange={setRightPanelView}
        methodologyTab={methodologyTab}
        onMethodologyTabChange={setMethodologyTab}
        sceneEvidence={sceneEvidence}
        onToggleFilmId={toggleFilmId}
        onClearFilmFilter={clearFilmFilter}
        onPickCharacter={pickNode}
      />

      {!filmHasGraph && !characterPanelOpen ? (
        <div className="pointer-events-none fixed left-1/2 top-[46%] z-[70] w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2">
          <div className="pointer-events-auto rounded-lg border border-ads-border-selected/40 bg-ads-surface-overlay-a88 p-panel text-center text-panel-body text-ads-text-subtle shadow-lg backdrop-blur-md sm:p-6">
            <p className="text-panel-title text-ads-text">No nodes for this filter</p>
            <p className="mt-2 text-panel-meta leading-relaxed text-ads-text-subtlest">
              Reset to the default film or pick another encoded title in the list.
            </p>
            <div
              className="mt-5 flex items-center justify-center gap-2"
              role="group"
              aria-label="Recover from empty graph"
            >
              <IconTooltipButton
                tooltip="Reset to Spirited Away"
                aria-label="Reset film selection to Spirited Away"
                onClick={clearFilmFilter}
                className={`${overlayIconBtn} border-ads-border-selected/60 bg-ads-icon-brand/15 text-ads-text-selected hover:bg-ads-icon-brand/25`}
              >
                <IconFilterX size={20} stroke={1.5} aria-hidden />
              </IconTooltipButton>
              <IconTooltipButton
                tooltip="Open filter panel"
                aria-label="Open film filter"
                onClick={() => {
                  setCharacterPanelOpen(true);
                  setRightPanelView("films");
                }}
                className={overlayIconBtn}
              >
                <IconFilter size={20} stroke={1.5} aria-hidden />
              </IconTooltipButton>
            </div>
          </div>
        </div>
      ) : null}

      <Canvas
        gl={canvasGl}
        dpr={canvasDpr}
        onPointerMissed={(e) => {
          if (e.button === 0) goToFullGraph();
        }}
      >
        <GraphCanvasInner
          data={graphPayload}
          focusNodeId={selected?.id ?? null}
          fullGraphOverviewNonce={fullGraphOverviewNonce}
          onSelectNode={(node) => selectNodeById(node.id)}
        />
      </Canvas>
    </div>
  );
}
