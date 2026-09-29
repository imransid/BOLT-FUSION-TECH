import type { Metadata } from "next";

import FigureText from "@/components/FigureText";
import CapabilityDiagram from "@/components/site/diagrams";
import DomainGlyph from "@/components/site/DomainGlyph";
import FinalCta from "@/components/site/home/FinalCta";
import SystemMapSection from "@/components/site/home/SystemMapSection";
import JsonLd from "@/components/site/JsonLd";
import PageHead from "@/components/site/PageHead";
import SiteShell from "@/components/site/SiteShell";
import StatusChip from "@/components/site/StatusChip";
import TierChip, { TierLegend } from "@/components/site/TierChip";
import { metrics } from "@/content";
import { engineering } from "@/content/engineering";
import type { Capability } from "@/content/engineering-schema";
import { insights } from "@/content/insights";
import type { Insight } from "@/content/insights-schema";
import { pages } from "@/content/pages";
import { siteContent } from "@/content/site";
import { pageMetadata } from "@/lib/page-meta";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbLd, organizationLd, serviceLd } from "@/lib/structured-data";
import { workLabel, workLink } from "@/lib/work-links";

export function generateMetadata(): Metadata {
  const m = pages.capabilities.head.meta;
  return pageMetadata({ path: "/capabilities", title: m.title, description: m.description });
}

/**
 * One capability in depth (SPEC §4): the same entry the homepage summarises
 * (content/engineering.ts), with every depth field — the body, what we build
 * (and robotics' "What we'd build"), how we approach it, the evidence tier with
 * its note, the figures behind it where it has them (each `[data-metric]` row
 * holding its own chip, verify-site check 8), the linked work, the articles
 * written from it, and its OWN diagram beside the text.
 *
 * Robotics is Lab: its honesty line is a visible element marked `data-honesty`,
 * its chip is Lab, and its diagram is captioned "Concept — not a shipped
 * system". The section's `id` is the anchor the homepage's "in depth" links
 * point at (/capabilities#software …).
 */
