import type { ReactNode } from "react";

import type { Capability, DiagramId } from "@/content/engineering-schema";

/**
 * Each capability's OWN diagram (SPEC §§3, 5) — six drawings, not one drawing
 * six times: a layered stack, a router in front of the model, a module ring, a
 * till at the centre of a hub, a machine loop, a release pipeline.
 *
 * Server-rendered inline SVG: `role="img"`, named by its <title> and described
 * by its <desc> (both from content/engineering.ts). Colours are the site's
 * tokens, set by class in app/site.css ("Diagrams"): nodes on the raised
 * surface with a steel outline, labels in the text colour, the brand blue for
 * the one element that decides (the router, the till, the core), and the cyan
 * ONLY on flow lines (`.dg-flow`). The flow runs along those paths only under
 * no-preference motion, three passes and then rest (components/site/SiteMotion).
 * A concept is drawn dashed, and carries NO flow: the Lab drawing (robotics)
 * has no `.dg-flow` and no cyan anywhere in its markup, on any profile —
 * nothing flows in a system that has not shipped (2026-09-29, the lead
 * designer under the owner's honesty rule; verify-site check 33).
 *
 * Every drawing is 480 x 360 units with labels at 15–17 units, so they stay
 * legible at a phone's width.
 */

const W = 480;
const H = 360;

function Svg({ id, capability, flow = true, children }: { id: DiagramId; capability: Capability; flow?: boolean; children: ReactNode }) {
  const t = `dg-${id}-title`;
  const d = `dg-${id}-desc`;
  return (
    <svg className={`bf-dg bf-dg--${id}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${t} ${d}`} xmlns="http://www.w3.org/2000/svg">
      <title id={t}>{capability.diagram.title}</title>
      <desc id={d}>{capability.diagram.description}</desc>
      <defs>
        <marker id={`dg-${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className="dg-arrowhead" />
        </marker>
        {flow ? (
          <marker id={`dg-${id}-flowhead`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="dg-flowhead" />
          </marker>
        ) : null}
      </defs>
      {children}
    </svg>
  );
}

/** A box with a centred label. */
function Box({
  x,
  y,
  w,
  h,
  label,
  variant,
  size = 16,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  variant?: "accent" | "concept";
  size?: number;
}) {
  return (
    <g className={`dg-node${variant ? ` dg-node--${variant}` : ""}`}>
      <rect x={x} y={y} width={w} height={h} rx={3} />
      <text x={x + w / 2} y={y + h / 2} className="dg-label" textAnchor="middle" dominantBaseline="central" fontSize={size}>
        {label}
      </text>
    </g>
  );
}

/** A connection and, over it, its flow: the same path drawn twice. */
function Wire({ d, id, flow = true, dashed = false, arrow = true }: { d: string; id: DiagramId; flow?: boolean; dashed?: boolean; arrow?: boolean }) {
  return (
    <>
      <path d={d} className={`dg-edge${dashed ? " dg-edge--dashed" : ""}`} markerEnd={arrow && !flow ? `url(#dg-${id}-arrow)` : undefined} />
      {flow ? <path d={d} className="dg-flow" markerEnd={arrow ? `url(#dg-${id}-flowhead)` : undefined} /> : null}
    </>
  );
}

/* 1 — Software: interface, API, services, data, with the request going down
   and the response coming back up. */
function LayeredStack({ c }: { c: Capability }) {
  const layers = [
    { label: "Interface", y: 40 },
    { label: "API", y: 116 },
    { label: "Services", y: 192 },
    { label: "Data", y: 268 },
  ];
  return (
    <Svg id="layered-stack" capability={c}>
      {layers.map((l) => (
        <g key={l.label} className="dg-node">
          <rect x={24} y={l.y} width={316} height={56} rx={3} />
          <text x={44} y={l.y + 28} className="dg-label" dominantBaseline="central" fontSize={17}>
            {l.label}
          </text>
          <path d={`M340 ${l.y + 28}H372`} className="dg-edge" />
        </g>
      ))}
      {/* each layer's own detail */}
      <g className="dg-detail">
        {[204, 246, 288].map((x) => (
          <rect key={x} x={x} y={57} width={34} height={22} rx={2} />
        ))}
        {[216, 240, 264, 288, 312].map((x) => (
          <circle key={x} cx={x} cy={144} r={5} />
        ))}
        {[204, 248, 292].map((x) => (
          <rect key={x} x={x} y={207} width={36} height={26} rx={4} />
        ))}
        {[222, 280].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={283} rx={20} ry={6} />
            <path d={`M${x - 20} 283v14a20 6 0 0 0 40 0v-14`} />
          </g>
        ))}
      </g>
      <Wire id="layered-stack" d="M384 40V318" />
      <Wire id="layered-stack" d="M440 318V40" />
      <text x={384} y={342} className="dg-small" textAnchor="middle" fontSize={14}>
        request
      </text>
      <text x={440} y={24} className="dg-small" textAnchor="middle" fontSize={14}>
        response
      </text>
    </Svg>
  );
}

