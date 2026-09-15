import FigureText from "@/components/FigureText";
import Cta from "@/components/site/Cta";
import CtaBand from "@/components/site/CtaBand";
import { KpiCard, KpiGrid } from "@/components/site/Kpi";
import LaneCard from "@/components/site/LaneCard";
import { Bullets, Tags } from "@/components/site/Lists";
import PageHead from "@/components/site/PageHead";
import SectionHead from "@/components/site/SectionHead";
import Shot from "@/components/site/Shot";
import Summary from "@/components/site/Summary";
import type { SiteContent } from "@/content/site-schema";

/**
 * The restaurant search write-up, /work/restaurant-search: the approved
 * `caseStudy` block in content/site.ts, word for word, in the site's one
 * design (restyled 2026-09-16, the section order kept). A server component —
 * the page hands it its slice of the content.
 *
 * In order: the page head (badge, title, lead, stack line, the system
 * diagram beside them), the executive summary and the KPIs, the three lanes,
 * the stack beside the bounded contexts, and the closing call to action. Every
 * figure goes through <FigureText> or a KPI cell, so each carries its own chip
 * or its exemption (content/figure-labels.ts, verify-site check 8).
 */
export default function CaseStudy({ cs }: { cs: SiteContent["caseStudy"] }) {
  const featuredContext = cs.contexts.find((c) => c.featured);
  const otherContexts = cs.contexts.filter((c) => !c.featured);

  return (
    <>
      <PageHead
        id="case-study-heading"
        title={cs.title}
        eyebrow={cs.badge}
        describedBy="case-study-lead case-study-summary"
        aside={
          <Shot src={cs.imageSrc} alt={cs.imageAlt} sizes="(min-width: 1025px) 520px, calc(100vw - 32px)" center priority>
            <div className="bf-shot__caption bf-shot__caption--bar">
              <span>{cs.diagramBadgeLeft}</span>
              <span>{cs.diagramBadgeRight}</span>
            </div>
            <figcaption className="sr-only">{cs.imageAlt}</figcaption>
          </Shot>
        }
      >
        <p id="case-study-lead" className="bf-lead">
          {cs.subtitle}
        </p>
        <p className="bf-pagehead__meta">{cs.titleAccentLine}</p>
      </PageHead>

      <div className="bf-section">
        <div className="bf-wrap">
          <Summary label="Executive summary" id="case-study-summary">
            <FigureText text={cs.executiveSummary} />
          </Summary>

          <section className="bf-subsection" aria-labelledby="case-study-kpi-heading">
            <SectionHead id="case-study-kpi-heading" eyebrow={cs.kpiSectionEyebrow} title={cs.kpiBlockTitle} />
            <KpiGrid labelledBy="case-study-kpi-heading">
              {cs.kpis.map((k) => (
                <KpiCard
                  key={k.label}
                  value={k.value}
                  label={k.label}
                  status={k.status}
                  hint={k.hint ? <FigureText text={k.hint} /> : undefined}
                />
              ))}
            </KpiGrid>
          </section>
        </div>
      </div>

      <section className="bf-section" aria-labelledby="case-study-lanes-heading" aria-describedby="case-study-lanes-intro">
        <div className="bf-wrap">
          <SectionHead id="case-study-lanes-heading" title={cs.lanesSectionTitle} lead={cs.lanesIntro} leadId="case-study-lanes-intro" />
          <ul className="bf-lanecards">
            {cs.lanes.map((lane) => (
              <LaneCard
                key={lane.lane}
                marker={lane.lane}
                meta={
                  <>
                    {/* each figure stays on one line with its chip: a chip wrapped
                        onto a line of its own reads as stray */}
                    <span className="bf-nowrap">
                      <FigureText text={lane.traffic} />
                    </span>
                    <span>, </span>
                    <span className="bf-nowrap">
                      <FigureText text={lane.latency} />
                    </span>
                  </>
                }
                title={lane.title}
                summary={lane.summary}
                bullets={lane.bullets}
                foot={lane.costLine ? <FigureText text={lane.costLine} /> : undefined}
              />
            ))}
          </ul>
        </div>
      </section>

      <div className="bf-section">
        <div className="bf-wrap bf-split">
          <section className="bf-col" aria-labelledby="case-study-stack-heading">
            <SectionHead id="case-study-stack-heading" eyebrow={cs.stackSectionTitle} title={cs.stackBlockTitle} />
            <div className="bf-stackgroups">
              {cs.stackGroups.map((g) => (
                <div key={g.title} className="bf-card" data-bf-reveal>
                  <p className="bf-card__label">{g.title}</p>
                  <Tags items={g.items} />
                </div>
              ))}
            </div>
          </section>

          <section className="bf-col" aria-labelledby="case-study-arch-heading" aria-describedby="case-study-arch-lead">
            <SectionHead
              id="case-study-arch-heading"
              eyebrow={cs.architectureSectionTitle}
              title={cs.architectureBlockTitle}
              lead={cs.architectureLead}
              leadId="case-study-arch-lead"
            />

            {featuredContext ? (
              <article className="bf-card bf-card--featured" aria-label={`${featuredContext.name} bounded context`} data-bf-reveal>
                <p className="bf-card__label">Primary bounded context</p>
                <h3 className="bf-card__name">{featuredContext.name}</h3>
                <p className="bf-card__tagline">{featuredContext.tagline}</p>
                <Bullets items={featuredContext.bullets} />
              </article>
            ) : null}

            <div className="bf-group" data-bf-reveal>
              <p className="bf-card__label">{cs.patternsSectionTitle}</p>
              <Tags items={cs.patterns} label={cs.patternsSectionTitle} />
            </div>

            <div className="bf-grid-2">
              {otherContexts.map((ctx) => (
                <div key={ctx.name} className="bf-card" data-bf-reveal>
                  <h3 className="bf-card__name">{ctx.name}</h3>
                  <p className="bf-card__tagline">{ctx.tagline}</p>
                  <Bullets items={ctx.bullets} />
                </div>
              ))}
            </div>

            <div className="bf-card" data-bf-reveal>
              <p className="bf-card__label">{cs.sharedKernelTitle}</p>
              <Bullets items={cs.sharedKernelItems} />
            </div>
          </section>
        </div>
      </div>

      <CtaBand text={cs.ctaSupportingText}>
        <Cta href={cs.primaryCtaHref} variant="ghost">
          {cs.primaryCtaLabel}
        </Cta>
        <Cta href={cs.secondaryCtaHref} variant="ghost">
          {cs.secondaryCtaLabel}
        </Cta>
      </CtaBand>
    </>
  );
}
