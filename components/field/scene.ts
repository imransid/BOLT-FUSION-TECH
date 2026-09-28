/**
 * The homepage hero's 3D scene: "Many technologies. One engineering system."
 * (engineering SPEC §7, the owner's brief of 2026-09-16; v2, 2026-09-28).
 *
 * An engineering core of stacked, chamfered octagonal plates in machined
 * graphite, turning slowly, with seven modules on two orbital tiers around it.
 * Thin curves run from the core to each module, and cyan comets carry data
 * along them. Everything stands on an architectural grid that fades into the
 * ground.
 *
 *  - the core: graphite plates catching a studio strip light, each lit by a
 *    thin brand-blue seam under it, with a slow band of energy climbing them;
 *  - the inner tier: web (a thin panel), mobile (a slim slab), AI (a wireframe
 *    icosahedron) and cloud (a torus ring);
 *  - the outer tier: ERP (stacked blocks), POS (a terminal block) and robotics
 *    (an articulated two-segment arm). Robotics is Lab work — nothing
 *    delivered — so it is drawn as a steel-edged wireframe on a dashed link,
 *    and no data flows to it: "concept, not delivered", without a word.
 *
 * Only this module imports three.js, and only HeroScene imports this module,
 * dynamically, after LCP and `load`. The caller decides WHETHER to run it
 * (desktop, a fine pointer, no Save-Data, motion allowed); this module only
 * runs it.
 *
 * The rules it keeps (CLAUDE.md, "The hero field"):
 *  - Named imports from `three`, so the bundler keeps only what is used.
 *  - Clears to the ground, #07090D. No post-processing, no bloom and no
 *    textures: the graphite's reflection is an analytic studio in the shader.
 *  - DPR capped at 1.75.
 *  - The build runs in slices of a few milliseconds, a frame apart, so it
 *    never becomes a long task. Nothing is drawn until every slice is done.
 *  - Nothing is allocated per frame. The pulses are two InstancedMeshes per
 *    tier (the comets' heads and their tails), and the loop writes their
 *    matrices straight into the instance buffers. Every other vector it uses
 *    is allocated once.
 *  - The frame-time watchdog: once the running average frame (about ten
 *    frames, so jitter cannot reset it) has stayed over 20ms for 2s, the
 *    drawing buffer steps down once, from DPR 1.75 to 1.25; after 2s more the
 *    comets fade out, and after 2s more the outer tier sinks into the floor.
 *    Nothing vanishes in one frame.
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
 * FRAMING: the HORIZONTAL field of view is fixed, at the 660x560 frame's. A
 * narrower canvas draws the whole frame smaller, exactly as the poster's
 * `object-fit: contain` draws the 660x560 poster in a narrower field (>=1025px),
 * and the room it gains above and below is ground on both.
 */
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
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
const FLOW = 0x2ee6d6; // the one cyan: the comets only
const STEEL = 0x6b7385; // Lab work: the site's steel, as on the dashed Lab chip

const MAX_DPR = 1.75;
const SLOW_DPR = 1.25; // the watchdog's one step down, before anything is dropped
const SLOW_FRAME_MS = 20;
const SLOW_FOR_MS = 2000;
const FADE_S = 0.8; // the comets fade out over this long
const SINK_S = 2.4; // the outer tier sinks into the floor over this long
const SINK = 1.7; // world units: deep enough that the floor hides the whole tier
const BUILD_SLICE_MS = 6; // how long one slice of the build may hold the main thread

/* ── Camera: a fixed HORIZONTAL field of view, orbiting a target above the core ── */
const FOV = 30; // vertical degrees at the 660x560 frame
const H_TAN = Math.tan((FOV * Math.PI) / 360) * (660 / 560); // tan of the half horizontal FOV, at every width
const CAM_DIST = 11.4;
const CAM_ELEV = 0.72; // radians above the horizon: a raised, drawing-board view
const CAM_TARGET_Y = 0.88;

