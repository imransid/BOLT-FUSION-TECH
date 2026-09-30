/**
 * The homepage hero's 3D scene: "Many technologies. One engineering system."
 * (engineering SPEC §7, the owner's brief of 2026-09-16; v2, 2026-09-28).
 *
 * An engineering core of stacked, chamfered octagonal plates in machined
 * graphite, turning slowly, with seven modules on two swaying tiers around it.
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
 *  - The watchdog judges the scene's own WORK, never the display's cadence:
 *    the script time of each frame's pose and draw, and the GPU time of its
 *    draw where the browser can clock it (EXT_disjoint_timer_query_webgl2).
 *    Once either has averaged over 10ms for 2s — or, with no GPU clock,
 *    frames have come both slow (over 20ms) and uneven — the drawing buffer
 *    steps down once, from DPR 1.75 to 1.25; after 2s more the comets fade
 *    out, and after 2s more the outer tier sinks into the floor. Nothing
 *    vanishes in one frame. A steady 30Hz cadence with cheap work — Safari's
 *    Low Power Mode, Chrome's Energy Saver — is the display's rate, and
 *    costs the scene nothing.
 *  - Paused while the canvas is offscreen and while the tab is hidden.
 *  - `dispose()` frees every geometry, material and instance buffer, then the
 *    renderer, then the context itself. The scene creates no textures.
 *  - A lost context stops the loop and calls `onLost`; nothing throws.
 *
 * IT OPENS AS THE HERO SCROLLS AWAY: an exploded view, the engineering
 * drawing's own gesture. Over the first 16% of the field's height of scroll
 * (90px: the field is 560px tall at every desktop width, and the header stays
 * pinned over the top 73px for the first 200px) each plate
 * lifts by its index x 0.13, the inner tier rises with the plate its links
 * leave from, the seams brighten in the opened gaps, and the camera lifts
 * its target and steps back a little to take it in; scrolling back
 * reassembles it. It is damped, driven by
 * the scene's own passive scroll listener (scrollY only — no layout read),
 * and identity at scroll 0; like everything else here it stops with the loop,
 * so Pause motion freezes it. No GSAP, no pinning.
 *
 * IT ANSWERS THE PRIMARY ACTION. Hovering or focusing the hero's own
 * "Schedule a Call" (`#hero [data-cta="schedule"]`) charges the system: the
 * seams brighten by 40% (a brighter BLUE, never amber — amber means target),
 * the rim by 30%, and the comets' clock runs 1.6x, all eased in over about
 * 0.6s and back out on leave or blur. The scene owns those listeners; it
 * exposes nothing to the page. The CTA's own hover and focus states stay the
 * signal: this only answers them.
 *
 * DETERMINISM, for the poster (scripts/render-scene-poster.mjs): the scene's
 * clock starts at 0 when it mounts and advances only by frame deltas while it
 * runs. The first frame, the one that resolves `ready`, is always t = 0 with
 * the camera at rest and nothing charged. That frame is the poster, so the
 * canvas fades in over an identical picture. Every state the visitor drives
 * (the pointer's parallax, the charge, the exploded view) starts at exactly its rest value at
 * mount and follows the visitor only once HOLD_S has passed — after the
 * canvas's fade — so the fade is always over the poster's own picture, even
 * on a page loaded mid-scroll or with the pointer already on the CTA.
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
/* The watchdog (2026-09-29). It judged the rAF interval until then, so a
   display delivering every second vsync — Safari's Low Power Mode, Chrome's
   Energy Saver, a laptop on battery — read as a slow GPU: on an M2 at a 30Hz
   cadence, with every frame drawn far inside its budget, the comets and the
   outer tier (ERP, POS, the robot) were gone within 3s (the design review). */
