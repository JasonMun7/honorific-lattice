import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PanelListShell from "./PanelListShell.jsx";

const TABS = [
  { id: "method", label: "Method" },
  { id: "legend", label: "Legend" },
  { id: "evidence", label: "Evidence" },
];

/**
 * Methodology tabs + scrollable content (embedded in the unified right panel).
 *
 * @param {{ tab: string; onTabChange: (id: string) => void; sceneEvidence: object }} props
 */
export default function MethodologyPanelBody({ tab, onTabChange, sceneEvidence, yStrength = 0.55, onYStrengthChange, yLocked = false, onYLockedChange, zLocked = false, onZLockedChange }) {
  const tabBtn =
    "rounded-md px-panel-tight py-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ads-border-selected";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap gap-2 border-b border-ads-border px-panel py-3">
        {TABS.map(({ id, label }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className={`h-auto min-h-0 ${tabBtn} ${
                  tab === id
                    ? "bg-ads-surface-raised text-ads-text"
                    : "text-ads-text-subtle hover:bg-ads-surface-sunken hover:text-ads-text"
                }`}
                onClick={() => onTabChange(id)}
              >
                {label}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={6}
              className="max-w-xs border border-ads-border/80 bg-ads-surface-overlay px-3 py-2 text-xs text-ads-text shadow-lg"
            >
              {label} tab
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-panel py-4 text-panel-body text-ads-text-subtle">
        {tab === "method" ? (
          <MethodTab
            yStrength={yStrength}
            onYStrengthChange={onYStrengthChange}
            yLocked={yLocked}
            onYLockedChange={onYLockedChange}
            zLocked={zLocked}
            onZLockedChange={onZLockedChange}
          />
        ) : null}
        {tab === "legend" ? <LegendTab /> : null}
        {tab === "evidence" ? <EvidenceTab sceneEvidence={sceneEvidence} /> : null}
      </div>
    </div>
  );
}

function MethodTab({ yStrength, onYStrengthChange, yLocked, onYLockedChange, zLocked, onZLockedChange }) {
  return (
    <div className="space-y-section leading-relaxed">
      <p className="text-ads-text">
        This project treats <strong>Japanese honorifics and politeness morphology</strong>{" "}
        as traces of <strong>who ranks whom in talk</strong>—not only who wins fights or
        owns the bathhouse in plot terms, but how speakers{" "}
        <strong>index hierarchy and social distance</strong> when they open their mouths.
      </p>
      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ads-text">
          Corpus → directed pairs
        </h3>
        <p>
          For <strong>Spirited Away</strong>, the full Japanese script is tagged by
          speaker and addressee. Polite-marker counts per line — weighted{" "}
          <strong>ございます ×3, sonkeigo/kenjōgo verbs ×2, ます ×1, です ×0.5</strong> —
          are averaged over each directed dyad. The 95th-percentile raw score sets the
          ceiling, normalizing to a <strong>0–3 formality scale</strong>.{" "}
          <strong>Social distance</strong> is derived from both directions:{" "}
          <code className="text-ads-text">max(f, f_rev)×0.70 + max(0, f−f_rev)×0.60 + 1</code>,
          clamped to 1–4. Group-addressed lines are decomposed to each named member.
          For <strong>other films</strong>, each directed edge is an interpretive summary
          of stance from speaker A toward addressee B, inferred from scene evidence and
          defended in prose.
        </p>
      </section>
      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ads-text">
          Edge weights: formality & social distance
        </h3>
        <p>
          <strong className="text-ads-text">Honorific formality</strong> encodes{" "}
          <strong>honorification load</strong> on that directed tie (higher = more upward
          deferral, lexical honorifics, or sustained polite inflection).{" "}
          <strong className="text-ads-text">Social distance</strong> encodes{" "}
          <strong>affective or institutional stretch</strong>—how “hard” the relationship
          feels to maintain politely (stranger danger, sovereign terror, feast chaos,
          etc.). For Spirited Away both values are corpus-derived; for other films
          they are qualitative judgments defended against scene evidence.
        </p>
        <p className="mt-2">
          The 3D layout also uses a derived{" "}
          <strong className="text-ads-text">hierarchy salience</strong>: directed formality
          counts for more when it runs <em>up</em> the institutional rank encoded on each
          node (<code className="text-ads-text">basePower</code>). Those dyads get slightly
          shorter springs and stronger link forces so deferential stance and power line up
          visually; edges are drawn a bit thicker and brighter where that signal is strong.
        </p>
      </section>
      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ads-text">
          Force layout
        </h3>
        <p>
          The simulation sets resting link distance to{" "}
          <span className="whitespace-nowrap font-medium text-ads-text">
            max(4.2, 6 + 2.2×<em>f</em> + 0.9×<em>sd</em> − 2.6×<em>hi</em>)
          </span>{" "}
          where <em>f</em> is honorific formality, <em>sd</em> is social distance, and{" "}
          <em>hi</em> is hierarchy salience on that edge. Higher formality or social
          distance → <strong>longer edges</strong>; stronger hierarchy salience{" "}
          <strong>shortens</strong> the spring, drawing deferential dyads slightly
          closer so rank alignment is visible in space.
        </p>
        {onYStrengthChange ? (
          <div className="mt-3 rounded-md border border-ads-border/60 bg-ads-surface-sunken px-3 py-2.5">
            <div className={`mb-2 flex items-center justify-between text-xs ${yLocked ? "opacity-40" : ""}`}>
              <span className="text-ads-text-subtle">Y spring strength</span>
              <span className="font-mono text-ads-text">{yStrength.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={yStrength}
              disabled={yLocked}
              onChange={(e) => onYStrengthChange(Number(e.target.value))}
              className={`w-full accent-blue-500 ${yLocked ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            />
            <div className={`mt-1.5 flex justify-between text-[10px] text-ads-text-subtlest ${yLocked ? "opacity-40" : ""}`}>
              <span>0 — free float</span>
              <span>0.55 — default</span>
              <span>1 — strongest spring</span>
            </div>
            <div className="mt-2.5 space-y-2">
              {onYLockedChange ? (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-ads-text-subtle">
                  <input
                    type="checkbox"
                    checked={yLocked}
                    onChange={(e) => onYLockedChange(e.target.checked)}
                    className="accent-blue-500"
                  />
                  Hard-lock Y to basePower (overrides spring)
                </label>
              ) : null}
              {onZLockedChange ? (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-ads-text-subtle">
                  <input
                    type="checkbox"
                    checked={zLocked}
                    onChange={(e) => onZLockedChange(e.target.checked)}
                    className="accent-blue-500"
                  />
                  Hard-lock Z to zTarget depth
                </label>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ads-text">
          Axes: power (Y) and uchi–soto tilt (Z)
        </h3>
        <p>
          <strong className="text-ads-text-accent-teal-bolder">Y</strong> pulls each node
          toward a target height proportional to its{" "}
          <strong>basePower</strong> (0–10 scale → 0–14 world units), with a spring
          strength of 0.55 that competes with link and repulsion forces. For Spirited Away,
          basePower is corpus-derived net deference received; for other films it is a
          hand-coded estimate of{" "}
          <strong>institutional or narrative rank</strong>.{" "}
          <strong className="text-ads-text-accent-yellow-bolder">Z</strong> is driven by a{" "}
          <strong>depth target</strong>, a compact stand-in for{" "}
          <strong>uchi–soto / relational depth</strong> orthogonal to raw rank: who is
          treated as inside the bathhouse machine vs exposed outsider.
        </p>
      </section>
      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ads-text">
          Reading hierarchy from the graph
        </h3>
        <p>
          Look for <strong>steep Y separation</strong> between clusters,{" "}
          <strong>directed dashed ties</strong> whose <strong>stroke weight, dash length,
          gap, and crawl speed</strong> all scale with <strong>honorific formality</strong>,{" "}
          <strong>social distance</strong>, and <strong>hierarchy salience</strong> (heavier /
          faster = more load, relational stretch, and salient upward deferral), plus a{" "}
          <strong>neutral gray</strong> stroke ramp along that same blend—and{" "}
          <strong>long vs short resting edges</strong> from the force formula. The model is{" "}
          <strong>interpretive</strong>: it compresses scenes into a few numbers so you can
          argue visually, not replace linguistics.
        </p>
      </section>
    </div>
  );
}

function LegendTab() {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ads-text">
          Nodes (icosahedron size = power, color = rank)
        </h3>
        <ul className="list-inside list-disc space-y-2 text-[13px] marker:text-ads-text-subtlest">
          <li>
            Every character is an <strong>icosahedron</strong>; larger meshes correspond to
            higher <strong>base power</strong> in the encoded hierarchy.
          </li>
          <li>
            <span className="font-medium text-ads-text">Warm orange</span> — ADS chart
            categorical token for very high narrative power (about 7/10 and above:
            sovereign-tier, senior agents, apex guests in context).{" "}
            <span className="text-ads-text-subtle">Cool blue</span> — chart categorical blue
            for lower ranks.
          </li>
        </ul>
      </section>
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ads-text">
          Edges (directed dashes = stance weights)
        </h3>
        <ul className="list-inside list-disc space-y-2 text-[13px] marker:text-ads-text-subtlest">
          <li>
            Every link is a <strong>pulsing dashed</strong> line with a{" "}
            <strong>cone arrowhead</strong> at the target end — the arrow points toward
            the node being deferred to (the addressee).
          </li>
          <li>
            <strong>Faster crawl</strong> → stronger blend of honorific formality, social
            distance, and hierarchy salience on that edge.
          </li>
          <li>
            <strong>Thicker stroke</strong> → higher honorification load, social distance,
            and hierarchy salience. Hierarchy salience carries the largest weight, so the
            widest edges are salient upward-deferral dyads, not just high-formality ones.
          </li>
          <li>
            <strong>Longer dash gaps</strong> → more relational stretch (higher social
            distance). Dash length itself scales more with formality.
          </li>
          <li>
            <strong>Lighter gray</strong> → combined upward stance;{" "}
            <strong>dimmer slate</strong> → flatter or peer-ish dyads.
          </li>
          <li>
            Resting edge <strong>length in 3D</strong> follows the force formula (see
            Method tab): base spacing plus formality and social distance, minus a
            hierarchy pull.
          </li>
        </ul>
      </section>
      <p className="text-panel-meta text-ads-text-subtlest">
        Drag to orbit · click a node for the sidebar. Portraits may be illustrative
        stand-ins.
      </p>
    </div>
  );
}

function EvidenceTab({ sceneEvidence }) {
  const scenes = useMemo(() => sceneEvidence?.scenes ?? [], [sceneEvidence]);
  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed">{sceneEvidence?.methodology}</p>
      <PanelListShell>
        <ul className="flex flex-col gap-3.5">
          {scenes.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-ads-border/90 bg-ads-surface-raised/40 px-4 py-4 shadow-sm"
            >
              <p className="font-medium text-ads-text">{s.title}</p>
              <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2.5 text-[11px]">
                <div>
                  <dt className="text-ads-text-subtlest">desu/masu</dt>
                  <dd className="tabular-nums text-ads-text">{s.counts?.desuMasu ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-ads-text-subtlest">Honorific cluster</dt>
                  <dd className="tabular-nums text-ads-text">
                    {s.counts?.sonkeigoKenjogoTeineigoMarkers ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-ads-text-subtlest">Plain / rough</dt>
                  <dd className="tabular-nums text-ads-text">
                    {s.counts?.plainImperativeRough ?? "—"}
                  </dd>
                </div>
              </dl>
              {s.rationale ? (
                <p className="mt-2 text-[11px] italic text-ads-text-subtle">{s.rationale}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </PanelListShell>
    </div>
  );
}
