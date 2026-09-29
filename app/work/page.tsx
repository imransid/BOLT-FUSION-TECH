import type { Metadata } from "next";
import { Fragment } from "react";

import { alt as ogAlt } from "../opengraph-image";

import FigureText from "@/components/FigureText";
import Cta from "@/components/site/Cta";
import CtaBand from "@/components/site/CtaBand";
import FeatureScreens, { PublicStat } from "@/components/site/FeatureScreens";
import JsonLd from "@/components/site/JsonLd";
import { Tags } from "@/components/site/Lists";
import PageHead from "@/components/site/PageHead";
import ProjectCard, { AttributionLabel, ProjectFacts, ProjectLinks } from "@/components/site/ProjectCard";
import ScreenImage from "@/components/site/ScreenImage";
import SectionHead from "@/components/site/SectionHead";
import SiteShell from "@/components/site/SiteShell";
import StatusChip from "@/components/site/StatusChip";
import { clientStories, clientStoryMembers, countWord, featureWork, metrics, projectSections, projects, type Project } from "@/content";
import { getSiteUrl } from "@/lib/site-url";

/**
 * /work — every project the owner approved, each labelled with who built it
 * (CLAUDE.md, "Projects and attribution", decided 2026-09-15), in the site's
 * one design since 2026-09-16 with every word and the section order kept.
 * Four sections, one per kind, in `projectSections` order:
 *
 *  · case studies — one row per write-up: a large screenshot beside the text,
 *    its figures each with its shipped/target chip. Rows, not a grid: a
 *    two-item grid looks unfinished, two rows look deliberate;
 *  · straight after them, each client story (2026-09-29: TTouch Clothing's
 *    four systems) as its own section and h2, anchored at its id
 *    (`/work#ttouch-clothing`); then the features we shipped into other
 *    companies' apps (`scope: "features"`, decided 2026-09-16) as their own
 *    section (`/work#feature-work`, 2026-09-30 — an h3 sub-group at the foot
 *    of Bolt Fusion projects until then): Bazzile first, featured, with the
 *    screens where our features live beside its text; GodConnect Online, whose
 *    role names no features, a text card under it;
 *  · Bolt Fusion projects, in-house products and our engineers' track record —
 *    cards on a grid that fills its rows at every width (app/site.css, "/work").
 *
 * Every card carries its attribution label directly above the project's name.
 * A track-record card is text only: the product belongs to someone else. A
 * feature-work card never shows a view of the whole app — the app is the
 * client's — only its feature screens, each captioned with its feature
 * (2026-09-30). The data attributes (`data-project-kind`, `-scope`, `-id`,
 * `data-attribution`, `data-role`, `data-built-at`, `data-metric`,
 * `data-feature-screen`) are verify-site check 9's and check 8's contract, and
 * no h3 sits outside a card.
 *
 * INDEXABLE, deliberately: crawlable, in the sitemap, with CollectionPage
 * schema listing the write-ups.
 *
 * Only `published` projects appear. The filter is on state, so an
 * unsubstantiated project cannot reach this page by accident.
 */

const TITLE = "Case studies — how the systems were built | Bolt Fusion Tech";
const DESCRIPTION =
  "Architecture-level write-ups of the systems we shipped, the other products we built, and our engineers' track record, each labelled with who built it.";

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteUrl();
  const canonical = new URL("/work", site).toString();
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      type: "website",
      url: canonical,
      siteName: "Bolt Fusion Tech",
      locale: "en_US",
      images: [
        {
          url: new URL("/opengraph-image", site).toString(),
          width: 1200,
          height: 630,
          alt: ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      images: [new URL("/opengraph-image", site).toString()],
    },
  };
}

/** Columns that fill every row: three across a set of three, two across a set
 *  of two or four, one otherwise (a lone card lays its screenshot beside its
 *  text). */
const columns = (n: number) => (n > 1 && n % 3 === 0 ? 3 : n > 1 && n % 2 === 0 ? 2 : 1);
const SIZES: Record<1 | 2 | 3, string> = {
  3: "(min-width: 1025px) 400px, (min-width: 768px) 50vw, calc(100vw - 32px)",
  2: "(min-width: 768px) 50vw, calc(100vw - 32px)",
  1: "(min-width: 768px) 55vw, calc(100vw - 32px)",
};

/** A set of cards on a grid that fills its rows. `labelledBy` names the list
 *  after the section heading above it. */
function ProjectGrid({ items, labelledBy }: { items: Project[]; labelledBy?: string }) {
  const cols = columns(items.length);
  return (
    <ul className={`bf-projects bf-projects--${cols}`} aria-labelledby={labelledBy}>
      {items.map((p) => (
        <ProjectCard key={p.id} p={p} sizes={SIZES[cols]} />
      ))}
    </ul>
  );
}

