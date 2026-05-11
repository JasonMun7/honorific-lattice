import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Line2, LineGeometry, LineMaterial } from "three-stdlib";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceY,
  forceZ,
} from "d3-force-3d";
import {
  hierarchySalience,
  honorificLinkDistance,
  honorificLinkStrength,
} from "../lib/honorificLinkMetrics.js";

const COLOR_COOL = new THREE.Color("#4688ec");
const COLOR_COOL_E = new THREE.Color("#0d2530");
const COLOR_WARM = new THREE.Color("#fca700");
const COLOR_WARM_E = new THREE.Color("#3d2500");
const COLOR_EDGE_LO = new THREE.Color("#ffffff");
const COLOR_EDGE_HI = new THREE.Color("#cc2200");

function neighborSet(focusId, links) {
  const set = new Set([focusId]);
  for (const l of links) {
    const a = typeof l.source === "object" ? l.source.id : l.source;
    const b = typeof l.target === "object" ? l.target.id : l.target;
    if (a === focusId) set.add(b);
    if (b === focusId) set.add(a);
  }
  return set;
}

// Pre-allocated Y-axis vector used for arrowhead orientation in every WeightedEdge.
// Shared across instances to avoid per-frame allocation.
const _YAXIS = new THREE.Vector3(0, 1, 0);

function WeightedEdge({ link, visible }) {
  const { line, geom, mat, arrow, arrowMat, _dir, _q } = useMemo(() => {
    const g = new LineGeometry();
    const m = new LineMaterial({
      color: 0x96999e,
      linewidth: 2,
      transparent: true,
      opacity: 0.72,
      depthTest: true,
    });
    m.dashed = true;
    m.dashScale = 1;
    const l = new Line2(g, m);
    l.frustumCulled = false;

    // Arrowhead cone — points along +Y by default; oriented each frame via
    // quaternion rotation from +Y → (target − source) direction.
    // Geometry: radius 0.13, height 0.34, 6 sides (hexagonal).
    const am = new THREE.MeshBasicMaterial({ transparent: true, depthTest: true });
    const a = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 6), am);
    a.frustumCulled = false;

    // Pre-allocated helpers — reused each frame to avoid GC pressure.
    const _dir = new THREE.Vector3();
    const _q = new THREE.Quaternion();

    return { line: l, geom: g, mat: m, arrow: a, arrowMat: am, _dir, _q };
  }, []);

  const { size } = useThree();

  useLayoutEffect(() => {
    mat.resolution.set(size.width, size.height);
    mat.needsUpdate = true;
  }, [mat, size.width, size.height]);

  useLayoutEffect(
    () => () => {
      geom.dispose();
      mat.dispose();
      arrow.geometry.dispose();
      arrowMat.dispose();
    },
    [geom, mat, arrow, arrowMat],
  );

  useFrame(({ clock }) => {
    if (!visible) return;
    const s = link.source;
    const t = link.target;
    if (!s || !t || typeof s === "string" || typeof t === "string") return;

    geom.setPositions([s.x, s.y, s.z, t.x, t.y, t.z]);
    line.computeLineDistances();

    const f = Number(link.formality) || 0;
    const sd = Number(link.socialDistance) || 1;
    const hi = hierarchySalience(link);

    mat.linewidth = 1.2 + f * 1.1;              // width → formality
    mat.dashSize = 0.28 + sd * 0.18;            // dash length → socialDistance
    mat.gapSize = 0.14;
    mat.opacity = 0.72;
    mat.dashOffset = clock.getElapsedTime() * 0.55;

    mat.color.copy(COLOR_EDGE_LO).lerp(COLOR_EDGE_HI, hi);  // color → hierarchySalience

    // Arrowhead: place at the target node surface, orient along s→t.
    // The cone tip sits at offset 1.1 from the target centre (≈ node radius).
    // Hidden when nodes are so close the arrow would overlap the geometry.
    _dir.set(t.x - s.x, t.y - s.y, t.z - s.z);
    const edgeLen = _dir.length();
    arrow.visible = edgeLen > 2.0;
    if (arrow.visible) {
      _dir.normalize();
      arrow.position.set(
        t.x - _dir.x * 1.1,
        t.y - _dir.y * 1.1,
        t.z - _dir.z * 1.1,
      );
      _q.setFromUnitVectors(_YAXIS, _dir);
      arrow.quaternion.copy(_q);
      arrowMat.color.copy(mat.color);
      arrowMat.opacity = 0.82;
    }
  });

  if (!visible) return null;
  return (
    <>
      <primitive object={line} dispose={null} />
      <primitive object={arrow} dispose={null} />
    </>
  );
}

function nodeScale(basePower) {
  const p = Number(basePower) || 0;
  return Math.min(2.25, 0.95 + p * 0.095);
}

/** Accent for selected-node rim; reads clearly on dark starfield. */
const COLOR_SELECT_RIM = new THREE.Color("#6eb0ff");

