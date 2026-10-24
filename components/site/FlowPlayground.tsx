"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

import FigureText from "@/components/FigureText";
import type { Lane, Playground } from "@/content/architecture";

const subscribeNothing = () => () => {};

/* One step of a request every STEP_MS: the longest walk (the AI lane, six
   steps) is drawn in 2.25s, inside the five seconds after which anything that
   moves needs a pause control. */
const STEP_MS = 450;

type NodeId = Playground["nodes"][number]["id"];

/* The drawing, in viewBox units (1040 x 290 from y = 24). Its words are the
   content's; only the geometry lives here. Each edge is one path, so its
   overlay traces with a single dash. */
const W = 160;
const H = 60;
const AT: Record<NodeId, { x: number; y: number }> = {
  request: { x: 90, y: 165 },
  router: { x: 295, y: 165 },
  cache: { x: 500, y: 165 },
  keyword: { x: 720, y: 165 },
  response: { x: 950, y: 165 },
  intent: { x: 660, y: 275 },
  retrieval: { x: 850, y: 275 },
};
const right = (n: NodeId) => AT[n].x + W / 2;
const left = (n: NodeId) => AT[n].x - W / 2;
const EDGE_PATHS: Record<string, string> = {
  "request>router": `M${right("request")} 165 H${left("router")}`,
  "router>cache": `M${right("router")} 165 H${left("cache")}`,
  "cache>keyword": `M${right("cache")} 165 H${left("keyword")}`,
  "keyword>response": `M${right("keyword")} 165 H${left("response")}`,
  "cache>response": `M500 ${165 - H / 2} V52 H950 V${165 - H / 2}`,
  "cache>intent": `M500 ${165 + H / 2} V275 H${left("intent")}`,
  "intent>retrieval": `M${right("intent")} 275 H${left("retrieval")}`,
  "retrieval>response": `M${right("retrieval")} 275 H950 V${165 + H / 2}`,
};

/* Each edge's length in viewBox units — the paths are straight runs (M, H,
   V) — so the request's pulse is the same short streak on every edge,
   whatever its length, and crosses it in one step. */
const EDGE_LEN: Record<string, number> = Object.fromEntries(
  Object.entries(EDGE_PATHS).map(([key, d]) => {
    let x = 0;
    let y = 0;
    let len = 0;
    for (const m of d.matchAll(/([MHV])([-\d.]+)(?: ([-\d.]+))?/g)) {
      const v = Number(m[2]);
      if (m[1] === "M") [x, y] = [v, Number(m[3])];
      else if (m[1] === "H") [len, x] = [len + Math.abs(v - x), v];
      else [len, y] = [len + Math.abs(v - y), v];
    }
    return [key, len];
  }),
);

function reduced() {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.getAttribute("data-motion") === "paused"
  );
}

/**
 * The engineering flow playground (owner's brief, 2026-10-24, §4) — the
 * restaurant search's three lanes, each with one sample request walked
 * through the router, on a graphite screen. Server-rendered and complete
 * without JavaScript: the diagram is drawn whole (every edge steel), and each
 * lane lists its request's steps as text. The diagram is the picture (it is
 * aria-hidden, and shown from 1025px); the steps are the content.
 *
 * With JavaScript each lane gets "Follow this request" (kept invisible, with
 * its space, until hydration, so it never shifts the page): pressing it traces
 * that request's path on the diagram in brand blue, an edge per step, while
 * the lane's own steps light in turn — below 1025px the steps are the flow,
 * drawn down the lane. The request is the data, so it is cyan: a pulse runs
 * along each edge as the request crosses it, its current stop is cyan, and
 * the response rings once when it arrives; the other parts dim. It settles
 * lit and stays until another request is followed. Under reduced motion, or
 * with motion paused, it lands on the end at once and nothing runs. Text
 * never moves: steps change colour and marker only.
 *
 * Every lane's words — its name, premise, detail and cost, the figures with
 * their chips (FigureText) — are the lanes' (content/architecture.ts), in
 * the served HTML whatever the visitor presses (verify-site check 30).
 */
