/**
 * The homepage hero's 3D scene: "Many technologies. One engineering system."
 * (engineering SPEC §7, the owner's brief of 2026-09-16).
 *
 * An engineering core of stacked, chamfered octagonal plates, turning slowly,
 * with seven modules on two orbital tiers around it. Thin curves run from the
 * core to each module, and small cyan pulses travel along them. Everything
 * stands on an architectural grid that fades into the ground.
 *
 *  - the core: graphite plates, each lit by a thin brand-blue seam under it;
 *  - the inner tier: web (a thin panel), mobile (a slim slab), AI (a wireframe
 *    icosahedron) and cloud (a torus ring);
 *  - the outer tier: ERP (stacked blocks), POS (a terminal block) and robotics
 *    (an articulated two-segment arm).
 *
 * Only this module imports three.js, and only HeroScene imports this module,
 * dynamically, after LCP and `load`. The caller decides WHETHER to run it
 * (desktop, a fine pointer, no Save-Data, motion allowed); this module only
 * runs it.
 *
 * The rules it keeps (CLAUDE.md, "The hero field"):
 *  - Named imports from `three`, so the bundler keeps only what is used.
 *  - Clears to the ground, #07090D. No post-processing and no bloom.
 *  - DPR capped at 1.75.
 *  - The build runs in slices of a few milliseconds, a frame apart, so it
 *    never becomes a long task. Nothing is drawn until every slice is done.
 *  - Nothing is allocated per frame. The pulses are two InstancedMeshes per
 *    tier (a core and a halo), and the loop writes their matrices straight
 *    into the instance buffers. Every other vector it uses is allocated once.
 *  - The frame-time watchdog: once the running average frame (about ten
 *    frames, so jitter cannot reset it) has stayed over 20ms for 2s, the
 *    pulses go; after 2s more, the outer tier goes.
 *  - Paused while the canvas is offscreen and while the tab is hidden.
 *  - `dispose()` frees every geometry, material and instance buffer, then the
 *    renderer, then the context itself. The scene creates no textures.
 *  - A lost context stops the loop and calls `onLost`; nothing throws.
 *
 * DETERMINISM, for the poster (scripts/render-scene-poster.mjs): the scene's
 * clock starts at 0 when it mounts and advances only by frame deltas while it
 * runs. The first frame, the one that resolves `ready`, is always t = 0 with
 * the camera at rest. That frame is the poster, so the canvas fades in over an
 * identical picture.
 *
 * FRAMING: the vertical field of view is fixed. A narrower canvas shows the
 * centre crop of a wider one, exactly as the poster's `object-fit: cover`
 * crops the 660x560 poster in a narrower field.
 */
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DynamicDrawUsage,
  EdgesGeometry,
  Fog,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  LineBasicMaterial,
  LineSegments,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  QuadraticBezierCurve3,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

export type SceneOptions = {
  /** Called once if the WebGL context is lost. The loop has stopped; the caller disposes. */
  onLost?: () => void;
  /** Start paused: the first frame (t = 0) is still drawn, and the loop waits for setPaused(false). */
  paused?: boolean;
};

export type SceneHandle = {
  /** Resolves once the first frame (t = 0, camera at rest) has been drawn. */
  ready: Promise<void>;
  /** The visitor's pause control (the hero's "Pause motion"): stops the loop, or lets it run again. */
  setPaused(paused: boolean): void;
  /** Stops the loop and frees every GPU resource, the context included. Idempotent. */
  dispose(): void;
};

/* ── Palette (sRGB). Cyan only on data flow. ─────────────────────────────── */
const GROUND = 0x07090d; // the site's ground, and the field's CSS background
const BRAND = 0x4c86ff; // the one brand blue: edge light only
const FLOW = 0x2ee6d6; // the one cyan: the pulses only

const MAX_DPR = 1.75;
const SLOW_FRAME_MS = 20;
const SLOW_FOR_MS = 2000;
const BUILD_SLICE_MS = 6; // how long one slice of the build may hold the main thread

/* ── Camera: a fixed vertical FOV, orbiting a target above the core ─────── */
const FOV = 30;
const CAM_DIST = 13.1;
const CAM_ELEV = 0.72; // radians above the horizon: a raised, drawing-board view
const CAM_TARGET_Y = 0.88;

