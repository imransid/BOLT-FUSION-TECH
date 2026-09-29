import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as ScrollTriggerStatic } from "gsap/ScrollTrigger";

/**
 * "Signal" — the site's motion system (owner, 2026-09-28; BRIEF §4; CLAUDE.md
 * "Motion, as built"). Three verbs: TRACE a connection in brand blue, let data
 * FLOW along it in cyan, then SETTLE — everything holds still: a diagram in the
 * state the server sent, and a hook LIT where the trace reached it (its
 * stations filled and its line brand blue, since 2026-09-29: settling back to
 * the server's hollow drawing made every payoff a 0.3s blink). The lit state
 * only adds to the server's drawing; nothing on screen is taken away. Imported only by ./MotionLoader, after its gate and its staged
 * waits; gsap and its plugins arrive as arguments, so this module imports
 * nothing from gsap but types (check 31: gsap is imported by the loader alone).
 *
 * What it animates, and nothing else:
 *  · every `[data-bf-flow]` diagram — a blue overlay CLONED from each
 *    `.dg-edge` (the originals are never touched: DrawSVG would overwrite
 *    their dash patterns), drawn in topology order, then handed to the CSS
 *    flow (`.bf-flowing`) for TWO passes. A concept drawing (`.dg-node--concept`,
 *    the Lab tier) is sketched in steel instead, and does not flow: nothing
 *    flows in a system that has not shipped. That "no flow" is the drawing's
 *    own, not this engine's: a concept drawing carries no flow lines and no
 *    cyan at all (components/site/diagrams.tsx, 2026-09-29), so it holds for a
 *    concept the engine never claimed (a reload in place, a deep link, a fast
 *    reader), wherever gsap never arrives, and on phones and touch screens;
 *  · every `[data-bf-trace="<name>"]` hook — its `svg.bf-trace` holds
 *    `.bf-trace__path` elements drawn complete in the server HTML; an overlay
 *    traces them in order, and each `[data-bf-trace-stop]` carries
 *    `data-bf-lit` from the moment the trace reaches it, and keeps it. The
 *    trace holds, then the host takes `data-bf-traced` — its own line turns
 *    brand blue (app/site.css) — and the overlay fades onto it. Any name
 *    works; `rail`, `pilot` and `cta` have their durations.
 *  A dashed source is traced dashed: its overlay is revealed through a mask
 *  that DrawSVG draws, since DrawSVG owns the dash pattern of what it draws.
 *
 * The rules it keeps (BRIEF §4.4–4.6):
 *  · nothing is created before its trigger, and only for a host whose trigger
 *    is still ahead when the engine starts; a host already reached stays as
 *    the server drew it (a diagram's CSS flow already ran);
 *  · nothing in the hero; no numbers, chips, tier meters or text move — only
 *    overlays that are added and removed, and the stops' lit state;
 *  · every sequence ends inside 5s; focus inside a host's section ends it, and
 *    so does the pause control (`html[data-motion="paused"]`, `bf:motion`); a
 *    sequence that would start in either state starts at its end — a hook lit,
 *    a diagram as the server drew it. When the gate stops holding, every hook
 *    goes back to the server's drawing, and is lit again if it holds again;
 *  · SVG strokes and opacity only: no pins, no layout, no scroll smoothing;
 *    the triggers re-measure when fonts finish loading and on a debounced
 *    ResizeObserver of `main#main` (the FAQ's <details>) — each on its own,
 *    never by a full refresh, which scrolls the page.
 * `<html data-bf-signal="live">` while it runs.
 */

type G = typeof Gsap;
type Timeline = ReturnType<G["timeline"]>;
type Tween = ReturnType<G["to"]>;
export type SignalDeps = {
  gsap: G;
  ScrollTrigger: typeof ScrollTriggerStatic;
  /** the loader's media gate — gsap.matchMedia reverts everything when it stops matching */
  gate: string;
  yieldTask: () => Promise<void>;
};

