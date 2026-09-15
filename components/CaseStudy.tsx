import FigureText from "@/components/FigureText";
import Button from "@/components/techwix/Button";
import CtaPanel from "@/components/techwix/CtaPanel";
import { KpiCard, KpiGrid } from "@/components/techwix/Kpi";
import LaneCard from "@/components/techwix/LaneCard";
import PageBanner from "@/components/techwix/PageBanner";
import SectionHeading from "@/components/techwix/SectionHeading";
import Shot from "@/components/techwix/Shot";
import Summary from "@/components/techwix/Summary";
import { Bullets, Tags } from "@/components/techwix/Tags";
import type { SiteContent } from "@/content/site-schema";

/**
 * The restaurant search write-up, /work/restaurant-search: the approved
 * `caseStudy` block in content/site.ts, word for word, in the site's design.
 * A server component — the page hands it its slice of the content.
 *
 * In order: the banner (badge, title, lead, stack line, the system diagram),
 * the executive summary and the KPIs, the three lanes, the stack beside the
 * bounded contexts, and the closing call to action. Every figure goes through
 * <FigureText> or a KPI card, so each carries its own chip or its exemption
 * (content/figure-labels.ts, verify-site check 8).
 */
export default function CaseStudy({ cs }: { cs: SiteContent["caseStudy"] }) {
  const featuredContext = cs.contexts.find((c) => c.featured);
  const otherContexts = cs.contexts.filter((c) => !c.featured);

  return (
    <>
      <PageBanner
        titleId="case-study-heading"
        title={cs.title}
        eyebrow={cs.badge}
        describedBy="case-study-lead case-study-summary"
        aside={
          <Shot src={cs.imageSrc} alt={cs.imageAlt} sizes="(min-width: 1025px) 560px, 100vw" center priority>
            <div className="tw-shot__caption tw-shot__caption--bar">
              <span>{cs.diagramBadgeLeft}</span>
              <span>{cs.diagramBadgeRight}</span>
            </div>
            <figcaption className="sr-only">{cs.imageAlt}</figcaption>
          </Shot>
        }
      >
        <p id="case-study-lead" className="tw-banner__lead">
          {cs.subtitle}
        </p>
        <p className="tw-banner__meta">{cs.titleAccentLine}</p>
      </PageBanner>

      <div className="tw-band tw-band--white">
        <div className="tw-band__inner">
          <Summary label="Executive summary" id="case-study-summary">
            <FigureText text={cs.executiveSummary} />
          </Summary>

          <section className="tw-band__inner" aria-labelledby="case-study-kpi-heading">
            <SectionHeading id="case-study-kpi-heading" eyebrow={cs.kpiSectionEyebrow} title={cs.kpiBlockTitle} />
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

      <section
        className="tw-band tw-band--light"
        aria-labelledby="case-study-lanes-heading"
        aria-describedby="case-study-lanes-intro"
      >
        <div className="tw-band__inner">
          <SectionHeading
            id="case-study-lanes-heading"
            title={cs.lanesSectionTitle}
            intro={cs.lanesIntro}
            introId="case-study-lanes-intro"
          />
          <ul className="tw-lanes">
            {cs.lanes.map((lane) => (
              <LaneCard
                key={lane.lane}
                marker={lane.lane}
                meta={
                  <>
                    {/* each figure stays on one line with its chip: a chip wrapped
                        onto a line of its own reads as stray */}
                    <span className="tw-nowrap">
                      <FigureText text={lane.traffic} />
                    </span>
                    <span>, </span>
                    <span className="tw-nowrap">
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

      <div className="tw-band tw-band--white">
        <div className="tw-band__inner">
          <div className="tw-split">
            <section className="tw-col tw-col--loose" aria-labelledby="case-study-stack-heading">
              <SectionHeading id="case-study-stack-heading" eyebrow={cs.stackSectionTitle} title={cs.stackBlockTitle} />
              <div className="tw-col">
                {cs.stackGroups.map((g) => (
                  <div key={g.title} className="tw-card tw-card--soft" data-tw-reveal>
                    <p className="tw-card__label">{g.title}</p>
                    <Tags items={g.items} />
                  </div>
                ))}
              </div>
            </section>

            <section
              className="tw-col tw-col--loose"
              aria-labelledby="case-study-arch-heading"
              aria-describedby="case-study-arch-lead"
            >
              <SectionHeading
                id="case-study-arch-heading"
                eyebrow={cs.architectureSectionTitle}
                title={cs.architectureBlockTitle}
                intro={cs.architectureLead}
                introId="case-study-arch-lead"
              />

              {featuredContext ? (
                <article
                  className="tw-card tw-card--soft"
                  aria-label={`${featuredContext.name} bounded context`}
                  data-tw-reveal
                >
                  <p className="tw-eyebrow">Primary bounded context</p>
                  <h3 className="tw-title-wrapper">
                    <span className="title-small">{featuredContext.name}</span>
                  </h3>
                  <p className="tw-card__tagline">{featuredContext.tagline}</p>
                  <Bullets items={featuredContext.bullets} />
                </article>
              ) : null}

              <div className="tw-group" data-tw-reveal>
                <p className="tw-card__label">{cs.patternsSectionTitle}</p>
                <Tags items={cs.patterns} label={cs.patternsSectionTitle} />
              </div>

              <div className="tw-grid-2">
                {otherContexts.map((ctx) => (
                  <div key={ctx.name} className="tw-card" data-tw-reveal>
                    <h3 className="tw-title-wrapper">
                      <span className="title-small">{ctx.name}</span>
                    </h3>
                    <p className="tw-card__tagline">{ctx.tagline}</p>
                    <Bullets items={ctx.bullets} />
                  </div>
                ))}
              </div>

              <div className="tw-card tw-card--soft" data-tw-reveal>
                <p className="tw-card__label">{cs.sharedKernelTitle}</p>
                <Bullets items={cs.sharedKernelItems} />
              </div>
            </section>
          </div>
        </div>
      </div>

      <CtaPanel text={cs.ctaSupportingText}>
        <Button href={cs.primaryCtaHref} variant="light">
          {cs.primaryCtaLabel}
        </Button>
        <Button href={cs.secondaryCtaHref} variant="secondary">
          {cs.secondaryCtaLabel}
        </Button>
      </CtaPanel>
    </>
  );
}
