# Honorific Lattice — polished project framing (paste-ready)

Use the sections below for Canvas, a group proposal doc, or the opening of your reflective PDF. Stack details are optional in the pitch; keep **directed graph**, **honorific / desu–masu / plain**, **scene evidence**, and **one film title** unless your instructor wants multi-film comparison.

---

## Working title

**Honorific lattice: mapping speech-level power in *Spirited Away***

## One-sentence pitch

I build a **data-grounded character network** in which **directed edges** encode how Chihiro and others **index social hierarchy and distance through Japanese honorifics, politeness forms, and plain speech**, then visualize that network so **power relations** the course discusses become **spatially legible** (who “ranks” whom in talk, who is treated as *uchi* vs *soto*, and where formality shifts).

## Research question

How far can we **recover implicit power structure** from **linguistic stance alone**—not plot summaries—by scoring **keigo / desu–masu / honorific bundles / plain or rough forms** between pairs of speakers in selected scenes?

## Creative artifact (what you are making)

- A **small, documented corpus**: a few tightly chosen scenes on the **Japanese track**, transcribed or time-stamped, with **counts or qualitative tags** for honorific load and stance (aligned with [`src/data/sceneEvidence.json`](src/data/sceneEvidence.json)).
- A **directed graph**: **nodes** = characters (or character-in-role, if register shifts matter); **edges** = attested address/reference or adjacency-pair speech events you code.
- **Edge weights** encoded as `formality` and `socialDistance` on each directed link in [`src/data/filmData.json`](src/data/filmData.json); the live simulation maps these to **link distance** with a fixed formula (see **Evidence ↔ graph alignment** below) so the layout is **defensible in prose**, not only aesthetic.
- An **interactive 3D visualization** (Vite + React + force layout in this repo) as the **public-facing** creative piece—optionally add a **QR** in the reflection to your deployed build ([`README.md`](README.md) deploy section).

## Course themes (name explicitly in the pitch)

- **Power and hierarchy** expressed through language, not only action or framing.
- **Modernity, labor, and identity** (*Spirited Away*): who is named, who is erased, who is infantilized or animalized in **how** they are spoken to.
- **Uchi–soto / relational self** (if your readings cover this): encoding **social distance** as a dimension separate from vertical rank (node field `zTarget` in data; depth axis in the viz).

## Evidence ↔ graph alignment (keep reflection and JSON in sync)

| Artifact | Role in the argument |
|----------|----------------------|
| [`sceneEvidence.json`](src/data/sceneEvidence.json) — per-scene `desuMasu`, `sonkeigoKenjogoTeineigoMarkers`, `plainImperativeRough` | Justify **why** each directed pair gets its qualitative `label` and numeric `formality` / `socialDistance` in `filmData.json`. Replace citation placeholders with **exact JP lines + timestamps** before submission. |
| [`filmData.json`](src/data/filmData.json) — `basePower`, `zTarget` | **Vertical hierarchy** (Y) vs **relational / uchi–soto tilt** (Z), orthogonal in the layout. |
| Link simulation in [`src/components/ForceGraph.jsx`](src/components/ForceGraph.jsx) | Resting link distance `d = 6 + 2.2 × formality + 0.9 × socialDistance` (higher values → **longer** edges). Line color/opacity also scales with `formality` (gold vs gray). |

Your 800-word reflection should **state this mapping in one clear sentence** and defend it—or revise the numbers in JSON **and** this table together if you change the rule.

---

## Reflective essay (~800 words) — rubric-aligned outline

1. **Description** — What the graph shows; your **role** (and teammates’ roles if paired); how nodes/edges map to linguistic evidence; which **film(s)** and **themes** (above).
2. **Process** — What hand-tagging honorifics forced you to notice that a plot-only essay would not; limits of quantification; borderline cases (same addressee, shifting register mid-scene).
3. **Reading** — One assigned text: **agree, extend, or push back**. Replace the bracketed slot below with a real citation from your syllabus; quote or paraphrase **one concrete claim**, then tie it to **one design choice**—for example: treating **vertical rank** (`basePower` → `forceY`) as **separate** from **relational distance** (`zTarget` → `forceZ`), or defending the **link-distance formula** as a model of “honorification load + relational stretch.”
4. **Point** — One-sentence thesis, e.g. “The lattice argues that ___ becomes visible when ___ is modeled as ___.”

### Reading slot (fill before submission)

**Assigned reading:** [Author, “Title,” course pack / book, pages ___]  

**Claim to engage:** [One sentence]  

**Design choice in dialogue with that claim:** [e.g. `zTarget` vs `basePower`; or `d = 6 + 2.2f + 0.9sd`; or three-scene windowing in `sceneEvidence.json`]

---

## Elevator version (very short)

We treat **honorifics and politeness morphology as traces of rank and distance**, code them between speakers in *Spirited Away*, and turn those codes into **weighted directed edges** in a **3D network** so **course themes about power and social positioning** can be **seen and argued from evidence**, not only described.
