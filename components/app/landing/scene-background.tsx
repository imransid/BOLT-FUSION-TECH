"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ACCENT = new THREE.Color("#22d3ee");
const ACCENT_SOFT = new THREE.Color("#67e8f9");
const NODE_COUNT = 70;
const MAX_LINKS_PER_NODE = 4;
const LINK_DISTANCE = 3.2;

type Vec3 = [number, number, number];

function TechNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const { initialPositions, edges, lineCount, linePositions } = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      positions.push((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10 - 4);
    }
    const edges: [number, number][] = [];
    const pos = (i: number) => [
      positions[i * 3],
      positions[i * 3 + 1],
      positions[i * 3 + 2],
    ] as Vec3;
    const dist = (a: Vec3, b: Vec3) =>
      Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    for (let i = 0; i < NODE_COUNT; i++) {
      const links: { j: number; d: number }[] = [];
      for (let j = 0; j < NODE_COUNT; j++) {
        if (i === j) continue;
        const d = dist(pos(i), pos(j));
        if (d < LINK_DISTANCE) links.push({ j, d });
      }
      links.sort((a, b) => a.d - b.d);
      for (let k = 0; k < Math.min(MAX_LINKS_PER_NODE, links.length); k++) {
        const j = links[k].j;
        if (i < j) edges.push([i, j]);
      }
    }
    const linePos = new Float32Array(edges.length * 2 * 3);
    return {
      initialPositions: new Float32Array(positions),
      edges,
      lineCount: edges.length,
      linePositions: linePos,
    };
  }, []);

  const nodePositions = useMemo(
    () => new Float32Array(initialPositions),
    [initialPositions]
  );
  const phases = useMemo(() => {
    const p: Float32Array = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT * 3; i++) p[i] = Math.random() * Math.PI * 2;
    return p;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < NODE_COUNT; i++) {
      const ix = i * 3;
      nodePositions[ix] =
        initialPositions[ix] + Math.sin(t * 0.4 + phases[ix]) * 0.35;
      nodePositions[ix + 1] =
        initialPositions[ix + 1] + Math.cos(t * 0.35 + phases[ix + 1]) * 0.35;
      nodePositions[ix + 2] =
        initialPositions[ix + 2] + Math.sin(t * 0.3 + phases[ix + 2]) * 0.2;
    }
    for (let e = 0; e < edges.length; e++) {
      const [i, j] = edges[e];
      const o = e * 6;
      linePositions[o] = nodePositions[i * 3];
      linePositions[o + 1] = nodePositions[i * 3 + 1];
      linePositions[o + 2] = nodePositions[i * 3 + 2];
      linePositions[o + 3] = nodePositions[j * 3];
      linePositions[o + 4] = nodePositions[j * 3 + 1];
      linePositions[o + 5] = nodePositions[j * 3 + 2];
    }
    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      posAttr.array.set(nodePositions);
      posAttr.needsUpdate = true;
    }
    if (linesRef.current) {
      const posAttr = linesRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      posAttr.array.set(linePositions);
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group rotation={[0, 0, 0]}>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={linePositions}
            count={lineCount * 2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={ACCENT}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </lineSegments>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={nodePositions}
            count={NODE_COUNT}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color={ACCENT}
          transparent
          opacity={0.6}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function WireframeGrid() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const size = 12;
  const divisions = 20;
  const { positions } = useMemo(() => {
    const pos: number[] = [];
    const step = (size * 2) / divisions;
    const half = size;
    for (let i = 0; i <= divisions; i++) {
      const x = -half + i * step;
      pos.push(x, -half, -8, x, half, -8);
      pos.push(-half, x, -8, half, x, -8);
    }
    return { positions: new Float32Array(pos) };
  }, []);

  useFrame((state) => {
    if (!lineRef.current) return;
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.05 + Math.sin(state.clock.elapsedTime * 0.4) * 0.025;
  });

  return (
    <lineSegments ref={lineRef} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={ACCENT_SOFT}
        transparent
        opacity={0.06}
        depthWrite={false}
      />
    </lineSegments>
  );
}

function OrbitingRings() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1.current) {
      ring1.current.rotation.x = Math.PI / 2;
      ring1.current.rotation.z = t * 0.04;
    }
    if (ring2.current) {
      ring2.current.rotation.x = Math.PI / 3;
      ring2.current.rotation.z = t * 0.055;
    }
    if (ring3.current) {
      ring3.current.rotation.y = Math.PI / 2;
      ring3.current.rotation.z = t * 0.035;
    }
  });

  return (
    <>
      <mesh ref={ring1} position={[0, 0.2, -6]}>
        <torusGeometry args={[2.6, 0.012, 8, 64]} />
        <meshBasicMaterial
          color={ACCENT_SOFT}
          transparent
          opacity={0.12}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ring2} position={[0.5, -0.3, -6.5]}>
        <torusGeometry args={[2, 0.01, 6, 48]} />
        <meshBasicMaterial
          color={ACCENT}
          transparent
          opacity={0.1}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ring3} position={[0, 0, -5.5]}>
        <torusGeometry args={[1.8, 0.008, 6, 48]} />
        <meshBasicMaterial
          color={ACCENT_SOFT}
          transparent
          opacity={0.08}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

function DataParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color={ACCENT}
        transparent
        opacity={0.25}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function SceneContent() {
  return (
    <>
      <WireframeGrid />
      <DataParticles />
      <TechNetwork />
      <OrbitingRings />
    </>
  );
}

export default function SceneBackground() {
  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden"
      style={{ width: "100%", height: "100%", minHeight: "100vh" }}
    >
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 52 }}
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
        }}
      >
        <color attach="background" args={["transparent"]} />
        <fog attach="fog" args={["#040406", 6, 20]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[2, 2, 4]} intensity={0.3} color={ACCENT} />
        <SceneContent />
      </Canvas>
    </div>
  );
}