function NodeShape({ node, selected }) {
  const s = nodeScale(node.basePower);
  const bp = Number(node.basePower) || 0;
  const t = bp / 10;
  const color = useMemo(() => COLOR_COOL.clone().lerp(COLOR_WARM, t), [t]);
  const emissive = useMemo(() => COLOR_COOL_E.clone().lerp(COLOR_WARM_E, t), [t]);

  const matProps = {
    color,
    emissive: selected ? emissive.clone().lerp(COLOR_SELECT_RIM, 0.35) : emissive,
    emissiveIntensity: selected ? 0.75 : 0.44,
    roughness: selected ? 0.26 : 0.34,
    metalness: selected ? 0.22 : 0.12,
  };

  const groupScale = s * (selected ? 1.14 : 1);

  return (
    <group scale={groupScale}>
      {selected ? (
        <mesh scale={1.08} renderOrder={-1}>
          <icosahedronGeometry args={[0.82, 0]} />
          <meshBasicMaterial
            color={COLOR_SELECT_RIM}
            transparent
            opacity={0.42}
            depthWrite={false}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ) : null}
      <mesh>
        <icosahedronGeometry args={[0.82, 0]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
    </group>
  );
}

function GraphNode({ node, onSelectNode, dimmed, selected }) {
  const groupRef = useRef(null);
  const scale = nodeScale(node.basePower);
  const labelAnchorScale = scale * (selected ? 1.14 : 1);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(node.x, node.y, node.z);
  });

  if (dimmed) return null;

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelectNode(node);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <NodeShape node={node} selected={selected} />
      <Html
        position={[0, 1.14 * labelAnchorScale + 0.82, 0]}
        center
        distanceFactor={19}
        zIndexRange={[28, 1]}
        style={{
          pointerEvents: "none",
          userSelect: "none",
          color: "#CECFD2",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.01em",
          padding: "5px 11px",
          borderRadius: "7px",
          background: "rgba(24, 25, 26, 0.78)",
          border: "1px solid rgba(227, 228, 242, 0.12)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        {node.name}
      </Html>
    </group>
  );
}

export default function ForceGraph({ data, focusNodeId, onSelectNode, yStrength = 0.55, yLocked = false, zLocked = false }) {
  const [graph, setGraph] = useState(null);
  const rootRef = useRef(null);
  const simRef = useRef(null);
  const yStrengthRef = useRef(yStrength);
  yStrengthRef.current = yStrength;
  const yLockedRef = useRef(yLocked);
  yLockedRef.current = yLocked;
  const zLockedRef = useRef(zLocked);
  zLockedRef.current = zLocked;

  const visibleIds = useMemo(() => {
    if (!focusNodeId) return null;
    return neighborSet(focusNodeId, data.links);
  }, [focusNodeId, data.links]);

  useLayoutEffect(() => {
    if (!data.nodes?.length) {
      setGraph(null);
      return;
    }

    const nodes = data.nodes.map((n) => ({ ...n }));
    const links = data.links.map((l) => ({ ...l }));

    const sim = forceSimulation(nodes, 3)
      .force(
        "link",
        forceLink(links)
          .id((d) => d.id)
          .distance((l) => honorificLinkDistance(l))
          .strength((l) => honorificLinkStrength(l)),
      )
      .force("charge", forceManyBody().strength(-118))
      .force("center", forceCenter(0, 0, 0))
      .force(
        "y",
        forceY((d) => (Number(d.basePower) / 10) * 14).strength(yStrengthRef.current),
      )
      .force(
        "z",
        forceZ((d) => Number(d.zTarget) || 0).strength(0.48),
      );

    // Apply hard locks if active at construction time.
    for (const node of nodes) {
      if (yLockedRef.current) node.fy = (Number(node.basePower) / 10) * 70;
      if (zLockedRef.current) node.fz = (Number(node.zTarget) || 0) * 10;
    }

    sim.alpha(1).restart();
    simRef.current = sim;
    setGraph({ sim, nodes, links });

    return () => {
      sim.stop();
    };
  }, [data]);

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.force("y").strength(yStrength);
    sim.alpha(0.3).restart();
  }, [yStrength]);

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    for (const node of sim.nodes()) {
      node.fy = yLocked ? (Number(node.basePower) / 10) * 70 : undefined;
    }
    sim.alpha(0.3).restart();
  }, [yLocked]);

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    for (const node of sim.nodes()) {
      node.fz = zLocked ? (Number(node.zTarget) || 0) * 10 : undefined;
    }
    sim.alpha(0.3).restart();
  }, [zLocked]);

  useLayoutEffect(() => {
    if (rootRef.current) {
      rootRef.current.userData.simNodes = graph?.nodes ?? [];
    }
  }, [graph]);

  if (!graph) {
    return <group ref={rootRef} name="force-graph-root" />;
  }

  const { nodes, links } = graph;

  return (
    <group ref={rootRef} name="force-graph-root">
      {links.map((link, i) => {
        const sid =
          link.source && typeof link.source === "object"
            ? link.source.id
            : link.source;
        const tid =
          link.target && typeof link.target === "object"
            ? link.target.id
            : link.target;
        const edgeVisible =
          !visibleIds || (visibleIds.has(sid) && visibleIds.has(tid));
        return (
          <WeightedEdge
            key={`${sid}-${tid}-${i}`}
            link={link}
            visible={edgeVisible}
          />
        );
      })}
      {nodes.map((node) => {
        const dimmed = Boolean(visibleIds && !visibleIds.has(node.id));
        const selected = Boolean(focusNodeId && node.id === focusNodeId);
        return (
          <GraphNode
            key={node.id}
            node={node}
            onSelectNode={onSelectNode}
            dimmed={dimmed}
            selected={selected}
          />
        );
      })}
    </group>
  );
}
