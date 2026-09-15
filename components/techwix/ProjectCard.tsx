import ScreenImage from "./ScreenImage";

import FigureText from "@/components/FigureText";
import type { Project } from "@/content/schema";

import { ArrowUpRightIcon } from "./icons";
import { Tags } from "./Tags";

/**
 * /work's cards — every project says who built it (CLAUDE.md, "Projects and
 * attribution", decided 2026-09-15).
 *
 * The attribution label sits directly above the project's name on every card,
 * the case-study rows included, in the same words for every card of a kind.
 * verify-site check 9 holds its own copy of these words and fails a card whose
 * label is missing, hidden, somewhere else, or not its kind's.
 *
 * Feature work (a project with `scope: "features"`, decided 2026-09-16) reads
 * "features built by Bolt Fusion for ‹client›": we built features inside the
 * client's app, not the app, so its label never says "built by Bolt Fusion".
 */
export function attribution(p: Project): string {
  switch (p.kind) {
    case "case-study":
      return `Case study: built by Bolt Fusion${p.client ? ` for ${p.client}` : ""}`;
    case "project":
      return p.scope === "features"
        ? `Delivered project: features built by Bolt Fusion for ${p.client}`
        : `Delivered project: built by Bolt Fusion${p.client ? ` for ${p.client}` : ""}`;
    case "in-house":
      return "In-house product: our own, not built for a client";
    case "track-record":
      return `Track record: built by our engineer at ${p.builtAt}, not by Bolt Fusion`;
  }
}

export function AttributionLabel({ p }: { p: Project }) {
  return (
    <p className="tw-attr" data-attribution>
      {attribution(p)}
    </p>
  );
}

const STATUS: Record<NonNullable<Project["status"]>, string> = { live: "Live", "in-production": "In production" };

/** What we built (or, on a track-record card, the engineer's role), the
 *  employer, the status and the dates. Brand blue for the status: teal and
 *  amber are the shipped/target chips' alone. */
export function ProjectFacts({ p }: { p: Project }) {
  return (
    <dl className="tw-facts">
      <div>
        <dt>{p.kind === "track-record" ? "Our engineer’s role" : "What we built"}</dt>
        <dd data-role>
          <FigureText text={p.role} />
        </dd>
      </div>
      {p.builtAt ? (
        <div>
          <dt>Built at</dt>
          <dd data-built-at>{p.builtAt}</dd>
        </div>
      ) : null}
      {p.status ? (
        <div>
          <dt>Status</dt>
          <dd data-project-status>
            <span className="tw-pill">{STATUS[p.status]}</span>
          </dd>
        </div>
      ) : null}
      {p.period ? (
        <div>
          <dt>When</dt>
          <dd>
            <FigureText text={p.period} />
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

/** Links out: the live product, store listings, public proof. */
export function ProjectLinks({ p }: { p: Project }) {
  if (!p.links.length) return null;
  return (
    <ul className="tw-project__links" aria-label={`${p.name} links`}>
      {p.links.map((l) => (
        <li key={l.href}>
          <a className="tw-project__link" href={l.href} target="_blank" rel="noopener noreferrer">
            {l.label}
            <ArrowUpRightIcon className="tw-project__link-icon" />
            <span className="sr-only"> for {p.name} (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** One project that is not a case study: a real screenshot of its live site
 *  when it is ours (none for a track record, nor for features in a client's
 *  app), then the text. Its name is an h3, or an h4 on a card in a sub-group
 *  under its own h3 (/work's feature work). */
export default function ProjectCard({ p, sizes, headingLevel = 3 }: { p: Project; sizes: string; headingLevel?: 3 | 4 }) {
  const Name = headingLevel === 4 ? "h4" : "h3";
  return (
    <li
      className={p.image ? "tw-project tw-project--shot" : "tw-project"}
      data-project-kind={p.kind}
      data-project-scope={p.kind === "project" ? p.scope : undefined}
      data-project-id={p.id}
      data-tw-reveal
    >
      {p.image ? (
        <div className="tw-project__shot">
          <ScreenImage src={p.image.src} alt={p.image.alt} sizes={sizes} className="tw-project__img" />
        </div>
      ) : null}
      <div className="tw-project__body">
        <AttributionLabel p={p} />
        <Name className="tw-title-wrapper">
          <span className="title-sub">{p.name}</span>
        </Name>
        <p className="tw-project__summary">
          <FigureText text={p.summary} />
        </p>
        <ProjectFacts p={p} />
        {p.stack.length > 0 ? <Tags items={p.stack} label={`${p.name} stack`} /> : null}
        <ProjectLinks p={p} />
      </div>
    </li>
  );
}
