# Polite-Speech Analysis: Notable Findings
*Spirited Away — corpus-derived dyad metrics from `dyad_metrics.csv`*

Scripts: `count-polite.mjs` (marker counting) → `derive-dyad-metrics.mjs` (formality + sD) → `update-film-data.mjs` (basePower + socialDistance → filmData.json).

---

## 1. The corpus is mostly plain speech

Only **108 of 1,251 lines (8.6%)** contain any polite marker. This is a low baseline — Spirited Away is a coming-of-age story set in an underworld workplace, not a formal social drama, and most of the dialogue is colloquial, emotional, or imperative. All findings below should be read against this backdrop: polite markers are *scarce and meaningful* precisely because they stand out.

---

## 2. Service formulae dominate the high-formality ceiling

The highest-load single line in the corpus:

> **蛙男 → group:arriving guests** — `いらっしゃいませ。いらっしゃいませ。` (load = 6)

Two back-to-back greeting formulae, each carrying `honorific_verb + masu`. The bathhouse frog staff (蛙男, 番台蛙) are the most polite speakers by average load per line (1.24 and 0.68 respectively), far above any other character. Their speech is **role-bound keigo** — register is dictated entirely by the service context, not personal relationship.

Other service-formula lines in the top 20:
- `到着でございます。` / `右手のお座敷でございます。` — 蛙男 narrating arrival of the River Spirit; `でございます` (gozaimasu-class) bumps load to 4.
- `これはとんだご無礼をいたしました。` — 兄役 (senior frog) apologizing after the No-Face incident; `いたす` (humble verb) marks formal accountability speech.

**Takeaway**: The data correctly identifies that *professional role*, not *personal deference*, generates the highest formality scores. This is a structural feature of teichōgo in Japanese service contexts.

---

## 3. The institutional hierarchy is legible as a gradient

Upward-directed speech toward 湯婆婆 across different speakers:

| Speaker | Formality (→湯婆婆) | Lines | Note |
|---|---|---|---|
| 番台蛙 | **3.000** | 4 | `おはようございます！`, `よくお休みになられましたか？` |
| ハク | **1.949** | 9 | `何があったのでしょう？教えてください。` |
| 父役 | **0.718** | 9 | Senior bath staff |
| 千尋 | **0.852** | 26 | See §5 |
| 青蛙 | **0.923** | 1 | Single line (low sample) |

A clear gradient runs from lowest-ranked service staff → institutional middle (Haku) → protagonist. 湯婆婆 receives zero upward speech of her own — she never addresses anyone in the corpus with polite markers (f = 0 in all directions), which is itself a register signal: sovereign command register requires no upward deferral.

---

## 4. Maximally asymmetric dyads mark clear power differentials

Four dyad pairs have formality = 3.0 / 0.0 (maximum asymmetry):

| Dyad | f→ | f← | Interpretation |
|---|---|---|---|
| 番台蛙 ↔ 湯婆婆 | 3.0 | 0.0 | Full institutional deferral; Yubaba commands, never honors |
| リン ↔ お白様 | 3.0 | 0.0 | Service register to a spirit guest; guest never replies in corpus |
| 千尋 ↔ 番台蛙 | 3.0 | 0.154 | Chihiro addresses the desk frog with maximum politeness to get hired; frog barely reciprocates |
| ハク ↔ 湯婆婆 | 1.949 | 0.0 | Institutional middle: more polite than Chihiro, less than service staff |

The `socialDistance` formula maps these correctly: a 3/0 split yields sD ≈ 4.0 regardless of which direction is measured, because `social_gap = max(f_AB, f_BA) = 3` captures the objective depth of the hierarchy even for the downward-speaking party.

---

## 5. Chihiro→Yubaba under-scores relative to naive expectation

The hand-coded `formality` for this link is 3 (maximum). The corpus-derived value is **0.852**.

Chihiro's polite lines toward Yubaba are almost entirely `ください`-form requests:

```
働かせてください！       (honorific_verb: ここで働かせてください repeated ×3)
ありがとうございました。  (gozaimasu — single line)
お世話になりました。      (masu — departure thanks)
```

