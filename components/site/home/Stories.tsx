import FigureText from "@/components/FigureText";
import ScreenImage from "@/components/site/ScreenImage";
import { clientStories, clientStoryMembers, countWord, featureWork, lanes, projects, type ClientStory, type Project } from "@/content";
import { playground, playgroundEdges } from "@/content/architecture";
import type { SiteContent } from "@/content/site-schema";
import { SCHEDULE_HREF, SCHEDULE_LABEL } from "@/content/site-schema";

import Cta from "../Cta";
import FeatureScreens, { PublicStat } from "../FeatureScreens";
import FlowPlayground from "../FlowPlayground";
import { ArrowUpRightIcon } from "../icons";
import { attribution, AttributionLabel, ProjectLinks } from "../ProjectCard";
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

/** A write-up as an engineering story, as a card of the pair: the screenshot,
 *  who built it (the label /work's card carries, from content/projects.ts),
 *  the name, the outcome, then the problem, the system, the engineering and the
 *  result. Only a published project links anywhere, and it links to its
 *  write-up. The restaurant search's three lanes, its system drawn out, are
 *  the flow playground under the pair (below; FlowPlayground).
 *
 *  Each step carries its key (`data-step`): on a phone the card shows only the
 *  result of the four, and the write-up the rest (app/site.css). */