const WORK_MS = 10; // the scene's own work a frame, script or GPU, averaged: over this, it is the slow part
const SLOW_FRAME_MS = 20; // with no GPU clock: frames this slow on average…
const UNEVEN_MS = 4; // …AND this uneven (p90 - p10 of the last GAPS intervals): a display's own cadence is steady
const GAPS = 30; // the intervals the evenness is judged over
const QUERIES = 4; // GPU timer queries in flight: a result arrives a frame or more after its draw
const SLOW_FOR_MS = 2000;
const FADE_S = 0.8; // the comets fade out over this long
const SINK_S = 3.6; // the outer tier sinks into the floor over this long (at 2.4, the smaller outer modules of 2026-09-29 lost 48% of their light in one 0.2s)
const SINK = 1.7; // world units: deep enough that the floor hides the whole tier
const BUILD_SLICE_MS = 6; // how long one slice of the build may hold the main thread
const HOLD_S = 0.75; // scene seconds after the first frame before the visitor's state moves it (the canvas fades in over 0.7s)

/* ── The exploded view: the hero scrolled away ── */
const EXPLODE_GAP = 0.13; // world units each plate lifts, per index, when fully open (0.24 put the mobile in the edge band)
const EXPLODE_SPAN = 0.16; // of the FIELD's height (560px on a desktop): the scroll over which it opens — 90px, so it is fully open while the whole drawing is on screen below the header, which stays pinned for the first 200px (at 0.36, 202px, its top modules were under the header and off the screen as it finished opening: the design review, 2026-09-29); never the hero's height, which is the page's layout and moved with it
const EXPLODE_EASE = 6; // per second: damped, about half a second behind the scroll
const EXPLODE_TARGET = 0.53; // the camera's target rises this far with it, so the opened stack sits lower in the frame — its top 58px from the frame's top at 660 at worst, not 36, its bottom 44px (0.25 until 2026-09-29); it does not tilt: lowering it 0.1 rad flattened the tiers into each other
const EXPLODE_BACK = 0.05; // and it steps back by this share of its distance: the opened stack is taller
const EXPLODE_SEAM = 0.3; // the seams' mix toward pale blue, fully open
const INNER_PLATE = 4; // the plate the inner tier's links leave from (its centre is INNER.from.y): the tier rises with it

/* ── The charge: the hero's Schedule a Call, hovered or focused ── */
const CHARGE_EASE = 5; // per second: about 0.6s to settle, either way
const CHARGE_SEAM = 0.24; // the seams' mix toward pale blue at full charge: about +40% luminance, as drawn
const CHARGE_RIM = 0.3; // the graphite's rim, +30%
const CHARGE_CLOCK = 0.6; // the comets' clock runs 1 + this, 1.6x

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
  swing: number; // radians the tier turns either way of its slots, with the scene's one sway
  from: { r: number; y: number }; // where the connections leave the core
  lift: number; // control-point height of each connection
};
/* The tiers SWAY; they do not orbit (2026-09-29). Both turn together, one
   sway every 48 seconds (SWAY_RATE), the inner tier 17 degrees either way of
   its slots and the outer 12.6 — the heavier ring moves less — so every
   module stays in its own part of the frame: the inner tier across the back
   and the sides, above the core, and the outer tier around the front of the
   floor, below it. No module ever crosses the core, and none crosses
   another: `scripts/probe-scene.mjs` (overlap) projects every part of every
   module over the sway at rest and fully opened, at the four parallax
   extremes, and fails any front module within 12px of the core, anything
   within 12px of the Lab robot and any two modules within 8px (CLAUDE.md,
   "The hero field").

   Full orbits could not do that from this camera, whatever the tuning. The
   outer ring's back arc projects onto the core's top edge, so ERP, POS and
   the robot rose out of the core into the inner tier; and an inner module at
   the front sits over the core unless it rises about 1.7 units, which puts
   it into the frame's top band and on top of whichever module is behind it.
   Orbiting at 90 and 140 seconds a turn, a front module overlapped the
   core for 250-330s of every 1257s and the robot was crossed for about
   130s by each of three modules (probe-scene's overlap check, 2026-09-29);
   a taller, narrower rise (2.0) still left 70-110s. Swaying tiers were
   tried in opposite phase too: the AI and the ERP met on the right. */