/* The scene DISSOLVES into the page; it never stops at a box. The canvas
   clears to the field's own ground, and the floor's grid and light pool fade
   to exactly that ground by FLOOR_FADE.to. Framed with the camera above, at
   660x560 — the primary frame — and inside 480x560, the narrowest the field
   goes, which is the safe area nothing important may leave. At 480, with the
   pointer at either parallax extreme, the fade circle ends >= 23px inside
   every edge, the rings >= 63px, and every module at every orbit angle
   >= 13px, on bounding spheres; at 660 the same objects clear the sides by
   >= 103px and the top and bottom by >= 65px and >= 50px (a projection check
   outside the repo, confirmed on rendered frames, 2026-09-16). The camera's
   height spends the frame's spare vertical room: raising it does not move the
   side margins, which only the orbits' radii set. So no line, ring or module
   reaches a canvas edge at 480–660px wide. */
const FLOOR_FADE = { from: 1.1, to: 2.8 };
const PARALLAX_AZ = 0.11; // radians of yaw at the pointer's extreme
const PARALLAX_EL = 0.045; // radians of pitch at the pointer's extreme
const PARALLAX_EASE = 1.6; // per second: a slow, eased follow

/* ── The core ─────────────────────────────────────────────────────────────── */
const PLINTH = { r: 1.26, h: 0.11 };
const PLATES: ReadonlyArray<readonly [radius: number, height: number]> = [
  [1.0, 0.24],
  [0.95, 0.22],
  [0.89, 0.21],
  [0.81, 0.2],
  [0.71, 0.18],
  [0.58, 0.16],
];
const GAP = 0.036; // the seam between plates, where the thin blue edge light sits

/* ── The tiers ────────────────────────────────────────────────────────────── */
type Tier = {
  radius: number;
  y: number; // module height
  speed: number; // radians per second
  phase: number;
  from: { r: number; y: number }; // where the connections leave the core
  lift: number; // control-point height of each connection
};
const INNER: Tier = { radius: 1.75, y: 2.25, speed: 0.07, phase: 0, from: { r: 0.77, y: 1.26 }, lift: 2.65 };
const OUTER: Tier = { radius: 2.25, y: 0.36, speed: -0.045, phase: 0, from: { r: 1.3, y: 0.06 }, lift: 0.05 };

/* Pulses: two per connection, one outward and one back. */
const PULSE_LEN = 0.07;
const PULSE_R = 0.017;
const HALO_LEN = 1.7;
const HALO_R = 2.6;

/** Write a scaled frame (tangent x L; y and z x R) and a position into a column-major 4x4 at k. */
function putFrame(
  M: Float32Array, k: number,
  tx: number, ty: number, tz: number,
  yx: number, yy: number, yz: number,
  zx: number, zz: number,
  L: number, R: number,
  px: number, py: number, pz: number,
) {
  M[k] = tx * L; M[k + 1] = ty * L; M[k + 2] = tz * L; M[k + 3] = 0;
  M[k + 4] = yx * R; M[k + 5] = yy * R; M[k + 6] = yz * R; M[k + 7] = 0;
  M[k + 8] = zx * R; M[k + 9] = 0; M[k + 10] = zz * R; M[k + 11] = 0;
  M[k + 12] = px; M[k + 13] = py; M[k + 14] = pz; M[k + 15] = 1;
}