function Story({ w }: { w: Work }) {
  const published = w.state === "published" && Boolean(w.href);
  const anchor = w.imgClass ? IMG_ANCHOR[w.imgClass] ?? "top" : "top";
  const project = projects.find((p) => p.href && p.href === w.href);
  return (
    <article className="bf-story" data-bf-reveal>
      <div className="bf-story__shot">
        <ScreenImage
          src={w.src}
          alt={w.alt}
          fill
          sizes="(min-width: 1025px) 600px, (min-width: 768px) 90vw, calc(100vw - 32px)"
          className={`bf-story__img bf-story__img--${anchor}`}
        />
      </div>
      <div className="bf-story__text">
        {project ? <p className="bf-attr">{attribution(project)}</p> : null}
        <h3 className="bf-story__title">{w.title}</h3>
        <p className="bf-story__stack">{w.stack}</p>
        <p className="bf-story__outcome">
          <FigureText text={w.outcome} />
        </p>
        <dl className="bf-story__steps">
          {STEPS.map(([key, label]) => (
            <div key={key} className="bf-story__step" data-step={key}>
              <dt>{label}</dt>
              <dd>
                <FigureText text={w.story[key]} />
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

/** A client story as a band (2026-09-29): one client's systems, shown
 *  together straight after the pair of write-ups — since 2026-09-29, the
 *  design and honesty reviews: the owner asked for these four to be
 *  highlighted, and at the end of the proof, as a 22px text band under the
 *  section's call to action, they were the smallest and last thing in it.
 *
 *  A surface plate: "Client story", who built the systems (the label every
 *  one of its cards on /work carries, from content/projects.ts), the story's
 *  title and intro, one link to the story on /work, and each system's real
 *  screenshot — the one its /work card shows — over its name and tagline.
 *  Each name opens the live system in a new tab, as the hero's proof line
 *  does, and the whole tile is that link's target (its `::after`), so a tile
 *  is one tab stop. The count in the link is the data's.
 *
 *  `data-client-story`, `data-attribution` and `data-story-project` are
 *  verify-site check 9's: the label must be the kind's words for this client
 *  where a reader can see it, every name a published project of it, and
 *  every screenshot in the band the one of the project whose tile holds it.
 *  The screenshots are lazy and in fixed 16:10 frames: nothing on the
 *  homepage's LCP path, and no shift as they load (check 29). */
function ClientStoryBand({ story }: { story: ClientStory }) {
  const members = clientStoryMembers(story);
  const titleId = `${story.id}-band-title`;
  return (
    <div className="bf-clientband" data-client-story={story.id} data-bf-reveal>
      <div className="bf-clientband__head">
        <div className="bf-clientband__lede">
          <p className="bf-eyebrow bf-clientband__eyebrow">Client story</p>
          <p className="bf-attr" data-attribution>
            {attribution(members[0])}
          </p>
          <h3 id={titleId} className="bf-clientband__title">
            {story.title}
          </h3>
        </div>
        <div className="bf-clientband__aside">
          <p className="bf-clientband__intro">{story.intro}</p>
          <Cta href={`/work#${story.id}`} variant="quiet" className="bf-clientband__all">
            See the {countWord(members.length)} systems
          </Cta>
        </div>
      </div>
      <ul className="bf-clientband__list" aria-labelledby={titleId}>
        {members.map((p) => {
          const live = p.links[0];
          return (
            <li key={p.id} className="bf-clientband__item" data-story-project={p.id}>
              {p.image ? (
                <div className="bf-clientband__shot">
                  <ScreenImage
                    src={p.image.src}
                    alt={p.image.alt}
                    fill
                    sizes="(min-width: 1025px) 300px, (min-width: 768px) calc(50vw - 60px), calc(50vw - 36px)"
                    className="bf-clientband__img"
                  />
                </div>
              ) : null}
              <h4 className="bf-clientband__name">
                {live ? (
                  <a href={live.href} target="_blank" rel="noopener noreferrer">
                    {p.name}
                    <ArrowUpRightIcon className="bf-clientband__out" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  p.name
                )}
              </h4>
              <p className="bf-clientband__line">{p.tagline ?? p.summary}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Feature work, as a tile (the owner, 2026-09-30): after the client story,
 *  before the section's Schedule a Call — "Features we shipped into other
 *  companies’ apps", then each feature-work project that has its screens
 *  (Bazzile): the screens small, each captioned with its feature; its label,
 *  which says features, never "built by"; its name; what we built, the role
 *  word for word, which names the features; the app's public figure with its
 *  source; and links to its card on /work and to the stores. A hairline tile
 *  on the ground, not the client story's surface plate: it is not a set of
 *  systems we built.
 *
 *  Each project is a card for verify-site check 9 (`data-project-kind`,
 *  `-scope`, `-id`, `data-attribution` directly above its name, `data-role`),
 *  and its screens are FeatureScreens' figures, so the rules /work's card
 *  keeps hold here too: the label must be the features label where a reader
 *  can see it, and each screen one of its own, under a visible caption that
 *  names its feature. The screens are lazy, in fixed frames (check 29). */
function FeatureWorkTile({ items }: { items: Project[] }) {
  const titleId = `${featureWork.id}-tile-title`;
  return (
    <div className="bf-feattile" data-bf-reveal>
      <div className="bf-feattile__head">
        <p className="bf-eyebrow bf-feattile__eyebrow">{featureWork.eyebrow}</p>
        <h3 id={titleId} className="bf-feattile__title">
          {featureWork.title}
        </h3>
        <p className="bf-feattile__intro">{featureWork.intro}</p>
        {/* One project: its card on /work; more: the section */}
        <Cta href={items.length === 1 ? `/work#${items[0].id}` : `/work#${featureWork.id}`} variant="quiet" className="bf-feattile__more">
          {items.length === 1 ? `See ${items[0].name} on our work page` : "See our feature work"}
        </Cta>
      </div>
      {items.map((p) => (
        <article key={p.id} className="bf-feattile__card" data-project-kind={p.kind} data-project-scope={p.scope} data-project-id={p.id} aria-labelledby={`${p.id}-tile-name`}>
          <FeatureScreens p={p} sizes="(min-width: 1025px) 150px, (min-width: 768px) 20vw, calc(50vw - 44px)" className="bf-feattile__screens" />
          <div className="bf-feattile__body">
            <AttributionLabel p={p} />
            <h4 id={`${p.id}-tile-name`} className="bf-feattile__name">
              {p.name}
            </h4>
            <p className="bf-feattile__role" data-role>
              <FigureText text={p.role} />
            </p>
            <PublicStat p={p} className="bf-feattile__stat" />
            <div className="bf-feattile__links">
              <ProjectLinks p={p} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/**
 * Engineering stories (SPEC §5), second on the homepage since 2026-09-28 — the
 * proof, straight after the hero (DECISIONS 2026-09-28, item 1): the two
 * write-ups side by side from 1025px, each with who built it; then each
 * client story (TTouch Clothing's four systems, since 2026-09-29), with its
 * screenshots; then the feature work with its screens (Bazzile, since
 * 2026-09-30), as a tile; then the section's own Schedule a Call and the link to all
 * work — the call follows the strongest proof; then the restaurant search's
 * three lanes as the flow playground (since 2026-10-24), with its own Schedule
 * a Call, and the proof strip — "From systems we shipped." (SPEC §8b.1;
 * never "Measured on…": ~$0.001 is a target). Until the design and honesty
 * reviews of 2026-09-29 the client story was a text band after the proof
 * strip, below the section's call, under a heading that said "Two
 * products": the owner had asked for it to be highlighted.
 *
 * Its heading is the standard h2, not a chapter head: at 1440 it shares the
 * first screen with the h1, and two near-equal headlines there blurred which
 * one leads.
 *
 * The section keeps `id="recent-work"`, the anchor the write-ups' "← All work"
 * link has always pointed at, and the proof strip's rows sit inside it with no
 * id between them and the section: verify-site checks 8 and 28 attribute each
 * figure to `#recent-work`.
 */
export default function Stories({ work, lanesTitle }: { work: SiteContent["recentWorks"]; lanesTitle: string }) {
  const laneStory = work.items.find((w) => w.story.lanes);
  /* The count is the data's: the published projects on /work that are ours,
     feature work included. The engineers' track record is on that page too,
     credited to them, and is not counted as our work. */
  const ourWork = projects.filter((p) => p.state === "published" && p.kind !== "track-record").length;
  /* feature work with its screens (2026-09-30): the tile after the client story */
  const featureScreens = projects.filter((p) => p.state === "published" && p.kind === "project" && p.scope === "features" && p.featureScreens.length > 0);
  return (
    <section id="recent-work" className="bf-section bf-proofsec" aria-labelledby="work-title">
      <div className="bf-wrap">
        {/* The head is one row from 1025px — the chapter title on the left, its
            lead and the link to every case study on the right — so the first
            write-up starts inside the first screen and a half. */}
        <div className="bf-proofsec__head">
          <SectionHead id="work-title" eyebrow={work.eyebrow} title={work.title} />
          <div className="bf-proofsec__aside" data-bf-reveal>
            <p className="bf-lead">{work.subtitle}</p>
            <Cta href="/work#case-studies" variant="quiet" className="bf-proofsec__all">
              See all case studies
            </Cta>
          </div>
        </div>
        <div className="bf-stories">
          {work.items.map((w) => (
            <Story key={w.title} w={w} />
          ))}
        </div>
        {clientStories.map((story) => (
          <ClientStoryBand key={story.id} story={story} />
        ))}
        {featureScreens.length ? <FeatureWorkTile items={featureScreens} /> : null}
        <p className="bf-actions bf-proofsec__cta">
          <Cta href={SCHEDULE_HREF} cta="schedule">
            {SCHEDULE_LABEL}
          </Cta>
          <Cta href="/work" variant="ghost">
            See all work ({ourWork} projects)
          </Cta>
        </p>
        {/* The restaurant search's system, as the engineering flow playground
            (2026-10-24): its three lanes, each with a sample request to follow
            through the router. It replaced the static lanes band in the same
            place — the mechanism between the stories and the figures. */}
        {laneStory ? (
          <FlowPlayground data={playground} lanes={lanes} edges={playgroundEdges} of={laneStory.title} lanesTitle={lanesTitle}>
            {/* Its own Schedule a Call (2026-10-24): after the engineering
                explanation, the brief's §13. The playground is taller than
                the band it replaced — 2,600px on a phone — and without it six
                phone screens in a row, from the proof's call to how we work's,
                showed none (verify-site check 36). It sits over 1,400px under
                the proof's, so the two are never in one view. */}
            <p className="bf-actions bf-flowpg__cta">
              <Cta href={SCHEDULE_HREF} cta="schedule">
                {SCHEDULE_LABEL}
              </Cta>
              {laneStory.state === "published" && laneStory.href ? (
                <Cta href={laneStory.href} variant="ghost">
                  {laneStory.ctaLabel ?? "Read the case study"}
                  <span className="sr-only"> for {laneStory.title}</span>
                </Cta>
              ) : null}
            </p>
          </FlowPlayground>
        ) : null}
        <ProofStrip id="proof-title" title={work.proofTitle} note={work.proofNote} />
      </div>
    </section>
  );
}
