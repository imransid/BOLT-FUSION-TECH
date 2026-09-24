import type { Metadata } from "next";

import FinalCta from "@/components/site/home/FinalCta";
import HowWeBuild from "@/components/site/home/HowWeBuild";
import TechnicalDepth from "@/components/site/home/TechnicalDepth";
import { CheckIcon } from "@/components/site/icons";
import JsonLd from "@/components/site/JsonLd";
import PageHead from "@/components/site/PageHead";
import SectionHead from "@/components/site/SectionHead";
import SiteShell from "@/components/site/SiteShell";
import { processSteps } from "@/content";
import { engineering } from "@/content/engineering";
import { pages } from "@/content/pages";
import { siteContent } from "@/content/site";
import { pageMetadata } from "@/lib/page-meta";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbLd } from "@/lib/structured-data";

export function generateMetadata(): Metadata {
  const m = pages.engineering.head.meta;
  return pageMetadata({ path: "/engineering", title: m.title, description: m.description });
}

/**
 * /engineering (SPEC §4): how we build — the six stages, a real sequence (the
 * homepage's section, one source) and the three phases they run as
 * (content/process.ts); the stack by layer, exactly SPEC §8b.2 (the homepage's
 * strata); the architecture principles, each from a system we built and linked
 * to where it is written up; and the verify-before-release discipline, told as
 * what the suite fails on, with no number. Then the final call to action.
 */
export default function EngineeringPage() {
  const site = getSiteUrl().toString();
  const e = pages.engineering;
  const crumbs = {
    "@context": "https://schema.org",
    ...breadcrumbLd(site, [
      { name: "Home", path: "/" },
      { name: "Engineering", path: "/engineering" },
    ]),
  };
  return (
    <>
      <JsonLd data={crumbs} />
      <SiteShell ground="graphite" current="/engineering">
        <PageHead id="engineering-title" eyebrow={e.head.eyebrow} title={e.head.title}>
          {e.head.lead.map((l) => (
            <p key={l} className="bf-lead">
              {l}
            </p>
          ))}
        </PageHead>

        <HowWeBuild />

        <section id="in-practice" className="bf-section" aria-labelledby="practice-title">
          <div className="bf-wrap">
            <SectionHead id="practice-title" eyebrow={e.inPractice.head.eyebrow} title={e.inPractice.head.title} lead={e.inPractice.head.lead} />
            <ol className="bf-phases">
              {e.inPractice.phases.map((ph) => {
                const step = processSteps.find((s) => s.id === ph.stepId);
                if (!step) throw new Error(`content/pages.ts: phase "${ph.stepId}" is not a step in content/process.ts`);
                return (
                  <li key={ph.stepId} className="bf-phase" data-bf-reveal>
                    <h3 className="bf-phase__title">{step.title}</h3>
                    <p className="bf-phase__body">{step.body}</p>
                    <p className="bf-phase__label">Stages</p>
                    <ul className="bf-phase__stages">
                      {ph.stageIds.map((id) => (
                        <li key={id}>{engineering.stages.find((s) => s.id === id)?.title ?? id}</li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <TechnicalDepth />

        <section id="principles" className="bf-section" aria-labelledby="principles-title">
          <div className="bf-wrap">
            <SectionHead id="principles-title" eyebrow={e.principles.head.eyebrow} title={e.principles.head.title} lead={e.principles.head.lead} />
            <ul className="bf-principles">
              {e.principles.items.map((p) => (
                <li key={p.id} id={`principle-${p.id}`} className="bf-principle" data-bf-reveal>
                  <h3 className="bf-principle__title">{p.title}</h3>
                  <p className="bf-principle__body">{p.body}</p>
                  <p className="bf-principle__label">Written up in</p>
                  <ul className="bf-principle__links">
                    {p.evidence.map((l) => (
                      <li key={l.href}>
                        <a href={l.href}>{l.label}</a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="verify" className="bf-section" aria-labelledby="verify-title">
          <div className="bf-wrap bf-verify">
            <SectionHead id="verify-title" eyebrow={e.verify.head.eyebrow} title={e.verify.head.title} lead={e.verify.head.lead} />
            <ul className="bf-checks">
              {e.verify.items.map((t) => (
                <li key={t} className="bf-check">
                  <CheckIcon className="bf-check__icon" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="bf-verify__note">{e.verify.note}</p>
          </div>
        </section>

        <FinalCta cta={siteContent.finalCta} />
      </SiteShell>
    </>
  );
}