export default function FlowPlayground({
  data,
  lanes,
  edges,
  of,
  lanesTitle,
  children,
}: {
  data: Playground;
  lanes: readonly Lane[];
  edges: readonly (readonly [string, string])[];
  of: string;
  lanesTitle: string;
  /** the playground's own calls to action, rendered by the server (Stories) */
  children?: ReactNode;
}) {
  /* an id an SVG url(#…) and aria-controls can both use */
  const uid = `pg${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [active, setActive] = useState<Lane["id"] | null>(null);
  const [reached, setReached] = useState(-1);
  const [running, setRunning] = useState(false);
  /* one per press: the packets and the arrival ping restart on every follow */
  const [runId, setRunId] = useState(0);
  const timers = useRef<number[]>([]);
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const scenario = data.scenarios.find((s) => s.lane === active);
  const path = scenario ? scenario.steps.map((s) => s.node) : [];
  const pathEdges = path.slice(1).map((n, i) => `${path[i]}>${n}`);
  const nodeLabel = new Map(data.nodes.map((n) => [n.id, n.label]));

  function follow(lane: Lane["id"]) {
    const s = data.scenarios.find((x) => x.lane === lane);
    if (!s) return;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    const last = s.steps.length - 1;
    setActive(lane);
    setRunId((r) => r + 1);
    if (reduced()) {
      setReached(last);
      setRunning(false);
      return;
    }
    setReached(0);
    setRunning(true);
    for (let i = 1; i <= last; i++)
      timers.current.push(
        window.setTimeout(() => {
          setReached(i);
          if (i === last) setRunning(false);
        }, i * STEP_MS),
      );
  }

  /* "the keyword lane", "the AI lane": lower case mid-sentence, but an
     acronym keeps its capitals */
  const laneName = (id: Lane["id"]) => {
    const name = lanes.find((l) => l.id === id)?.name ?? id;
    return /^[A-Z]{2,}\b/.test(name) ? name : name.charAt(0).toLowerCase() + name.slice(1);
  };
  /* the hit and miss labels belong to the edges leaving the cache */
  const tagDim = (key: string) => (active && !pathEdges.includes(key) ? " is-dim" : "");
  const status =
    mounted && scenario ? `Following “${scenario.query}” through the ${laneName(scenario.lane)}: ${path.map((n) => nodeLabel.get(n)).join(", then ")}.` : data.hint;

  return (
    <div className="bf-flowpg" data-flow-playground data-bf-reveal>
      <div className="bf-flowpg__head">
        <p className="bf-flowpg__of">{of}</p>
        <h3 className="bf-flowpg__title">{data.title}</h3>
        <p className="bf-flowpg__lead">{data.lead}</p>
      </div>

      <div className="bf-flowpg__canvas" id={`${uid}-diagram`}>
        <svg className="bf-flowpg__svg" viewBox="0 24 1040 290" aria-hidden="true" focusable="false">
          <defs>
            <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 1 L9 5 L0 9" className="bf-flowpg__head-mark" />
            </marker>
          </defs>
          {edges.map(([a, b]) => {
            const key = `${a}>${b}`;
            const d = EDGE_PATHS[key];
            if (!d) throw new Error(`FlowPlayground: no geometry for the edge ${key}`);
            const k = pathEdges.indexOf(key);
            const on = k >= 0 && reached >= k + 1;
            return (
              <g key={key} data-edge={key} className={`bf-flowpg__edge${k >= 0 ? " is-path" : ""}${active && k < 0 ? " is-dim" : ""}`}>
                <path d={d} className="bf-flowpg__wire" markerEnd={`url(#${uid}-arrow)`} />
                {active ? <path d={d} pathLength={1} className={`bf-flowpg__trace${on ? " is-on" : ""}`} /> : null}
                {/* the request itself, crossing this edge: a cyan pulse that
                    runs once along it while the trace draws (CSS; none under
                    reduced motion, where the path lands at once) */}
                {k >= 0 && reached === k + 1 ? <path key={`${runId}-${k}`} d={d} className="bf-flowpg__packet" style={{ "--len": EDGE_LEN[key] } as CSSProperties} /> : null}
              </g>
            );
          })}
          <text x="520" y="44" className={`bf-flowpg__tag${tagDim("cache>response")}`}>
            hit
          </text>
          <text x="548" y="155" className={`bf-flowpg__tag${tagDim("cache>keyword")}`}>
            miss
          </text>
          <text x="510" y="245" className={`bf-flowpg__tag${tagDim("cache>intent")}`}>
            miss
          </text>
          {data.nodes.map((n) => {
            const i = path.indexOf(n.id);
            const lit = i >= 0 && reached >= i;
            const here = lit && running && reached === i;
            const { x, y } = AT[n.id];
            return (
              <g key={n.id} data-node={n.id} className={`bf-flowpg__node${lit ? " is-lit" : ""}${here ? " is-here" : ""}${active && i < 0 ? " is-dim" : ""}`}>
                <rect x={x - W / 2} y={y - H / 2} width={W} height={H} rx={10} className="bf-flowpg__box" />
                {/* the answer arrives: one ring, out and gone */}
                {n.id === "response" && lit ? <rect key={runId} x={x - W / 2} y={y - H / 2} width={W} height={H} rx={10} className="bf-flowpg__ping" /> : null}
                <text x={x} y={y - 8} textAnchor="middle" className="bf-flowpg__label">
                  {n.label}
                </text>
                <text x={x} y={y + 15} textAnchor="middle" className="bf-flowpg__sub">
                  {n.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="bf-flowpg__status" aria-live="polite">
        {status}
      </p>

      <h4 className="bf-flowpg__lanes-title">{lanesTitle}</h4>
      <ul className="bf-flowpg__lanes">
        {lanes.map((lane) => {
          const s = data.scenarios.find((x) => x.lane === lane.id);
          const isActive = active === lane.id;
          return (
            <li key={lane.id} className={`bf-lane bf-flowpg__lane${isActive ? " is-active" : ""}`} data-tone={lane.tone} data-lane={lane.id}>
              <p className="bf-lane__head">
                <span className="bf-lane__name">{lane.name}</span> <span className="bf-lane__premise">— {lane.premise}</span>
              </p>
              <p className="bf-lane__detail">
                <FigureText text={lane.detail} />
              </p>
              <p className="bf-lane__cost">
                <FigureText text={lane.cost} />
              </p>
              {s ? (
                <div className="bf-flowpg__request">
                  <p className="bf-flowpg__ask">{s.label}</p>
                  <p className="bf-flowpg__query">
                    <span className="bf-flowpg__qlabel">{data.queryLabel}:</span> “{s.query}”
                  </p>
                  <button
                    type="button"
                    className="bf-flowpg__go"
                    data-ready={mounted ? "" : undefined}
                    aria-pressed={isActive}
                    aria-controls={`${uid}-diagram ${uid}-${lane.id}-steps`}
                    onClick={() => follow(lane.id)}
                  >
                    {isActive && !running ? "Follow it again" : "Follow this request"}
                  </button>
                  <ol className="bf-flowpg__steps" id={`${uid}-${lane.id}-steps`}>
                    {s.steps.map((step, i) => {
                      const lit = isActive && reached >= i;
                      const here = lit && running && reached === i;
                      return (
                        <li key={step.node} data-step-node={step.node} className={`bf-flowpg__step${lit ? " is-lit" : ""}${here ? " is-here" : ""}`}>
                          <span className="bf-flowpg__stop">{nodeLabel.get(step.node)}</span> {step.text}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {children}
    </div>
  );
}