/** A client story's eyebrow: what the section is, in sentence case. */
const STORY_EYEBROW = "Client story";

/** Feature work with its screens, featured (2026-09-30): the screens where our
 *  features live beside the text — the label, the name, the summary, the
 *  app's public figure with its source, what we built, the stack and the store
 *  links. The screens come first, as every card's screenshot does. */
function FeaturedCard({ p }: { p: Project }) {
  return (
    <li id={p.id} className="bf-project bf-feat" data-project-kind={p.kind} data-project-scope={p.scope} data-project-id={p.id} data-bf-reveal>
      <div className="bf-feat__media">
        <FeatureScreens p={p} sizes="(min-width: 1025px) 240px, (min-width: 768px) 22vw, calc(50vw - 40px)" className="bf-feat__screens" />
      </div>
      <div className="bf-project__body bf-feat__body">
        <AttributionLabel p={p} />
        <h3 className="bf-project__name bf-feat__name">{p.name}</h3>
        <p className="bf-project__summary bf-feat__summary">
          <FigureText text={p.summary} />
        </p>
        <PublicStat p={p} />
        <ProjectFacts p={p} />
        {p.stack.length > 0 ? <Tags items={p.stack} label={`${p.name} stack`} /> : null}
        <ProjectLinks p={p} />
      </div>
    </li>
  );
}

/** A write-up's row: the screenshot, then the label, the name, the figures and
 *  the link to the write-up. */