/* The tokens (BRIEF §4.3). */
const TRACE_S = 0.8; /* per edge, power2.inOut */
const STAGGER_S = 0.06; /* in topology order */
const STAGGER_MAX_S = 0.36; /* the ceiling: a stagger that outlasts reading is a queue */
const FADE_S = 0.3;
const FLOW_PASS_S = 1.6; /* the CSS flow's pass (app/site.css, bf-flow) */
const FLOW_PASSES = 2; /* after a trace; three without one (app/site.css) */
const LAB_S = 1.4; /* the Lab sketch, steel, no flow */
const LAB_DASH = "5 4"; /* the concept dash (app/site.css, .dg-node--concept) */
const HOOK_S: Record<string, number> = { rail: 1.2, pilot: 1.2, cta: 0.9 };
const HOOK_DEFAULT_S = 1.2;
const HOOK_HOLD_S = 0.4; /* a hook's trace holds this long once it has arrived… */
const HOOK_FADE_S = 0.6; /* …then its overlay fades onto the lit drawing */
/* where a sequence starts: a diagram once 35% of it is in view; a hook when it reaches 70% of the viewport's height */
const FLOW_AT = 0.35;
const HOOK_AT = 0.7;
const TOL = 6; /* user units: how near an edge's end must be to a node to join it */
const DWELL_MS = 150; /* in view this long before a sequence starts */

const SVG_NS = "http://www.w3.org/2000/svg";
const MARK = "data-bf-signal";
const LIT = "data-bf-lit"; /* a station the trace has reached */
const TRACED = "data-bf-traced"; /* a hook whose trace has run: its line is brand blue */

type Seq = { tl: Timeline; host: HTMLElement; scope: Element; settle: () => void; flowing: boolean };
/** what DrawSVG draws (`draw`), what fades (`overlay`), and everything to remove */
type Trace = { draw: SVGGeometryElement; overlay: SVGGeometryElement; made: Element[] };

/** A host's box as it would be in the flow — a sticky figure is measured where
 *  it sits in the document, not where it is stuck. Sticky and static take the
 *  same space, and the switch is undone in the same task, so nothing moves. */
function naturalRect(el: HTMLElement): DOMRect {
  if (getComputedStyle(el).position !== "sticky") return el.getBoundingClientRect();
  const prev = el.style.position;
  el.style.position = "static";
  const r = el.getBoundingClientRect();
  el.style.position = prev;
  return r;
}

const inView = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight && r.height > 0;
};

let uid = 0;

/** An overlay cloned over a stroke — the original stays as the server drew it.
 *  It goes just after its source (under a diagram's cyan flow, so nothing on
 *  screen is covered), or on `top` of the whole drawing (the Lab sketch). A
 *  dashed overlay (`dash`: the pattern to draw with — a dashed source's own,
 *  so the trace lands on its dashes) is revealed through a mask DrawSVG draws,
 *  since DrawSVG owns the dash pattern of whatever it draws. */
function traceOf(src: SVGGeometryElement, cls: string, dash: string | null, top = false): Trace {
  const o = src.cloneNode(false) as SVGGeometryElement;
  for (const a of ["id", "marker-start", "marker-mid", "marker-end", "style", "data-bf-trace-stop"]) o.removeAttribute(a);
  o.setAttribute("class", cls);
  o.setAttribute("aria-hidden", "true");
  if (dash) o.style.strokeDasharray = dash;
  /* a trace is drawn the way its source is: a hairline on the pixel grid
     (crispEdges, the rail's) is traced on it */
  const sr = getComputedStyle(src).shapeRendering;
  if (sr && sr !== "auto") o.style.shapeRendering = sr;
  const svg = src.ownerSVGElement!;
  if (top) {
    /* lifted to the drawing's root: carry the source's own transform along
       (identity in every diagram today) */
    const own = svg.getScreenCTM();
    const at = src.getScreenCTM();
    const t = own && at ? own.inverse().multiply(at) : null;
    const near = (a: number, b: number) => Math.abs(a - b) < 1e-3;
    if (t && !(near(t.a, 1) && near(t.b, 0) && near(t.c, 0) && near(t.d, 1) && near(t.e, 0) && near(t.f, 0)))
      o.setAttribute("transform", `matrix(${t.a} ${t.b} ${t.c} ${t.d} ${t.e} ${t.f})`);
    svg.append(o);
  } else src.after(o);
  if (!dash) return { draw: o, overlay: o, made: [o] };
  const box = src.getBBox();
  const m = document.createElementNS(SVG_NS, "mask");
  const id = `bf-signal-m${++uid}`;
  const at = { id, maskUnits: "userSpaceOnUse", x: box.x - 20, y: box.y - 20, width: box.width + 40, height: box.height + 40 };
  for (const [k, v] of Object.entries(at)) m.setAttribute(k, String(v));
  const p = src.cloneNode(false) as SVGGeometryElement;
  for (const a of ["id", "marker-start", "marker-mid", "marker-end", "style", "data-bf-trace-stop"]) p.removeAttribute(a);
  p.setAttribute("class", "bf-signal-mask");
  m.append(p);
  svg.append(m);
  o.setAttribute("mask", `url(#${id})`);
  return { draw: p, overlay: o, made: [o, m] };
}

