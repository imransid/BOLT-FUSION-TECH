import type { Metadata } from "next";

import FigureText from "@/components/FigureText";
import Cta from "@/components/site/Cta";
import FinalCta from "@/components/site/home/FinalCta";
import Team from "@/components/site/home/Team";
import { RefuseIcon } from "@/components/site/icons";
import JsonLd from "@/components/site/JsonLd";
import PageHead from "@/components/site/PageHead";
import SectionHead from "@/components/site/SectionHead";
import SiteShell from "@/components/site/SiteShell";
import { pilot, services } from "@/content";
import { pages } from "@/content/pages";
import { siteContent } from "@/content/site";
import { pageMetadata } from "@/lib/page-meta";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbLd, organizationLd } from "@/lib/structured-data";

export function generateMetadata(): Metadata {
  const m = pages.about.head.meta;
  return pageMetadata({ path: "/about", title: m.title, description: m.description });
}

/**
 * /about (SPEC §4): who we are; the team (the homepage's Team section: its
 * size, 15+ developers, and no one named — the owner, 2026-09-24); where our
 * engineers work (SPEC §8b.12:
 * never "offices", never an address); how we work with clients — the terms,
 * the engagement models (content/services.ts), the line under the table, the
 * operating detail and the pilot (content/pilot.ts), each moved here from the
 * old homepage word for word ($SP/engineering/MOVES.md); and what we won't do,
 * only commitments the site keeps. Then the final call to action.
 *
 * No Person structured data: the team is a headcount, so no one is named in
 * the markup either.
 */
export default function AboutPage() {
  const site = getSiteUrl().toString();
  const a = pages.about;
  const team = siteContent.team;
  const aboutUrl = new URL("/about", site).toString();
  const sameAs = siteContent.footer.socialLinks.map((l) => l.url);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      organizationLd(site, sameAs),
      { "@type": "AboutPage", "@id": `${aboutUrl}#page`, url: aboutUrl, name: a.head.title, about: { "@id": `${site}#organization` } },
      breadcrumbLd(site, [
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
      ]),
    ],
  };
  const how = a.howWeWork;
  return (
    <>
      <JsonLd data={graph} />
      <SiteShell ground="graphite" current="/about">
        <PageHead id="about-title" eyebrow={a.head.eyebrow} title={a.head.title}>
          {a.head.lead.map((l) => (
            <p key={l} className="bf-lead">
              {l}
            </p>
          ))}
        </PageHead>

        <section id="who" className="bf-section" aria-labelledby="who-title">
          <div className="bf-wrap bf-who">
            <SectionHead id="who-title" eyebrow={a.who.head.eyebrow} title={a.who.head.title} />
            <div className="bf-who__body" data-bf-reveal>
              {a.who.body.map((p) => (
                <p key={p} className="bf-who__p">
                  {p}
                </p>
              ))}
              <ul className="bf-who__links">
                {a.who.links.map((l) => (
                  <li key={l.href}>
                    <Cta href={l.href} variant="quiet">
                      {l.label}
                    </Cta>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <Team team={team} />

        <section id="where" className="bf-section" aria-labelledby="where-title">
          <div className="bf-wrap">
            <SectionHead id="where-title" eyebrow={a.where.head.eyebrow} title={a.where.head.title} lead={a.where.head.lead} />
            <ul className="bf-places" data-bf-reveal>
              {a.where.places.map((p) => (
                <li key={p} className="bf-place">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="how-we-work" className="bf-section" aria-labelledby="how-title">
          <div className="bf-wrap">
            <SectionHead
              id="how-title"
              eyebrow={how.head.eyebrow}
              title={how.head.title}
              lead={how.head.lead ? <FigureText text={how.head.lead} /> : undefined}
            />
            <dl className="bf-terms" data-bf-reveal>
              {how.terms.map((t) => (
                <div key={t.term} className="bf-term">
                  <dt>{t.term}</dt>
                  <dd>
                    <FigureText text={t.detail} />
                  </dd>
                </div>
              ))}
            </dl>

            <h3 id="models-title" className="bf-h4 bf-models__title">
              {how.modelsTitle}
            </h3>
            {/* Scrolls sideways on a phone, so it takes focus: a keyboard user
                can scroll it too. */}
            <div id="engagement-models" className="bf-table-wrap" role="region" aria-labelledby="models-title" tabIndex={0}>
              <table className="bf-table">
                <caption className="sr-only">{how.modelsTitle}</caption>
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    <th scope="col">Shape</th>
                    <th scope="col">Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id}>
                      <th scope="row">{s.name}</th>
                      <td>{s.shape}</td>
                      <td>
                        <FigureText text={s.timeline} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bf-models__lines">
              <p>{how.lineUnderTable}</p>
              <p>{how.operatingDetail}</p>
            </div>

            <div id="pilot" className="bf-pilot" data-bf-reveal>
              <div className="bf-pilot__text">
                <h3 className="bf-pilot__title">{pilot.title}</h3>
                <p className="bf-pilot__body">{pilot.body}</p>
              </div>
              <div className="bf-pilot__plan">
                <ol className="bf-pilot__weeks">
                  {pilot.weeks.map((w) => (
                    <li key={w.id} className="bf-pilot__week">
                      <span className="bf-pilot__label">{w.label}</span>
                      <span className="bf-pilot__what">{w.body}</span>
                    </li>
                  ))}
                </ol>
                <p className="bf-pilot__deliverable">
                  <span className="bf-pilot__label">Deliverable</span>
                  <span className="bf-pilot__what">{pilot.deliverable}</span>
                </p>
                <p className="bf-actions">
                  {/* The button's exemption covers its whole label (content/figure-labels.ts). */}
                  <Cta href={how.pilotCta.href} variant="ghost">
                    <FigureText text={how.pilotCta.label} />
                  </Cta>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="wont" className="bf-section" aria-labelledby="wont-title">
          <div className="bf-wrap">
            <SectionHead id="wont-title" eyebrow={a.refuse.head.eyebrow} title={a.refuse.head.title} lead={a.refuse.head.lead} />
            <ul className="bf-refuse">
              {a.refuse.items.map((it) => (
                <li key={it.title} className="bf-refuse__item" data-bf-reveal>
                  <RefuseIcon className="bf-refuse__icon" />
                  <div className="bf-refuse__text">
                    <h3 className="bf-refuse__title">{it.title}</h3>
                    <p className="bf-refuse__body">{it.body}</p>
                    {it.link ? (
                      <Cta href={it.link.href} variant="quiet">
                        {it.link.label}
                      </Cta>
                    ) : null}
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