/* The scene DISSOLVES into the page; it never stops at a box. The canvas
   clears to the field's own ground, and the floor's grid and light pool fade
   to exactly that ground by FLOOR_FADE.to. It is composed for the 660x560
   frame, and because the horizontal field of view is fixed, a narrower field
   (467px at 1025, the narrowest) draws the same frame smaller rather than
   cropping it: the safe area is the frame itself, at every width. Measured on
   rendered frames by scripts/probe-scene.mjs at 660 and 467, across t = 0-100s
   with the pointer at rest and at both parallax extremes (CLAUDE.md, "The
   hero field", has the figures). */
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
  rise: number; // how far a module rises as it passes the front (world units, x cos² of its azimuth; 0 across the back)
};
/* The inner tier RISES as a module comes round to the front: 1.25 at the
   front (x cos² of its azimuth, 0 across the back half), so it passes over
   the top of the core instead of across the seams. At a flat 2.25 every inner
   module crossed the core's face for about 20s of each 90s turn (probe
   frames, 2026-09-28); a tilted orbit (front up, back down) and a 0.4 rise
   both still did. Its link bends with it (the rise shader below), its comets
   follow the bent link, and its orbit ring fades into the ground where it
   rises. */
const INNER: Tier = { radius: 1.75, y: 2.25, speed: 0.07, phase: 0, from: { r: 0.77, y: 1.26 }, lift: 2.65, rise: 1.25 };
const OUTER: Tier = { radius: 2.25, y: 0.36, speed: -0.045, phase: 0, from: { r: 1.3, y: 0.06 }, lift: 0.05, rise: 0 };

/* Pulses: two comets per connection, one outward and one back. */
const PULSE_LEN = 0.07;
const PULSE_R = 0.017;
const HALO_LEN = 1.7;
const HALO_R = 2.6;
const TRAIL = 4; // each comet's glow: the head's halo and three thinner, dimmer segments behind it
const TRAIL_STEP = 0.03; // how far behind the head each segment sits, as a fraction of the link
const TRAIL_GLOW = [1, 0.6, 0.34, 0.15]; // each segment's brightness: a steep fall-off

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

/* The graphite's light, added after three.js's own (MeshStandardMaterial,
   `#include <lights_fragment_end>`): an ANALYTIC studio — a dark floor, a cool
   sky and one long softbox, as a function of the reflected direction — fed
   through the material's own EnvironmentBRDF, so the metal has something to
   reflect with no environment map, no PMREM and no texture. Then a thin
   brand-blue fresnel rim that outlines each silhouette against the ground.
   Without it the metal (metalness 0.6, which three.js scales the diffuse by
   1 - metalness for) could only ever be dark: 95% of the field was under
   luminance 32. */
