"use client";

import {
  Suspense,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";

/**
 * Interactive curl-noise particle nebula — the hero's living "data core".
 *
 * A single THREE.Points cloud (one draw call) is advected through a divergence-free
 * curl-noise field entirely in the vertex shader, so ~30k particles flow like a
 * breathing nebula with zero per-frame CPU work. The cursor parts and swirls the
 * field (stateless — no FBO ping-pong), and the camera drifts for parallax depth.
 *
 * Guardrails: skipped for prefers-reduced-motion / no-WebGL, dynamically imported
 * (ssr:false) so it never blocks LCP, aria-hidden + pointer-events-none so it stays
 * decorative, and the render loop fully stops when scrolled out of view or the tab
 * is hidden.
 */

// ── Brand palette (0–1 linear-ish sRGB values) ───────────────────────────────
//   cyan  #22d3ee   amber #fbbf24
const CYAN = "vec3(0.1333, 0.8275, 0.9333)";
const AMBER = "vec3(0.9843, 0.7490, 0.1412)";

const vertexShader = /* glsl */ `
precision highp float;

// three.js (GLSL3 ShaderMaterial) auto-prepends: position, projectionMatrix,
// modelMatrix, viewMatrix, modelViewMatrix, normalMatrix, cameraPosition.
in float aSeed;                 // per-particle random [0,1)

uniform float uTime;
uniform float uFlowScale;       // spatial frequency of the flow field
uniform float uFlowSpeed;       // how fast the field scrolls through the cloud
uniform float uFlowAmp;         // advection scale — curl magnitude is ~3, so keep this small
uniform vec3  uMouse;           // cursor projected onto the z=0 world plane
uniform float uMouseRadius;     // influence radius (world units)
uniform float uMouseStrength;   // radial force (+ repels)
uniform float uSwirlStrength;   // tangential swirl force
uniform float uMouseActive;     // 0..1 eased pointer presence
uniform float uSize;            // base point size
uniform float uScale;           // 0.5 * drawingBufferHeight (size attenuation)
uniform float uColorScale;      // maps speed -> colour ramp
uniform float uFogNear;
uniform float uFogFar;

out vec3  vColor;
out float vAlpha;

// ── Simplex 3D noise — Ashima Arts / Stefan Gustavson (webgl-noise) ───────────
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g  = step(x0.yzx, x0.xyz);
  vec3 l  = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// ── Curl of a vector potential -> divergence-free flow (coherent streams) ─────
vec3 snoiseVec3(vec3 x){
  return vec3(
    snoise(x),
    snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2)),
    snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4))
  );
}

vec3 curlNoise(vec3 p){
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  vec3 px0 = snoiseVec3(p - dx), px1 = snoiseVec3(p + dx);
  vec3 py0 = snoiseVec3(p - dy), py1 = snoiseVec3(p + dy);
  vec3 pz0 = snoiseVec3(p - dz), pz1 = snoiseVec3(p + dz);
  float cx = (py1.z - py0.z) - (pz1.y - pz0.y);
  float cy = (pz1.x - pz0.x) - (px1.z - px0.z);
  float cz = (px1.y - px0.y) - (py1.x - py0.x);
  return vec3(cx, cy, cz) / (2.0 * e);
}

void main() {
  vec3 base = (modelMatrix * vec4(position, 1.0)).xyz;

  // Bounded, seamless advection: offset = curl * amp, added to the fixed home.
  vec3 sp   = base * uFlowScale + vec3(0.0, 0.0, uTime * uFlowSpeed);
  vec3 flow = curlNoise(sp);
  vec3 pos  = base + flow * uFlowAmp;

  // Stateless cursor force: smooth radial repulsion + tangential swirl.
  vec3  toP  = pos - uMouse;
  float dist = length(toP);
  float fall = smoothstep(uMouseRadius, 0.0, dist) * uMouseActive;
  vec3  dir  = toP / max(dist, 1e-4);
  vec3  tang = vec3(-dir.y, dir.x, 0.0);
  pos += (dir * uMouseStrength + tang * uSwirlStrength) * fall;

  vec4 mvPosition = viewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Depth-attenuated point size with per-particle variation, clamped for fill-rate.
  float sizeVar = 0.55 + 0.45 * aSeed;
  gl_PointSize = clamp(uSize * sizeVar * (uScale / max(-mvPosition.z, 1e-4)), 1.0, 26.0);

  // Colour: mostly cyan, amber flares at speed peaks, rare white-hot cores.
  float speed = length(flow) + fall * (abs(uMouseStrength) + abs(uSwirlStrength));
  float t = pow(clamp(speed * uColorScale, 0.0, 1.0), 1.5);
  vec3 col = mix(${CYAN}, ${AMBER}, t);
  col = mix(col, vec3(1.0), pow(t, 3.0) * 0.6);
  vColor = col;

  // Depth fog + gentle per-particle twinkle.
  float fog     = smoothstep(uFogNear, uFogFar, -mvPosition.z);
  float twinkle = 0.72 + 0.28 * sin(uTime * 1.4 + aSeed * 6.2831853);
  vAlpha = (1.0 - fog) * twinkle;
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

in vec3  vColor;
in float vAlpha;

uniform float uOpacity;

out vec4 fragColor;   // GLSL3 ShaderMaterial provides no gl_FragColor

void main() {
  vec2  uv = gl_PointCoord - 0.5;
  float d  = length(uv);
  if (d > 0.5) discard;                 // square -> soft disc

  float core = smoothstep(0.5, 0.0, d); // 0 at rim -> 1 at centre
  float glow = core * core;

  // Additive blend: intensity lives in alpha, rgb stays the pure tint.
  fragColor = vec4(vColor, glow * vAlpha * uOpacity);
}
`;

/** Deterministic PRNG (mulberry32) — pure, so the particle layout is stable across
 *  re-renders and satisfies React's purity rules (no Math.random during render). */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Quality = {
  count: number;
  size: number;
  opacity: number;
  maxDpr: number;
};

function pickQuality(): Quality {
  if (typeof window === "undefined") {
    return { count: 26000, size: 0.09, opacity: 0.85, maxDpr: 1.75 };
  }
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 820;
  const lowMem =
    // deviceMemory is non-standard but widely available on Chromium.
    typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory ===
      "number" &&
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
  const cores =
    typeof navigator.hardwareConcurrency === "number"
      ? navigator.hardwareConcurrency
      : 8;

  if (coarse || narrow || lowMem || cores <= 4) {
    return { count: 9000, size: 0.13, opacity: 0.8, maxDpr: 1.4 };
  }
  return { count: 28000, size: 0.09, opacity: 0.85, maxDpr: 1.75 };
}

function ParticleFlow({ quality }: { quality: Quality }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  // Monotonic shader clock — advances only while the loop runs, so it survives
  // R3F zeroing state.clock on every frameloop pause/resume (no teleport).
  const timeRef = useRef(0);
  const { gl } = useThree();

  // Static geometry buffers — a soft ellipsoidal gaussian cloud (dense core).
  const { positions, seeds } = useMemo(() => {
    const { count } = quality;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const rand = makeRng(0x9e3779b9);
    // Approx. normal from summed uniforms -> denser toward the centre.
    const gaussian = () => (rand() + rand() + rand() - 1.5) / 1.5;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = gaussian() * 6.6; // wide (fills the hero band)
      positions[i * 3 + 1] = gaussian() * 3.0;
      positions[i * 3 + 2] = gaussian() * 3.0;
      seeds[i] = rand();
    }
    return { positions, seeds };
  }, [quality]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFlowScale: { value: 0.22 },
      uFlowSpeed: { value: 0.14 },
      // curl magnitude is ~3, so ~0.35 keeps median drift < 1 world unit and
      // preserves the flat, wide dense core instead of smearing it to a blob.
      uFlowAmp: { value: 0.35 },
      uMouse: { value: new THREE.Vector3(1e3, 1e3, 1e3) },
      uMouseRadius: { value: 3.2 },
      uMouseStrength: { value: 1.6 },
      uSwirlStrength: { value: 1.1 },
      uMouseActive: { value: 0 },
      uSize: { value: quality.size },
      uScale: { value: 500 },
      // curl speed medians ~3, so ~0.12 keeps the field mostly cyan with amber
      // flares only at velocity peaks (and around the cursor).
      uColorScale: { value: 0.12 },
      uFogNear: { value: 9.0 },
      uFogFar: { value: 22.0 },
      uOpacity: { value: quality.opacity },
    }),
    [quality],
  );

  // Pointer tracking (NDC target + eased presence) via a window listener so it
  // works even though the canvas is pointer-events-none behind the hero copy.
  const pointer = useRef({ x: 0, y: 0, target: 0 });
  const scratch = useMemo(
    () => ({
      ray: new THREE.Vector3(),
      hit: new THREE.Vector3(),
      mouseWorld: new THREE.Vector3(1e3, 1e3, 1e3),
    }),
    [],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // Desktop-only interaction: touch "pointermove" (fires during scroll/drag)
      // would drag the field off-center and never re-center.
      if (e.pointerType === "touch") return;
      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointer.current.target = 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [gl]);

  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    const cam = state.camera;
    // Clamp delta so a large gap (tab refocus / resume) can't jump the field.
    timeRef.current += Math.min(delta, 0.05);
    const t = timeRef.current;

    u.uTime.value = t;
    // Native size attenuation convention: 0.5 * drawing-buffer height.
    u.uScale.value = 0.5 * state.gl.domElement.height;

    // Ease pointer presence; presence decays (frame-rate independent) when the
    // cursor stops moving.
    pointer.current.target *= Math.pow(0.96, delta * 60);
    u.uMouseActive.value = THREE.MathUtils.lerp(
      u.uMouseActive.value as number,
      pointer.current.target,
      Math.min(1, delta * 6),
    );

    // Project the cursor onto the z=0 plane in world space.
    scratch.ray
      .set(pointer.current.x, pointer.current.y, 0.5)
      .unproject(cam)
      .sub(cam.position)
      .normalize();
    const denom = scratch.ray.z;
    if (Math.abs(denom) > 1e-4) {
      const distToPlane = -cam.position.z / denom;
      if (distToPlane > 0) {
        scratch.hit.copy(cam.position).addScaledVector(scratch.ray, distToPlane);
        scratch.mouseWorld.lerp(scratch.hit, 0.12);
      }
    }
    (u.uMouse.value as THREE.Vector3).copy(scratch.mouseWorld);

    // Subtle camera parallax for depth (eased toward the cursor).
    const px = pointer.current.x * 0.9;
    const py = pointer.current.y * 0.55;
    cam.position.x = THREE.MathUtils.lerp(cam.position.x, px, 0.03);
    cam.position.y = THREE.MathUtils.lerp(cam.position.y, py, 0.03);
    cam.lookAt(0, 0, 0);
  });

  // Stable args identity so R3F never disposes + reconstructs the material on
  // an unrelated Canvas re-render (frameloop/dpr toggles). uniforms are mutated
  // in place each frame, so the reference must persist.
  const materialArgs = useMemo<[THREE.ShaderMaterialParameters]>(
    () => [
      {
        glslVersion: THREE.GLSL3,
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      },
    ],
    [uniforms],
  );

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial ref={materialRef} args={materialArgs} />
    </points>
  );
}

