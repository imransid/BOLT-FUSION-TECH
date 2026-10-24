/**
 * The hero scene's LAYOUT over time, read from the scene's own objects
 * (scripts/probe-scene.mjs, the `overlap` check).
 *
 * `captureHook` runs before any page script (an init script): it records the
 * three.js Scene and PerspectiveCamera as they are constructed, through a
 * setter for `isScene` and `isPerspectiveCamera` on Object.prototype — three.js
 * assigns both flags in the constructors — so the probe reads the real scene
 * graph, with nothing exposed by the page. scene.ts names what is read: the
 * core group `core`, and each module's holder `module:<id>` (`:lab` on Lab
 * work).
 *
 * `layoutRun` then advances the scene's own clock (`window.__bfStep`, the
 * probe's frame driver) and, every sample, projects EVERY vertex of the core
 * and of each module through the camera: the scene's own, and the same camera
 * turned to each measured parallax extreme. Each object's screen silhouette is
 * the union of its PARTS' convex hulls (each plate, box, joint and edge set
 * its own hull) — conservative: a hull covers at least what its part paints,
 * so a clearance between the unions is a clearance between the objects, and
 * no hull spans the empty space between an arm and its base. Links and comets
 * are not objects here: a link leaves the core by construction.
 *
 * Both functions are self-contained (page.evaluate serialises them).
 */

/** Init script: remember the Scene and the PerspectiveCamera three.js makes. */
export function captureHook() {
  const keep = (flag, store) =>
    Object.defineProperty(Object.prototype, flag, {
      configurable: true,
      get() {
        return undefined;
      },
      set(v) {
        Object.defineProperty(this, flag, { value: v, writable: true, configurable: true, enumerable: true });
        if (v) (window[store] = window[store] || []).push(this);
      },
    });
  keep("isScene", "__bfScenes");
  keep("isPerspectiveCamera", "__bfCameras");
}

/** The scene camera's pose, recovered: its target is on the y axis, where it looks. */
export function cameraPose() {
  /* the scene's own camera: the last PerspectiveCamera made that is not a
     light's shadow camera — a PointLight (the visitor's hand, 2026-10-24)
     makes a PerspectiveCamera for its shadow, after the scene's */
  const shadowCams = new Set();
  for (const sc of window.__bfScenes || []) sc.traverse?.((o) => o.shadow?.camera && shadowCams.add(o.shadow.camera));
  const cam = (window.__bfCameras || []).filter((c) => !shadowCams.has(c)).at(-1);
  if (!cam) return null;
  const e = cam.matrixWorld.elements;
  const t = Math.abs(e[10]) > Math.abs(e[8]) ? e[14] / e[10] : e[12] / e[8];
  const ty = e[13] - e[9] * t;
  const d = Math.hypot(e[12], e[13] - ty, e[14]);
  return { az: Math.atan2(e[12], e[14]), el: Math.asin((e[13] - ty) / d), d, ty };
}

/**
 * Run `samples` samples, `frames` frames of `dtMs` apart each, and measure.
 * `variants`: camera offsets [{ daz, del }] from the scene's own pose (the
 * first should be { daz: 0, del: 0 }). Returns the minimum clearance of every
 * pair that matters and how long each was closer than its limit.
 */