/** How far motion of its own has carried an element from its place in the
 *  layout: the translations on it and on its ancestors up to `host` (a
 *  reveal's rise — the pilot's stations may be revealing while the trace
 *  starts). A transform that is not a pure translation is left alone. */
function drift(el: Element | null, host: Element): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (let n = el; n && n !== host; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.transform && cs.transform !== "none") {
      const m = new DOMMatrixReadOnly(cs.transform);
      if (m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1) {
        x += m.e;
        y += m.f;
      }
    }
    if (cs.translate && cs.translate !== "none") {
      const [tx = "0", ty = "0"] = cs.translate.split(" ");
      x += tx.endsWith("px") ? parseFloat(tx) : 0;
      y += ty.endsWith("px") ? parseFloat(ty) : 0;
    }
  }
  return { x, y };
}

/** A stroke's own dash pattern, or null when it is solid. */
const dashOf = (el: Element): string | null => {
  const d = getComputedStyle(el).strokeDasharray;
  return d && d !== "none" && d !== "0" && d !== "0px" ? d : null;
};

/** The edges of a diagram in topology order, each with the node shape it
 *  leaves: each edge joins the node its start touches to the node its end
 *  touches; nodes are levelled breadth-first from the sources (no incoming
 *  edge — or, in a loop, the first edge's start), and edges follow their start
 *  node's level, then the drawing's own order. An edge that starts at no node
 *  is level 0. */
function topologyOrder(svg: SVGSVGElement): { edge: SVGGeometryElement; from: SVGGeometryElement | null }[] {
  const edges = [...svg.querySelectorAll<SVGGeometryElement>(".dg-edge")];
  const shapes = [...svg.querySelectorAll<SVGGeometryElement>(".dg-node > rect, .dg-node > polygon, .dg-node > circle, .dg-node > ellipse")];
  const vb = svg.viewBox?.baseVal;
  const sr = svg.getBoundingClientRect();
  const scale = vb && vb.width ? sr.width / vb.width : 1;
  const tol = TOL * scale;
  const boxes = shapes.map((s) => s.getBoundingClientRect());
  const nodeAt = (x: number, y: number) => {
    let best = -1;
    let area = Infinity;
    boxes.forEach((b, i) => {
      if (x < b.left - tol || x > b.right + tol || y < b.top - tol || y > b.bottom + tol) return;
      if (b.width * b.height < area) {
        area = b.width * b.height;
        best = i;
      }
    });
    return best;
  };
  const ends = edges.map((e) => {
    const m = e.getScreenCTM();
    const len = e.getTotalLength();
    const pt = (l: number) => {
      const p = e.getPointAtLength(l);
      return m ? new DOMPoint(p.x, p.y).matrixTransform(m) : p;
    };
    const a = pt(0);
    const b = pt(len);
    return { from: nodeAt(a.x, a.y), to: nodeAt(b.x, b.y) };
  });
  const indeg = new Map<number, number>();
  for (const e of ends) if (e.from >= 0 && e.to >= 0 && e.to !== e.from) indeg.set(e.to, (indeg.get(e.to) || 0) + 1);
  const starts = [...new Set(ends.filter((e) => e.from >= 0).map((e) => e.from))];
  let sources = starts.filter((n) => !indeg.get(n));
  if (!sources.length && starts.length) sources = [starts[0]];
  const level = new Map<number, number>(sources.map((s) => [s, 0]));
  const queue = [...sources];
  while (queue.length) {
    const u = queue.shift()!;
    for (const e of ends)
      if (e.from === u && e.to >= 0 && !level.has(e.to)) {
        level.set(e.to, level.get(u)! + 1);
        queue.push(e.to);
      }
  }
  const deepest = Math.max(0, ...level.values());
  const lv = ends.map((e) => (e.from < 0 ? 0 : (level.get(e.from) ?? deepest + 1)));
  return edges
    .map((e, i) => ({ e, i, l: lv[i] }))
    .sort((a, b) => a.l - b.l || a.i - b.i)
    .map((x) => ({ edge: x.e, from: ends[x.i].from >= 0 ? shapes[ends[x.i].from] : null }));
}