function CaseStudyRow({ p }: { p: Project }) {
  const rowMetrics = p.metricIds
    .map((id) => metrics.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  return (
    <li className="bf-work__row" data-project-kind={p.kind} data-project-id={p.id}>
      {/* Large screenshot — this page is the portfolio, thumbnails waste it.
          The button below is the row's link for keyboards and screen readers;
          this one is for the pointer. */}
      <a href={p.href!} className="bf-work__shot" tabIndex={-1} aria-hidden data-bf-reveal>
        <ScreenImage src={p.image!.src} alt="" fill sizes="(min-width: 1025px) 700px, calc(100vw - 32px)" className="bf-work__img" />
      </a>

      <div className="bf-work__body" data-bf-reveal>
        <AttributionLabel p={p} />
        <h3 className="bf-work__name">{p.name}</h3>

        <p className="bf-work__summary">{p.summary}</p>

        <ProjectFacts p={p} />

        {/* Every figure keeps its shipped/target label, beside it. No exceptions. */}
        {rowMetrics.length > 0 ? (
          <ul className="bf-metrics">
            {rowMetrics.map((m) => (
              <li key={m.id} className="bf-metric">
                {/* The figure and its own chip, in a box that names the metric
                    (content/metrics.ts): a chip in the label is the label's
                    figure's, never this one's. */}
                <span className="bf-metric__fig" data-metric={m.id}>
                  <span className="bf-metric__value">{m.value}</span>
                  <StatusChip status={m.status} />
                </span>
                <span className="bf-metric__label">
                  <FigureText text={m.label} />
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {p.stack.length > 0 ? <Tags items={p.stack} /> : null}

        <ProjectLinks p={p} />

        <p className="bf-work__cta">
          <Cta href={p.href!} variant="ghost">
            Read the write-up
            <span className="sr-only"> for {p.name}</span>
          </Cta>
        </p>
      </div>
    </li>
  );
}

export default function WorkIndexPage() {
  const published = projects.filter((p) => p.state === "published");
  const caseStudies = published.filter((p) => p.kind === "case-study");
  const sections = projectSections
    .map((s) => ({ ...s, items: published.filter((p) => p.kind === s.kind) }))
    .filter((s) => s.items.length > 0);
  /* the client stories and their members (content/projects.ts computes
     them): each is its own section after the case studies, and its members
     leave the product grid below */
  const stories = clientStories.map((story) => ({ story, members: clientStoryMembers(story) }));
  const inStory = new Set(stories.flatMap((x) => x.members.map((p) => p.id)));
  /* feature work: its own section after the client stories, the cards with
     feature screens first (featured), then the text cards */
  const featureProjects = published.filter((p) => p.kind === "project" && p.scope === "features");
  const featured = featureProjects.filter((p) => p.featureScreens.length > 0);
  const featureText = featureProjects.filter((p) => p.featureScreens.length === 0);
  const site = getSiteUrl().toString();

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": new URL("/work", site).toString(),
        name: "Case studies",
        description: DESCRIPTION,
        isPartOf: { "@id": `${site}#website` },
        hasPart: caseStudies.map((p) => ({
          "@type": "Article",
          headline: p.name,
          description: p.summary,
          url: new URL(p.href!, site).toString(),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: site },
          { "@type": "ListItem", position: 2, name: "Case studies", item: new URL("/work", site).toString() },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={graph} />
      <SiteShell ground="graphite" current="/work">
        <PageHead id="work-title" title="The systems, and how they were built.">
          <p className="bf-lead">
            {caseStudies.length === 2 ? "Two write-ups so far." : `${caseStudies.length} write-ups so far.`} Each one
            covers the actual architecture — constraints, decisions, tradeoffs, and what we&rsquo;d change. Not a
            screenshot and a paragraph.
          </p>
          {/* The client stories, named where the page says what is on it
              (2026-09-29, the design review: the lede never mentioned the
              four TTouch systems). The count is the data's, and "live" is
              said only of a set whose members all are, as the story's own
              intro may (content/projects.ts). */}
          <p className="bf-lead">
            {stories.map(({ story, members }) => (
              <Fragment key={story.id}>
                Then the {countWord(members.length)} systems we built end to end for {story.client}
                {members.every((m) => m.status === "live") ? `, all ${countWord(members.length)} live` : ""}.{" "}
              </Fragment>
            ))}
            {featureProjects.length ? "Then the features we shipped into other companies’ apps. " : null}
            {stories.length ? "Below them" : "Below the write-ups"}: the other products we built, for clients and for
            ourselves, and what our engineers shipped at previous employers. Every card says who built it.
          </p>
        </PageHead>

        {sections.map((s) => {
          /* a client story takes its members out of the product grid — only a
             story that is a set: projects.ts refuses one with fewer than two */
          const products = s.items.filter((p) => p.scope !== "features" && !inStory.has(p.id));
          return (
            <Fragment key={s.id}>
              <section id={s.id} className="bf-section" aria-labelledby={`${s.id}-title`}>
                <div className="bf-wrap">
                  <SectionHead id={`${s.id}-title`} title={s.title} lead={s.intro ?? undefined} />
                  {s.kind === "case-study" ? (
                    <ul className="bf-work">
                      {s.items.map((p) => (
                        <CaseStudyRow key={p.id} p={p} />
                      ))}
                    </ul>
                  ) : (
                    products.length > 0 ? <ProjectGrid items={products} /> : null
                  )}
                </div>
              </section>
              {/* Each client story is its own section straight after the case
                  studies (2026-09-29, the design review: as an h3 inside
                  "Bolt Fusion projects" it sat at screen 4 of 9 at 1440): the
                  eyebrow, its h2 and intro beside it from 1025px, over its
                  members' cards, two across, with h3 names. */}
              {s.kind === "case-study"
                ? stories.map(({ story, members }) => (
                    <section key={story.id} id={story.id} className="bf-section bf-clientstory" aria-labelledby={`${story.id}-title`}>
                      <div className="bf-wrap">
                        <SectionHead id={`${story.id}-title`} eyebrow={STORY_EYEBROW} title={story.title} lead={story.intro} className="bf-clientstory__head" />
                        <ProjectGrid items={members} labelledBy={`${story.id}-title`} />
                      </div>
                    </section>
                  ))
                : null}
              {/* Feature work, after the client stories (2026-09-30): the owner
                  asked for Bazzile to be highlighted, with its screens. Under
                  its own h2, with h3 names; the featured cards first, each
                  full width, then the text cards, a lone one laid out as a row. */}
              {s.kind === "case-study" && featureProjects.length ? (
                <section id={featureWork.id} className="bf-section bf-featwork" aria-labelledby={`${featureWork.id}-title`}>
                  <div className="bf-wrap">
                    <SectionHead id={`${featureWork.id}-title`} eyebrow={featureWork.eyebrow} title={featureWork.title} lead={featureWork.intro} className="bf-featwork__head" />
                    <ul className="bf-featwork__list" aria-labelledby={`${featureWork.id}-title`}>
                      {featured.map((p) => (
                        <FeaturedCard key={p.id} p={p} />
                      ))}
                    </ul>
                    {featureText.length ? <ProjectGrid items={featureText} labelledBy={`${featureWork.id}-title`} /> : null}
                  </div>
                </section>
              ) : null}
            </Fragment>
          );
        })}

        <CtaBand titleId="work-cta" title="Building something with a constraint like these?">
          <Cta href="/contact#project" variant="ghost">
            Start a pilot
          </Cta>
        </CtaBand>
      </SiteShell>
    </>
  );
}