const STUDIO_GLSL = /* glsl */ `
#include <lights_fragment_end>
{
  vec3 bfV = normalize( vViewPosition );
  vec3 bfR = ( vec4( reflect( -bfV, normal ), 0.0 ) * viewMatrix ).xyz;
  vec3 bfEnv = mix( vec3( 0.012, 0.013, 0.017 ), vec3( 0.1, 0.11, 0.13 ), smoothstep( -0.2, 0.7, bfR.y ) );
  bfEnv *= 0.7 + 0.6 * smoothstep( -1.0, 1.0, bfR.x );
  bfEnv += vec3( 0.95, 1.0, 1.08 ) * ( 1.0 - smoothstep( 0.0, 0.11, abs( bfR.y - 0.28 ) ) ) * smoothstep( -0.9, 0.1, bfR.z );
  reflectedLight.indirectSpecular += bfEnv * EnvironmentBRDF( normal, bfV, material.specularColorBlended, material.specularF90, material.roughness );
  totalEmissiveRadiance += uRim * uRimK * pow( 1.0 - saturate( dot( normal, bfV ) ), 4.0 );
}`;

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
  let maxPr = MAX_DPR; // the watchdog lowers it once, to SLOW_DPR

  /* Every GPU resource is registered here as it is made, and freed from here. */
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const instanced: InstancedMesh[] = [];
  const geo = <T extends BufferGeometry>(x: T): T => (geometries.push(x), x);
  const mat = <T extends Material>(x: T): T => (materials.push(x), x);

  const scene = new Scene();
  /* depth, not a cut-off: it follows the camera. Steep enough that the back
     tier recedes and the front comes forward. */
  scene.fog = new Fog(GROUND, CAM_DIST - 2.5, CAM_DIST + 6);
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  const target = new Vector3(0, CAM_TARGET_Y, 0);

  /* ── Materials ── */
  const graphite = mat(new MeshStandardMaterial({ color: 0x3a414c, metalness: 0.6, roughness: 0.3, flatShading: true }));
  const graphiteLight = mat(new MeshStandardMaterial({ color: 0x566070, metalness: 0.6, roughness: 0.32, flatShading: true }));
  /* the cloud's torus, smooth: flat facets turn the reflection into a checkerboard */
  const graphiteRound = mat(new MeshStandardMaterial({ color: 0x566070, metalness: 0.6, roughness: 0.32 }));
  const rimColor = new Color(BRAND);
  const studio = (m: MeshStandardMaterial, rimK: number) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uRim = { value: rimColor };
      sh.uniforms.uRimK = { value: rimK };
      sh.fragmentShader = "uniform vec3 uRim;\nuniform float uRimK;\n" + sh.fragmentShader.replace("#include <lights_fragment_end>", STUDIO_GLSL);
    };
    m.customProgramCacheKey = () => "bf-studio-1"; // one program per shading mode; the uniforms are per material
  };
  studio(graphite, 0.34);
  studio(graphiteLight, 0.28);
  studio(graphiteRound, 0.28);
  /* the screens: dark glass, catching the same studio as a faint sheen */
  const screenMat = mat(new MeshStandardMaterial({ color: 0x0b0f16, metalness: 0.3, roughness: 0.22 }));
  studio(screenMat, 0.12);
  const edge = mat(new MeshBasicMaterial({ color: BRAND }));
  const edgeDim = mat(new MeshBasicMaterial({ color: 0x2f5bb8 }));
  /* the AI's wireframe, dimmer than the core: it once out-shone it */
  const wire = mat(new LineBasicMaterial({ color: 0x6f86b8 }));
  const steel = mat(new LineBasicMaterial({ color: STEEL }));
  const steelFill = mat(new MeshBasicMaterial({ color: STEEL }));
  const connMat = mat(new MeshBasicMaterial({ color: 0x31435f }));
  const orbitMat = mat(new MeshBasicMaterial({ color: 0x1c2533 }));
  const pulseMat = mat(new MeshBasicMaterial({ color: FLOW }));
  const haloMat = mat(new MeshBasicMaterial({ color: FLOW, transparent: true, opacity: 0.3, blending: AdditiveBlending, depthWrite: false }));

  /* The seams' own material (the modules share `edge`): a soft band of light
     climbs the stack every 7 seconds, bottom to top. EXACTLY zero at t = 0 —
     the band starts below the plinth and its strength ramps in over 1.5s —
     so the first frame is the poster's. It peaks at 55% of a mix toward pale
     blue over about a second: it glows, it never flashes. */
  const seamU = { uT: { value: 0 } };
  const seamMat = mat(new MeshBasicMaterial({ color: BRAND }));
  seamMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, seamU);
    sh.vertexShader = "varying float vWy;\n" + sh.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\n  vWy = ( modelMatrix * vec4( transformed, 1.0 ) ).y;");
    sh.fragmentShader =
      "uniform float uT;\nvarying float vWy;\n" +
      sh.fragmentShader.replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
  float bfD = ( vWy - ( mod( uT, 7.0 ) / 7.0 * 3.2 - 0.6 ) ) * 4.0;
  float bfBand = exp( -bfD * bfD ) * smoothstep( 0.0, 1.5, uT );
  diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.62, 0.8, 1.0 ), 0.55 * bfBand );`,
      );
  };
  seamMat.customProgramCacheKey = () => "bf-seam-1";

  /* The inner tier's links bend up with their module as it rises past the
     front (Tier.rise): the lift is 0 where a link leaves the core and the
     module's own at its end, from each vertex's own azimuth, so the tube stays
     attached with no per-frame geometry. */
  const riseMat = (color: number, from: number, to: number, fade: number) => {
    const m = mat(new MeshBasicMaterial({ color }));
    const u = { uRise: { value: INNER.rise }, uFrom: { value: from }, uTo: { value: to }, uFade: { value: fade }, uGround: { value: new Color(GROUND) } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader =
        "uniform float uFade;\nuniform vec3 uGround;\nvarying float vBfUp;\n" +
        sh.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n  diffuseColor.rgb = mix( diffuseColor.rgb, uGround, uFade * vBfUp );");
      sh.vertexShader =
        "uniform float uRise;\nuniform float uFrom;\nuniform float uTo;\nvarying float vBfUp;\n" +
        sh.vertexShader.replace(
          "#include <begin_vertex>",
          /* glsl */ `#include <begin_vertex>
  {
    vec4 bfW = modelMatrix * vec4( transformed, 1.0 );
    float bfC = bfW.z / max( length( bfW.xz ), 1e-4 );
    vBfUp = max( 0.0, bfC ) * max( 0.0, bfC );
    float bfLift = uRise * vBfUp * smoothstep( uFrom, uTo, length( bfW.xz ) );
    /* world up, in this object's own space */
    vec3 bfUp = vec3( modelMatrix[ 0 ][ 1 ], modelMatrix[ 1 ][ 1 ], modelMatrix[ 2 ][ 1 ] );
    transformed += bfUp * ( bfLift / dot( bfUp, bfUp ) );
  }`,
        );
    };
    m.customProgramCacheKey = () => "bf-rise-1";
    return m;
  };
  const connRise = riseMat(0x31435f, INNER.from.r, INNER.radius - 0.3, 0);
  /* the inner orbit's ring rises with its modules, and fades into the ground
     where it rises, so it never draws a line across the core */
  const orbitRise = riseMat(0x1c2533, -2, -1, 1);

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
  const key = new DirectionalLight(0xf1f4f9, 3.25);
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
      add(pivot, band(Math.min(r, below) - c - 0.012, GAP + 0.006), seamMat, 0, -h / 2 - GAP / 2, 0);
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

  /** Lab work: every mesh under `root` becomes its steel edges (build time only). */
  const ghost = (root: Object3D) => {
    const meshes: Mesh[] = [];
    root.traverse((o) => {
      if ((o as Mesh).isMesh) meshes.push(o as Mesh);
    });
    for (const m of meshes) {
      const lines = new LineSegments(geo(new EdgesGeometry(m.geometry, 20)), steel);
      lines.position.copy(m.position);
      lines.rotation.copy(m.rotation);
      lines.scale.copy(m.scale);
      m.parent?.add(lines);
      m.removeFromParent();
    }
  };

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
    add(ring, geo(new TorusGeometry(0.25, 0.052, 12, 56)), graphiteRound);
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
  /** Robotics: Lab tier, nothing delivered. The same articulated arm, drawn as
   *  its steel edges only — a concept, not a solid, lit peer of the others. */
  const buildRobot = () => {
    const g = new Group();
    g.position.y = -0.2;
    add(g, geo(new CylinderGeometry(0.13, 0.16, 0.07, 8, 1, false, Math.PI / 8)), graphite, 0, 0.035, 0);
    add(g, band(0.135, 0.012), graphite, 0, 0.074, 0);
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
    ghost(g);
    return g;
  };

  /* Which module sits where (degrees from the front, +z), and which way it
     faces the viewer (world yaw). Placed for t = 0, the poster: no two modules
     overlap on screen and none hides the core. The spacing is deliberately
     uneven, so the composition never reads as a mirrored diagram. `lab`: a
     dashed steel link, and no comets on it. */
  type Slot = { build: () => Group; angle: number; yaw: number; scale: number; lab?: boolean };
  const deg = (d: number) => (d * Math.PI) / 180;
  const innerSlots: Slot[] = [
    { build: buildWeb, angle: deg(325), yaw: 0.38, scale: 1.3 },
    { build: buildAi, angle: deg(35), yaw: 0, scale: 1.3 },
    { build: buildCloud, angle: deg(145), yaw: 0, scale: 1.3 },
    { build: buildMobile, angle: deg(215), yaw: -0.35, scale: 1.3 },
  ];
  const outerSlots: Slot[] = [
    { build: buildRobot, angle: deg(40), yaw: -0.65, scale: 1.55, lab: true },
    { build: buildErp, angle: deg(115), yaw: -0.5, scale: 1.4 },
    { build: buildPos, angle: deg(265), yaw: 0.5, scale: 1.4 },
  ];

  type BuiltTier = {
    tier: Tier;
    group: Group;
    ring: Mesh;
    modules: { obj: Group; angle: number; yaw: number; wobble: number; port: Mesh | null }[];
    curves: Float32Array; // 9 floats per connection: P0, P1, P2
    pulses: InstancedMesh; // the comets' heads
    halos: InstancedMesh; // their glow: TRAIL instances per comet
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
  const tmpColor = new Color();

  const tiers: BuiltTier[] = [];

  /** A tier's cheap parts: its group, its orbit ring, and the comet instances
   *  (the instances themselves cost nothing; the modules and tubes are what
   *  take the time, and each of those is its own slice). Lab links carry no
   *  comets, so they get none. */
  const startTier = (tier: Tier, slots: Slot[], seed: number): BuiltTier => {
    const group = new Group();
    scene.add(group);
    const ring = add(scene, geo(new TorusGeometry(tier.radius, 0.0045, 3, 220)), tier === INNER ? orbitRise : orbitMat, 0, tier.y, 0);
    ring.rotation.x = Math.PI / 2;

    const live: number[] = [];
    slots.forEach((s, j) => {
      if (!s.lab) live.push(j);
    });
    const n = live.length * 2;
    const pulses = new InstancedMesh(pulseGeo, pulseMat, n);
    const halos = new InstancedMesh(pulseGeo, haloMat, n * TRAIL);
    for (let q = 0; q < n * TRAIL; q++) halos.setColorAt(q, tmpColor.setScalar(TRAIL_GLOW[q % TRAIL]));
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
      const j = live[i >> 1];
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

    /* a connection: from the core's surface to just short of the module */
    const endR = tier.radius - 0.3;
    tmpA.set(dx * tier.from.r, tier.from.y, dz * tier.from.r);
    tmpC.set(dx * endR, tier.y - 0.02, dz * endR);
    const midR = (tier.from.r + endR) / 2;
    tmpB.set(dx * midR, tier.lift, dz * midR);
    curves.set([tmpA.x, tmpA.y, tmpA.z, tmpB.x, tmpB.y, tmpB.z, tmpC.x, tmpC.y, tmpC.z], i * 9);
    const curve = new QuadraticBezierCurve3(tmpA.clone(), tmpB.clone(), tmpC.clone());
    let port: Mesh;
    if (s.lab) {
      /* Lab: a dashed steel line — 24 dashes along the same curve — with steel ports */
      const pts = curve.getPoints(48);
      const dash = new Float32Array(24 * 6);
      for (let j = 0; j < 24; j++) {
        pts[2 * j].toArray(dash, j * 6);
        pts[2 * j + 1].toArray(dash, j * 6 + 3);
      }
      const g = geo(new BufferGeometry());
      g.setAttribute("position", new BufferAttribute(dash, 3));
      group.add(new LineSegments(g, steel));
      add(group, portGeo, steelFill, tmpA.x, tmpA.y, tmpA.z);
      port = add(group, portGeo, steelFill, tmpC.x, tmpC.y, tmpC.z);
    } else {
      add(group, geo(new TubeGeometry(curve, 48, 0.011, 4, false)), tier === INNER ? connRise : connMat);
      add(group, portGeo, edge, tmpA.x, tmpA.y, tmpA.z);
      port = add(group, portGeo, edge, tmpC.x, tmpC.y, tmpC.z);
    }
    bt.modules.push({ obj: holder, angle: s.angle, yaw: s.yaw, wobble: seed + i * 1.7, port: tier === INNER ? port : null });
  };

  /* ── Per-frame state (allocated once) ── */
  const pointer = { x: 0, y: 0 }; // -1..1, the pointer over the viewport
  const cam = { az: 0, el: 0 }; // eased parallax offsets
  let time = 0;
  let last = 0;
  let slowFor = 0;
  let avgMs = 1000 / 60; // the running average frame time, for the watchdog
  let degrade = 0; // 0 all; 1 the drawing buffer stepped down; 2 no comets; 3 no outer tier
  let cometK = 1; // the comets' scale while they fade out (degrade 2)
  let sinkK = 0; // how far the outer tier has sunk, 0..1 (degrade 3)
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
  /** How far a module at this world azimuth has risen (Tier.rise): the link shader's own curve. */
  const frontRise = (tier: Tier, az: number) => {
    const f = Math.max(0, Math.cos(az));
    return tier.rise * f * f;
  };

  const writePulses = (bt: BuiltTier, t: number, ang: number) => {
    const C = bt.curves;
    const P = bt.pulses.instanceMatrix.array as Float32Array;
    const H = bt.halos.instanceMatrix.array as Float32Array;
    const n = bt.pulseCurve.length;
    const fadeK = Math.sqrt(cometK); // a comet's light goes with its area: an even fade
    for (let i = 0; i < n; i++) {
      const j = bt.pulseCurve[i];
      const o = j * 9;
      const dir = bt.pulseDir[i];
      const rise = bt.tier === INNER ? frontRise(bt.tier, bt.modules[j].angle + ang) : 0;
      const head = (bt.pulsePhase[i] + t * bt.pulseRate[i]) % 1;
      /* grow in from the start and shrink out at the end: nothing pops */
      const s = smooth(0, 0.12, head) * (1 - smooth(0.86, 1, head)) * fadeK;
      for (let k = 0; k < TRAIL; k++) {
        /* the head, then each tail segment a little further back along the link */
        const travel = Math.max(0, head - k * TRAIL_STEP);
        const u = dir > 0 ? travel : 1 - travel;
        const a = 1 - u;
        /* the point on the quadratic curve, bent up by the module's rise
           (smoothstep in u, as the link shader bends it), and its tangent in
           the direction of travel */
        const px = a * a * C[o] + 2 * a * u * C[o + 3] + u * u * C[o + 6];
        const py = a * a * C[o + 1] + 2 * a * u * C[o + 4] + u * u * C[o + 7] + rise * u * u * (3 - 2 * u);
        const pz = a * a * C[o + 2] + 2 * a * u * C[o + 5] + u * u * C[o + 8];
        let tx = (a * (C[o + 3] - C[o]) + u * (C[o + 6] - C[o + 3])) * dir;
        let ty = (a * (C[o + 4] - C[o + 1]) + u * (C[o + 7] - C[o + 4]) + 3 * rise * u * a) * dir;
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
        const L = PULSE_LEN * s;
        const R = PULSE_R * s;
        if (k === 0) putFrame(P, i * 16, tx, ty, tz, yx, yy, yz, zx, zz, L, R, px, py, pz);
        /* each segment of the glow longer, thinner and dimmer than the one before it */
        putFrame(H, (i * TRAIL + k) * 16, tx, ty, tz, yx, yy, yz, zx, zz, L * HALO_LEN * (1 + 0.3 * k), R * HALO_R * 0.7 * (1 - 0.2 * k), px, py, pz);
      }
    }
    bt.pulses.instanceMatrix.needsUpdate = true;
    bt.halos.instanceMatrix.needsUpdate = true;
  };

  /** Pose the whole scene at time t. Deterministic: t, the eased camera and the watchdog's fades only. */
  const pose = (t: number) => {
    /* indexed loops only: no iterators or closures per frame */
    for (let i = 0; i < plates.length; i++) {
      plates[i].rotation.y = (i % 2 ? Math.PI / 8 : 0) + t * (0.055 + (i % 2) * 0.018);
    }
    seamU.uT.value = t;
    for (let b = 0; b < tiers.length; b++) {
      const bt = tiers[b];
      const ang = bt.tier.phase + t * bt.tier.speed;
      bt.group.rotation.y = ang;
      /* each module keeps its own world-facing yaw while it orbits, with a slow sway */
      for (let i = 0; i < bt.modules.length; i++) {
        const m = bt.modules[i];
        m.obj.rotation.y = m.yaw - ang + 0.2 * Math.sin(t * 0.3 + m.wobble);
        if (m.port) {
          const r = frontRise(bt.tier, m.angle + ang);
          m.obj.position.y = bt.tier.y + r;
          m.port.position.y = bt.tier.y - 0.02 + r;
        }
      }
      if (degrade < 2 || cometK > 0) writePulses(bt, t, ang);
    }
    for (let i = 0; i < spinners.length; i++) spinners[i].obj.rotation.y = t * spinners[i].rate;
    shoulder.rotation.z = 0.42 + 0.2 * Math.sin(t * 0.42);
    elbow.rotation.z = -1.2 + 0.28 * Math.sin(t * 0.42 + 1.3);
    if (sinkK > 0 && tiers[1]) {
      const d = SINK * smooth(0, 1, sinkK);
      tiers[1].group.position.y = -d;
      tiers[1].ring.position.y = OUTER.y - d;
    }

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
    const pr = Math.min(window.devicePixelRatio || 1, maxPr);
    /* nothing changed — a ResizeObserver reporting the same box, say: do not
       touch the canvas, since assigning its size reallocates the buffer */
    if (w === sizedW && h === sizedH && pr === sizedPr) return;
    sizedW = w;
    sizedH = h;
    sizedPr = pr; // a zoom, a move to another screen, or the watchdog's step, changes it
    renderer.setDrawingBufferSize(w, h, pr);
    /* the horizontal extent is the 660x560 frame's at every width: a narrower
       canvas gains vertical room, and draws the frame smaller */
    camera.aspect = w / h;
    camera.fov = (360 / Math.PI) * Math.atan(H_TAN / camera.aspect);
    camera.updateProjectionMatrix();
  };

  const render = () => {
    if (sizeDirty) applySize();
    pose(time);
    renderer.render(scene, camera);
  };

  /** The watchdog's next step, once the frames have been slow for SLOW_FOR_MS. */
  const degradeStep = () => {
    degrade++;
    if (degrade === 1) {
      /* one step down of the drawing buffer — one reallocation, once — before
         anything is dropped; where it is already at or under SLOW_DPR there is
         nothing to step, and the comets are next */
      if (Math.min(window.devicePixelRatio || 1, maxPr) > SLOW_DPR) {
        maxPr = SLOW_DPR;
        sizeDirty = true;
      } else degrade = 2;
    }
  };

  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dtMs = last ? now - last : 0;
    last = now;
    /* the watchdog: 2s of slow frames per step */
    if (dtMs && degrade < 3) {
      /* judged on a running average over about ten frames: a slow device's
         frames are uneven, and testing each frame alone reset the count on
         every fast one, so it never fired (probe 6e). One long hitch is
         clamped, so it cannot trip it alone. */
      avgMs += (Math.min(dtMs, 250) - avgMs) * 0.1;
      slowFor = avgMs > SLOW_FRAME_MS ? slowFor + dtMs : 0;
      if (slowFor > SLOW_FOR_MS) {
        slowFor = 0;
        degradeStep();
      }
    }
    const dt = Math.min(dtMs / 1000, 0.05);
    time += dt;
    /* the fades: the comets shrink away, then the outer tier sinks into the
       floor (the floor's depth hides it); each is hidden once it has gone */
    if (degrade >= 2 && cometK > 0) {
      cometK = Math.max(0, cometK - dt / FADE_S);
      if (cometK === 0) for (let b = 0; b < tiers.length; b++) tiers[b].pulses.visible = tiers[b].halos.visible = false;
    }
    if (degrade >= 3 && sinkK < 1 && tiers[1]) {
      sinkK = Math.min(1, sinkK + dt / SINK_S);
      if (sinkK === 1) tiers[1].group.visible = tiers[1].ring.visible = false;
    }
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