In her 26 lines to Yubaba, only 11 carry any polite load. The rest are emotional, desperate, or declarative:
- `嫌です！` (refusal)
- `湯婆婆！お父さんとお母さんを返して！` (demand)
- `やる！やります！` (capitulation)

**Interpretation**: Chihiro's relationship with Yubaba is driven by *emotional urgency*, not *formal register discipline*. She deploys keigo instrumentally (when asking for something) rather than maintaining it as a relational baseline. This is linguistically significant — it suggests Chihiro has not yet internalized the bathhouse's register economy. Her register *peaks* at critical junctures and then collapses back to plain speech.

---

## 6. The なさい false positive: parental commands vs. sonkeigo

The regex tags `なさい` as `honorific_verb_count` because it is morphologically the imperative of `なさる` (sonkeigo "to do"). But in practice it functions as a **downward parental command**:

| Speaker | Line | Pragmatic function |
|---|---|---|
| お母さん→千尋 | `千尋、座ってなさい。` | Command to sit |
| お母さん→千尋 | `千尋、早くしなさい！` | Command to hurry |
| 釜爺→千尋 | `待ちなさい！` | Command to stop |
| 湯婆婆→坊 | `いい子でいなさいね。` | Command to behave |

These inflate `formality` for お母さん (f = 0.769 toward 千尋) and 釜爺 (f = 0.2) beyond their true register level. The commands reflect *authority*, not *deference*. A morphological/pragmatic tagger would split these into a separate "command" category. This is the primary known limitation of the regex approach.

---

## 7. 千尋↔ハク: the most symmetric high-traffic dyad

With 65 lines (千尋→ハク) and 87 lines (ハク→千尋), this is the largest dyad pair in the corpus. Formality values:

- 千尋→ハク: **0.071**
- ハク→千尋: **0.085**

Difference: 0.014 — effectively zero. Both speakers use plain speech almost exclusively in both directions, and the asymmetry is negligible. This is the only high-volume dyad where the relationship is near-symmetrically intimate. The `socialDistance` formula yields 1.059/1.068 — minimum possible, barely above the floor.

Contrast with 千尋↔リン (85 + 38 lines): also low, but slightly less symmetric (f = 0.022/0.097), suggesting Chihiro is marginally more deferential toward Lin than vice versa, consistent with Lin being a workplace senior.

---

## 8. No-Face and Boh have zero polite output

Both `顔無し` (in all its variants) and `坊` produce **zero polite markers** across all their lines. No-Face's speech acts are mimicry and desire-expression; Boh's are childish demands. Neither character participates in the register economy of the bathhouse. This is consistent with their narrative roles: No-Face mirrors others' registers without generating his own, and Boh is a spoiled child exempt from social protocol.

---

## 9. Zeniba's single humble verb

銭婆 has formality = 0.042 toward 千尋 — 44 lines, one polite marker: `まいりません` in:

> `このエレベーターは上へはまいりません。`

The humble verb `まいる` here functions as a formal announcement, not personal deference. Zeniba's register toward Chihiro is otherwise entirely warm plain speech — she addresses Chihiro as a peer or younger intimate throughout their Swamp Bottom scenes. This contrasts with Chihiro's f = 0.849 toward Zeniba (a notably larger asymmetry than toward Yubaba in terms of *felt* deference), suggesting Chihiro perceives Zeniba as a high-status outsider worth respecting even when Zeniba herself drops all formality.

---

## 10. Chihiro's single highest-load line: gratitude to Kamaji

> **千尋→釜爺** — `ありがとうございました。` (load = 4, gozaimasu × 1 + masu × 1... actually gozaimasu × 1 → load = 3 + 1 = 4? Let me check)

Actually: `ありがとうございました` = `ございました` (gozaimasu-class, weight 3) + `ました` (masu-class, weight 1) = **load 4**. This is the single highest-load line Chihiro produces in the entire corpus — higher than anything she says to Yubaba. It reflects the pivotal moment of gratitude after Kamaji helps her get the train tickets. The corpus captures that Chihiro's most formal speech is reserved for *genuine gratitude to a helper*, not performed deference to authority.

