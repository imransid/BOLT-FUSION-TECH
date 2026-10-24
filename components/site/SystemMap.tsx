"use client";

import { useState, useSyncExternalStore } from "react";

import type { MapFlow, MapLink, MapNode, SystemMap as SystemMapData } from "@/content/engineering-schema";

const subscribeNothing = () => () => {};

type Active = { kind: "node" | "flow"; id: string } | null;

/** The compact map on the homepage (2026-10-24): what each part links to —
 *  the published work behind its capabilities, and each capability "in
 *  depth" — computed on the server from content/engineering.ts. */
export type MapCompact = {
  related: Record<string, { work: { id: string; name: string; href: string }[]; depth: { label: string; href: string }[] }>;
  more: { label: string; href: string };
};

const same = (a: Active, b: Active) => Boolean(a && b && a.kind === b.kind && a.id === b.id);

/**
 * The system map (SPEC §5): "Different technologies. One engineering
 * discipline." Server-rendered, and complete without JavaScript.
 *
 *  · The SVG is the picture, for a pointer: hovering a part lights its links.
 *    It is aria-hidden — the lists beside it are the same content as text.
 *  · The lists (inside `data-system-map`) name every part, every connection
 *    and the three worked flows. They are the no-JS view and what a crawler or
 *    a screen reader reads.
 *  · With JavaScript each part and flow in the list is a button: focus or hover
 *    lights it on the map, and the readout (a polite live region) says what its
 *    connections do. A click pins it. Without JavaScript they are plain text —
 *    never a button that does nothing.
 *
 * A concept (robotics, and the flow through it) is drawn dashed and labelled
 * "Concept". The cyan runs along a lit link only under no-preference motion,
 * and never along a concept's: lit, a concept link turns a lighter steel and
 * stays dashed — nothing flows in a system that has not shipped, the rule the
 * Lab drawings keep (CLAUDE.md, the Signal; until 2026-10-24 a lit robotics
 * link took the cyan pulse like any other).
 *
 * `compact` (the homepage, 2026-10-24): the map, its readout and the parts —
 * the connections and the worked flows stay on /capabilities, one link away.
 * A selection holds until another part is chosen (the readout carries links,
 * which a hover that cleared it would pull away from the pointer), a tap on
 * the drawing selects too, and the readout adds the part's related work and
 * its capabilities in depth.
 */