/* ScrollTrigger runs a requestAnimationFrame loop of its own (_rafBugFix, a
   Firefox repaint workaround) for as long as it is ENABLED, whether or not a
   trigger is left: about 62 wake-ups a second on every page once gsap has
   arrived, and on after the engine stopped — a client-side navigation to
   /work, which has nothing to trace, kept 64-67 a second (the engineering
   review, 2026-09-29). The engine's stop disables it; the next start, on the
   next page with something to trace, enables it again. */
let asleep = false;

export function startSignal({ gsap, ScrollTrigger, gate, yieldTask }: SignalDeps): () => void {
  if (asleep) {
    ScrollTrigger.enable();
    asleep = false;
  }
  const root = document.documentElement;
  const running = new Set<Seq>();
  const played = new WeakSet<Element>();
  const paused = () => root.dataset.motion === "paused";
  /* The hooks that have settled, lit: every station and the line. Kept for
     the engine's life, so that when the gate stops holding they go back to
     the server's drawing and, when it holds again, are lit again (without a
     trace: they were read). */
  const lit = new Set<HTMLElement>();
  const lightHook = (host: HTMLElement) => {
    for (const s of host.querySelectorAll("[data-bf-trace-stop]")) s.setAttribute(LIT, "");
    host.setAttribute(TRACED, "");
    lit.add(host);
  };
  const unlightHook = (host: HTMLElement) => {
    for (const s of host.querySelectorAll("[data-bf-trace-stop]")) s.removeAttribute(LIT);
    host.removeAttribute(TRACED);
  };

  /* Ends a sequence where it would have ended: overlays gone, a hook lit, a
     flow the trace handed on stopped at rest. */
  const finish = (s: Seq) => {
    s.tl.kill();
    s.settle();
    if (s.flowing) s.host.classList.remove("bf-flowing");
  };
  const finishAll = () => [...running].forEach(finish);

  /* Two things ScrollTrigger does to the page itself, undone here.
     · It forgets the page's scroll position when the last trigger on it is
       killed, and a media change then refreshes it from the top: when the gate
       stopped holding (a window narrowed to 1000px), matchMedia's revert killed
       every trigger and the reader was thrown to scrollY 0 (measured 2883 → 0).
       One idle trigger for the engine's life keeps the position.
     · Each refresh measures from the top with smooth scrolling switched off,
       then writes `scroll-behavior: smooth` back INLINE on <html>, which would
       outlive the stylesheet's own guard (smooth only under no-preference
       motion) once reduced motion is asked for. The stylesheet governs again
       once each refresh is done. */
  const keep = ScrollTrigger.create({ start: 0, end: "max" });
  const unsmooth = () => requestAnimationFrame(() => root.style.removeProperty("scroll-behavior"));
  ScrollTrigger.addEventListener("refresh", unsmooth);

  const mm = gsap.matchMedia();
  mm.add(gate, (ctx) => {
    root.setAttribute(MARK, "live");
    let dead = false;
    const claims = new Set<HTMLElement>();
    /* the gate holds again: the hooks read before are lit again */
    lit.forEach(lightHook);

    const begin = (host: HTMLElement, scope: Element, build: (seq: Seq) => void, atEnd?: () => void) => {
      const focus = document.activeElement;
      const focused = focus && focus !== document.body && scope.contains(focus);
      if (paused() || focused) return atEnd?.(); /* starts at its end: a hook lit, a diagram the server's drawing */
      const seq: Seq = { tl: gsap.timeline({ paused: true }), host, scope, settle: () => {}, flowing: false };
      build(seq);
      const settle = seq.settle;
      seq.settle = () => {
        if (!running.delete(seq)) return;
        settle();
      };
      seq.tl.eventCallback("onComplete", () => seq.settle());
      running.add(seq);
      seq.tl.play();
    };

    /* a diagram: trace its edges, then hand them to the CSS flow — or, for a
       concept, sketch it */
    const playFlow = (host: HTMLElement) => {
      const svg = host.querySelector<SVGSVGElement>("svg");
      if (!svg) return;
      const lab = Boolean(svg.querySelector(".dg-node--concept"));
      begin(host, host.closest("section") ?? host, (seq) => {
        const order = topologyOrder(svg);
        if (!order.length) return;
        const tl = seq.tl;
        /* Lab: the pencil draws each concept box, then the edge leaving it,
           around the loop; a shipped system traces its edges */
        const strokes: SVGGeometryElement[] = [];
        if (lab) {
          const drawn = new Set<Element>();
          for (const { edge, from } of order) {
            if (from && !drawn.has(from)) {
              strokes.push(from);
              drawn.add(from);
            }
            strokes.push(edge);
          }
          for (const s of svg.querySelectorAll<SVGGeometryElement>(".dg-node--concept > rect")) if (!drawn.has(s)) strokes.push(s);
        } else strokes.push(...order.map((o) => o.edge));
        /* the Lab pencil keeps a dashed stroke's own dashes and sketches a
           solid one in the concept dash, so the whole loop reads as a concept */
        const traces = strokes.map((e) => (lab ? traceOf(e, "bf-signal-trace bf-signal-trace--lab", dashOf(e) ?? LAB_DASH, true) : traceOf(e, "bf-signal-trace", dashOf(e))));
        const clear = () => traces.forEach((t) => t.made.forEach((m) => m.remove()));
        seq.settle = clear;
        const overlays = traces.map((t) => t.overlay);
        if (!lab) {
          const each = traces.length > 1 ? Math.min(STAGGER_S, STAGGER_MAX_S / (traces.length - 1)) : 0;
          tl.fromTo(traces.map((t) => t.draw), { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: TRACE_S, ease: "power2.inOut", stagger: each });
          tl.to(overlays, { opacity: 0, duration: FADE_S, ease: "power1.out", onComplete: clear }, `-=${FADE_S - 0.1}`);
          tl.addLabel("flow", `-=${FADE_S}`);
          tl.add(() => {
            host.classList.add("bf-flowing");
            seq.flowing = true;
          }, "flow");
          /* the flow's own time: the sequence ends when its last pass does */
          tl.to({}, { duration: FLOW_PASS_S * FLOW_PASSES }, "flow");
          tl.add(() => void (seq.flowing = false));
          return;
        }
        /* Lab: one steel pencil around the loop, over the drawing and dashed
           like every concept drawing, 1.4s in all at one speed — and no flow:
           nothing flows in a system that has not shipped */
        const lens = strokes.map((e) => e.getTotalLength() || 1);
        const total = lens.reduce((a, b) => a + b, 0);
        traces.forEach((t, i) => tl.fromTo(t.draw, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: (LAB_S * lens[i]) / total, ease: "none" }));
        tl.to(overlays, { opacity: 0, duration: FADE_S, ease: "power1.out", onComplete: clear }, "+=0.1");
      });
    };

    /* a hook: trace its paths in order; light each stop as the trace reaches it */
    const playTrace = (host: HTMLElement) => {
      const svg = host.querySelector<SVGSVGElement>("svg.bf-trace");
      const paths = svg ? [...svg.querySelectorAll<SVGGeometryElement>(".bf-trace__path")] : [];
      if (!paths.length) return;
      const build = (seq: Seq) => {
        const tl = seq.tl;
        const traces = paths.map((p) => traceOf(p, "bf-signal-trace", dashOf(p)));
        const lens = paths.map((p) => p.getTotalLength() || 0);
        const total = lens.reduce((a, b) => a + b, 0) || 1;
        const stops = [...host.querySelectorAll<Element>("[data-bf-trace-stop]")];
        /* A stop is reached at the first point of the trace that touches its
           box — a station drawn on the line, or an HTML station the line runs
           through (the rail's stages, the pilot's <li>s); a stop the line only
           passes beside is reached at the point nearest its centre. Sampled on
           screen, every 2px of path, so a stretched viewBox measures what is
           drawn. A stop is measured where the layout puts it: a reveal still
           rising on it (and not on the drawing) is taken back out. */
        const lineDrift = drift(svg, host);
        const reach = stops.map((s) => {
          const d = drift(s, host);
          const r = s.getBoundingClientRect();
          const b = new DOMRect(r.x - (d.x - lineDrift.x), r.y - (d.y - lineDrift.y), r.width, r.height);
          const cx = (b.left + b.right) / 2;
          const cy = (b.top + b.bottom) / 2;
          let before = 0;
          let near = Infinity;
          let nearAt = Infinity;
          for (let i = 0; i < paths.length; i++) {
            const p = paths[i];
            const m = p.getScreenCTM();
            const r = p.getBoundingClientRect();
            const n = Math.min(2000, Math.max(2, Math.ceil(Math.hypot(r.width, r.height) / 2)));
            for (let k = 0; k <= n; k++) {
              const l = (lens[i] * k) / n;
              const q = p.getPointAtLength(l);
              const c = m ? new DOMPoint(q.x, q.y).matrixTransform(m) : q;
              if (c.x >= b.left - 2 && c.x <= b.right + 2 && c.y >= b.top - 2 && c.y <= b.bottom + 2) return before + l;
              const d = Math.hypot(c.x - cx, c.y - cy);
              if (d < near) {
                near = d;
                nearAt = before + l;
              }
            }
            before += lens[i];
          }
          return nearAt;
        });
        const segs: Tween[] = traces.map((t) => gsap.fromTo(t.draw, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 1, ease: "none", paused: true }));
        const reached = new Set<Element>();
        /* its end, wherever it is ended: the overlays gone, and the hook lit —
           every station, and the line */
        seq.settle = () => {
          segs.forEach((s) => s.kill());
          traces.forEach((t) => t.made.forEach((m) => m.remove()));
          lightHook(host);
        };
        const head = { d: 0 };
        tl.to(head, {
          d: total,
          duration: HOOK_S[host.dataset.bfTrace || ""] ?? HOOK_DEFAULT_S,
          ease: "power2.inOut",
          onUpdate: () => {
            let rest = head.d;
            segs.forEach((s, i) => {
              s.progress(Math.min(1, Math.max(0, rest / (lens[i] || 1))));
              rest -= lens[i];
            });
            stops.forEach((s, i) => {
              if (!reached.has(s) && reach[i] <= head.d + 0.5) {
                reached.add(s);
                s.setAttribute(LIT, "");
              }
            });
          },
        });
        /* it holds where it arrived; then the line under it turns brand blue
           and the overlay fades onto it — the stations stay lit */
        tl.add(() => host.setAttribute(TRACED, ""), `+=${HOOK_HOLD_S}`);
        tl.to(
          traces.map((t) => t.overlay),
          { opacity: 0, duration: HOOK_FADE_S, ease: "power1.out" },
          "<",
        );
      };
      begin(host, host.closest("section") ?? host, build, () => lightHook(host));
    };

    /* Arms one host: a trigger whose range — from its start to the host's
       bottom leaving the top of the viewport — is measured on every refresh.
       A host whose start has already been passed is left alone: a diagram
       keeps whatever the CSS flow did with it, a hook stays the finished
       drawing. The sequence plays once the host has been in view for DWELL_MS:
       a fly-past (a smooth-scrolled anchor, End) spends nothing, and the trace
       waits for the reader to come back. */
    const arm = (host: HTMLElement) => {
      if (played.has(host)) return;
      const flow = host.hasAttribute("data-bf-flow");
      if (flow && host.classList.contains("bf-flowing")) return;
      const max = () => ScrollTrigger.maxScroll(window) - 1;
      const at = () => {
        const r = naturalRect(host);
        const y = r.top + scrollY + (flow ? FLOW_AT * r.height - innerHeight : -HOOK_AT * innerHeight);
        return Math.max(0, Math.min(y, max()));
      };
      /* the range ends when the host has left the top of the viewport: a
         sticky figure (the capability diagrams at >=1025) stays in view, stuck,
         until its containing block's bottom carries it off — measured to that,
         or a reader who lands in the stuck stretch would look at a claimed
         diagram that neither traces nor flows */
      const until = () => {
        const sticky = getComputedStyle(host).position === "sticky" && host.parentElement;
        const bottom = sticky ? sticky.getBoundingClientRect().bottom : naturalRect(host).bottom;
        return Math.max(at() + 1, bottom + scrollY);
      };
      if (at() <= scrollY) return;
      /* one owner: SiteMotion's CSS flow skips a diagram claimed here */
      if (flow) {
        host.setAttribute("data-bf-motion", "gsap");
        claims.add(host);
      }
      let wait: ReturnType<typeof setTimeout> | undefined;
      ScrollTrigger.create({
        start: at,
        end: until,
        onToggle: (self) => {
          clearTimeout(wait);
          if (!self.isActive) return;
          wait = setTimeout(() => {
            if (dead || !self.isActive || !inView(host)) return;
            self.kill();
            played.add(host);
            claims.delete(host);
            ctx.add(() => (flow ? playFlow(host) : playTrace(host)));
          }, DWELL_MS);
        },
      });
    };

    /* one host per task, in page order; nothing in the hero */
    (async () => {
      const hosts = [...document.querySelectorAll<HTMLElement>("[data-bf-flow], [data-bf-trace]")].filter((h) => !h.closest("#hero"));
      for (const h of hosts) {
        await yieldTask();
        if (dead) return;
        ctx.add(() => arm(h));
      }
    })();

    return () => {
      dead = true;
      finishAll();
      /* armed and never played: back to the CSS */
      claims.forEach((h) => h.removeAttribute("data-bf-motion"));
      claims.clear();
      /* the gate no longer holds: the server's drawing, until it holds again */
      lit.forEach(unlightHook);
      root.removeAttribute(MARK);
    };
  });

  /* Layout that moves a trigger: faces swapping in, a <details> opening. Each
     trigger re-measures on its own, then they are checked against where the
     reader is. Never ScrollTrigger.refresh(): a full refresh scrolls the page
     to the top to measure and puts it back, which cancels a smooth scroll in
     flight — an anchor followed while main grew 40px left the reader at
     2473-4349 with #faq still 13-15k px below (17777 with gsap blocked, and
     with this). None of these triggers pins or scrubs, so re-reading each
     one's start and end is all a refresh would do. And none that nothing asked
     for: none for fonts that had finished before the engine started (they
     nearly always have — it starts after load), and none for the
     ResizeObserver's first report, which is the size the triggers were just
     measured at. */
  let t: ReturnType<typeof setTimeout> | undefined;
  const refresh = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      for (const st of ScrollTrigger.getAll()) st.refresh();
      ScrollTrigger.update();
    }, 150);
  };
  const fonts = document.fonts;
  if (fonts?.status === "loading") void fonts.ready.then(refresh);
  fonts?.addEventListener("loadingdone", refresh);
  let sized = false;
  const ro = new ResizeObserver(() => (sized ? refresh() : (sized = true)));
  const main = document.getElementById("main");
  if (main) ro.observe(main);

  /* focus ends a sequence; so does the pause control */
  const onFocus = (e: FocusEvent) => {
    const el = e.target instanceof Node ? e.target : null;
    for (const s of [...running]) if (el && s.scope.contains(el)) finish(s);
  };
  const onMotion = (e: Event) => {
    const p = (e as CustomEvent<{ paused?: boolean } | null>).detail?.paused;
    if (p ?? paused()) finishAll();
  };
  document.addEventListener("focusin", onFocus);
  window.addEventListener("bf:motion", onMotion);

  return () => {
    clearTimeout(t);
    ro.disconnect();
    fonts?.removeEventListener("loadingdone", refresh);
    document.removeEventListener("focusin", onFocus);
    window.removeEventListener("bf:motion", onMotion);
    mm.revert();
    ScrollTrigger.removeEventListener("refresh", unsmooth);
    keep.kill();
    root.style.removeProperty("scroll-behavior");
    /* nothing of ours is left: no loop either */
    ScrollTrigger.disable();
    asleep = true;
  };
}
