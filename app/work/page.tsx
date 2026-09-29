import type { Metadata } from "next";
import { Fragment } from "react";

import { alt as ogAlt } from "../opengraph-image";

import FigureText from "@/components/FigureText";
import Cta from "@/components/site/Cta";
import CtaBand from "@/components/site/CtaBand";
import JsonLd from "@/components/site/JsonLd";
import { Tags } from "@/components/site/Lists";
import PageHead from "@/components/site/PageHead";
import ProjectCard, { AttributionLabel, ProjectFacts, ProjectLinks } from "@/components/site/ProjectCard";
import ScreenImage from "@/components/site/ScreenImage";
import SectionHead from "@/components/site/SectionHead";
import SiteShell from "@/components/site/SiteShell";
import StatusChip from "@/components/site/StatusChip";
import { clientStories, clientStoryMembers, countWord, metrics, projectSections, projects, type Project } from "@/content";
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
 *  · Bolt Fusion projects, in-house products and our engineers' track record —
 *    cards on a grid that fills its rows at every width (app/site.css, "/work").
 *    Inside Bolt Fusion projects, the products first; then each client story
 *    (2026-09-29: TTouch Clothing's four systems) as a sub-group under its own
 *    h3, anchored at its id (`/work#ttouch-clothing`); then a sub-group under
 *    its own h3 for the features we shipped into other companies' apps
 *    (`scope: "features"`, decided 2026-09-16). Every sub-group's cards have
 *    h4 names, on a grid of its own that fills its rows too.
 *
 * Every card carries its attribution label directly above the project's name.
 * A track-record card is text only: the product belongs to someone else. So is
 * a feature-work card: the app's UI belongs to the client. The data
 * attributes (`data-project-kind`, `-scope`, `-id`, `data-attribution`,
 * `data-role`, `data-built-at`, `data-metric`) are verify-site check 9's and
 * check 8's contract, and no h3 or h4 sits outside a card or the sub-group.
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
 *  after the sub-group heading above it. */
function ProjectGrid({ items, headingLevel, labelledBy }: { items: Project[]; headingLevel?: 3 | 4; labelledBy?: string }) {
  const cols = columns(items.length);
  return (
    <ul className={`bf-projects bf-projects--${cols}`} aria-labelledby={labelledBy}>
      {items.map((p) => (
        <ProjectCard key={p.id} p={p} sizes={SIZES[cols]} headingLevel={headingLevel} />
      ))}
    </ul>
  );
}

/** The feature-work sub-group's heading. Plain words: what these cards are. */
const FEATURES_TITLE = "Features we shipped into other companies’ apps";

/** A client story's eyebrow: what the section is, in sentence case. */
const STORY_EYEBROW = "Client story";

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
            {stories.length ? "Below them" : "Below the write-ups"}: the other products we built, for clients and for
            ourselves, and what our engineers shipped at previous employers. Every card says who built it.
          </p>
        </PageHead>

        {sections.map((s) => {
          /* a client story takes its members out of the product grid — only a
             story that is a set: projects.ts refuses one with fewer than two */
          const products = s.items.filter((p) => p.scope !== "features" && !inStory.has(p.id));
          const features = s.items.filter((p) => p.scope === "features");
          const featuresId = `${s.id}-features-title`;
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
                    <>
                      {products.length > 0 ? <ProjectGrid items={products} /> : null}
                      {/* The heading's parent holds the cards it heads: verify-site
                          check 9 reads such a heading as a group's, not a card's. */}
                      {features.length > 0 ? (
                        <div className="bf-subgroup">
                          <h3 id={featuresId} className="bf-subgroup__title" data-bf-reveal>
                            {FEATURES_TITLE}
                          </h3>
                          <ProjectGrid items={features} headingLevel={4} labelledBy={featuresId} />
                        </div>
                      ) : null}
                    </>
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
