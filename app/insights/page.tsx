import type { Metadata } from "next";

import FinalCta from "@/components/site/home/FinalCta";
import JsonLd from "@/components/site/JsonLd";
import PageHead from "@/components/site/PageHead";
import SiteShell from "@/components/site/SiteShell";
import { engineering } from "@/content/engineering";
import { insights } from "@/content/insights";
import { pages } from "@/content/pages";
import { siteContent } from "@/content/site";
import { longDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/page-meta";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbLd } from "@/lib/structured-data";

export function generateMetadata(): Metadata {
  const m = pages.insights.head.meta;
  return pageMetadata({ path: "/insights", title: m.title, description: m.description });
}

const capName = (id: string) => engineering.capabilities.find((c) => c.id === id)?.name ?? id;

/**
 * /insights (SPEC §6): the index of the articles in content/insights.ts — each
 * one's date and author, its title (an h2 linking to it), its dek, and the
 * capabilities it comes from. A ledger of rows, not a grid of cards.
 */
export default function InsightsIndex() {
  const site = getSiteUrl().toString();
  const h = pages.insights.head;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": new URL("/insights", site).toString(),
        name: "Insights",
        description: h.meta.description,
        isPartOf: { "@id": `${site}#website` },
        hasPart: insights.map((a) => ({
          "@type": "Article",
          headline: a.title,
          description: a.dek,
          datePublished: a.datePublished,
          url: new URL(`/insights/${a.slug}`, site).toString(),
        })),
      },
      breadcrumbLd(site, [
        { name: "Home", path: "/" },
        { name: "Insights", path: "/insights" },
      ]),
    ],
  };
  return (
    <>
      <JsonLd data={graph} />
      <SiteShell ground="graphite" current="/insights">
        <PageHead id="insights-title" eyebrow={h.eyebrow} title={h.title}>
          {h.lead.map((l) => (
            <p key={l} className="bf-lead">
              {l}
            </p>
          ))}
        </PageHead>

        <section id="articles" className="bf-section" aria-label="Articles">
          <div className="bf-wrap">
            <ul className="bf-articles">
              {insights.map((a) => (
                <li key={a.slug} className="bf-articles__item" data-bf-reveal>
                  <p className="bf-articles__meta">
                    <time dateTime={a.datePublished}>{longDate(a.datePublished)}</time>
                    <span>{a.author}</span>
                  </p>
                  <div className="bf-articles__main">
                    <h2 className="bf-articles__title">
                      <a href={`/insights/${a.slug}`}>{a.title}</a>
                    </h2>
                    <p className="bf-articles__dek">{a.dek}</p>
                    <ul className="bf-articles__caps" aria-label={`${a.title}: capabilities`}>
                      {a.capabilities.map((id) => (
                        <li key={id}>{capName(id)}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <FinalCta cta={siteContent.finalCta} />
      </SiteShell>
    </>
  );
}
