import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import FigureText from "@/components/FigureText";
import CodeBlock from "@/components/site/CodeBlock";
import FlowSteps from "@/components/site/FlowSteps";
import FinalCta from "@/components/site/home/FinalCta";
import JsonLd from "@/components/site/JsonLd";
import PageHead from "@/components/site/PageHead";
import SiteShell from "@/components/site/SiteShell";
import { engineering } from "@/content/engineering";
import { insights } from "@/content/insights";
import type { InsightSection } from "@/content/insights-schema";
import { siteContent } from "@/content/site";
import { longDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/page-meta";
import { getSiteUrl } from "@/lib/site-url";
import { articleLd, breadcrumbLd } from "@/lib/structured-data";
import { workLink } from "@/lib/work-links";

type Params = { params: Promise<{ slug: string }> };

/* Every article is built at build time; any other slug is the 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return insights.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = insights.find((x) => x.slug === slug);
  if (!a) return {};
  return pageMetadata({
    path: `/insights/${a.slug}`,
    title: a.title,
    description: a.description ?? a.dek,
    article: { publishedTime: a.datePublished, author: a.author },
  });
}

const capName = (id: string) => engineering.capabilities.find((c) => c.id === id)?.name ?? id;

/** A section in reading order: its paragraphs, with its list, code block and
 *  diagram each after the paragraph `place` names (content/insights-schema.ts),
 *  or after them all. Paragraphs and bullets go through <FigureText>, so every
 *  figure carries its chip or its exemption (scripts/verify-insights.mjs). */
function sectionBody(s: InsightSection, i: number): ReactNode[] {
  const extras = (["bullets", "code", "diagram"] as const).filter((k) => s[k]);
  const after = (k: (typeof extras)[number]) => s.place?.[k] ?? s.paragraphs.length;
  const render = (k: (typeof extras)[number]) => {
    if (k === "bullets")
      return (
        <ul key="bullets" className="bf-prose__list">
          {s.bullets!.map((b) => (
            <li key={b}>
              <FigureText text={b} />
            </li>
          ))}
        </ul>
      );
    if (k === "code") return <CodeBlock key="code" code={s.code!} id={`code-${i + 1}`} />;
    return <FlowSteps key="diagram" diagram={s.diagram!} id={`flow-${i + 1}`} />;
  };
  const out: ReactNode[] = [];
  s.paragraphs.forEach((p, j) => {
    out.push(
      <p key={`p${j}`}>
        <FigureText text={p} />
      </p>,
    );
    for (const k of extras) if (after(k) === j + 1) out.push(render(k));
  });
  return out;
}

/**
 * An article (SPEC §6): the head (a link back to the index, the one h1 — the
 * Article's headline — the dek, the author and the date), the sections in
 * reading order, and beside them the related work, the capabilities it comes
 * from and the other articles. Code is set in Barlow 500 with tabular figures
 * — the site loads no mono face — in a box that scrolls sideways, captioned;
 * each "diagram" is drawn as an ordered flow. Article and BreadcrumbList
 * structured data from the same entry the page renders.
 */
export default async function InsightPage({ params }: Params) {
  const { slug } = await params;
  const a = insights.find((x) => x.slug === slug);
  if (!a) notFound();

  const site = getSiteUrl().toString();
  const path = `/insights/${a.slug}`;
  const related = a.relatedWork.map(workLink);
  const others = insights.filter((x) => x.slug !== a.slug);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      articleLd(site, {
        path,
        headline: a.title,
        description: a.dek,
        datePublished: a.datePublished,
        author: a.author,
        about: a.capabilities.map(capName),
      }),
      breadcrumbLd(site, [
        { name: "Home", path: "/" },
        { name: "Insights", path: "/insights" },
        { name: a.title, path },
      ]),
    ],
  };

  return (
    <>
      <JsonLd data={graph} />
      <SiteShell ground="graphite" current="/insights">
        <article className="bf-article" aria-labelledby="article-title">
          <PageHead id="article-title" eyebrow="Insight" back={{ href: "/insights", label: "← All insights" }} title={a.title} size="long">
            <p className="bf-lead">{a.dek}</p>
            <p className="bf-pagehead__meta">
              <span>{a.author}</span>
              <time dateTime={a.datePublished}>{longDate(a.datePublished)}</time>
            </p>
          </PageHead>

          <div className="bf-section bf-article__main">
            <div className="bf-wrap bf-article__grid">
              <div className="bf-article__body bf-prose">
                {a.sections.map((s, i) => (
                  <section key={s.heading} aria-labelledby={`section-${i + 1}`}>
                    <h2 id={`section-${i + 1}`}>{s.heading}</h2>
                    {sectionBody(s, i)}
                  </section>
                ))}
              </div>

              <div className="bf-article__aside">
                {related.length ? (
                  <div className="bf-article__block">
                    <p id="article-related" className="bf-article__label">
                      Related work
                    </p>
                    <ul aria-labelledby="article-related">
                      {related.map((w) => (
                        <li key={w.id}>
                          <a href={w.href}>{w.name}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="bf-article__block">
                  <p id="article-capabilities" className="bf-article__label">
                    Capabilities
                  </p>
                  <ul aria-labelledby="article-capabilities">
                    {a.capabilities.map((id) => (
                      <li key={id}>
                        <a href={`/capabilities#${id}`}>{capName(id)}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                {others.length ? (
                  <div className="bf-article__block">
                    <p id="article-more" className="bf-article__label">
                      More insights
                    </p>
                    <ul aria-labelledby="article-more">
                      {others.map((o) => (
                        <li key={o.slug}>
                          <a href={`/insights/${o.slug}`}>{o.title}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </article>

        <FinalCta cta={siteContent.finalCta} />
      </SiteShell>
    </>
  );
}
