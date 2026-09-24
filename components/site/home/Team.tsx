import FigureText from "@/components/FigureText";
import type { SiteContent } from "@/content/site-schema";

/**
 * The team, as a headcount. The owner, 2026-09-24: "we just show we have 15+
 * developer team, no details". So the section says how many developers there
 * are and nothing about any one of them: no names, no profiles, no photographs,
 * no Person structured data (CLAUDE.md, "The team is a headcount").
 *
 * The size is a figure ("15+"): <FigureText> renders it inside the exemption
 * content/figure-labels.ts holds for that exact text, and the build refuses a
 * size without one. Verify-site check 14 fails a person card or a Person node
 * anywhere on the page, and check 30 fails a named member coming back.
 */
export default function Team({ team }: { team: SiteContent["team"] }) {
  return (
    <section id="team" className="bf-section" aria-labelledby="team-title">
      <div className="bf-wrap">
        <div className="bf-team__head" data-bf-reveal>
          <div className="bf-head">
            <p className="bf-eyebrow">
              <span>{team.benchLabel}</span> <span className="bf-team__comment">{team.codeComment}</span>
            </p>
            <h2 id="team-title" className="bf-h2">
              <span className="bf-team__line">{team.headlineLine1}</span>{" "}
              <span className="bf-team__line">{team.headlineLine2}</span>
            </h2>
            <p className="bf-lead">{team.subtext}</p>
          </div>
          <p className="bf-team__stat">
            <span className="bf-team__count">
              <FigureText text={team.size} />
            </span>{" "}
            <span className="bf-team__count-label">{team.sizeLabel}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