/* 2 — AI: a request, a router, three lanes (keyword, model, cache), an action. */
function AiRouter({ c }: { c: Capability }) {
  const lanes = [
    { label: "Keyword", y: 52, variant: undefined },
    { label: "Model", y: 154, variant: "accent" as const },
    { label: "Cache", y: 256, variant: undefined },
  ];
  return (
    <Svg id="ai-router" capability={c}>
      <Box x={12} y={152} w={92} h={56} label="Request" />
      <Wire id="ai-router" d="M104 180H150" />
      <g className="dg-node dg-node--accent">
        <polygon points="194,138 236,180 194,222 152,180" />
        <text x={194} y={180} className="dg-label" textAnchor="middle" dominantBaseline="central" fontSize={15}>
          Router
        </text>
      </g>
      {lanes.map((l) => (
        <g key={l.label}>
          <Wire id="ai-router" d={`M236 180C258 180 252 ${l.y + 26} 280 ${l.y + 26}`} arrow={false} />
          <Box x={280} y={l.y} w={100} h={52} label={l.label} variant={l.variant} />
          <Wire id="ai-router" d={`M380 ${l.y + 26}C400 ${l.y + 26} 394 180 410 180`} arrow={false} />
        </g>
      ))}
      <Box x={410} y={152} w={62} h={56} label="Action" size={15} />
      <text x={330} y={336} className="dg-small" textAnchor="middle" fontSize={14}>
        classified before any paid inference
      </text>
    </Svg>
  );
}

/* 3 — ERP: nine modules on a ring around one shared data core. The ring is an
   ellipse, wider than tall, so the pills at the top and bottom never touch. */
function ModuleRing({ c }: { c: Capability }) {
  const cx = 240;
  const cy = 176;
  const rx = 160;
  const ry = 128;
  const modules = c.whatWeBuild.map((b) => b.label);
  const step = 360 / modules.length;
  return (
    <Svg id="module-ring" capability={c}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className="dg-ring" />
      {modules.map((label, i) => {
        const a = ((-90 + i * step) * Math.PI) / 180;
        const x = cx + rx * Math.cos(a);
        const y = cy + ry * Math.sin(a);
        const sx = cx + 56 * Math.cos(a);
        const sy = cy + 56 * Math.sin(a);
        const ex = cx + (rx - 20) * Math.cos(a);
        const ey = cy + (ry - 17) * Math.sin(a);
        const w = Math.round(label.length * 8.4 + 22);
        return (
          <g key={label}>
            <Wire id="module-ring" d={`M${sx.toFixed(1)} ${sy.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`} arrow={false} />
            <g className="dg-node">
              <rect x={x - w / 2} y={y - 15} width={w} height={30} rx={15} />
              <text x={x} y={y} className="dg-label" textAnchor="middle" dominantBaseline="central" fontSize={15}>
                {label}
              </text>
            </g>
          </g>
        );
      })}
      <g className="dg-node dg-node--accent">
        <circle cx={cx} cy={cy} r={54} />
        <text x={cx} y={cy - 9} className="dg-label" textAnchor="middle" dominantBaseline="central" fontSize={15}>
          Shared
        </text>
        <text x={cx} y={cy + 11} className="dg-label" textAnchor="middle" dominantBaseline="central" fontSize={15}>
          data core
        </text>
      </g>
    </Svg>
  );
}

/* 4 — POS: the till at the centre; stock, kitchen, receipts and reports
   around it; an offline queue under it that syncs when the network returns.
   Receipts, not payments: SPEC §8b.6 drops payments from what is built. */
