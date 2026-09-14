import type { SiteContent } from "@/content/site-schema";

import { ArrowUpRightIcon } from "./icons";

/**
 * §5 — the six engineers with a verified LinkedIn (COPY.md §5, amended
 * 2026-09-11). Text-forward: no photograph exists yet, so there is no photo
 * slot — never a template avatar, a stock face or a generated one.
 *
 * Role, experience and stack are empty until each engineer supplies real
 * values; each renders only when present, never as a placeholder. Every card is
 * its person's profile link, and the Person structured data is built from the
 * same roster (verify-site checks 14 and 27).
 */
export default function Team({ team }: { team: SiteContent["team"] }) {
  const roster = team.roster;
  return (
    <section id="team" className="tw-band tw-band--navy tw-on-dark" aria-labelledby="team-title">
      <div className="tw-band__inner">
        <div className="tw-team__head" data-tw-reveal>
          <div className="tw-team__intro">
            <p className="tw-team__eyebrow">
              <span>{team.benchLabel}</span>
              <span className="tw-team__comment">{team.codeComment}</span>
            </p>
            <h2 id="team-title" className="tw-title-wrapper">
              <span className="title-section tw-team__line">{team.headlineLine1}</span>{" "}
              <span className="title-section tw-team__line">{team.headlineLine2}</span>
            </h2>
            <p className="tw-team__sub">{team.subtext}</p>
          </div>
          {/* Plain text: the real number is in the server HTML. */}
          <p className="tw-team__stat">
            <span className="tw-team__count">{roster.length}</span> <span className="tw-team__count-label">{team.statLabel}</span>
          </p>
        </div>

        <ul className="tw-team__grid">
          {roster.map((m) => {
            const role = m.role?.trim();
            const experience = m.experience?.trim();
            const stack = (m.stack ?? []).map((s) => s.trim()).filter(Boolean);
            return (
              <li key={m.id} data-tw-reveal>
                <a href={m.profileUrl} target="_blank" rel="noopener noreferrer" data-person-card className="tw-person">
                  <h3 className="tw-person__name">{m.name}</h3>
                  {role ? <p className="tw-person__role">{role}</p> : null}
                  {experience || stack.length ? (
                    <p className="tw-person__tags">
                      {experience ? <span className="tw-person__tag">{experience}</span> : null}
                      {stack.map((s) => (
                        <span key={s} className="tw-person__tag">
                          {s}
                        </span>
                      ))}
                    </p>
                  ) : null}
                  <p className="tw-person__handle">{m.handle}</p>
                  <span className="tw-person__icon" aria-hidden="true">
                    <ArrowUpRightIcon />
                  </span>
                  <span className="sr-only">, LinkedIn profile (opens in a new tab)</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
