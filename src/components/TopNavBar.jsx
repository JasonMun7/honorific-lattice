import {
  IconArrowLeft,
  IconArrowRight,
  IconFilter,
  IconFilterX,
  IconInfoCircle,
  IconLayoutSidebarRight,
  IconTopologyRing,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import IconTooltipButton from "./IconTooltipButton.jsx";

/**
 * @param {{
 *   characterPanelOpen: boolean;
 *   onCharacterPanelToggle: () => void;
 *   filmFilterOpen: boolean;
 *   onFilmFilterToggle: () => void;
 *   filmFilterActive: boolean; when true, show reset-to-default film in the toolbar;
 *   onClearFilmFilter: () => void;
 *   methodologyOpen: boolean;
 *   onMethodology: () => void;
 *   onShowFullGraph: () => void;
 *   canGoSelectionBack: boolean;
 *   canGoSelectionForward: boolean;
 *   onSelectionBack: () => void;
 *   onSelectionForward: () => void;
 * }} props
 */
export default function TopNavBar({
  characterPanelOpen,
  onCharacterPanelToggle,
  filmFilterOpen,
  onFilmFilterToggle,
  filmFilterActive,
  onClearFilmFilter,
  methodologyOpen,
  onMethodology,
  onShowFullGraph,
  canGoSelectionBack,
  canGoSelectionForward,
  onSelectionBack,
  onSelectionForward,
}) {
  const btn =
    "flex h-10 w-10 items-center justify-center rounded-md border border-transparent text-ads-text-subtle transition-colors hover:border-ads-border hover:bg-ads-surface-raised hover:text-ads-text focus:outline-none focus-visible:ring-2 focus-visible:ring-ads-border-selected focus-visible:ring-offset-2 focus-visible:ring-offset-ads-surface-sunken";

  const btnFullGraph =
    "flex h-10 min-w-10 items-center justify-center gap-1 rounded-md border border-transparent px-2 text-ads-text-subtle transition-colors hover:border-ads-border hover:bg-ads-surface-raised hover:text-ads-text focus:outline-none focus-visible:ring-2 focus-visible:ring-ads-border-selected focus-visible:ring-offset-2 focus-visible:ring-offset-ads-surface-sunken sm:min-w-0 sm:px-2.5";

  const tipSurface =
    "max-w-[min(20rem,calc(100vw-2rem))] px-3 py-2 text-left text-xs font-normal leading-snug shadow-lg";

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[100] border-b border-ads-border bg-ads-surface-overlay-a88 backdrop-blur-md">
      <div className="pointer-events-auto mx-auto flex h-16 max-w-[100vw] items-center justify-between gap-stack px-[max(1.75rem,env(safe-area-inset-left))] pe-[max(1.75rem,env(safe-area-inset-right))]">
        <div className="flex min-w-0 items-center gap-stack pe-3">
          <span className="truncate text-panel-title text-ads-text">
            Honorific Lattice
          </span>
        </div>
        <nav className="flex shrink-0 items-center gap-2.5 sm:gap-3.5" aria-label="Primary">
          <IconTooltipButton
            tooltip={
              canGoSelectionBack
                ? "Previous selection or clear focus"
                : "No history yet"
            }
            aria-label="Previous character in history"
            disabled={!canGoSelectionBack}
            onClick={onSelectionBack}
            className={btn}
          >
            <IconArrowLeft size={20} stroke={1.5} aria-hidden />
          </IconTooltipButton>
          <IconTooltipButton
            tooltip={
              canGoSelectionForward
                ? "Redo next selection"
                : "Nothing forward"
            }
            aria-label="Next character in history"
            disabled={!canGoSelectionForward}
            onClick={onSelectionForward}
            className={btn}
          >
            <IconArrowRight size={20} stroke={1.5} aria-hidden />
          </IconTooltipButton>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className={btnFullGraph}
                aria-label="Full graph: clear selection and fit current film"
                onClick={onShowFullGraph}
              >
                <IconTopologyRing size={20} stroke={1.5} aria-hidden />
                <span className="hidden text-xs font-medium sm:inline">
                  Full graph
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className={tipSurface}>
              Clear selection, fit the current film’s graph, close panel
            </TooltipContent>
          </Tooltip>
          <div
            className="mx-2 h-6 w-px shrink-0 bg-ads-border"
            aria-hidden
          />
          <IconTooltipButton
            tooltip={
              filmFilterOpen ? "Close filter panel" : "Open filter panel"
            }
            aria-label="Open filter panel"
            aria-expanded={filmFilterOpen}
            aria-controls={filmFilterOpen ? "right-sidebar-panel" : undefined}
            onClick={onFilmFilterToggle}
            className={`${btn} ${filmFilterOpen ? "border-ads-border bg-ads-surface-raised text-ads-text" : ""}`}
          >
            <IconFilter size={20} stroke={1.5} aria-hidden />
          </IconTooltipButton>
          {filmFilterActive ? (
            <IconTooltipButton
              tooltip="Reset film to Spirited Away"
              aria-label="Reset film selection to Spirited Away"
              onClick={onClearFilmFilter}
              className={btn}
            >
              <IconFilterX size={20} stroke={1.5} aria-hidden />
            </IconTooltipButton>
          ) : null}
          <IconTooltipButton
            tooltip={
              methodologyOpen
                ? "Close methodology panel"
                : "Open methodology"
            }
            aria-label="Open methodology"
            aria-expanded={methodologyOpen}
            aria-controls={methodologyOpen ? "right-sidebar-panel" : undefined}
            onClick={onMethodology}
            className={`${btn} ${methodologyOpen ? "border-ads-border bg-ads-surface-raised text-ads-text" : ""}`}
          >
            <IconInfoCircle size={20} stroke={1.5} aria-hidden />
          </IconTooltipButton>
          <IconTooltipButton
            tooltip={
              characterPanelOpen ? "Hide side panel" : "Show side panel"
            }
            aria-label={
              characterPanelOpen
                ? "Close character sidebar"
                : "Open character sidebar"
            }
            aria-expanded={characterPanelOpen}
            aria-controls={
              characterPanelOpen ? "right-sidebar-panel" : undefined
            }
            onClick={onCharacterPanelToggle}
            className={`${btn} ${characterPanelOpen ? "border-ads-border bg-ads-surface-raised text-ads-text" : ""}`}
          >
            <IconLayoutSidebarRight size={20} stroke={1.5} aria-hidden />
          </IconTooltipButton>
        </nav>
      </div>
    </header>
  );
}