---

## Summary table: key dyads

| Dyad | f | f_rev | sD | Interpretation |
|---|---|---|---|---|
| 番台蛙→湯婆婆 | 3.000 | 0.000 | 4.000 | Maximum institutional hierarchy |
| リン→お白様 | 3.000 | 0.000 | 4.000 | Pure service register to spirit guest |
| 千尋→番台蛙 | 3.000 | 0.154 | 4.000 | Desperate job application |
| ハク→湯婆婆 | 1.949 | 0.000 | 3.533 | Institutional middle |
| ハク→釜爺 | 1.846 | 0.000 | 3.400 | Haku is polite across the workplace |
| 千尋→釜爺 | 1.011 | 0.200 | 2.195 | Reciprocal but asymmetric |
| 千尋→湯婆婆 | 0.852 | 0.000 | 2.108 | Emotional urgency over keigo |
| 千尋→銭婆 | 0.849 | 0.042 | 2.079 | Outgroup respect; Zeniba barely reciprocates |
| お母さん→千尋 | 0.769 | 0.000 | 2.000 | ⚠ Inflated by なさい commands |
| ハク↔千尋 | 0.085 | 0.071 | ~1.06 | Most symmetric intimate dyad |
| 坊, 顔無し | 0.000 | — | 1.000 | Zero polite output; outside register economy |

---

## 11. basePower: corpus-derived formula and results

**Script**: `scripts/update-film-data.mjs` writes results to `src/data/filmData.json`.

### Formula

For each character X, using dyad formality values from `dyad_metrics.csv`:

**Received score** — collects all directed dyads A→X (individual or decomposed from groups):
```
received_score(X) = mean(f_values) × log(1 + N_dyads)
```
The `log(N+1)` factor rewards *breadth*: a character formally addressed by 5 people outscores one addressed just as formally by 1 person.

**Group decomposition**: group addressees (e.g. `group:bathhouse workers`) are expanded to their named members — each member receives the full dyad formality as a separate data point. Memberships are hardcoded in the script.

**Given score** — all dyads X→B (including group addressees):
```
given_score(X) = mean(f_values) × log(1 + N_dyads)
```

**Net deference and scale**:
```
net(X) = received_score(X) − given_score(X)
basePower(X) = linear_scale(net, net_min, net_max, 0, 10)   [rounded to 1 d.p.]
```

### Results (Spirited Away characters updated)

| Character | Old basePower | New basePower | net | Interpretation |
|---|---|---|---|---|
| RadishSpirit (お白様) | 4 | **10.0** | +4.83 | Receives full service register from Lin; gives nothing back |
| RiverSpirit (河の神) | 6 | **9.2** | +4.30 | Max deference from frog staff; silent reciprocally |
| Yubaba (湯婆婆) | 10 | **5.5** | +1.73 | Still top of humanoid hierarchy; pushed off ceiling by spirit guests |
| Kamaji (釜爺) | 4 | **4.8** | +1.27 | Receives genuine upward formality from both Chihiro and Haku |
| Aogaeru (青蛙) | 2 | **3.5** | +0.36 | Receives some group formality; net slightly positive |
| Zeniba (銭婆) | 9 | **3.3** | +0.19 | Drops sharply: barely addressed formally; herself uses keigo to Haku |
| Boh (坊) | 6 | **3.3** | +0.19 | Receives な さ い commands from Yubaba; doesn't speak formally |
| NoFace (顔無し) | 5 | **3.1** | +1.02 | Receives formality from Chihiro and Yubaba during feast |
| ChihiroFather (お父さん) | 0.5 | **3.1** | +0.06 | Near-zero — gets small credit from group:family addresses |
| Haku (ハク) | 7 | **3.0** | −0.01 | Exactly at breakeven: gives as much formality as he receives |
| Lin (リン) | 3 | **2.6** | −0.32 | Gives formal service speech more than she receives |
| Foreman / Chichiyaku (兄役 / 父役) | 4 / 2 | **2.6** each | ~−0.3 | Intermediate: give keigo upward, receive little back |
| BandaiKaeru (番台蛙) | 2 | **2.4** | −0.41 | Gives max formality to Yubaba; receives only from Chihiro |
| ChihiroMother (お母さん) | 0.5 | **2.4** | −0.39 | なさい commands inflate given; family group adds some received |
| Chihiro (千尋) | 1 | **1.6** | −0.95 | Lowest: addresses nearly everyone with higher formality than she receives |

