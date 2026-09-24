import FigureText from "@/components/FigureText";
import ScreenImage from "@/components/site/ScreenImage";
import { lanes, projects } from "@/content";
import type { SiteContent } from "@/content/site-schema";

import Cta from "../Cta";
import ProofStrip from "../ProofStrip";
import SectionHead from "../SectionHead";

type Work = SiteContent["recentWorks"]["items"][number];

/* Which edge of a screenshot the frame keeps when it crops (`imgClass` in
   content/site.ts): the top of a landing page, the left of a search screen
   whose words start at its left edge. */
const IMG_ANCHOR: Record<string, "top" | "left"> = { "object-[center_top]": "top", "object-left": "left" };

const STEPS = [
  ["problem", "The problem"],
  ["system", "The system"],
  ["engineering", "The engineering"],
  ["result", "The result"],
] as const;

/** A write-up as an engineering story: the problem, the system, the
 *  engineering, the result — the restaurant search's system with its three
 *  lanes (content/architecture.ts, every figure labelled). Only a published
 *  project links anywhere, and it links to its write-up. */
function Story({ w, flip }: { w: Work; flip: boolean }) {
  const published = w.state === "published" && Boolean(w.href);
  const anchor = w.imgClass ? IMG_ANCHOR[w.imgClass] ?? "top" : "top";
  return (
    <article className={`bf-story${flip ? " bf-story--flip" : ""}`} data-bf-reveal>
      <div className="bf-story__shot">
        <ScreenImage
          src={w.src}
          alt={w.alt}
          fill
          sizes="(min-width: 1025px) 560px, (min-width: 768px) 90vw, calc(100vw - 32px)"
          className={`bf-story__img bf-story__img--${anchor}`}
        />
      </div>
      <div className="bf-story__text">
        <p className="bf-story__stack">{w.stack}</p>
        <h3 className="bf-story__title">{w.title}</h3>
        <p className="bf-story__outcome">
          <FigureText text={w.outcome} />
        </p>
        <dl className="bf-story__steps">
          {STEPS.map(([key, label]) => (
            <div key={key} className="bf-story__step">
              <dt>{label}</dt>
              <dd>
                <FigureText text={w.story[key]} />
                {key === "system" && w.story.lanes ? (
                  <ul className="bf-lanes">
                    {lanes.map((lane) => (
                      <li key={lane.id} className="bf-lane" data-tone={lane.tone}>
                        <p className="bf-lane__head">
                          <span className="bf-lane__name">{lane.name}</span> <span className="bf-lane__premise">— {lane.premise}</span>
                        </p>
                        <p className="bf-lane__detail">
                          <FigureText text={lane.detail} />
                        </p>
                        <p className="bf-lane__cost">
                          <FigureText text={lane.cost} />
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
        {published ? (
          <Cta href={w.href as string} variant="quiet">
            {w.ctaLabel ?? "Read the case study"}
            <span className="sr-only"> for {w.title}</span>
          </Cta>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Engineering stories (SPEC §5): the two write-ups, the links to all work, and
 * the proof strip — "From systems we shipped." (SPEC §8b.1; never "Measured
 * on…": ~$0.001 is a target). The
 * section keeps `id="recent-work"`, the anchor the write-ups' "← All work"
 * link has always pointed at.
 */
export default function Stories({ work }: { work: SiteContent["recentWorks"] }) {
  /* The count is the data's: the published projects on /work that are ours,
     feature work included. The engineers' track record is on that page too,
     credited to them, and is not counted as our work. */
  const ourWork = projects.filter((p) => p.state === "published" && p.kind !== "track-record").length;
  return (
    <section id="recent-work" className="bf-section" aria-labelledby="work-title">
      <div className="bf-wrap">
        <SectionHead id="work-title" eyebrow={work.eyebrow} title={work.title} lead={work.subtitle} />
        <div className="bf-stories">
          {work.items.map((w, i) => (
            <Story key={w.title} w={w} flip={i % 2 === 1} />
          ))}
        </div>
        <p className="bf-actions">
          <Cta href="/work#case-studies" variant="ghost">
            See all case studies
          </Cta>
          <Cta href="/work" variant="ghost">
            See all work ({ourWork} projects)
          </Cta>
        </p>
        <ProofStrip id="proof-title" title={work.proofTitle} note={work.proofNote} />
      </div>
    </section>
  );
}
