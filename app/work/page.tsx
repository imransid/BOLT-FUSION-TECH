import type { Metadata } from "next";
import ScreenImage from "@/components/techwix/ScreenImage";

import FigureText from "@/components/FigureText";
import Button from "@/components/techwix/Button";
import CtaPanel from "@/components/techwix/CtaPanel";
import PageBanner from "@/components/techwix/PageBanner";
import PageShell from "@/components/techwix/PageShell";
import ProjectCard, { AttributionLabel, ProjectFacts, ProjectLinks } from "@/components/techwix/ProjectCard";
import SectionHeading from "@/components/techwix/SectionHeading";
import StatusChip from "@/components/techwix/StatusChip";
import { Tags } from "@/components/techwix/Tags";
import { metrics, projectSections, projects, type Project } from "@/content";
import { getSiteUrl } from "@/lib/site-url";
import { jsonLdHtml } from "@/lib/structured-data";

/**
 * /work — every project the owner approved, each labelled with who built it
 * (CLAUDE.md, "Projects and attribution", decided 2026-09-15). Four sections,
 * one per kind, in `projectSections` order:
 *
 *  · case studies — one row per write-up: a large screenshot beside the text,
 *    its figures each with its shipped/target chip. Rows, not a grid: a
 *    two-item grid looks unfinished, two rows look deliberate;
 *  · Bolt Fusion projects, in-house products and our engineers' track record —
 *    cards on a grid that fills its rows at every width (app/techwix.css).
 *
 * Every card carries its attribution label directly above the project's name.
 * A track-record card is text only: the product belongs to someone else.
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
          alt: "Bolt Fusion Tech — We build AI systems that are still running in six months.",
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
  3: "(min-width: 1025px) 420px, (min-width: 768px) 50vw, 100vw",
  2: "(min-width: 768px) 50vw, 100vw",
  1: "(min-width: 768px) 55vw, 100vw",
};

/** A write-up's row: the screenshot, then the label, the name, the figures and
 *  the link to the write-up. */
function CaseStudyRow({ p }: { p: Project }) {
  const rowMetrics = p.metricIds
    .map((id) => metrics.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  return (
    <li className="tw-work__row" data-project-kind={p.kind} data-project-id={p.id}>
      {/* Large screenshot — this page is the portfolio, thumbnails waste it.
          The button below is the row's link for keyboards and screen readers;
          this one is for the pointer. */}
      <a href={p.href!} className="tw-work__shot" tabIndex={-1} aria-hidden data-tw-reveal>
        <ScreenImage src={p.image!.src} alt="" fill sizes="(min-width: 1025px) 55vw, 100vw" className="tw-work__img" />
      </a>

      <div className="tw-work__body" data-tw-reveal>
        <AttributionLabel p={p} />
        <h3 className="tw-title-wrapper">
          <span className="title-sub">{p.name}</span>
        </h3>

        <p className="tw-work__summary">{p.summary}</p>

        <ProjectFacts p={p} />

        {/* Every figure keeps its shipped/target label, beside it. No exceptions. */}
        {rowMetrics.length > 0 ? (
          <ul className="tw-metrics">
            {rowMetrics.map((m) => (
              <li key={m.id} className="tw-metric">
                {/* The figure and its own chip, in a box that names the metric
                    (content/metrics.ts): a chip in the label is the label's
                    figure's, never this one's. */}
                <span className="tw-metric__fig" data-metric={m.id}>
                  <span className="tw-metric__value">{m.value}</span>
                  <StatusChip status={m.status} />
                </span>
                <span className="tw-metric__label">
                  <FigureText text={m.label} />
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {p.stack.length > 0 ? <Tags items={p.stack} /> : null}

        <ProjectLinks p={p} />

        <p>
          <Button href={p.href!} variant="primary">
            Read the write-up
            <span className="sr-only"> for {p.name}</span>
          </Button>
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(graph) }} />
      <PageShell current="/work">
        <PageBanner titleId="work-title" title="The systems, and how they were built." titleSize="major">
          <p className="tw-banner__lead">
            {caseStudies.length === 2 ? "Two write-ups so far." : `${caseStudies.length} write-ups so far.`} Each one
            covers the actual architecture — constraints, decisions, tradeoffs, and what we&rsquo;d change. Not a
            screenshot and a paragraph.
          </p>
          <p className="tw-banner__lead">
            Below the write-ups: the other products we built, for clients and for ourselves, and what our engineers
            shipped at previous employers. Every card says who built it.
          </p>
        </PageBanner>

        {sections.map((s, i) => {
          /* the bands alternate back from the closing panel, which is on the
             light band: the last section is white */
          const band = (sections.length - 1 - i) % 2 === 0 ? "tw-band--white" : "tw-band--light";
          const cols = columns(s.items.length);
          return (
            <section key={s.id} id={s.id} className={`tw-band ${band}`} aria-labelledby={`${s.id}-title`}>
              <div className="tw-band__inner">
                <SectionHeading id={`${s.id}-title`} title={s.title} intro={s.intro ?? undefined} />
                {s.kind === "case-study" ? (
                  <ul className="tw-work">
                    {s.items.map((p) => (
                      <CaseStudyRow key={p.id} p={p} />
                    ))}
                  </ul>
                ) : (
                  <ul className={`tw-projects tw-projects--${cols}`}>
                    {s.items.map((p) => (
                      <ProjectCard key={p.id} p={p} sizes={SIZES[cols]} />
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        })}

        <CtaPanel titleId="work-cta" title="Building something with a constraint like these?">
          <Button href="/#contact" variant="light">
            Start a pilot
          </Button>
        </CtaPanel>
      </PageShell>
    </>
  );
}
