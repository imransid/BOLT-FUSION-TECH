"use client";

import { Suspense, startTransition, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";

/**
 * Subtle floating jewel — adds depth without competing with copy.
 * Skipped when user prefers reduced motion or WebGL is unavailable.
 */
function DistortedJewel() {
  return (
    <Float speed={1.35} rotationIntensity={0.42} floatIntensity={0.55}>
      <mesh rotation={[0.2, 0.65, 0.08]} scale={2.35}>
        <icosahedronGeometry args={[1, 2]} />
        <MeshDistortMaterial
          color="#0a0a0a"
          emissive="#c2410c"
          emissiveIntensity={0.09}
          metalness={0.96}
          roughness={0.14}
          speed={0.42}
          distort={0.26}
        />
      </mesh>
    </Float>
  );
}

export default function HeroThreeField() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const canvas = document.createElement("canvas");
    const hasGl =
      !!canvas.getContext("webgl2") ||
      !!canvas.getContext("webgl") ||
      !!canvas.getContext("experimental-webgl");
    if (!hasGl) return;

    startTransition(() => {
      setEnabled(true);
    });
  }, []);

  if (!enabled) return null;

  return (
    <Canvas
      className="!absolute inset-0 h-full min-h-[100%] w-full touch-none"
      camera={{ position: [0, 0.15, 6.4], fov: 36 }}
      dpr={[1, 1.65]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ambientLight intensity={0.22} />
      <directionalLight position={[5.5, 4, 6]} intensity={0.9} color="#fffbeb" />
      <directionalLight position={[-6, -2.5, -2]} intensity={0.32} color="#22d3ee" />
      <pointLight position={[0.8, -0.6, 4.5]} intensity={0.45} color="#fbbf24" distance={14} decay={2} />
      <Suspense fallback={null}>
        <DistortedJewel />
      </Suspense>
    </Canvas>
  );
}