function TillHub({ c }: { c: Capability }) {
  return (
    <Svg id="till-hub" capability={c}>
      <Box x={24} y={28} w={104} h={46} label="Stock" />
      <Box x={352} y={28} w={104} h={46} label="Kitchen" />
      <Box x={24} y={176} w={104} h={46} label="Reports" />
      <Box x={352} y={176} w={104} h={46} label="Receipts" />
      <Wire id="till-hub" d="M180 124H154V51H128" />
      <Wire id="till-hub" d="M300 124H326V51H352" />
      <Wire id="till-hub" d="M180 160H154V199H128" />
      <Wire id="till-hub" d="M300 160H326V199H352" />
      <Box x={180} y={110} w={120} h={64} label="Till" variant="accent" size={18} />
      <Wire id="till-hub" d="M240 174V284" dashed />
      <text x={252} y={240} className="dg-small" fontSize={14}>
        syncs on reconnect
      </text>
      <g className="dg-node">
        <rect x={150} y={284} width={180} height={48} rx={3} />
        <text x={166} y={308} className="dg-label" dominantBaseline="central" fontSize={15}>
          Offline queue
        </text>
      </g>
      <g className="dg-detail">
        {[278, 292, 306].map((x) => (
          <rect key={x} x={x} y={301} width={10} height={14} rx={1} />
        ))}
      </g>
    </Svg>
  );
}

/* 5 — Robotics, a CONCEPT: sensor, vision, decision, controller, machine, and
   the machine's effect back on what the sensor sees. Drawn dashed, in steel:
   every connection is a dashed steel edge with a steel arrowhead, and none
   carries a flow line — no cyan anywhere, on any profile (2026-09-29). Where
   the Signal runs it is sketched once in light steel, and never flows. It
   carries no caption of its own: wherever it is drawn, its figcaption says
   "Concept — not a shipped system" under it (the schema requires the caption
   on a Lab diagram), and "concept: not a shipped system" inside the drawing
   said it twice, in two styles, 58px apart (the design review, 2026-09-29). */
function MachineLoop({ c }: { c: Capability }) {
  return (
    <Svg id="machine-loop" capability={c} flow={false}>
      <Box x={20} y={60} w={116} h={52} label="Sensor" variant="concept" />
      <Box x={182} y={60} w={116} h={52} label="Vision" variant="concept" />
      <Box x={344} y={60} w={116} h={52} label="Decision" variant="concept" />
      <Box x={344} y={232} w={116} h={52} label="Controller" variant="concept" />
      <Box x={182} y={232} w={116} h={52} label="Machine" variant="concept" />
      <Wire id="machine-loop" d="M136 86H182" dashed flow={false} />
      <Wire id="machine-loop" d="M298 86H344" dashed flow={false} />
      <Wire id="machine-loop" d="M402 112V232" dashed flow={false} />
      <Wire id="machine-loop" d="M344 258H298" dashed flow={false} />
      <Wire id="machine-loop" d="M182 258H78V112" dashed flow={false} />
      <text x={90} y={190} className="dg-small" fontSize={14}>
        feedback
      </text>
    </Svg>
  );
}

/* 6 — Cloud: the release pipeline, commit to observe, and what observation
   finds feeding the next commit. */
function ReleasePipeline({ c }: { c: Capability }) {
  const stages = ["Commit", "Build", "Test", "Deploy", "Observe"];
  const top = 118;
  const h = 64;
  return (
    <Svg id="release-pipeline" capability={c}>
      <path d="M18 88H462" className="dg-edge" />
      {stages.map((label, i) => {
        const x = 16 + i * 90;
        const mid = top + h / 2;
        const points =
          i === 0
            ? `${x},${top} ${x + 72},${top} ${x + 88},${mid} ${x + 72},${top + h} ${x},${top + h}`
            : `${x},${top} ${x + 72},${top} ${x + 88},${mid} ${x + 72},${top + h} ${x},${top + h} ${x + 16},${mid}`;
        return (
          <g key={label}>
            <circle cx={x + 44} cy={88} r={5} className="dg-gate" />
            <g className={`dg-node${label === "Deploy" ? " dg-node--accent" : ""}`}>
              <polygon points={points} />
              <text x={x + (i === 0 ? 38 : 46)} y={mid} className="dg-label" textAnchor="middle" dominantBaseline="central" fontSize={15}>
                {label}
              </text>
            </g>
          </g>
        );
      })}
      <Wire id="release-pipeline" d="M18 212H462" />
      <Wire id="release-pipeline" d="M420 228C420 306 60 306 60 236" dashed flow={false} />
      <text x={240} y={328} className="dg-small" textAnchor="middle" fontSize={14}>
        what it finds feeds the next commit
      </text>
    </Svg>
  );
}

const DRAWINGS: Record<DiagramId, (p: { c: Capability }) => ReactNode> = {
  "layered-stack": LayeredStack,
  "ai-router": AiRouter,
  "module-ring": ModuleRing,
  "till-hub": TillHub,
  "machine-loop": MachineLoop,
  "release-pipeline": ReleasePipeline,
};

export default function CapabilityDiagram({ capability }: { capability: Capability }) {
  const Drawing = DRAWINGS[capability.diagram.id];
  return <Drawing c={capability} />;
}