### Key departures from hand-coded values

- **Spirit guests (RadishSpirit, RiverSpirit) rise to the top.** The corpus correctly identifies that service staff use maximum register toward these divine guests, pushing them above Yubaba. Hand-coded values treated them as mid-tier because their *narrative* authority is limited; the corpus captures their *linguistic* authority.
- **Zeniba drops from 9 → 3.3.** Off-screen prestige. In the 44 lines of corpus data, Zeniba speaks warmly and plainly to Chihiro; almost no one addresses her formally. Corpus basePower captures *speech-as-heard*, not narrative rank.
- **Haku lands at exactly 3.0 (net ≈ 0).** He is the pivot of the hierarchy — giving as much formal speech upward as he receives. This confirms his role as institutional intermediary rather than high-authority figure.
- **Kamaji rises from 4 → 4.8.** He is genuinely respected in dialogue: Chihiro uses ありがとうございました (load 4) and Haku also speaks formally to him.

---

## 12. socialDistance: formula, direction, and visualization

**socialDistance is already directional** in `filmData.json` — each directed link A→B carries its own value, which may differ from B→A. The formula is in `derive-dyad-metrics.mjs`:

```
social_gap  = max(formality_AB, formality_BA)
asymmetry   = max(0, formality_AB − formality_BA)
sD_AB       = clamp(social_gap × 0.70 + asymmetry × 0.60 + 1.0,  1, 4)
```

`social_gap` captures the objective depth of the hierarchy regardless of who is speaking. `asymmetry` adds extra distance when the deferral is one-sided. The +1 floor matches the minimum observed in the hand-coded data.

### How socialDistance is rendered (ForceGraph.jsx + honorificLinkMetrics.js)

Every directed link uses its own `socialDistance` in five places:

| Property | Formula | Effect |
|---|---|---|
| Spring length | `6 + f×2.2 + sD×0.9` | Higher sD → farther apart in 3D space |
| Line width | `1.15 + f×0.85 + sD×0.28 + hier×1.35` | Higher sD → thicker edge |
| Dash size | `0.38 + f×0.14 + sD×0.05` | Higher sD → longer dashes |
| Gap size | `0.14 + sD×0.07 + f×0.03` | Higher sD → wider gaps between dashes |
| Opacity | `0.34 + f×0.10 + sD×0.045 + hier×0.12` | Higher sD → more visible edge |

Since both A→B and B→A links exist as separate spring forces in the d3-force-3d simulation, an asymmetric pair (sD_AB=4, sD_BA=1.6) produces a net equilibrium closer to the low-sD end, biased toward the more intimate direction. This naturally represents the asymmetric "pull" of intimate vs. formal stances.

### Selected updated link values

| Link | Old sD | New sD | Note |
|---|---|---|---|
| Haku → Yubaba | 2.0 | **3.53** | Large upward asymmetry correctly detected |
| Chihiro → BandaiKaeru | 2.0 | **4.0** | Max: Chihiro's desperate job-application formality |
| Lin → RadishSpirit | 2.0 | **4.0** | Max: pure service register to a silent divine guest |
| Chihiro → Yubaba | 4.0 | **2.11** | Drops: corpus shows Chihiro's speech is often plain/emotional |
| Chihiro → Haku | 1.5 | **1.06** | Near-floor: symmetric intimate register confirmed |
| Haku ↔ Lin | 1.8 | **1.0** each | Floor: both speak plainly to each other |

---

## 13. Directed edges: reverse link synthesis and arrowhead rendering

### Why reverse links were needed