export function createScene(canvas: HTMLCanvasElement, opts: SceneOptions = {}): SceneHandle | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, stencil: false, powerPreference: "low-power" });
  } catch {
    return null; // no WebGL: the poster stays
  }
  renderer.setClearColor(GROUND, 1);

  /* The drawing buffer is sized in ONE pass, by `applySize` below.
     `setPixelRatio` re-applies the renderer's CURRENT size at the new ratio,
     so `setPixelRatio` then `setSize` assigned canvas.width and .height twice
     per sizing: four assignments where two will do, and at DPR 1 the first
     pair wrote the values they already held. Every assignment reallocates the
     drawing buffer, even an unchanged one, and a reallocation is expensive
     (see "The build, in slices"). Setting the ratio at construction only moved
     those two assignments earlier — the canvas is 300x150 then — so the size
     and the ratio go together, through `setDrawingBufferSize`, which assigns
     each once. Measured 2026-09-16. */
  let sizedPr = 0;
  let sizedW = 0;
  let sizedH = 0;

  /* Every GPU resource is registered here as it is made, and freed from here. */
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const instanced: InstancedMesh[] = [];
  const geo = <T extends BufferGeometry>(x: T): T => (geometries.push(x), x);
  const mat = <T extends Material>(x: T): T => (materials.push(x), x);

  const scene = new Scene();
  scene.fog = new Fog(GROUND, CAM_DIST - 1, CAM_DIST + 9.5); // depth, not a cut-off: it follows the camera
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  const target = new Vector3(0, CAM_TARGET_Y, 0);

  /* ── Materials ── */
  const graphite = mat(new MeshStandardMaterial({ color: 0x30363f, metalness: 0.6, roughness: 0.35, flatShading: true }));
  const graphiteLight = mat(new MeshStandardMaterial({ color: 0x566070, metalness: 0.6, roughness: 0.36, flatShading: true }));
  const screenMat = mat(new MeshStandardMaterial({ color: 0x0b0f16, metalness: 0.3, roughness: 0.5 }));
  const edge = mat(new MeshBasicMaterial({ color: BRAND }));
  const edgeDim = mat(new MeshBasicMaterial({ color: 0x2f5bb8 }));
  const wire = mat(new LineBasicMaterial({ color: 0x86a3dc }));
  const connMat = mat(new MeshBasicMaterial({ color: 0x31435f }));
  const orbitMat = mat(new MeshBasicMaterial({ color: 0x1c2533 }));
  const pulseMat = mat(new MeshBasicMaterial({ color: FLOW }));
  const haloMat = mat(new MeshBasicMaterial({ color: FLOW, transparent: true, opacity: 0.1, blending: AdditiveBlending, depthWrite: false }));

  /* ── Geometry helpers ── */
  /** A chamfered octagonal plate: a lathe of 8 segments, a flat face toward +z. */
  const plate = (r: number, h: number, c: number) =>
    geo(
      new LatheGeometry(
        [
          new Vector2(0, -h / 2),
          new Vector2(r - c, -h / 2),
          new Vector2(r, -h / 2 + c),
          new Vector2(r, h / 2 - c),
          new Vector2(r - c, h / 2),
          new Vector2(0, h / 2),
        ],
        8,
        Math.PI / 8,
      ),
    );
  /** An open octagonal band: the seams' edge light. */
  const band = (r: number, h: number) => geo(new CylinderGeometry(r, r, h, 8, 1, true, Math.PI / 8));
  const box = (w: number, h: number, d: number) => geo(new BoxGeometry(w, h, d));
  const add = (parent: Object3D, g: BufferGeometry, m: Material, x = 0, y = 0, z = 0) => {
    const mesh = new Mesh(g, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  /* ── Lights: hemisphere, a key, and a cool rim from behind ── */
  scene.add(new HemisphereLight(0x9fb2d8, GROUND, 1.05));
  const key = new DirectionalLight(0xf1f4f9, 2.5);
  key.position.set(4.5, 7.5, 6);
  scene.add(key);
  const rim = new DirectionalLight(0x5a8cff, 3.4);
  rim.position.set(-5.5, 3.2, -6.5);
  scene.add(rim);

  /* ── The floor: an architectural grid, anti-aliased in the shader, fading
       into the ground with distance, with a faint blue pool under the core ── */
  const floorMat = mat(
    new ShaderMaterial({
      uniforms: {
        uGround: { value: new Color(GROUND) },
        uMinor: { value: new Color(0x121820) },
        uMajor: { value: new Color(0x1c2431) },
        uPool: { value: new Color(0x0c1a3a) },
        uFadeFrom: { value: FLOOR_FADE.from },
        uFadeTo: { value: FLOOR_FADE.to },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uGround;
        uniform vec3 uMinor;
        uniform vec3 uMajor;
        uniform vec3 uPool;
        uniform float uFadeFrom;
        uniform float uFadeTo;
        varying vec3 vWorld;
        float grid(vec2 p, float step) {
          vec2 q = p / step;
          vec2 d = fwidth(q);
          vec2 g = abs(fract(q - 0.5) - 0.5) / max(d, vec2(1e-4));
          float line = 1.0 - min(min(g.x, g.y), 1.0);
          /* where a cell is smaller than a couple of pixels, fade the lines
             out instead of letting them alias into a shimmer */
          return line * (1.0 - smoothstep(0.18, 0.45, max(d.x, d.y)));
        }
        void main() {
          vec2 p = vWorld.xz;
          float r = length(p);
          /* the floor dissolves into the page: its lines and its pool reach
             exactly the ground at uFadeTo, so past it the plane IS the clear
             colour and the canvas edge cannot be seen. Squared, so the last
             lines are faint long before the rim. */
          float fade = 1.0 - smoothstep(uFadeFrom, uFadeTo, r);
          fade *= fade;
          vec3 col = uGround;
          col = mix(col, uMinor, grid(p, 0.25) * fade);
          col = mix(col, uMajor, grid(p, 1.0) * fade);
          col += uPool * exp(-(r * r) / 2.2) * 0.55 * fade;
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    }),
  );
  const floor = add(scene, geo(new PlaneGeometry(48, 48)), floorMat);
  floor.rotation.x = -Math.PI / 2;

  /* the core's footprint on the floor: a thin octagon */
  const footprint = add(scene, geo(new RingGeometry(1.6, 1.618, 8, 1, Math.PI / 8)), orbitMat, 0, 0.002, 0);
  footprint.rotation.x = -Math.PI / 2;

  /* ── The core: one slice of the build ── */
  const plates: Group[] = [];
  const buildCore = () => {
    const core = new Group();
    scene.add(core);
    add(core, plate(PLINTH.r, PLINTH.h, 0.03), graphite, 0, PLINTH.h / 2, 0);
    let y = PLINTH.h + GAP;
    let below = PLINTH.r;
    PLATES.forEach(([r, h], i) => {
      const c = Math.min(0.05, h * 0.22);
      const pivot = new Group();
      pivot.position.y = y + h / 2;
      pivot.rotation.y = i % 2 ? Math.PI / 8 : 0;
      core.add(pivot);
      add(pivot, plate(r, h, c), i % 2 ? graphiteLight : graphite);
      /* the seam under this plate: recessed inside both plates' chamfers */
      add(pivot, band(Math.min(r, below) - c - 0.012, GAP + 0.006), edge, 0, -h / 2 - GAP / 2, 0);
      plates.push(pivot);
      below = r;
      y += h + GAP;
    });
    /* the top: a raised die, ringed by a thin blue inlay */
    const top = new Group();
    top.position.y = y - GAP;
    core.add(top);
    add(top, plate(0.34, 0.07, 0.018), graphiteLight, 0, 0.035, 0);
    const inlay = add(top, geo(new RingGeometry(0.45, 0.466, 8, 1, Math.PI / 8)), edge, 0, 0.002, 0);
    inlay.rotation.x = -Math.PI / 2;
    plates.push(top);
  };

  /* ── The modules: each a distinct form, no text ── */
  const shoulder = new Group();
  const elbow = new Group();
  const spinners: { obj: Object3D; rate: number }[] = [];

  const buildWeb = () => {
    const g = new Group();
    add(g, box(0.7, 0.46, 0.03), graphiteLight);
    add(g, box(0.64, 0.36, 0.004), screenMat, 0, -0.03, 0.016);
    add(g, box(0.64, 0.007, 0.006), edge, 0, 0.19, 0.016); // the browser's top edge, lit
    add(g, box(0.28, 0.13, 0.004), graphite, -0.15, 0.02, 0.019);
    add(g, box(0.28, 0.022, 0.004), graphite, 0.15, 0.07, 0.019);
    add(g, box(0.28, 0.022, 0.004), graphite, 0.15, 0.02, 0.019);
    add(g, box(0.6, 0.06, 0.004), graphite, 0, -0.14, 0.019);
    return g;
  };
  const buildMobile = () => {
    const g = new Group();
    add(g, box(0.25, 0.5, 0.04), graphiteLight);
    add(g, box(0.215, 0.42, 0.004), screenMat, 0, -0.005, 0.021);
    add(g, box(0.06, 0.007, 0.006), edge, 0, 0.225, 0.021);
    return g;
  };
  const buildAi = () => {
    const g = new Group();
    const shell = new IcosahedronGeometry(0.31, 0);
    const lines = new LineSegments(geo(new EdgesGeometry(shell)), wire);
    shell.dispose(); // only its edges are drawn
    g.add(lines);
    add(g, geo(new IcosahedronGeometry(0.1, 0)), graphiteLight);
    g.rotation.x = 0.4;
    spinners.push({ obj: g, rate: 0.22 });
    return g;
  };
  const buildCloud = () => {
    const g = new Group();
    const ring = new Group();
    ring.rotation.x = 0.32; // facing the viewer, tipped back a little: it reads as a ring
    add(ring, geo(new TorusGeometry(0.25, 0.052, 12, 56)), graphiteLight);
    add(ring, geo(new TorusGeometry(0.25, 0.008, 5, 56)), edge, 0, 0, 0.05);
    g.add(ring);
    spinners.push({ obj: g, rate: 0.16 });
    return g;
  };
  const buildErp = () => {
    const g = new Group();
    const offsets = [0, 0.035, -0.02];
    offsets.forEach((dx, i) => {
      const y = -0.13 + i * 0.13;
      add(g, box(0.46, 0.1, 0.32), i === 1 ? graphiteLight : graphite, dx, y, 0);
      add(g, box(0.2, 0.007, 0.006), i === 2 ? edge : edgeDim, dx - 0.09, y, 0.162);
    });
    return g;
  };
  const buildPos = () => {
    const g = new Group();
    add(g, box(0.44, 0.1, 0.32), graphite, 0, -0.15, 0);
    add(g, box(0.3, 0.006, 0.006), edgeDim, 0, -0.15, 0.162);
    add(g, box(0.07, 0.12, 0.06), graphiteLight, 0, -0.05, -0.04);
    const head = new Group();
    head.position.set(0, 0.06, -0.02);
    head.rotation.x = -0.42; // the screen leans back toward the operator
    add(head, box(0.36, 0.24, 0.035), graphiteLight);
    add(head, box(0.31, 0.19, 0.004), screenMat, 0, 0, 0.019);
    add(head, box(0.31, 0.006, 0.006), edge, 0, -0.108, 0.02);
    g.add(head);
    return g;
  };
  const buildRobot = () => {
    const g = new Group();
    g.position.y = -0.2;
    add(g, geo(new CylinderGeometry(0.13, 0.16, 0.07, 8, 1, false, Math.PI / 8)), graphite, 0, 0.035, 0);
    add(g, band(0.135, 0.012), edge, 0, 0.074, 0);
    shoulder.position.y = 0.1;
    g.add(shoulder);
    const jointGeo = geo(new CylinderGeometry(0.045, 0.045, 0.09, 12));
    const j1 = add(shoulder, jointGeo, graphiteLight);
    j1.rotation.x = Math.PI / 2;
    add(shoulder, box(0.06, 0.3, 0.06), graphiteLight, 0, 0.15, 0);
    elbow.position.y = 0.3;
    shoulder.add(elbow);
    const j2 = add(elbow, jointGeo, graphite);
    j2.rotation.x = Math.PI / 2;
    add(elbow, box(0.05, 0.25, 0.05), graphite, 0, 0.125, 0);
    add(elbow, box(0.1, 0.03, 0.05), graphiteLight, 0, 0.26, 0);
    add(elbow, box(0.018, 0.06, 0.04), graphiteLight, -0.04, 0.3, 0);
    add(elbow, box(0.018, 0.06, 0.04), graphiteLight, 0.04, 0.3, 0);
    add(elbow, box(0.012, 0.012, 0.052), edge, 0, 0.0, 0); // the elbow's lit axle
    return g;
  };

  /* Which module sits where (degrees from the front, +z), and which way it
     faces the viewer (world yaw). Placed for t = 0, the poster: no two modules
     overlap on screen, none hides the core, and all seven sit inside a
     480px-wide centre crop. The spacing is deliberately uneven, so the
     composition never reads as a mirrored diagram. */
  type Slot = { build: () => Group; angle: number; yaw: number; scale: number };
  const deg = (d: number) => (d * Math.PI) / 180;
  const innerSlots: Slot[] = [
    { build: buildWeb, angle: deg(325), yaw: 0.38, scale: 1.3 },
    { build: buildAi, angle: deg(35), yaw: 0, scale: 1.3 },
    { build: buildCloud, angle: deg(145), yaw: 0, scale: 1.3 },
    { build: buildMobile, angle: deg(215), yaw: -0.35, scale: 1.3 },
  ];
  const outerSlots: Slot[] = [
    { build: buildRobot, angle: deg(40), yaw: -0.65, scale: 1.55 },
    { build: buildErp, angle: deg(115), yaw: -0.5, scale: 1.4 },
    { build: buildPos, angle: deg(265), yaw: 0.5, scale: 1.4 },
  ];

  type BuiltTier = {
    tier: Tier;
    group: Group;
    ring: Mesh;
    modules: { obj: Group; yaw: number; wobble: number }[];
    curves: Float32Array; // 9 floats per connection: P0, P1, P2
    pulses: InstancedMesh;
    halos: InstancedMesh;
    pulseCurve: Uint8Array;
    pulsePhase: Float32Array;
    pulseRate: Float32Array;
    pulseDir: Int8Array;
  };

  const pulseGeo = geo(new SphereGeometry(1, 10, 6));
  const portGeo = geo(new SphereGeometry(0.026, 10, 8));
  const tmpA = new Vector3();
  const tmpB = new Vector3();
  const tmpC = new Vector3();

  const tiers: BuiltTier[] = [];

  /** A tier's cheap parts: its group, its orbit ring, and the pulse instances
   *  (the instances themselves cost nothing; the modules and tubes are what
   *  take the time, and each of those is its own slice). */
  const startTier = (tier: Tier, slots: Slot[], seed: number): BuiltTier => {
    const group = new Group();
    scene.add(group);
    const ring = add(scene, geo(new TorusGeometry(tier.radius, 0.0045, 3, 220)), orbitMat, 0, tier.y, 0);
    ring.rotation.x = Math.PI / 2;

    const n = slots.length * 2;
    const pulses = new InstancedMesh(pulseGeo, pulseMat, n);
    const halos = new InstancedMesh(pulseGeo, haloMat, n);
    for (const im of [pulses, halos]) {
      im.instanceMatrix.setUsage(DynamicDrawUsage);
      im.frustumCulled = false; // the instances move; a stale bounding sphere would cull them
      group.add(im);
      instanced.push(im);
    }
    const pulseCurve = new Uint8Array(n);
    const pulsePhase = new Float32Array(n);
    const pulseRate = new Float32Array(n);
    const pulseDir = new Int8Array(n);
    for (let i = 0; i < n; i++) {
      const j = i >> 1;
      pulseCurve[i] = j;
      pulseDir[i] = i & 1 ? -1 : 1;
      pulsePhase[i] = (j * 0.381966 + (i & 1) * 0.5 + seed * 0.13) % 1;
      pulseRate[i] = 1 / (3.8 + (j % 3) * 0.6); // one traverse every 3.8–5s
    }
    const bt: BuiltTier = {
      tier,
      group,
      ring,
      modules: [],
      curves: new Float32Array(slots.length * 9),
      pulses,
      halos,
      pulseCurve,
      pulsePhase,
      pulseRate,
      pulseDir,
    };
    tiers.push(bt);
    return bt;
  };

  /** One module, its connection curve and the two lit ports: one slice. */
  const addModule = (bt: BuiltTier, s: Slot, i: number, seed: number) => {
    const { tier, group, curves } = bt;
    const dx = Math.sin(s.angle);
    const dz = Math.cos(s.angle);
    const holder = new Group();
    holder.position.set(dx * tier.radius, tier.y, dz * tier.radius);
    holder.scale.setScalar(s.scale);
    holder.add(s.build());
    group.add(holder);
    bt.modules.push({ obj: holder, yaw: s.yaw, wobble: seed + i * 1.7 });

    /* a connection: from the core's surface to just short of the module */
    const endR = tier.radius - 0.3;
    tmpA.set(dx * tier.from.r, tier.from.y, dz * tier.from.r);
    tmpC.set(dx * endR, tier.y - 0.02, dz * endR);
    const midR = (tier.from.r + endR) / 2;
    tmpB.set(dx * midR, tier.lift, dz * midR);
    curves.set([tmpA.x, tmpA.y, tmpA.z, tmpB.x, tmpB.y, tmpB.z, tmpC.x, tmpC.y, tmpC.z], i * 9);
    const curve = new QuadraticBezierCurve3(tmpA.clone(), tmpB.clone(), tmpC.clone());
    add(group, geo(new TubeGeometry(curve, 48, 0.0068, 4, false)), connMat);
    add(group, portGeo, edge, tmpA.x, tmpA.y, tmpA.z);
    add(group, portGeo, edge, tmpC.x, tmpC.y, tmpC.z);
  };

  /* ── Per-frame state (allocated once) ── */
  const pointer = { x: 0, y: 0 }; // -1..1, the pointer over the viewport
  const cam = { az: 0, el: 0 }; // eased parallax offsets
  let time = 0;
  let last = 0;
  let slowFor = 0;
  let avgMs = 1000 / 60; // the running average frame time, for the watchdog
  let degrade = 0; // 0 all, 1 no pulses, 2 no outer tier
  let raf = 0;
  let running = false;
  let drawn = false;
  let disposed = false;
  let lost = false;
  let inView = true;
  let visible = !document.hidden;
  let paused = opts.paused ?? false;
  let sizeDirty = true;

  const smooth = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  const writePulses = (bt: BuiltTier, t: number) => {
    const C = bt.curves;
    const P = bt.pulses.instanceMatrix.array as Float32Array;
    const H = bt.halos.instanceMatrix.array as Float32Array;
    for (let i = 0; i < bt.pulseCurve.length; i++) {
      const o = bt.pulseCurve[i] * 9;
      const dir = bt.pulseDir[i];
      const travel = (bt.pulsePhase[i] + t * bt.pulseRate[i]) % 1;
      const u = dir > 0 ? travel : 1 - travel;
      const a = 1 - u;
      /* the point on the quadratic curve, and its tangent in the direction of travel */
      const px = a * a * C[o] + 2 * a * u * C[o + 3] + u * u * C[o + 6];
      const py = a * a * C[o + 1] + 2 * a * u * C[o + 4] + u * u * C[o + 7];
      const pz = a * a * C[o + 2] + 2 * a * u * C[o + 5] + u * u * C[o + 8];
      let tx = (a * (C[o + 3] - C[o]) + u * (C[o + 6] - C[o + 3])) * dir;
      let ty = (a * (C[o + 4] - C[o + 1]) + u * (C[o + 7] - C[o + 4])) * dir;
      let tz = (a * (C[o + 5] - C[o + 2]) + u * (C[o + 8] - C[o + 5])) * dir;
      const tl = Math.hypot(tx, ty, tz) || 1;
      tx /= tl;
      ty /= tl;
      tz /= tl;
      /* an orthonormal frame around the tangent: z = t x up, y = z x t */
      let zx = -tz;
      let zz = tx;
      const zl = Math.hypot(zx, zz) || 1;
      zx /= zl;
      zz /= zl;
      const yx = -zz * ty;
      const yy = zz * tx - zx * tz;
      const yz = zx * ty;
      /* grow in from the start and shrink out at the end: nothing pops */
      const s = smooth(0, 0.12, travel) * (1 - smooth(0.86, 1, travel));
      const L = PULSE_LEN * s;
      const R = PULSE_R * s;
      putFrame(P, i * 16, tx, ty, tz, yx, yy, yz, zx, zz, L, R, px, py, pz);
      putFrame(H, i * 16, tx, ty, tz, yx, yy, yz, zx, zz, L * HALO_LEN, R * HALO_R, px, py, pz);
    }
    bt.pulses.instanceMatrix.needsUpdate = true;
    bt.halos.instanceMatrix.needsUpdate = true;
  };

  /** Pose the whole scene at time t. Deterministic: t and the eased camera only. */
  const pose = (t: number) => {
    /* indexed loops only: no iterators or closures per frame */
    for (let i = 0; i < plates.length; i++) {
      plates[i].rotation.y = (i % 2 ? Math.PI / 8 : 0) + t * (0.055 + (i % 2) * 0.018);
    }
    for (let b = 0; b < tiers.length; b++) {
      const bt = tiers[b];
      const ang = bt.tier.phase + t * bt.tier.speed;
      bt.group.rotation.y = ang;
      /* each module keeps its own world-facing yaw while it orbits, with a slow sway */
      for (let i = 0; i < bt.modules.length; i++) {
        const m = bt.modules[i];
        m.obj.rotation.y = m.yaw - ang + 0.2 * Math.sin(t * 0.3 + m.wobble);
      }
      if (degrade < 1) writePulses(bt, t);
    }
    for (let i = 0; i < spinners.length; i++) spinners[i].obj.rotation.y = t * spinners[i].rate;
    shoulder.rotation.z = 0.42 + 0.2 * Math.sin(t * 0.42);
    elbow.rotation.z = -1.2 + 0.28 * Math.sin(t * 0.42 + 1.3);

    const az = cam.az;
    const el = CAM_ELEV + cam.el;
    camera.position.set(
      CAM_DIST * Math.cos(el) * Math.sin(az),
      CAM_TARGET_Y + CAM_DIST * Math.sin(el),
      CAM_DIST * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(target);
  };

  const applySize = () => {
    sizeDirty = false;
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    const pr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    /* nothing changed — a ResizeObserver reporting the same box, say: do not
       touch the canvas, since assigning its size reallocates the buffer */
    if (w === sizedW && h === sizedH && pr === sizedPr) return;
    sizedW = w;
    sizedH = h;
    sizedPr = pr; // a zoom, or a move to another screen, changes it
    renderer.setDrawingBufferSize(w, h, pr);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const render = () => {
    if (sizeDirty) applySize();
    pose(time);
    renderer.render(scene, camera);
  };


  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dtMs = last ? now - last : 0;
    last = now;
    /* the watchdog: 2s of slow frames drops the pulses, 2s more the outer tier */
    if (dtMs && degrade < 2) {
      /* judged on a running average over about ten frames: a slow device's
         frames are uneven, and testing each frame alone reset the count on
         every fast one, so it never fired (probe 6e). One long hitch is
         clamped, so it cannot trip it alone. */
      avgMs += (Math.min(dtMs, 250) - avgMs) * 0.1;
      slowFor = avgMs > SLOW_FRAME_MS ? slowFor + dtMs : 0;
      if (slowFor > SLOW_FOR_MS) {
        slowFor = 0;
        degrade++;
        if (degrade >= 1) for (const bt of tiers) bt.pulses.visible = bt.halos.visible = false;
        if (degrade >= 2) {
          tiers[1].group.visible = false;
          tiers[1].ring.visible = false;
        }
      }
    }
    const dt = Math.min(dtMs / 1000, 0.05);
    time += dt;
    /* ease the camera toward the pointer, frame-rate independent */
    const k = 1 - Math.exp(-dt * PARALLAX_EASE);
    cam.az += (pointer.x * PARALLAX_AZ - cam.az) * k;
    cam.el += (pointer.y * PARALLAX_EL - cam.el) * k;
    render();
  };

  const start = () => {
    if (running || disposed || lost || !drawn) return;
    running = true;
    last = 0;
    slowFor = 0;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };
  const sync = () => (inView && visible && !paused ? start() : stop());

  const io = new IntersectionObserver((entries) => {
    inView = entries[entries.length - 1].isIntersecting;
    sync();
  });
  const ro = new ResizeObserver(() => {
    sizeDirty = true;
    if (drawn && !running && !disposed && !lost) render();
  });
  const onVisibility = () => {
    visible = !document.hidden;
    sync();
  };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    pointer.x = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
    pointer.y = Math.max(-1, Math.min(1, -((e.clientY / window.innerHeight) * 2 - 1)));
  };
  const onLost = () => {
    if (lost || disposed) return;
    lost = true;
    stop();
    opts.onLost?.();
  };

  canvas.addEventListener("webglcontextlost", onLost);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pointermove", onPointer, { passive: true });
  io.observe(canvas);
  ro.observe(canvas);

  /* ── The build, in slices ────────────────────────────────────────────────
     Built in one synchronous block this was the page's longest task after
     load: 105–164ms with the CPU throttled 4x, on top of the chunk's own
     parse. The steps below run for a few milliseconds at a time, a frame
     apart, and each group's shaders are compiled as that group appears —
     off the main thread wherever the driver supports it.

     ONE frame is drawn, last, and it is the whole scene at t = 0 — the
     poster's frame. The canvas is at opacity 0 throughout, so nothing of the
     build is ever seen.

     Two ways of spreading that first draw were measured on 2026-09-16 and
     BOTH were rejected; do not reach for them again without measuring:
       - drawing the scene as it grows, at full size, after the core and each
         tier: about the same at DPR 1 (83ms against 92ms for the longest
         task) but far worse at DPR 2, 185ms against 78ms, since every extra
         frame is filled again;
       - the same, into an 8x8 buffer to avoid that fill cost: catastrophic.
         Shrinking the drawing buffer and restoring it makes the driver
         reallocate it, and the final render went from 54ms to 815ms (1069ms
         with the CPU throttled 4x). Resizing a canvas's backing store is far
         more expensive than the frame it was meant to save.
     What remains of the first draw is upload and program setup for the whole
     scene in one task: 25ms here, once the drawing buffer stopped being
     allocated twice (see `applySize`), and no longer a long task at all.

     Frames do not run in a hidden tab, so a background tab builds nothing
     until it is looked at. */
  let inner!: BuiltTier;
  let outer!: BuiltTier;
  const steps: Array<() => void | Promise<unknown>> = [buildCore];
  steps.push(() => {
    inner = startTier(INNER, innerSlots, 0);
  });
  innerSlots.forEach((s, i) => steps.push(() => addModule(inner, s, i, 0)));
  steps.push(() => renderer.compileAsync(inner.group, camera, scene));
  steps.push(() => {
    outer = startTier(OUTER, outerSlots, 2);
  });
  outerSlots.forEach((s, i) => steps.push(() => addModule(outer, s, i, 2)));
  steps.push(() => renderer.compileAsync(outer.group, camera, scene));
  steps.push(() => renderer.compileAsync(scene, camera)); // the floor, the core and the lights
  steps.push(() => {
    render(); // the first and only frame of the build: t = 0, the poster's frame
    drawn = true;
    sync();
  });

  let buildRaf = 0;
  const ready = new Promise<void>((resolve) => {
    let at = 0;
    const slice = async () => {
      buildRaf = 0;
      const until = performance.now() + BUILD_SLICE_MS;
      while (at < steps.length) {
        if (disposed || lost) return;
        const pending = steps[at++]();
        if (pending) await pending; // a compile: hand the driver the work
        if (performance.now() > until) break;
      }
      if (disposed || lost) return;
      if (at < steps.length) buildRaf = requestAnimationFrame(slice);
      else resolve();
    };
    buildRaf = requestAnimationFrame(slice);
  });

  return {
    ready,
    setPaused(p: boolean) {
      paused = p;
      sync();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      cancelAnimationFrame(buildRaf); // a build still in slices stops here
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      for (const im of instanced) im.dispose();
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      const gl = renderer.getContext();
      renderer.dispose();
      /* release the context now rather than at GC; losing a lost one is a GL error */
      if (!gl.isContextLost()) renderer.forceContextLoss();
    },
  };
}
