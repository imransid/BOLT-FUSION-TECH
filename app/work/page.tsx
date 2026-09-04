import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

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
 * Old design language — black base, Satoshi headings, existing card and beam
 * treatments. Not the trace rail.
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
    },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  };
}

const CARD_SHADOW = "16px 24px 20px 8px rgba(0,0,0,0.4)";

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
    <main className="py-20 px-5 md:px-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(graph) }}
      />

      <div className="max-w-[1600px] mx-auto flex flex-col gap-16">
        <header className="flex flex-col gap-6">
          <h1
            className="max-w-[18ch] text-5xl sm:text-7xl lg:text-[92px] font-normal leading-[1em]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            The systems, and how they were built.
          </h1>
          <p
            className="max-w-[640px] text-lg text-white/65 sm:text-xl"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {published.length === 2 ? "Two write-ups so far." : `${published.length} write-ups so far.`}{" "}
            Each one covers the actual architecture — constraints, decisions, tradeoffs, and what
            we&rsquo;d change. Not a screenshot and a paragraph.
          </p>
        </header>

        <ul className="flex list-none flex-col gap-16 p-0">
          {published.map((p) => {
            const rowMetrics = p.metricIds
              .map((id) => metrics.find((m) => m.id === id))
              .filter((m): m is NonNullable<typeof m> => Boolean(m));
            return (
              <li key={p.id} className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
                {/* Large screenshot — this page is the portfolio, thumbnails waste it. */}
                <a
                  href={p.href!}
                  className="group relative block aspect-[16/10] w-full overflow-hidden rounded-[30px] ring-1 ring-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
                  style={{ boxShadow: CARD_SHADOW }}
                  tabIndex={-1}
                  aria-hidden
                >
                  <Image
                    src={p.screenshot!}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-cover object-top transition-transform duration-700 ease-out md:group-hover:scale-[1.02]"
                  />
                </a>

                <div className="flex flex-col gap-5 lg:pt-4">
                  <h2
                    className="text-3xl md:text-4xl font-normal text-white"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {p.name}
                  </h2>

                  <p className="max-w-[60ch] text-base leading-relaxed text-white/80">
                    {p.summary}
                  </p>

                  {/* Every figure keeps its shipped/target label. No exceptions. */}
                  {rowMetrics.length > 0 ? (
                    <ul className="flex list-none flex-wrap gap-x-6 gap-y-3 p-0">
                      {rowMetrics.map((m) => {
                        const shipped = m.status === "shipped";
                        return (
                          <li key={m.id} className="flex items-baseline gap-2">
                            <span
                              className={`text-lg ${shipped ? "text-cyan-200" : "text-amber-300"}`}
                              style={{ fontFamily: "var(--font-machine)" }}
                            >
                              {m.value}
                            </span>
                            <span className="text-sm text-white/65">{m.label}</span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs ${
                                shipped
                                  ? "border-cyan-200/45 text-cyan-200"
                                  : "border-amber-300/50 text-amber-300"
                              }`}
                              style={{ fontFamily: "var(--font-machine)" }}
                            >
                              {m.status}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}

                  {p.stack.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {p.stack.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-xs text-white/70"
                          style={{ fontFamily: "var(--font-machine)" }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <p className="pt-1">
                    <a
                      href={p.href!}
                      className="beam-button corner-glow inline-block rounded-[10px] border border-white/10 bg-black px-6 py-3 text-sm text-white transition-all duration-500 hover:border-white/25 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
                    >
                      Read the write-up
                      <span className="sr-only"> for {p.name}</span>
                    </a>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <section
          className="flex flex-col gap-6 rounded-[30px] bg-[#0d0d0d] p-8 md:p-11"
          style={{ boxShadow: CARD_SHADOW }}
          aria-labelledby="work-cta"
        >
          <h2
            id="work-cta"
            className="max-w-[24ch] text-2xl md:text-3xl font-normal text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Building something with a constraint like these?
          </h2>
          <p>
            <Link
              href="/#contact"
              className="beam-button corner-glow inline-block rounded-[10px] border border-white/10 bg-black px-6 py-3 text-sm text-white transition-all duration-500 hover:border-white/25 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
            >
              Start a pilot
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
