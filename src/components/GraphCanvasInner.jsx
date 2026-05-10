import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import ForceGraph from "./ForceGraph.jsx";

/** Fallback overview when node positions are not ready yet. */
const DEFAULT_CAM = new THREE.Vector3(0, 7, 46);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

const OVERVIEW_DIR = new THREE.Vector3(0.42, 0.36, 1).normalize();

/**
 * Camera target + position that frame all simulation nodes (axis-aligned bounds).
 */
function computeOverviewGoals(nodes, fovDeg) {
  const target = new THREE.Vector3();
  const position = new THREE.Vector3();
  if (!nodes?.length) {
    return { target: target.copy(DEFAULT_TARGET), position: position.copy(DEFAULT_CAM) };
  }
  let minx = Infinity;
  let miny = Infinity;
  let minz = Infinity;
  let maxx = -Infinity;
  let maxy = -Infinity;
  let maxz = -Infinity;
  let any = false;
  for (const n of nodes) {
    if (
      !Number.isFinite(n.x) ||
      !Number.isFinite(n.y) ||
      !Number.isFinite(n.z)
    ) {
      continue;
    }
    any = true;
    minx = Math.min(minx, n.x);
    miny = Math.min(miny, n.y);
    minz = Math.min(minz, n.z);
    maxx = Math.max(maxx, n.x);
    maxy = Math.max(maxy, n.y);
    maxz = Math.max(maxz, n.z);
  }
  if (!any) {
    return { target: target.copy(DEFAULT_TARGET), position: position.copy(DEFAULT_CAM) };
  }
  target.set((minx + maxx) * 0.5, (miny + maxy) * 0.5, (minz + maxz) * 0.5);
  const dx = maxx - minx;
  const dy = maxy - miny;
  const dz = maxz - minz;
  const halfDiag = 0.5 * Math.sqrt(dx * dx + dy * dy + dz * dz);
  const pad = 5;
  const radius = halfDiag + pad;
  const fovRad = (Math.min(85, Math.max(20, fovDeg)) * Math.PI) / 180;
  const dist = Math.min(
    185,
    Math.max(36, (radius / Math.sin(fovRad * 0.5)) * 1.2),
  );
  position.copy(target).addScaledVector(OVERVIEW_DIR, dist);
  return { target, position };
}

/** Inactivity before gentle orbit returns (after welcome orbit has ended). */
const IDLE_ORBIT_MS = 30000;
/** Subtle auto-rotate on first visit and when idle (drei / OrbitControls scale). */
const IDLE_AUTO_ROTATE_SPEED = 0.1;

/** Lerp “done” thresholds (loose so damping is not fought). */
const TARGET_EPS = 0.08;
const POSITION_EPS = 0.15;

/** Hard stop so early-return paths never leave framing stuck on forever. */
const FRAMING_MS = 2400;

function neighborSet(focusId, links) {
  const set = new Set([focusId]);
  for (const l of links) {
    const a = typeof l.source === "object" ? l.source.id : l.source;
    const b = typeof l.target === "object" ? l.target.id : l.target;
    if (a === focusId) set.add(b);
    if (b === focusId) set.add(b);
  }
  return set;
}

/**
 * One-shot camera framing: when `focusNodeId` changes we lerp the orbit target
 * to the focused simulation node (fallback: neighborhood centroid). OrbitControls
 * `start` cancels the lerp; a wall-clock deadline stops pulling if sim data is late.
 *
 * When `fullGraphOverviewNonce` increases (Full graph / clear selection), we lerp
 * to a bounds-based overview of every visible node in the current graph payload.
 */
