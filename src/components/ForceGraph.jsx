import { useLayoutEffect, useMemo, useRef, useState } from "react";
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

/** ADS chart categorical tokens — see `src/atlassian-dark.css` & DESIGN.md */
const COLOR_COOL = new THREE.Color("#4688ec");
const COLOR_COOL_E = new THREE.Color("#0d2530");
const COLOR_WARM = new THREE.Color("#fca700");
const COLOR_WARM_E = new THREE.Color("#3d2500");
const COLOR_EDGE_LO = new THREE.Color("#5c6068");
const COLOR_EDGE_HI = new THREE.Color("#96999e");

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

function edgeStyle(link) {
  const f = Number(link.formality) || 0;
  const sd = Number(link.socialDistance) || 1;
  const hi = hierarchySalience(link);
  const w = f + sd * 0.35;
  return { f, sd, w, hi };
}

function WeightedEdge({ link, visible }) {
  const { line, geom, mat } = useMemo(() => {
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
    return { line: l, geom: g, mat: m };
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
    },
    [geom, mat],
  );

  useFrame(({ clock }) => {
    if (!visible) return;
    const s = link.source;
    const t = link.target;
    if (!s || !t || typeof s === "string" || typeof t === "string") return;

    geom.setPositions([s.x, s.y, s.z, t.x, t.y, t.z]);
    line.computeLineDistances();

    const { f, sd, w, hi } = edgeStyle(link);

    mat.linewidth = 1.15 + f * 0.85 + sd * 0.28 + hi * 1.35;
    mat.dashSize = 0.38 + f * 0.14 + sd * 0.05;
    mat.gapSize = 0.14 + sd * 0.07 + f * 0.03;
    mat.opacity = 0.34 + f * 0.1 + sd * 0.045 + hi * 0.12;
    mat.dashOffset = clock.getElapsedTime() * (0.45 + w * 0.28 + hi * 0.35);

    const tCol = Math.min(1, (f * 0.35 + sd * 0.22 + hi * 0.55) / 3.2);
    mat.color.copy(COLOR_EDGE_LO).lerp(COLOR_EDGE_HI, tCol);
  });

  if (!visible) return null;
  return <primitive object={line} dispose={null} />;
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
  const warm = bp >= 7;
  const color = warm ? COLOR_WARM : COLOR_COOL;
  const emissive = warm ? COLOR_WARM_E : COLOR_COOL_E;

  const matProps = {
    color,
    emissive: selected ? emissive.clone().lerp(COLOR_SELECT_RIM, 0.35) : emissive,
    emissiveIntensity: selected
      ? warm
        ? 0.78
        : 0.72
      : warm
        ? 0.48
        : 0.4,
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

export default function ForceGraph({ data, focusNodeId, onSelectNode }) {
  const [graph, setGraph] = useState(null);
  const rootRef = useRef(null);

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
        forceY((d) => (Number(d.basePower) / 10) * 14).strength(0.55),
      )
      .force(
        "z",
        forceZ((d) => Number(d.zTarget) || 0).strength(0.48),
      );

    sim.alpha(1).restart();
    setGraph({ sim, nodes, links });

    return () => {
      sim.stop();
    };
  }, [data]);

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