const SWAY_RATE = (2 * Math.PI) / 48; // one sway every 48 seconds, at its fastest through t = 0
const INNER: Tier = { radius: 1.75, y: 2.25, swing: 0.3, from: { r: 0.77, y: 1.26 }, lift: 2.65 };
const OUTER: Tier = { radius: 2.25, y: 0.36, swing: 0.22, from: { r: 1.3, y: 0.06 }, lift: 0.05 };

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
  totalEmissiveRadiance += uRim * uRimK * uRimB * pow( 1.0 - saturate( dot( normal, bfV ) ), 4.0 );
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
  /* depth, not a cut-off: it follows the camera. It starts just in front of
     the core's centre, so the core and the front tier are clear and the back
     tier recedes. Starting at CAM_DIST - 2.5 it dimmed the core itself by
     about 29%, the one thing that should lead the picture. */
  scene.fog = new Fog(GROUND, CAM_DIST - 0.8, CAM_DIST + 7);
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  const target = new Vector3(0, CAM_TARGET_Y, 0);

  /* ── Materials ── */
  const graphite = mat(new MeshStandardMaterial({ color: 0x3a414c, metalness: 0.6, roughness: 0.3, flatShading: true }));
  const graphiteLight = mat(new MeshStandardMaterial({ color: 0x566070, metalness: 0.6, roughness: 0.32, flatShading: true }));
  /* the cloud's torus, smooth: flat facets turn the reflection into a checkerboard */
  const graphiteRound = mat(new MeshStandardMaterial({ color: 0x566070, metalness: 0.6, roughness: 0.32 }));
  const rimColor = new Color(BRAND);
  const rimBoost = { value: 1 }; // shared by every graphite material: the charge raises it
  const studio = (m: MeshStandardMaterial, rimK: number) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uRim = { value: rimColor };
      sh.uniforms.uRimK = { value: rimK };
      sh.uniforms.uRimB = rimBoost;
      sh.fragmentShader = "uniform vec3 uRim;\nuniform float uRimK;\nuniform float uRimB;\n" + sh.fragmentShader.replace("#include <lights_fragment_end>", STUDIO_GLSL);
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
     blue over about a second: it glows, it never flashes. It runs on the
     comets' clock, so it quickens with them when the system is charged, and
     the charge itself lifts every seam toward the same pale blue. */
  const seamU = { uT: { value: 0 }, uCharge: { value: 0 } }; // uCharge: the charge's and the opened gaps' lift
  const seamMat = mat(new MeshBasicMaterial({ color: BRAND }));
  seamMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, seamU);
    sh.vertexShader = "varying float vWy;\n" + sh.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\n  vWy = ( modelMatrix * vec4( transformed, 1.0 ) ).y;");
    sh.fragmentShader =
      "uniform float uT;\nuniform float uCharge;\nvarying float vWy;\n" +
      sh.fragmentShader.replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
  diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.62, 0.8, 1.0 ), uCharge );
  float bfD = ( vWy - ( mod( uT, 7.0 ) / 7.0 * 3.2 - 0.6 ) ) * 4.0;
  float bfBand = exp( -bfD * bfD ) * smoothstep( 0.0, 1.5, uT );
  diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.62, 0.8, 1.0 ), 0.55 * bfBand );`,
      );
  };
  seamMat.customProgramCacheKey = () => "bf-seam-1";

  /* The inner orbit's ring is drawn only across the back and the sides, where
     the tier sways: in front, 2.25 units up, it would draw a line across the
     core's face. It fades into the ground over 45-63 degrees from the front
     (the camera's parallax is 6) and is not drawn in front of that. */
  const ringFront = mat(new MeshBasicMaterial({ color: 0x1c2533 }));
  ringFront.onBeforeCompile = (sh) => {
    sh.uniforms.uGround = { value: new Color(GROUND) };
    sh.vertexShader =
      "varying float vBfFront;\n" +
      sh.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\n  vec4 bfW = modelMatrix * vec4( transformed, 1.0 );\n  vBfFront = bfW.z / max( length( bfW.xz ), 1e-4 );",
      );
    sh.fragmentShader =
      "uniform vec3 uGround;\nvarying float vBfFront;\n" +
      sh.fragmentShader.replace(
        "#include <color_fragment>",
        "#include <color_fragment>\n  if ( vBfFront > 0.71 ) discard;\n  diffuseColor.rgb = mix( diffuseColor.rgb, uGround, smoothstep( 0.45, 0.71, vBfFront ) );",
      );
  };
  ringFront.customProgramCacheKey = () => "bf-ring-1";

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
  const plateBase: number[] = []; // each plate's height when assembled
  const buildCore = () => {
    const core = new Group();
    core.name = "core"; // names are for scripts/probe-scene.mjs, which reads the scene's layout
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
      plateBase.push(pivot.position.y);
      below = r;
      y += h + GAP;
    });
    /* the top: a raised die, ringed by a thin blue inlay */
    const top = new Group();
    top.position.y = y - GAP;
    core.add(top);
    add(top, plate(0.34, 0.07, 0.018), graphiteLight, 0, 0.035, 0);
    const inlay = add(top, geo(new RingGeometry(0.45, 0.466, 8, 1, Math.PI / 8)), seamMat, 0, 0.002, 0); // the top seam: the band ends in it
    inlay.rotation.x = -Math.PI / 2;
    plates.push(top);
    plateBase.push(top.position.y);
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
     faces the viewer (world yaw). The slots are the poster's layout (t = 0)
     and the centre of each tier's sway: the inner tier across the back and
     the sides, the outer around the front of the floor, the front of the
     inner orbit left open, since a module there would stand over the core.
     The spacing is uneven, so the picture never reads as a mirrored diagram.
     The modules are a little smaller than the core's top plates (1.2 and
     1.3; they were 1.3 and 1.4 when they orbited), so the core leads and the
     sway has room. `lab`: a dashed steel link, and no comets on it. */
  type Slot = { id: string; build: () => Group; angle: number; yaw: number; scale: number; lab?: boolean };
  const deg = (d: number) => (d * Math.PI) / 180;
  const innerSlots: Slot[] = [
    { id: "web", build: buildWeb, angle: deg(280), yaw: 0.38, scale: 1.2 },
    { id: "ai", build: buildAi, angle: deg(85), yaw: 0, scale: 1.2 },
    { id: "cloud", build: buildCloud, angle: deg(140), yaw: 0, scale: 1.2 },
    { id: "mobile", build: buildMobile, angle: deg(220), yaw: -0.35, scale: 1.2 },
  ];
  const outerSlots: Slot[] = [
    { id: "robot", build: buildRobot, angle: deg(45), yaw: -0.65, scale: 1.45, lab: true },
    { id: "erp", build: buildErp, angle: deg(100), yaw: -0.5, scale: 1.3 },
    { id: "pos", build: buildPos, angle: deg(290), yaw: 0.5, scale: 1.3 },
  ];

  type BuiltTier = {
    tier: Tier;
    group: Group;
    ring: Mesh;
    modules: { obj: Group; yaw: number; wobble: number }[];
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

  /** A tier's cheap parts: its group, its ring, and the comet instances
   *  (the instances themselves cost nothing; the modules and tubes are what
   *  take the time, and each of those is its own slice). Lab links carry no
   *  comets, so they get none. */
  const startTier = (tier: Tier, slots: Slot[], seed: number): BuiltTier => {
    const group = new Group();
    scene.add(group);
    const ring = add(scene, geo(new TorusGeometry(tier.radius, 0.0045, 3, 220)), tier === INNER ? ringFront : orbitMat, 0, tier.y, 0);
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
    holder.name = `module:${s.id}${s.lab ? ":lab" : ""}`;
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
      add(group, portGeo, steelFill, tmpC.x, tmpC.y, tmpC.z);
    } else {
      add(group, geo(new TubeGeometry(curve, 48, 0.011, 4, false)), connMat);
      add(group, portGeo, edge, tmpA.x, tmpA.y, tmpA.z);
      add(group, portGeo, edge, tmpC.x, tmpC.y, tmpC.z);
    }
    bt.modules.push({ obj: holder, yaw: s.yaw, wobble: seed + i * 1.7 });
  };

  /* ── Per-frame state (allocated once) ── */
  const pointer = { x: 0, y: 0 }; // -1..1, the pointer over the viewport
  const cam = { az: 0, el: 0 }; // eased parallax offsets
  let time = 0;
  let pulseClock = 0; // the comets' own clock: time, run faster while charged
  let energy = 0; // the charge, eased: 0 at rest
  let explode = 0; // the exploded view, eased: 0 assembled — whatever the scroll at mount
  let explodeTarget = 0; // where the scroll says it should be
  let explodeSpan = 1; // px of scroll that open it fully
  let hovered = false;
  let focused = false;
  let last = 0;
  let slowFor = 0;
  let avgMs = 1000 / 60; // the running average rAF interval, for the watchdog (the cadence)
  let avgWork = 0; // the running average script time of a frame's pose and draw (ms)
  let avgGpu = 0; // the running average GPU time of a frame's draw (ms), where the browser clocks it
  let gpuSeen = false; // a GPU clock has reported: judge the GPU by it, and never by the cadence
  const gaps = new Float64Array(GAPS); // the last GAPS rAF intervals, a ring
  const gapSort = new Float64Array(GAPS);
  let gapN = 0;
  let gapAt = 0;
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

  /* The GPU's own clock, where the browser has one (Chrome and Edge on the
     desktop; not Safari, not Firefox): a ring of TIME_ELAPSED queries, made
     once, each read back a frame or more after the draw it timed. A reading
     taken while the clock jumped (GPU_DISJOINT_EXT) is dropped. */
  const gl = renderer.getContext() as WebGL2RenderingContext;
  const timer = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  const queries: WebGLQuery[] = [];
  if (timer)
    for (let i = 0; i < QUERIES; i++) {
      const q = gl.createQuery();
      if (q) queries.push(q);
    }
  const queryBusy = new Uint8Array(queries.length);
  let queryAt = 0;
  const readGpu = () => {
    for (let i = 0; i < queries.length; i++) {
      if (!queryBusy[i] || !gl.getQueryParameter(queries[i], gl.QUERY_RESULT_AVAILABLE)) continue;
      queryBusy[i] = 0;
      if (gl.getParameter(timer!.GPU_DISJOINT_EXT)) continue;
      avgGpu += (Math.min(gl.getQueryParameter(queries[i], gl.QUERY_RESULT) / 1e6, 250) - avgGpu) * 0.1;
      gpuSeen = true;
    }
  };
  /** The cadence is uneven: the spread of the last GAPS intervals, p90 - p10, over UNEVEN_MS. */
  const uneven = () => {
    if (gapN < GAPS) return false;
    gapSort.set(gaps);
    gapSort.sort();
    const k = (GAPS / 10) | 0;
    return gapSort[GAPS - 1 - k] - gapSort[k] > UNEVEN_MS;
  };

  const smooth = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  const writePulses = (bt: BuiltTier, t: number) => {
    const C = bt.curves;
    const P = bt.pulses.instanceMatrix.array as Float32Array;
    const H = bt.halos.instanceMatrix.array as Float32Array;
    const n = bt.pulseCurve.length;
    const fadeK = Math.sqrt(cometK); // a comet's light goes with its area: an even fade
    for (let i = 0; i < n; i++) {
      const j = bt.pulseCurve[i];
      const o = j * 9;
      const dir = bt.pulseDir[i];
      const head = (bt.pulsePhase[i] + t * bt.pulseRate[i]) % 1;
      /* grow in from the start and shrink out at the end: nothing pops */
      const s = smooth(0, 0.12, head) * (1 - smooth(0.86, 1, head)) * fadeK;
      for (let k = 0; k < TRAIL; k++) {
        /* the head, then each tail segment a little further back along the link */
        const travel = Math.max(0, head - k * TRAIL_STEP);
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

  /** Pose the whole scene at time t. Deterministic: t, the comets' clock, the eased camera and charge, and the watchdog's fades only. */
  const pose = (t: number) => {
    /* indexed loops only: no iterators or closures per frame */
    for (let i = 0; i < plates.length; i++) {
      plates[i].rotation.y = (i % 2 ? Math.PI / 8 : 0) + t * (0.055 + (i % 2) * 0.018);
    }
    seamU.uT.value = pulseClock;
    seamU.uCharge.value = Math.min(1, CHARGE_SEAM * energy + EXPLODE_SEAM * explode);
    rimBoost.value = 1 + CHARGE_RIM * energy;
    /* the tiers' one sway: zero at t = 0, so the slots are the poster's layout */
    const sway = Math.sin(t * SWAY_RATE);
    for (let b = 0; b < tiers.length; b++) {
      const bt = tiers[b];
      const ang = bt.tier.swing * sway;
      bt.group.rotation.y = ang;
      /* each module keeps its own world-facing yaw while its tier sways, and turns a little on its own */
      for (let i = 0; i < bt.modules.length; i++) {
        const m = bt.modules[i];
        m.obj.rotation.y = m.yaw - ang + 0.2 * Math.sin(t * 0.3 + m.wobble);
      }
      /* the comets run on their own clock: changing a rate under `phase + t * rate` would make them jump */
      if (degrade < 2 || cometK > 0) writePulses(bt, pulseClock);
    }
    for (let i = 0; i < spinners.length; i++) spinners[i].obj.rotation.y = t * spinners[i].rate;
    shoulder.rotation.z = 0.42 + 0.2 * Math.sin(t * 0.42);
    elbow.rotation.z = -1.2 + 0.28 * Math.sin(t * 0.42 + 1.3);
    if (sinkK > 0 && tiers[1]) {
      const d = SINK * smooth(0, 1, sinkK);
      tiers[1].group.position.y = -d;
      tiers[1].ring.position.y = OUTER.y - d;
    }
    /* the exploded view: exactly the assembled pose at explode = 0. Plate i
       lifts by (i + 1) gaps; the top die (the last entry) rides on the plate
       it is inlaid into; the plinth never moves, so the outer tier's links,
       which leave from it, stay attached */
    for (let i = 0; i < plates.length; i++) plates[i].position.y = plateBase[i] + explode * Math.min(i + 1, PLATES.length) * EXPLODE_GAP;
    if (tiers[0]) {
      const lift = explode * (INNER_PLATE + 1) * EXPLODE_GAP;
      tiers[0].group.position.y = lift;
      tiers[0].ring.position.y = INNER.y + lift;
    }

    const az = cam.az;
    const el = CAM_ELEV + cam.el;
    target.y = CAM_TARGET_Y + explode * EXPLODE_TARGET;
    const d = CAM_DIST * (1 + EXPLODE_BACK * explode);
    camera.position.set(d * Math.cos(el) * Math.sin(az), target.y + d * Math.sin(el), d * Math.cos(el) * Math.cos(az));
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

  /** The watchdog's next step, once the scene has been the slow part for SLOW_FOR_MS. */
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
    if (dtMs && degrade < 3) {
      /* the cadence, kept for a browser with no GPU clock: a running average
         over about ten frames (a slow device's frames are uneven, and testing
         each frame alone reset the count on every fast one, so it never fired:
         probe 6e; one long hitch is clamped, so it cannot trip it alone), and
         the last GAPS intervals, for their evenness */
      avgMs += (Math.min(dtMs, 250) - avgMs) * 0.1;
      gaps[gapAt] = dtMs;
      gapAt = (gapAt + 1) % GAPS;
      if (gapN < GAPS) gapN++;
      if (queries.length) readGpu();
    }
    const dt = Math.min(dtMs / 1000, 0.05);
    time += dt;
    /* the charge follows the visitor once the canvas has faded in */
    if (time > HOLD_S) energy += ((hovered || focused ? 1 : 0) - energy) * (1 - Math.exp(-dt * CHARGE_EASE));
    pulseClock += dt * (1 + CHARGE_CLOCK * energy);
    if (time > HOLD_S) explode += (explodeTarget - explode) * (1 - Math.exp(-dt * EXPLODE_EASE));
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
    /* ease the camera toward the pointer, frame-rate independent — it too
       waits out the fade, like the charge */
    const k = time > HOLD_S ? 1 - Math.exp(-dt * PARALLAX_EASE) : 0;
    cam.az += (pointer.x * PARALLAX_AZ - cam.az) * k;
    cam.el += (pointer.y * PARALLAX_EL - cam.el) * k;
    /* the frame's own work: its script time around the pose and the draw, and
       its GPU time where there is a query free to clock it */
    const t0 = performance.now();
    const q = queries.length && !queryBusy[queryAt] ? queries[queryAt] : null;
    if (q) gl.beginQuery(timer!.TIME_ELAPSED_EXT, q);
    render();
    if (q) {
      gl.endQuery(timer!.TIME_ELAPSED_EXT);
      queryBusy[queryAt] = 1;
      queryAt = (queryAt + 1) % queries.length;
    }
    /* the watchdog: 2s of the scene being the slow part, per step. It is slow
       when its own work is — the script's, or the GPU's where it is clocked.
       With no GPU clock, only frames that are slow AND uneven stand in for the
       GPU: a display's own cadence (30Hz on battery) is steady, and a device
       that cannot keep up drops frames unevenly. */
    if (dtMs && degrade < 3) {
      avgWork += (Math.min(performance.now() - t0, 250) - avgWork) * 0.1;
      const busy = avgWork > WORK_MS;
      const gpuSlow = gpuSeen && avgGpu > WORK_MS;
      const dropping = !gpuSeen && avgMs > SLOW_FRAME_MS && uneven();
      slowFor = busy || gpuSlow || dropping ? slowFor + dtMs : 0;
      if (slowFor > SLOW_FOR_MS) {
        slowFor = 0;
        degradeStep();
      }
    }
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
  /* the scroll: scrollY against the span, read in the listener — no layout */
  const onScroll = () => {
    explodeTarget = Math.min(1, Math.max(0, window.scrollY / explodeSpan));
  };
  /* the span follows the field's (the canvas's) height, measured here only: at mount and on a resize of the canvas */
  const measure = () => {
    explodeSpan = Math.max(1, EXPLODE_SPAN * canvas.clientHeight);
    onScroll();
  };
  const ro = new ResizeObserver(() => {
    sizeDirty = true;
    measure();
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
  /* the hero's own Schedule a Call; the canvas sits in the hero's field */
  const cta = canvas.closest("#hero")?.querySelector<HTMLElement>('[data-cta="schedule"]') ?? null;
  const onEnter = () => (hovered = true);
  const onLeave = () => (hovered = false);
  const onFocus = () => (focused = true);
  const onBlur = () => (focused = false);
  if (cta) {
    /* already hovered or focused when the scene mounts: charged once HOLD_S has passed */
    hovered = cta.matches(":hover");
    focused = document.activeElement === cta;
    cta.addEventListener("pointerenter", onEnter);
    cta.addEventListener("pointerleave", onLeave);
    cta.addEventListener("focus", onFocus);
    cta.addEventListener("blur", onBlur);
  }
  const onLost = () => {
    if (lost || disposed) return;
    lost = true;
    stop();
    opts.onLost?.();
  };

  canvas.addEventListener("webglcontextlost", onLost);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  io.observe(canvas);
  ro.observe(canvas);
  measure();

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
      window.removeEventListener("scroll", onScroll);
      cta?.removeEventListener("pointerenter", onEnter);
      cta?.removeEventListener("pointerleave", onLeave);
      cta?.removeEventListener("focus", onFocus);
      cta?.removeEventListener("blur", onBlur);
      for (const im of instanced) im.dispose();
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const q of queries) gl.deleteQuery(q);
      renderer.dispose();
      /* release the context now rather than at GC; losing a lost one is a GL error */
      if (!gl.isContextLost()) renderer.forceContextLoss();
    },
  };
}