After running `update-film-data.mjs`, the original hand-coded filmData.json had many SA character pairs with only one directed link. The simulation was therefore applying one spring force per pair, which means `socialDistance` acted as a scalar rather than a truly directed quantity. For example, Haku→Chihiro existed but Chihiro→Haku was missing; the spring could not distinguish asymmetric social distance.

A second pass in `update-film-data.mjs` synthesizes the missing reverse links. For every directed link A→B in filmData.json where both endpoints are SA characters and B→A does not already exist, the script creates the reverse:

```
formality(B→A)       = dyad_metrics.formality(B→A)      if that dyad appears in corpus
                     = 0                                   otherwise (no polite speech observed)

socialDistance(B→A)  = dyad_metrics.socialDistance(B→A)  if that dyad appears in corpus
                     = 1.0                                 otherwise (floor value — cannot infer stretch from unobserved interaction)
```

The label is auto-generated to indicate register level:
```
f ≥ 2   → "Corpus: formal reply (B→A)"
f ≥ 0.5 → "Corpus: polite acknowledgment (B→A)"
f < 0.5 → "Corpus: plain speech (B→A)"
```

**Result**: 14 reverse links added. 6 had corpus data; 8 were given floor sD=1.

| Added link | f | sD | Corpus data? |
|---|---|---|---|
| Haku → Zeniba | 0 | 1.65 | Yes (sD only) |
| Yubaba → Haku | 0 | 2.36 | Yes (sD only) |
| Kamaji → Chihiro | 0.20 | 1.71 | Yes |
| Haku → Chihiro | 0.09 | 1.07 | Yes |
| Chihiro → Lin | 0.10 | 1.11 | Yes |
| ChihiroMother → Chihiro | 0.77 | 2.00 | Yes |
| Lin → Haku | 0 | 1.00 | No — floor |
| Kamaji → Haku | 0 | 1.00 | No — floor |
| *(8 others)* | 0 | 1.00 | No — floor |

With both directions now present, the d3-force-3d simulation applies two independent spring forces for each SA pair — one per directed link with its own distance and strength. An asymmetric pair (e.g. Chihiro→BandaiKaeru sD=4.0 vs. BandaiKaeru→Chihiro sD=1.15) reaches an equilibrium position that is a weighted average of the two springs, naturally representing the net social stretch from both perspectives.

### Arrowhead rendering (ForceGraph.jsx)

To make the directed links visually legible, each `WeightedEdge` component now renders a cone arrowhead pointing from source toward target.

**Geometry**: `THREE.ConeGeometry(0.13, 0.34, 6)` — radius 0.13, height 0.34, 6-sided (hexagonal cross-section). The cone's long axis is +Y by default.

**Placement**: The arrowhead tip is positioned on the target node's surface. In `useFrame`, the cone is placed at:
```
position = target_centre − direction̂ × 1.1
```
where 1.1 is approximately the icosahedron node radius. This puts the tip touching the target sphere without overlap.

**Orientation**: The cone points along the source→target direction. Because Three.js cones point along +Y, orientation is computed via quaternion rotation:
```javascript
_dir.set(t.x - s.x, t.y - s.y, t.z - s.z).normalize()
_q.setFromUnitVectors(_YAXIS, _dir)          // _YAXIS = new THREE.Vector3(0, 1, 0)
arrow.quaternion.copy(_q)
```
`_YAXIS`, `_dir`, and `_q` are all pre-allocated outside the frame loop (module constant and `useMemo` respectively) to avoid per-frame garbage collection.

**Color and opacity**: The arrowhead inherits the line's color directly (`arrowMat.color.copy(mat.color)`) and is slightly more opaque (`opacity = min(0.92, mat.opacity × 1.4)`). This makes arrows pop without diverging visually from their parent edge.

**Visibility threshold**: The arrow is hidden when the source and target nodes are closer than 2.0 world units (`arrow.visible = edgeLen > 2.0`). Below this threshold the cone would overlap both node meshes and become visually confusing.

**Material**: `THREE.MeshBasicMaterial` (not `MeshStandardMaterial`) — unlit, so the arrowhead reads consistently regardless of scene lighting, matching the `LineMaterial` behavior of the edge line itself.