export default function GraphCanvasInner({
  data,
  focusNodeId,
  fullGraphOverviewNonce = 0,
  onSelectNode,
}) {
  const { gl } = useThree();
  const controlsRef = useRef(null);
  const goalTarget = useRef(new THREE.Vector3());
  const goalPos = useRef(new THREE.Vector3());
  const animatingRef = useRef(true);
  const userActiveRef = useRef(false);
  const framingDeadlineRef = useRef(0);
  const lastActivityRef = useRef(
    typeof performance !== "undefined" ? performance.now() : 0,
  );
  const idleAutoRotateRef = useRef(false);
  const [idleAutoRotate, setIdleAutoRotate] = useState(false);
  /** Slow orbit + zoomed-out overview until first interaction or node focus. */
  const [welcomeOrbit, setWelcomeOrbit] = useState(true);
  const welcomeOrbitRef = useRef(true);
  const orbitAutoDriveRef = useRef(false);

  const bumpActivity = useCallback(() => {
    if (typeof performance !== "undefined") {
      lastActivityRef.current = performance.now();
    }
    if (idleAutoRotateRef.current) {
      idleAutoRotateRef.current = false;
      setIdleAutoRotate(false);
    }
    setWelcomeOrbit(false);
  }, []);

  const handleSelectNode = useCallback(
    (node) => {
      bumpActivity();
      onSelectNode(node);
    },
    [bumpActivity, onSelectNode],
  );

  const visibleIds = useMemo(() => {
    if (!focusNodeId) return null;
    return neighborSet(focusNodeId, data.links);
  }, [focusNodeId, data.links]);

  const initialOverviewRef = useRef(true);
  const wideOverviewRef = useRef(false);

  useEffect(() => {
    if (focusNodeId) {
      wideOverviewRef.current = false;
      animatingRef.current = true;
      initialOverviewRef.current = false;
    } else if (initialOverviewRef.current) {
      /** First visit: keep animation on so `fullGraphOverviewNonce` can drive the same wide fit as “Full graph”. */
      initialOverviewRef.current = false;
    } else {
      animatingRef.current = true;
    }
    framingDeadlineRef.current =
      typeof performance !== "undefined"
        ? performance.now() + FRAMING_MS
        : Number.POSITIVE_INFINITY;
  }, [focusNodeId]);

  useEffect(() => {
    if (!fullGraphOverviewNonce) return;
    animatingRef.current = true;
    wideOverviewRef.current = true;
    welcomeOrbitRef.current = false;
    setWelcomeOrbit(false);
    framingDeadlineRef.current =
      typeof performance !== "undefined"
        ? performance.now() + FRAMING_MS
        : Number.POSITIVE_INFINITY;
  }, [fullGraphOverviewNonce]);

  useEffect(() => {
    if (focusNodeId) {
      bumpActivity();
    }
  }, [focusNodeId, bumpActivity]);

  useEffect(() => {
    const el = gl.domElement;
    const onPointerDown = () => {
      bumpActivity();
    };
    const onWheel = () => {
      bumpActivity();
    };
    const onKeyDown = () => {
      bumpActivity();
    };
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [gl, bumpActivity]);

  useEffect(() => {
    let cancelled = false;
    let controls;
    let onStart;
    let onEnd;
    let onChange;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return;
        controls = controlsRef.current;
        if (!controls) return;
        onStart = () => {
          bumpActivity();
          userActiveRef.current = true;
          animatingRef.current = false;
          wideOverviewRef.current = false;
        };
        onEnd = () => {
          userActiveRef.current = false;
        };
        onChange = () => {
          if (!orbitAutoDriveRef.current) {
            bumpActivity();
          }
        };
        controls.addEventListener("start", onStart);
        controls.addEventListener("end", onEnd);
        controls.addEventListener("change", onChange);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (controls && onStart && onEnd && onChange) {
        controls.removeEventListener("start", onStart);
        controls.removeEventListener("end", onEnd);
        controls.removeEventListener("change", onChange);
      }
    };
  }, [bumpActivity]);

  useFrame((state, dt) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const framingBusy = animatingRef.current || userActiveRef.current;
    const now =
      typeof performance !== "undefined" ? performance.now() : 0;
    const wantIdleRotate =
      !welcomeOrbitRef.current &&
      now - lastActivityRef.current >= IDLE_ORBIT_MS &&
      !framingBusy;
    if (wantIdleRotate !== idleAutoRotateRef.current) {
      idleAutoRotateRef.current = wantIdleRotate;
      setIdleAutoRotate(wantIdleRotate);
    }

    if (!animatingRef.current || userActiveRef.current) return;

    if (typeof performance !== "undefined" && performance.now() > framingDeadlineRef.current) {
      animatingRef.current = false;
      wideOverviewRef.current = false;
      return;
    }

    const cam = state.camera;

    let goalT;
    let goalP;

    if (!focusNodeId) {
      const nodes = state.scene.getObjectByName("force-graph-root")?.userData
        ?.simNodes;
      if (wideOverviewRef.current && nodes?.length) {
        const { target, position } = computeOverviewGoals(nodes, cam.fov);
        goalTarget.current.copy(target);
        goalPos.current.copy(position);
        goalT = goalTarget.current;
        goalP = goalPos.current;
      } else {
        goalT = DEFAULT_TARGET;
        goalP = DEFAULT_CAM;
      }
    } else {
      const nodes = state.scene.getObjectByName("force-graph-root")?.userData
        ?.simNodes;
      if (!visibleIds || !nodes?.length) {
        return;
      }

      const focusSim = nodes.find((node) => node.id === focusNodeId);
      const nVisible = visibleIds.size;
      const spread = 6 + nVisible * 0.35;

      if (focusSim && Number.isFinite(focusSim.x)) {
        goalTarget.current.set(focusSim.x, focusSim.y, focusSim.z);
        goalPos.current.set(
          focusSim.x + spread * 0.85,
          focusSim.y + 4.5,
          focusSim.z + spread * 1.1,
        );
      } else {
        let cx = 0;
        let cy = 0;
        let cz = 0;
        let n = 0;
        for (const node of nodes) {
          if (!visibleIds.has(node.id)) continue;
          cx += node.x;
          cy += node.y;
          cz += node.z;
          n += 1;
        }
        if (n === 0) {
          return;
        }
        cx /= n;
        cy /= n;
        cz /= n;
        goalTarget.current.set(cx, cy, cz);
        goalPos.current.set(cx + spread * 0.85, cy + 4.5, cz + spread * 1.1);
      }
      goalT = goalTarget.current;
      goalP = goalPos.current;
    }

    const tAlpha = 1 - Math.exp(-3.2 * dt);
    const pAlpha = 1 - Math.exp(-2.6 * dt);
    controls.target.lerp(goalT, tAlpha);
    cam.position.lerp(goalP, pAlpha);
    controls.update();

    if (
      controls.target.distanceTo(goalT) < TARGET_EPS &&
      cam.position.distanceTo(goalP) < POSITION_EPS
    ) {
      animatingRef.current = false;
      if (wideOverviewRef.current) wideOverviewRef.current = false;
    }
  });

  welcomeOrbitRef.current = welcomeOrbit;
  orbitAutoDriveRef.current =
    (welcomeOrbit && !focusNodeId) || idleAutoRotate;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 7, 46]} fov={45} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={3}
        maxDistance={200}
        autoRotate={(welcomeOrbit && !focusNodeId) || idleAutoRotate}
        autoRotateSpeed={IDLE_AUTO_ROTATE_SPEED}
      />
      <Stars
        radius={120}
        depth={60}
        count={5000}
        factor={3.5}
        saturation={0}
        fade
        speed={0.35}
      />
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 14, 6]} intensity={1.1} />
      <pointLight position={[-10, -6, -8]} intensity={0.35} color="#4688EC" />
      <ForceGraph
        data={data}
        focusNodeId={focusNodeId}
        onSelectNode={handleSelectNode}
      />
    </>
  );
}
