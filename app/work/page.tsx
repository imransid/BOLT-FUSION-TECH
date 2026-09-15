import type { Metadata } from "next";
import Image from "next/image";

import FigureText from "@/components/FigureText";
import Button from "@/components/techwix/Button";
import CtaPanel from "@/components/techwix/CtaPanel";
import PageBanner from "@/components/techwix/PageBanner";
import PageShell from "@/components/techwix/PageShell";
import StatusChip from "@/components/techwix/StatusChip";
import { Tags } from "@/components/techwix/Tags";
import { metrics, projects } from "@/content";
import { getSiteUrl } from "@/lib/site-url";
import { jsonLdHtml } from "@/lib/structured-data";

/**
 * /work — the case-study index. Spec §2.
 *
 * Rows, not a grid: a two-item grid looks unfinished, two rows look deliberate.
 * Scales to 12 without redesign; at 8+ studies this becomes a two-column grid and
 * gains filters (spec §6 step 4) — not before. No filters and no pagination here,
 * because thirty filters over two items announces the gap.
 *
 * INDEXABLE, deliberately. The reference site sets follow,noindex on its index and
 * earns nothing for 140 studies. This one is crawlable, in the sitemap, and carries
 * CollectionPage schema.
 *
 * In the site's design (app/techwix.css): the navy page banner, one row per
 * write-up on a white band, and the navy call-to-action panel.
 *
 * Only `published` projects appear: spec §2 — "A card that can't be clicked doesn't
 * belong on a page whose promise is depth." The filter is on state, so an
 * unsubstantiated project cannot reach this page by accident.
 */

const TITLE = "Case studies — how the systems were built | Bolt Fusion Tech";
const DESCRIPTION =
  "Architecture-level write-ups of the systems we shipped: constraints, decisions, tradeoffs, and the numbers, each labelled shipped or target.";

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

export default function WorkIndexPage() {
  const published = projects.filter((p) => p.state === "published");
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
        hasPart: published.map((p) => ({
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
            {published.length === 2 ? "Two write-ups so far." : `${published.length} write-ups so far.`} Each one covers
            the actual architecture — constraints, decisions, tradeoffs, and what we&rsquo;d change. Not a screenshot and a
            paragraph.
          </p>
        </PageBanner>

        <div className="tw-band tw-band--white">
          <div className="tw-band__inner">
            <ul className="tw-work">
              {published.map((p) => {
                const rowMetrics = p.metricIds
                  .map((id) => metrics.find((m) => m.id === id))
                  .filter((m): m is NonNullable<typeof m> => Boolean(m));
                return (
                  <li key={p.id} className="tw-work__row">
                    {/* Large screenshot — this page is the portfolio, thumbnails
                        waste it. The button below is the row's link for keyboards
                        and screen readers; this one is for the pointer. */}
                    <a href={p.href!} className="tw-work__shot" tabIndex={-1} aria-hidden data-tw-reveal>
                      <Image src={p.screenshot!} alt="" fill sizes="(min-width: 1025px) 55vw, 100vw" className="tw-work__img" />
                    </a>

                    <div className="tw-work__body" data-tw-reveal>
                      <h2 className="tw-title-wrapper">
                        <span className="title-section">{p.name}</span>
                      </h2>

                      <p className="tw-work__summary">{p.summary}</p>

                      {/* Every figure keeps its shipped/target label, beside it. No exceptions. */}
                      {rowMetrics.length > 0 ? (
                        <ul className="tw-metrics">
                          {rowMetrics.map((m) => (
                            <li key={m.id} className="tw-metric">
                              {/* The figure and its own chip, in a box that names
                                  the metric (content/metrics.ts): a chip in the
                                  label is the label's figure's, never this one's. */}
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

                      <p>
                        <Button href={p.href!} variant="primary">
                          Read the write-up
                          <span className="sr-only"> for {p.name}</span>
                        </Button>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <CtaPanel titleId="work-cta" title="Building something with a constraint like these?">
          <Button href="/#contact" variant="light">
            Start a pilot
          </Button>
        </CtaPanel>
      </PageShell>
    </>
  );
}