export function layoutRun({ samples, frames, dtMs, variants, W, H, limits, keep = [] }) {
  const scene = (window.__bfScenes || []).find((s) => s.getObjectByName && s.getObjectByName("core"));
  /* the scene's own camera: the last PerspectiveCamera made that is not a
     light's shadow camera — a PointLight (the visitor's hand, 2026-10-24)
     makes a PerspectiveCamera for its shadow, after the scene's */
  const shadowCams = new Set();
  for (const sc of window.__bfScenes || []) sc.traverse?.((o) => o.shadow?.camera && shadowCams.add(o.shadow.camera));
  const cam = (window.__bfCameras || []).filter((c) => !shadowCams.has(c)).at(-1);
  if (!scene || !cam) return { error: "no scene or camera captured (captureHook must run before the page's scripts)" };
  const core = scene.getObjectByName("core");
  const mods = [];
  scene.traverse((o) => {
    if (typeof o.name === "string" && o.name.startsWith("module:")) mods.push(o);
  });
  const parts = (root) => {
    const out = [];
    root.traverse((o) => {
      if ((o.isMesh || o.isLineSegments || o.isLine) && !o.isInstancedMesh && o.geometry?.attributes?.position) out.push(o);
    });
    return out;
  };
  const objs = [{ name: "core", root: core, parts: parts(core) }, ...mods.map((m) => ({ name: m.name.slice(7), root: m, parts: parts(m), lab: m.name.endsWith(":lab") }))];
  for (const o of objs) o.id = o.name.replace(/:lab$/, "");

  /* 4x4 column-major helpers */
  const mul = (a, b, out) => {
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++) out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return out;
  };
  const lookAt = (px, py, pz, tx, ty, tz, out) => {
    /* the view matrix of a camera at p looking at t, world up +y (three.js's lookAt) */
    let zx = px - tx;
    let zy = py - ty;
    let zz = pz - tz;
    const zl = Math.hypot(zx, zy, zz);
    zx /= zl;
    zy /= zl;
    zz /= zl;
    let xx = zz; // up x z = (0,1,0) x z
    let xy = 0;
    let xz = -zx;
    const xl = Math.hypot(xx, xy, xz);
    xx /= xl;
    xz /= xl;
    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;
    out[0] = xx; out[4] = xy; out[8] = xz; out[12] = -(xx * px + xy * py + xz * pz);
    out[1] = yx; out[5] = yy; out[9] = yz; out[13] = -(yx * px + yy * py + yz * pz);
    out[2] = zx; out[6] = zy; out[10] = zz; out[14] = -(zx * px + zy * py + zz * pz);
    out[3] = 0; out[7] = 0; out[11] = 0; out[15] = 1;
    return out;
  };
  const hull = (pts) => {
    pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [];
    for (const p of pts) {
      while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
      lo.push(p);
    }
    const up = [];
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
      up.push(p);
    }
    up.pop();
    lo.pop();
    return lo.concat(up);
  };
  /* convex polygons: > 0 their gap in px, <= 0 they overlap (minus the SAT penetration depth) */
  const segDist = (p, a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  };
  const gap = (A, B) => {
    let pen = Infinity;
    for (const P of [A, B])
      for (let i = 0; i < P.length; i++) {
        const a = P[i];
        const b = P[(i + 1) % P.length];
        const nx = b[1] - a[1];
        const ny = a[0] - b[0];
        const nl = Math.hypot(nx, ny) || 1e-9;
        let a0 = Infinity;
        let a1 = -Infinity;
        let b0 = Infinity;
        let b1 = -Infinity;
        for (const q of A) {
          const d = (q[0] * nx + q[1] * ny) / nl;
          a0 = Math.min(a0, d);
          a1 = Math.max(a1, d);
        }
        for (const q of B) {
          const d = (q[0] * nx + q[1] * ny) / nl;
          b0 = Math.min(b0, d);
          b1 = Math.max(b1, d);
        }
        const o = Math.min(a1, b1) - Math.max(a0, b0);
        if (o <= 0) {
          /* separated: the true distance between the polygons */
          let d = Infinity;
          for (const q of A) for (let j = 0; j < B.length; j++) d = Math.min(d, segDist(q, B[j], B[(j + 1) % B.length]));
          for (const q of B) for (let j = 0; j < A.length; j++) d = Math.min(d, segDist(q, A[j], A[(j + 1) % A.length]));
          return d;
        }
        pen = Math.min(pen, o);
      }
    return -pen;
  };

  /* two objects: the least gap between any part of one and any part of the other */
  const objGap = (A, B) => {
    let best = Infinity;
    for (const a of A)
      for (const b of B) {
        const bx = Math.max(a.x0 - b.x1, b.x0 - a.x1, 0);
        const by = Math.max(a.y0 - b.y1, b.y0 - a.y1, 0);
        if (Math.hypot(bx, by) >= best) continue;
        best = Math.min(best, gap(a.h, b.h));
      }
    return best;
  };

  /* the camera's own pose, recovered: its target is on the y axis, where it looks */
  const pose = () => {
    const e = cam.matrixWorld.elements;
    const px = e[12];
    const py = e[13];
    const pz = e[14];
    const fx = -e[8];
    const fy = -e[9];
    const fz = -e[10];
    const t = Math.abs(fz) > Math.abs(fx) ? -pz / fz : -px / fx;
    const ty = py + fy * t;
    const d = Math.hypot(px, py - ty, pz);
    return { ty, d, az: Math.atan2(px, pz), el: Math.asin((py - ty) / d) };
  };

  const V = new Float64Array(16);
  const PV = new Float64Array(16);
  const PVM = new Float64Array(16);
  const stats = {};
  let k = 0;
  /* a sample counts once however many camera variants are under the limit */
  const note = (key, g, limit, t, where) => {
    const s = (stats[key] ||= { min: Infinity, at: null, under: 0, last: -1, limit });
    if (g < s.min) {
      s.min = g;
      s.at = { t, ...where };
    }
    if (g < limit && s.last !== k) {
      s.under++;
      s.last = k;
    }
  };
  const bounds = { L: Infinity, R: Infinity, T: Infinity, B: Infinity };
  const kept = []; // the hulls at the sample indices in `keep`, for a picture of the layout
  let clock = 0;
  for (k = 0; k < samples; k++) {
    if (k) window.__bfStep(frames, dtMs, false); // posed, not drawn: render() still updates every matrix
    clock = (k * frames * dtMs) / 1000;
    const base = pose();
    for (let v = 0; v < variants.length; v++) {
      const az = base.az + variants[v].daz;
      const el = base.el + variants[v].del;
      lookAt(base.d * Math.cos(el) * Math.sin(az), base.ty + base.d * Math.sin(el), base.d * Math.cos(el) * Math.cos(az), 0, base.ty, 0, V);
      mul(cam.projectionMatrix.elements, V, PV);
      const hulls = []; // per object: its parts' hulls, each with its box
      const depth = [];
      for (const o of objs) {
        const ph = [];
        for (const part of o.parts) {
          mul(PV, part.matrixWorld.elements, PVM);
          const p = part.geometry.attributes.position.array;
          const pts = [];
          for (let i = 0; i < p.length; i += 3) {
            const x = p[i];
            const y = p[i + 1];
            const z = p[i + 2];
            const w = PVM[3] * x + PVM[7] * y + PVM[11] * z + PVM[15];
            pts.push([(((PVM[0] * x + PVM[4] * y + PVM[8] * z + PVM[12]) / w + 1) / 2) * W, ((1 - (PVM[1] * x + PVM[5] * y + PVM[9] * z + PVM[13]) / w) / 2) * H]);
          }
          const h = hull(pts);
          let x0 = Infinity;
          let x1 = -Infinity;
          let y0 = Infinity;
          let y1 = -Infinity;
          for (const q of h) {
            x0 = Math.min(x0, q[0]);
            x1 = Math.max(x1, q[0]);
            y0 = Math.min(y0, q[1]);
            y1 = Math.max(y1, q[1]);
          }
          ph.push({ h, x0, x1, y0, y1 });
          bounds.L = Math.min(bounds.L, x0);
          bounds.R = Math.min(bounds.R, W - x1);
          bounds.T = Math.min(bounds.T, y0);
          bounds.B = Math.min(bounds.B, H - y1);
        }
        hulls.push(ph);
        /* its view depth, and the core's axis at its height: in front of the core or behind it */
        const e = o.root.matrixWorld.elements;
        const vz = V[2] * e[12] + V[6] * e[13] + V[10] * e[14] + V[14];
        const az0 = V[6] * e[13] + V[14];
        depth.push(vz - az0); // > 0: nearer the camera than the core's axis
      }
      if (v === 0 && keep.includes(k)) kept.push({ t: +clock.toFixed(2), hulls: hulls.map((ph) => ph.map((p) => p.h.map((q) => [+q[0].toFixed(1), +q[1].toFixed(1)]))) });
      const where = { variant: v };
      for (let i = 1; i < objs.length; i++) {
        const g = objGap(hulls[i], hulls[0]);
        const front = depth[i] > 0;
        note(`${objs[i].id} / core${front ? " (in front)" : " (behind)"}`, g, front ? limits.core : -Infinity, clock, where);
        for (let j = i + 1; j < objs.length; j++) {
          const lab = objs[i].lab || objs[j].lab;
          note(`${objs[i].id} / ${objs[j].id}`, objGap(hulls[i], hulls[j]), lab ? limits.lab : limits.module, clock, where);
        }
      }
    }
  }
  const sampleS = (frames * dtMs) / 1000;
  const out = {};
  for (const [k, s] of Object.entries(stats)) out[k] = { min: +s.min.toFixed(1), limit: s.limit, underS: +(s.under * sampleS).toFixed(1), at: s.at };
  return { pairs: out, bounds: { L: +bounds.L.toFixed(1), R: +bounds.R.toFixed(1), T: +bounds.T.toFixed(1), B: +bounds.B.toFixed(1) }, seconds: +clock.toFixed(1), objects: objs.map((o) => o.name), kept };
}