function CapabilityDetail({ c, flip, reading }: { c: Capability; flip: boolean; reading: readonly Insight[] }) {
  const titleId = `${c.id}-title`;
  const work = c.workSlugs.map(workLink);
  const shown = c.metricIds.map((id) => metrics.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => Boolean(m));
  const lab = c.evidence.some((e) => e.tier === "lab");
  return (
    <section id={c.id} data-capability={c.id} className={`bf-section bf-cap bf-cap--depth${flip ? " bf-cap--flip" : ""}`} aria-labelledby={titleId}>
      <div className="bf-wrap bf-cap__inner">
        <div className="bf-cap__text">
          <p className="bf-eyebrow bf-eyebrow--glyph">
            <DomainGlyph id={c.id} className="bf-eyebrow__glyph" />
            {c.name}
          </p>
          <h2 id={titleId} className="bf-h2">
            {c.title}
          </h2>
          <p className="bf-lead">
            <FigureText text={c.body} />
          </p>
          {c.honesty ? (
            <p className="bf-honesty" data-honesty>
              {c.honesty}
            </p>
          ) : null}

          <h3 className="bf-h4">{c.buildHeading}</h3>
          {c.buildNote ? (
            <p className="bf-build__note">
              <FigureText text={c.buildNote} />
            </p>
          ) : null}
          <ul className={`bf-build${c.whatWeBuild.length > 6 ? " bf-build--modules" : ""}`}>
            {c.whatWeBuild.map((b) => (
              <li key={b.label}>
                <FigureText text={b.label} />
                {b.tier ? <TierChip tier={b.tier} /> : null}
              </li>
            ))}
          </ul>

          <h3 className="bf-h4">{lab ? "How we’d approach it" : "How we approach it"}</h3>
          <ul className="bf-approach">
            {c.approach.map((a) => (
              <li key={a}>
                <FigureText text={a} />
              </li>
            ))}
          </ul>

          <h3 className="bf-h4">Evidence</h3>
          <div className="bf-evidence bf-evidence--depth">
            <div className="bf-evidence__tiers">
              {c.evidence.map((e) => (
                <TierChip key={e.tier} tier={e.tier} scope={e.scope} />
              ))}
            </div>
            <p className="bf-evidence__note">
              <FigureText text={c.evidenceNote} />
            </p>
            {shown.length ? (
              <ul className="bf-capfigs" aria-label={`${c.name}: figures`}>
                {shown.map((m) => (
                  <li key={m.id} className="bf-capfigs__item">
                    <p className="bf-capfigs__top" data-metric={m.id}>
                      <span className="bf-capfigs__figure">{m.value}</span>
                      <StatusChip status={m.status} />
                    </p>
                    <p className="bf-capfigs__label">
                      <FigureText text={m.label} />
                    </p>
                    {m.href ? (
                      <p className="bf-capfigs__source">
                        <a href={m.href}>{m.source}</a>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {work.length ? (
              <div className="bf-evidence__work">
                <p id={`${c.id}-work`} className="bf-evidence__label">
                  {workLabel(c)}
                </p>
                <ul aria-labelledby={`${c.id}-work`}>
                  {work.map((w) => (
                    <li key={w.id}>
                      <a href={w.href}>{w.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {reading.length ? (
              <div className="bf-evidence__work">
                <p id={`${c.id}-reading`} className="bf-evidence__label">
                  Written up
                </p>
                <ul aria-labelledby={`${c.id}-reading`}>
                  {reading.map((a) => (
                    <li key={a.slug}>
                      <a href={`/insights/${a.slug}`}>{a.title}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <figure className="bf-cap__figure" data-bf-flow>
          <div className="bf-cap__plate">
            <CapabilityDiagram capability={c} />
          </div>
          <figcaption className="bf-cap__figcaption">
            {c.diagram.caption ? <span className="bf-cap__caption">{c.diagram.caption}</span> : null}
            <span className="bf-cap__desc">{c.diagram.description}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/**
 * /capabilities (SPEC §4): the six capabilities in depth, in the redesign.
 * The page head with the tier legend, a contents row (each capability with its
 * tier), then one full-bleed section per capability, text and its own diagram
 * alternating sides, then the system map — how the six fit together — and the
 * final call to action. One Service node per capability
 * (lib/structured-data.ts), from the same entries.
 *
 * The system map moved here from the homepage on 2026-09-28 (DECISIONS item
 * 1): its parts ARE the six capabilities, so it belongs where the reader has
 * already chosen depth on them, after them. Its lists — every part, every
 * connection and the three worked flows — are the no-JS and crawler view, as
 * they were on the homepage.
 */
export default function CapabilitiesPage() {
  const site = getSiteUrl().toString();
  const h = pages.capabilities.head;
  const sameAs = siteContent.footer.socialLinks.map((l) => l.url);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      organizationLd(site, sameAs),
      ...serviceLd(site),
      breadcrumbLd(site, [
        { name: "Home", path: "/" },
        { name: "Capabilities", path: "/capabilities" },
      ]),
    ],
  };
  return (
    <>
      <JsonLd data={graph} />
      <SiteShell ground="graphite" current="/capabilities">
        <PageHead id="capabilities-title" eyebrow={h.eyebrow} title={h.title}>
          {h.lead.map((p) => (
            <p key={p} className="bf-lead">
              {p}
            </p>
          ))}
          <TierLegend />
        </PageHead>

        <nav className="bf-toc" aria-label="The six capabilities">
          <div className="bf-wrap">
            <ol className="bf-toc__list">
              {engineering.capabilities.map((c) => (
                <li key={c.id} className="bf-toc__cell">
                  <a href={`#${c.id}`} className="bf-toc__link">
                    <DomainGlyph id={c.id} className="bf-toc__glyph" />
                    <span className="bf-toc__name">{c.name}</span>
                    {/* Every tier with its scope, as the ledger shows them
                        (2026-09-29, the honesty review): the first alone read
                        ERP as a plain "Proven" (verify-site check 33). */}
                    <span className="bf-toc__tier">
                      {c.evidence.map((e) => (
                        <TierChip key={e.tier} tier={e.tier} scope={e.scope} />
                      ))}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {engineering.capabilities.map((c, i) => (
          <CapabilityDetail key={c.id} c={c} flip={i % 2 === 1} reading={insights.filter((a) => a.capabilities.includes(c.id))} />
        ))}

        <SystemMapSection />

        <FinalCta cta={siteContent.finalCta} />
      </SiteShell>
    </>
  );
}