export default function SystemMap({ map, compact }: { map: SystemMapData; compact?: MapCompact }) {
  const [hover, setHover] = useState<Active>(null);
  const [focus, setFocus] = useState<Active>(null);
  const [pinned, setPinned] = useState<Active>(null);
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  const active = compact ? (pinned ?? focus ?? hover) : (hover ?? focus ?? pinned);
  const nodeById = new Map(map.nodes.map((n) => [n.id, n]));
  const linksOf = (id: string) => map.links.filter((l) => l.from === id || l.to === id);
  const other = (l: MapLink, id: string) => nodeById.get(l.from === id ? l.to : l.from) as MapNode;

  const litLinks = new Set<string>();
  const litNodes = new Set<string>();
  let flow: MapFlow | undefined;
  if (active?.kind === "node") {
    litNodes.add(active.id);
    for (const l of linksOf(active.id)) {
      litLinks.add(l.id);
      litNodes.add(l.from);
      litNodes.add(l.to);
    }
  } else if (active?.kind === "flow") {
    flow = map.flows.find((f) => f.id === active.id);
    for (const id of flow?.links ?? []) {
      const l = map.links.find((x) => x.id === id);
      if (!l) continue;
      litLinks.add(l.id);
      litNodes.add(l.from);
      litNodes.add(l.to);
    }
    for (const s of flow?.steps ?? []) litNodes.add(s.node);
  }
  const dim = active !== null;

  const node = active?.kind === "node" ? nodeById.get(active.id) : undefined;

  const hoverNode = (id: string | null) => setHover(id ? { kind: "node", id } : null);
  const pinNode = (id: string) => {
    const me: Active = { kind: "node", id };
    setPinned(same(pinned, me) ? null : me);
  };
  const rel = node && compact ? compact.related[node.id] : undefined;

  return (
    <div className={`bf-map${compact ? " bf-map--compact" : ""}`} data-system-map>
      <div className="bf-map__canvas">
        <svg className="bf-map__svg" viewBox="0 0 1000 560" aria-hidden="true" focusable="false">
          {map.links.map((l) => {
            const a = nodeById.get(l.from) as MapNode;
            const b = nodeById.get(l.to) as MapNode;
            const lit = litLinks.has(l.id);
            return (
              <g key={l.id} className={`bf-map__link${l.concept ? " is-concept" : ""}${lit ? " is-lit" : ""}${dim && !lit ? " is-dim" : ""}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="bf-map__wire" />
                {lit && !l.concept ? <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="bf-map__pulse" /> : null}
              </g>
            );
          })}
          {map.nodes.map((n) => {
            const lit = litNodes.has(n.id);
            const below = n.y < 280 ? n.y - 44 : n.y + 50;
            return (
              <g
                key={n.id}
                className={`bf-map__node${n.concept ? " is-concept" : ""}${lit ? " is-lit" : ""}${dim && !lit ? " is-dim" : ""}`}
                onMouseEnter={() => hoverNode(n.id)}
                onMouseLeave={() => hoverNode(null)}
                onClick={compact ? () => pinNode(n.id) : undefined}
              >
                <circle cx={n.x} cy={n.y} r={44} className="bf-map__hit" />
                <circle cx={n.x} cy={n.y} r={24} className="bf-map__ring" />
                <circle cx={n.x} cy={n.y} r={7} className="bf-map__core" />
                <text x={n.x} y={below} textAnchor="middle" dominantBaseline="central" className="bf-map__label">
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="bf-map__readout" aria-live="polite">
          {!mounted ? (
            <p>{compact ? "Every part is listed beside the map, with what it does." : "Every part, connection and worked flow is listed beside the map."}</p>
          ) : node ? (
            <>
              <p className="bf-map__readout-title">
                {node.label}
                {node.concept ? <span className="bf-concept">Concept</span> : null}
              </p>
              <p>{node.short}</p>
              <ul>
                {linksOf(node.id).map((l) => (
                  <li key={l.id}>
                    <span className="bf-map__pair">{other(l, node.id).label}:</span> {l.does}
                  </li>
                ))}
              </ul>
              {rel ? (
                <div className="bf-map__rel">
                  <p className="bf-map__rel-label">{rel.work.length ? "Work behind it" : "Work behind it: nothing delivered yet"}</p>
                  {rel.work.length ? (
                    <ul className="bf-map__rel-list">
                      {rel.work.map((w) => (
                        <li key={w.id}>
                          <a href={w.href}>{w.name}</a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <ul className="bf-map__rel-list bf-map__rel-depth">
                    {rel.depth.map((d) => (
                      <li key={d.href}>
                        <a href={d.href}>{d.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : flow ? (
            <>
              <p className="bf-map__readout-title">
                {flow.title}
                {flow.concept ? <span className="bf-concept">Concept</span> : null}
              </p>
              <ol>
                {flow.steps.map((s) => (
                  <li key={s.text}>{s.text}</li>
                ))}
              </ol>
            </>
          ) : compact ? (
            <p>Select a part of the map, or one in the list, to see what it connects to.</p>
          ) : (
            <p>Hover a part of the map, or focus one in the list, to see what its connections do.</p>
          )}
        </div>
      </div>

      <div className="bf-map__lists">
        <div className="bf-map__group">
          {compact ? <h4 className="bf-h4">Parts</h4> : <h3 className="bf-h4">Parts</h3>}
          <ul className="bf-map__nodes">
            {map.nodes.map((n) => {
              const me: Active = { kind: "node", id: n.id };
              return (
                <li key={n.id} data-node={n.id} className={litNodes.has(n.id) ? "is-lit" : undefined}>
                  {mounted ? (
                    <button
                      type="button"
                      className="bf-map__btn"
                      aria-pressed={same(pinned, me)}
                      aria-describedby={`map-node-${n.id}`}
                      onFocus={() => setFocus(me)}
                      onBlur={() => setFocus(null)}
                      onMouseEnter={() => setHover(me)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => setPinned(same(pinned, me) ? null : me)}
                    >
                      {n.label}
                    </button>
                  ) : (
                    <span className="bf-map__btn">{n.label}</span>
                  )}
                  {n.concept ? <span className="bf-concept">Concept</span> : null}
                  <span id={`map-node-${n.id}`} className="bf-map__short">
                    {n.short}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {compact ? (
          <p className="bf-map__more">
            <a href={compact.more.href}>{compact.more.label}</a>
          </p>
        ) : null}

        {compact ? null : (
          <>
            <div className="bf-map__group">
              <h3 className="bf-h4">Connections</h3>
              <ul className="bf-map__conns">
                {map.links.map((l) => (
                  <li key={l.id} data-link={l.id} className={litLinks.has(l.id) ? "is-lit" : undefined}>
                    <span className="bf-map__pair">
                      {nodeById.get(l.from)?.label} and {nodeById.get(l.to)?.label}:
                    </span>{" "}
                    {l.does}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bf-map__group">
              <h3 className="bf-h4">Worked flows</h3>
              <ol className="bf-map__flows">
                {map.flows.map((f) => {
                  const me: Active = { kind: "flow", id: f.id };
                  return (
                    <li key={f.id} data-flow={f.id}>
                      {mounted ? (
                        <button
                          type="button"
                          className="bf-map__btn"
                          aria-pressed={same(pinned, me)}
                          onFocus={() => setFocus(me)}
                          onBlur={() => setFocus(null)}
                          onMouseEnter={() => setHover(me)}
                          onMouseLeave={() => setHover(null)}
                          onClick={() => setPinned(same(pinned, me) ? null : me)}
                        >
                          {f.title}
                        </button>
                      ) : (
                        <span className="bf-map__btn">{f.title}</span>
                      )}
                      {f.concept ? <span className="bf-concept">Concept</span> : null}
                      <ol className="bf-map__steps">
                        {f.steps.map((s) => (
                          <li key={s.text}>{s.text}</li>
                        ))}
                      </ol>
                    </li>
                  );
                })}
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
