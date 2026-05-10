import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CharacterPortraitImg from "./CharacterPortraitImg.jsx";
import CourseFilmStrip from "./CourseFilmStrip.jsx";
import PanelListShell from "./PanelListShell.jsx";
import { DEFAULT_COURSE_FILM_ID } from "../lib/graphFilmFilter.js";

const CHARACTER_SEARCH_MAX = 40;

/**
 * Filter panel: character search + single course-title selection (unified right panel).
 *
 * @param {{
 *   films: Array<object>;
 *   selectedFilmIds: string[];
 *   onToggleFilmId: (id: string) => void;
 *   graphIsEmpty: boolean;
 *   nodes: Array<{ id: string; name: string; film?: string; role?: string }>;
 *   onPickCharacter: (id: string) => void;
 * }} props
 */
export default function FilmFilterPanelBody({
  films,
  selectedFilmIds,
  onToggleFilmId,
  graphIsEmpty,
  nodes,
  onPickCharacter,
}) {
  const [characterQuery, setCharacterQuery] = useState("");
  const characterSearchRef = useRef(null);

  const filterBlocksGraph =
    graphIsEmpty && selectedFilmIds.length > 0;

  const defaultFilmTitle =
    films.find((f) => f.id === DEFAULT_COURSE_FILM_ID)?.titleDisplay ??
    "Spirited Away";

  const { characterMatches, characterMatchesTruncated } = useMemo(() => {
    const t = characterQuery.trim().toLowerCase();
    if (!t) return { characterMatches: [], characterMatchesTruncated: false };
    const out = [];
    for (const n of nodes) {
      const label = (n.name ?? n.id ?? "").toString();
      if (label.toLowerCase().includes(t)) out.push(n);
    }
    out.sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", "en", {
        sensitivity: "base",
      }),
    );
    const truncated = out.length > CHARACTER_SEARCH_MAX;
    return {
      characterMatches: out.slice(0, CHARACTER_SEARCH_MAX),
      characterMatchesTruncated: truncated,
    };
  }, [nodes, characterQuery]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {filterBlocksGraph ? (
        <div
          className="shrink-0 rounded-lg border border-ads-border-selected/55 bg-ads-icon-brand/12 px-4 py-3.5 shadow-sm"
          role="status"
        >
          <p className="text-left text-panel-meta leading-relaxed text-ads-text">
            No nodes for this title — only some weeks are encoded. Use{" "}
            <span className="font-semibold text-ads-text-selected">Graph</span> in the list or{" "}
            <span className="whitespace-nowrap font-semibold text-ads-text-selected">
              reset to {defaultFilmTitle}
            </span>{" "}
            in the top bar or panel header.
          </p>
        </div>
      ) : null}

      <div className="shrink-0 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ads-text-subtlest">
          Characters
        </p>
        <Field>
          <FieldLabel htmlFor="filter-character-search" className="sr-only">
            Search characters by name
          </FieldLabel>
          <ButtonGroup className="w-full min-w-0 max-w-full">
            <Input
              ref={characterSearchRef}
              id="filter-character-search"
              type="search"
              autoComplete="off"
              spellCheck={false}
              value={characterQuery}
              onChange={(e) => setCharacterQuery(e.target.value)}
              placeholder="Search by name…"
              className="border-ads-border/80 bg-ads-surface-sunken text-[13px] text-ads-text placeholder:text-ads-text-subtlest focus-visible:border-ads-border-selected focus-visible:ring-ads-border-selected"
            />
            <Button
              type="button"
              variant="outline"
              className="h-10 min-h-10 shrink-0 self-stretch px-3.5"
              onClick={() => characterSearchRef.current?.focus()}
            >
              Search
            </Button>
          </ButtonGroup>
        </Field>
        {characterQuery.trim() ? (
          <PanelListShell className="max-h-52 overflow-y-auto py-3">
            {characterMatches.length === 0 ? (
              <p className="px-1 text-panel-meta text-ads-text-subtlest">
                No names match in the current graph slice.
              </p>
            ) : (
              <ul className="flex flex-col gap-3.5" aria-label="Character search results">
                {characterMatches.map((n) => (
                  <li key={n.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto min-h-0 w-full justify-start gap-3 rounded-lg border border-ads-border/80 bg-ads-surface-raised/50 px-3.5 py-3.5 text-left text-[13px] font-medium leading-snug text-ads-text shadow-sm transition-[border-color,box-shadow,background-color] hover:border-ads-border-bold hover:bg-ads-surface-raised hover:shadow-md focus-visible:ring-2 focus-visible:ring-ads-border-selected"
                          onClick={() => {
                            onPickCharacter(n.id);
                            setCharacterQuery("");
                          }}
                        >
                          <CharacterPortraitImg
                            node={n}
                            alt={`Portrait for ${n.name} (illustrative or curated)`}
                            className="h-10 w-10 shrink-0 rounded-lg border border-ads-border object-cover"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{n.name}</span>
                            {n.role ? (
                              <span className="mt-0.5 block truncate text-[10px] font-normal text-ads-text-subtlest">
                                {n.role}
                              </span>
                            ) : null}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        sideOffset={8}
                        className="max-w-xs border border-ads-border/80 bg-ads-surface-overlay px-3 py-2 text-xs text-ads-text shadow-lg"
                      >
                        Open {n.name} in graph
                      </TooltipContent>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            )}
            {characterMatchesTruncated ? (
              <p className="mt-2 px-1 text-[10px] text-ads-text-subtlest">
                Showing first {CHARACTER_SEARCH_MAX} matches — refine your search.
              </p>
            ) : null}
          </PanelListShell>
        ) : null}
      </div>

      <div className="min-h-0 flex-1">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ads-text-subtlest">
          Titles
        </p>
        <PanelListShell className="flex h-full min-h-0 flex-col">
          <CourseFilmStrip
            embedded
            layout="sheet"
            films={films}
            selectedFilmIds={selectedFilmIds}
            onToggleFilmId={onToggleFilmId}
            rootId="course-film-strip-right-panel"
          />
        </PanelListShell>
      </div>
    </div>
  );
}
