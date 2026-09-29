import FigureText from "@/components/FigureText";
import { pilot, services } from "@/content";
import { pages } from "@/content/pages";
import type { SiteContent } from "@/content/site-schema";
import { SCHEDULE_HREF, SCHEDULE_LABEL } from "@/content/site-schema";

import Cta from "../Cta";

/**
 * How we work with you — new on the homepage on 2026-09-28 (DECISIONS item 1;
 * the owner: "make it easy for clients to hire"). What a buyer needs to start,
 * and what it risks: the four terms, the engagement models, the two-week pilot
 * and the headcount. Every word is published copy, rendered from the modules
 * /about renders — /about's terms and lines (content/pages.ts), the engagement
 * models (content/services.ts), the pilot (content/pilot.ts), where our
 * engineers work (content/pages.ts) and the team's headcount (content/site.ts,
 * "15+", the owner's figure; no one named). It merged the homepage's Team
 * section, whose full version stays on /about.
 *
 * The pilot's three stations are the `pilot` trace hook of the interface
 * between the streams (DECISIONS 2026-09-28): `[data-bf-trace="pilot"]` holds
 * one `svg.bf-trace` with its `.bf-trace__path`, drawn COMPLETE in the server
 * HTML in a steel stroke, and the stations `[data-bf-trace-stop]` in order.
 * Without script it is a finished static drawing; the motion stream traces it.
 * Below 768px the stations stack and the line is the list's own rule.
 *
 * The section ends with the contextual primary, Schedule a Call, beside the
 * ghost "Start a 2-week pilot" — which has no `data-cta`: it is an approved
 * label that is not Schedule a Call (CLAUDE.md, "The inner pages, as built").
 */
export default function HowWeWork({ team }: { team: SiteContent["team"] }) {
  const how = pages.about.howWeWork;
  const where = pages.about.where.head;
  const stations = [...pilot.weeks.map((w) => ({ id: w.id, label: w.label, what: w.body })), { id: "deliverable", label: "Deliverable", what: pilot.deliverable }];
  return (
    <section id="how-we-work" className="bf-section bf-hww" aria-labelledby="hww-title">
      <div className="bf-wrap">
        <div className="bf-hww__top">
          <div className="bf-head bf-head--chapter" data-bf-reveal>
            <p className="bf-eyebrow">{how.head.eyebrow}</p>
            <h2 id="hww-title" className="bf-h2">
              {how.head.title}
            </h2>
            {how.head.lead ? (
              <p className="bf-lead">
                <FigureText text={how.head.lead} />
              </p>
            ) : null}
          </div>
          {/* The team, as a headcount (the owner, 2026-09-24): its size and
              where the engineers work, and nothing about any one person. */}
          <div className="bf-hww__team" data-bf-reveal>
            <p className="bf-hww__count">
              <span className="bf-hww__num">
                <FigureText text={team.size} />
              </span>{" "}
              <span className="bf-hww__unit">{team.sizeLabel}</span>
            </p>
            <p className="bf-hww__where">{where.lead}</p>
          </div>
        </div>

        <dl className="bf-hww__terms" data-bf-reveal>
          {how.terms.map((t) => (
            <div key={t.term} className="bf-hww__term">
              <dt>{t.term}</dt>
              <dd>
                <FigureText text={t.detail} />
              </dd>
            </div>
          ))}
        </dl>

        <div className="bf-hww__models" data-bf-reveal>
          <h3 id="hww-models-title" className="bf-hww__h3">
            {how.modelsTitle}
          </h3>
          <table className="bf-hww__table" aria-labelledby="hww-models-title">
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">Shape</th>
                <th scope="col">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <th scope="row">{s.name}</th>
                  <td>{s.shape}</td>
                  <td>
                    <FigureText text={s.timeline} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bf-hww__lines">
            <p>{how.lineUnderTable}</p>
            <p>{how.operatingDetail}</p>
          </div>
        </div>

        <div className="bf-hww__pilot" data-bf-reveal>
          <div className="bf-hww__pilot-text">
            <h3 className="bf-hww__pilot-title">{pilot.title}</h3>
            <p className="bf-hww__pilot-body">{pilot.body}</p>
          </div>
          <div className="bf-hww__plan" data-bf-trace="pilot">
            <svg className="bf-trace" aria-hidden="true" focusable="false" viewBox="0 0 100 2" preserveAspectRatio="none">
              <line className="bf-trace__path" x1="0" y1="1" x2="100" y2="1" vectorEffect="non-scaling-stroke" />
            </svg>
            <ol className="bf-hww__stations">
              {stations.map((st) => (
                <li key={st.id} className="bf-hww__station" data-bf-trace-stop>
                  <span className="bf-hww__station-label">{st.label}</span>
                  <span className="bf-hww__station-what">{st.what}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className="bf-actions bf-hww__cta">
            <Cta href={SCHEDULE_HREF} cta="schedule">
              {SCHEDULE_LABEL}
            </Cta>
            {/* The button's exemption covers its whole label (content/figure-labels.ts). */}
            <Cta href={how.pilotCta.href} variant="ghost">
              <FigureText text={how.pilotCta.label} />
            </Cta>
          </p>
        </div>
      </div>
    </section>
  );
}
