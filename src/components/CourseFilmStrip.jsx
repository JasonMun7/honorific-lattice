import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Course film posters (under public/posters). Vertical list with arrow keys.
 * Parent should pass the active course film id(s); one film at a time is typical.
 *
 * @param {{
 *   films: Array<{ id: string; titleDisplay: string; year: number; week: number; weekEnd?: number; poster: string | null; wikipediaUrl: string; graphSource?: boolean; note?: string }>;
 *   selectedFilmIds: string[];
 *   onToggleFilmId: (id: string) => void;
 *   rootId?: string;
 *   layout?: "sheet";
 *   embedded?: boolean;
 * }} props
 */
export default function CourseFilmStrip({
  films,
  selectedFilmIds,
  onToggleFilmId,
  rootId = "course-film-strip",
  layout,
  embedded = false,
}) {
  const narrowing = selectedFilmIds.length > 0;
  const sheet = layout === "sheet";

  const onKeyNavigate = useCallback((e, index) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const list = e.currentTarget.closest("ul");
    const buttons = list?.querySelectorAll("button");
    if (!buttons?.length) return;
    const next =
      e.key === "ArrowDown"
        ? Math.min(index + 1, buttons.length - 1)
        : Math.max(index - 1, 0);
    buttons[next]?.focus();
  }, []);

  return (
    <div
      id={rootId}
      className={`pointer-events-auto ${
        sheet && embedded
          ? "flex h-full min-h-0 flex-1 flex-col"
          : sheet
            ? "flex h-full min-h-0 flex-1 flex-col bg-ads-surface-overlay px-panel py-4"
            : "bg-ads-surface-overlay-a88/80 px-panel py-panel backdrop-blur-md"
      }`}
    >
      {!sheet ? (
        <div className="mb-stack space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ads-text-subtle">
            ASIAN2252 / PMA2452
          </h2>
          <p className="text-panel-meta text-ads-text-subtle">
            Tap a poster to switch the graph to that film only.
          </p>
        </div>
      ) : null}
      <ul
        className={`flex flex-col gap-3.5 overflow-y-auto overflow-x-hidden [scrollbar-color:var(--ads-color-border-bold)_transparent] ${
          sheet && embedded
            ? "min-h-0 flex-1 list-none py-0"
            : sheet
              ? "min-h-0 flex-1 list-none pb-stack pt-stack"
              : "max-h-[min(42vh,22rem)] list-none pb-stack pt-stack"
        }`}
        aria-label="Course titles in catalog"
      >
        {films.map((film, index) => {
          const inFilter = selectedFilmIds.includes(film.id);
          const posterSrc = film.poster || "/posters/placeholder.svg";
          const weekLabel =
            film.weekEnd != null
              ? `W${film.week}–${film.weekEnd}`
              : `W${film.week}`;
          const rowSelected = narrowing && inFilter;
          const rowMuted = narrowing && !inFilter;
          const ariaPressed = narrowing ? inFilter : undefined;
          const tip = narrowing
            ? inFilter
              ? `${film.titleDisplay} — selected`
              : `Show only ${film.titleDisplay}`
            : `Show only ${film.titleDisplay}`;
          return (
            <li key={film.id} className="shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-pressed={ariaPressed}
                    aria-label={
                      narrowing
                        ? inFilter
                          ? `${film.titleDisplay}, currently selected`
                          : `${film.titleDisplay}, switch graph to this film`
                        : `${film.titleDisplay}, show this film only`
                    }
                    onClick={() => onToggleFilmId(film.id)}
                    onKeyDown={(e) => onKeyNavigate(e, index)}
                    className={`group relative h-auto min-h-0 w-full justify-start gap-3 overflow-hidden rounded-lg border px-3.5 py-3.5 text-left font-medium leading-snug shadow-sm transition-[border-color,box-shadow,background-color,opacity,transform] focus-visible:ring-2 focus-visible:ring-ads-border-selected focus-visible:ring-offset-2 focus-visible:ring-offset-ads-surface-sunken ${
                  rowSelected
                    ? "border-ads-border-selected bg-ads-icon-brand/16 shadow-[0_0_0_1px_var(--ads-color-border-selected),0_0_14px_-4px_var(--ads-color-border-selected)]"
                    : rowMuted
                      ? "border-ads-border/60 bg-ads-surface-raised/35 text-ads-text-subtle opacity-[0.72] hover:border-ads-border-bold hover:bg-ads-surface-raised/55 hover:opacity-100"
                      : "border-ads-border/80 bg-ads-surface-raised/50 text-ads-text hover:border-ads-border-bold hover:bg-ads-surface-raised hover:shadow-md"
                } ${film.graphSource ? "ring-1 ring-ads-icon-information/50" : ""}`}
              >
                {rowSelected ? (
                  <span
                    className="pointer-events-none absolute inset-y-2 left-0 w-1 rounded-full bg-ads-border-selected shadow-[0_0_8px_var(--ads-color-border-selected)]"
                    aria-hidden
                  />
                ) : null}
                <div
                  className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-ads-surface-raised sm:h-11 sm:w-11 ${
                    rowSelected
                      ? "border-ads-border-selected ring-2 ring-ads-border-selected/35 ring-offset-2 ring-offset-[color-mix(in_srgb,var(--ads-color-icon-brand)_16%,var(--ads-elevation-surface-raised))]"
                      : "border-ads-border"
                  }`}
                >
                  <img
                    src={posterSrc}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-[0.99]"
                    aria-hidden
                  />
                  {film.graphSource ? (
                    <span className="absolute left-0.5 top-0.5 rounded bg-ads-surface-sunken/90 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-ads-icon-information">
                      Graph
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p
                    className={`line-clamp-2 text-[13px] ${
                      rowSelected ? "font-semibold text-ads-text-selected" : "text-ads-text"
                    }`}
                  >
                    {film.titleDisplay}
                  </p>
                  <p
                    className={`text-[10px] ${
                      rowSelected ? "text-ads-text-subtle" : "text-ads-text-subtlest"
                    }`}
                  >
                    {film.year} · {weekLabel}
                  </p>
                </div>
                {rowSelected ? (
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ads-icon-brand/25 text-ads-text-selected"
                    aria-hidden
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0"
                    >
                      <path
                        d="M2.5 7.2 5.4 10 11.5 3.8"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                ) : null}
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  sideOffset={8}
                  className="max-w-xs border border-ads-border/80 bg-ads-surface-overlay px-3 py-2 text-xs text-ads-text shadow-lg"
                >
                  {tip}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
