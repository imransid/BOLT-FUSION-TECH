import type { Metadata } from "next";

import DomainGlyph from "@/components/site/DomainGlyph";
import FinalCta from "@/components/site/home/FinalCta";
import JsonLd from "@/components/site/JsonLd";
import PageHead from "@/components/site/PageHead";
import SectionHead from "@/components/site/SectionHead";
import SiteShell from "@/components/site/SiteShell";
import { engineering } from "@/content/engineering";
import type { Industry } from "@/content/engineering-schema";
import { pages } from "@/content/pages";
import { siteContent } from "@/content/site";
import { pageMetadata } from "@/lib/page-meta";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbLd } from "@/lib/structured-data";

export function generateMetadata(): Metadata {
  const m = pages.industries.head.meta;
  return pageMetadata({ path: "/industries", title: m.title, description: m.description });
}

const capName = (id: string) => engineering.capabilities.find((c) => c.id === id)?.name ?? id;

/* content/engineering.ts writes a capability's evidence as "#pos" — its
   anchor on the homepage. On this page it is the capability's section on
   /capabilities. */
const evidenceHref = (href: string) => (href.startsWith("#") ? `/capabilities${href}` : href);

/** One industry: the problems it brings, what we'd build, the capabilities it
 *  draws on, and — only where content/engineering.ts records delivered work —
 *  where we've built it (SPEC §8b.10). */
function IndustryRow({ ind }: { ind: Industry }) {
  const built = ind.evidence.length > 0;
  return (
    <li id={ind.id} className={`bf-ind${built ? "" : " bf-ind--unbuilt"}`} data-bf-reveal>
      <div className="bf-ind__head">
        <h3 className="bf-ind__name">{ind.name}</h3>
        <p className="bf-ind__label">Draws on</p>
        <ul className="bf-ind__caps">
          {ind.capabilityIds.map((id) => (
            <li key={id}>
              <a href={`/capabilities#${id}`}>
                <DomainGlyph id={id} className="bf-ind__glyph" />
                {capName(id)}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="bf-ind__cell">
        <p className="bf-ind__label">The problems</p>
        <ul className="bf-ind__list">
          {ind.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <div className="bf-ind__cell">
        <p className="bf-ind__label">What we&rsquo;d build</p>
        <ul className="bf-ind__list">
          {ind.wouldBuild.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
      {built ? (
        <div className="bf-ind__cell">
          <p className="bf-ind__label">Where we&rsquo;ve built it</p>
          <ul className="bf-ind__list bf-ind__list--links">
            {ind.evidence.map((e) => (
              <li key={e.href + e.label}>
                <a href={evidenceHref(e.href)}>{e.label}</a>
              </li>
            ))}
          </ul>
          {ind.note ? <p className="bf-ind__note">{ind.note}</p> : null}
        </div>
      ) : null}
    </li>
  );
}

/**
 * /industries (SPEC §4, "Technology we can build for…"): the industries from
 * content/engineering.ts, in two groups — those with delivered work, each
 * linked to it, and those with none yet, which say what we would build and
 * claim no past work. Then the final call to action.
 */
export default function IndustriesPage() {
  const site = getSiteUrl().toString();
  const p = pages.industries;
  const built = engineering.industries.filter((i) => i.evidence.length > 0);
  const unbuilt = engineering.industries.filter((i) => i.evidence.length === 0);
  const crumbs = {
    "@context": "https://schema.org",
    ...breadcrumbLd(site, [
      { name: "Home", path: "/" },
      { name: "Industries", path: "/industries" },
    ]),
  };
  return (
    <>
      <JsonLd data={crumbs} />
      <SiteShell ground="graphite" current="/industries">
        <PageHead id="industries-title" eyebrow={p.head.eyebrow} title={p.head.title}>
          {p.head.lead.map((l) => (
            <p key={l} className="bf-lead">
              {l}
            </p>
          ))}
        </PageHead>

        <section id="built" className="bf-section" aria-labelledby="built-title">
          <div className="bf-wrap">
            <SectionHead id="built-title" eyebrow={p.built.eyebrow} title={p.built.title} lead={p.built.lead} />
            <ul className="bf-inds">
              {built.map((ind) => (
                <IndustryRow key={ind.id} ind={ind} />
              ))}
            </ul>
          </div>
        </section>

        <section id="would-build" className="bf-section" aria-labelledby="would-title">
          <div className="bf-wrap">
            <SectionHead id="would-title" eyebrow={p.wouldBuild.eyebrow} title={p.wouldBuild.title} lead={p.wouldBuild.lead} />
            <ul className="bf-inds">
              {unbuilt.map((ind) => (
                <IndustryRow key={ind.id} ind={ind} />
              ))}
            </ul>
          </div>
        </section>

        <FinalCta cta={siteContent.finalCta} />
      </SiteShell>
    </>
  );
}