export default function HeroParticleField() {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(true);
  const [dpr, setDpr] = useState(1.5);
  const [quality] = useState<Quality>(() => pickQuality());
  const hostRef = useRef<HTMLDivElement>(null);

  // Enable only when motion is welcome and WebGL exists (after first paint).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const probe = document.createElement("canvas");
    const hasGl =
      !!probe.getContext("webgl2") ||
      !!probe.getContext("webgl") ||
      !!probe.getContext("experimental-webgl");
    if (!hasGl) return;
    const nextDpr = Math.min(quality.maxDpr, window.devicePixelRatio || 1);
    startTransition(() => {
      setDpr(nextDpr);
      setEnabled(true);
    });
  }, [quality]);

  // Pause the render loop when scrolled out of view or the tab is hidden.
  useEffect(() => {
    if (!enabled) return;
    let inView = true;
    let visible = !document.hidden;
    const apply = () => setActive(inView && visible);

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        apply();
      },
      { rootMargin: "200px" },
    );
    if (hostRef.current) io.observe(hostRef.current);

    const onVis = () => {
      visible = !document.hidden;
      apply();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled]);

  const onDecline = useCallback(() => setDpr(1), []);

  return (
    <div ref={hostRef} className="absolute inset-0">
      {enabled && (
        <Canvas
          className="!absolute inset-0 h-full w-full touch-none"
          frameloop={active ? "always" : "never"}
          camera={{ position: [0, 0, 12], fov: 46 }}
          dpr={dpr}
          gl={{
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <PerformanceMonitor onDecline={onDecline} flipflops={3} />
          <Suspense fallback={null}>
            <ParticleFlow quality={quality} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
