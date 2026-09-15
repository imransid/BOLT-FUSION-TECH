import type { Metadata } from "next";

import FigureText from "@/components/FigureText";
import ContactForm from "@/components/site/ContactForm";
import Cta from "@/components/site/Cta";
import SiteShell from "@/components/site/SiteShell";
import { siteContent } from "@/content/site";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbLd, jsonLdHtml } from "@/lib/structured-data";

import { alt as ogAlt, contentType as ogType, size as ogSize } from "../opengraph-image";

/* The Calendly booking calendar as an iframe — no widget.js, so none of
   Calendly's script runs in this page. Its colours follow the graphite ground:
   the surface, the text colour, and the button fill (white on it at 5.35:1). */
const CALENDLY_SRC =
  "https://calendly.com/bolttechfusion/30min?background_color=0d1016&text_color=eceff4&primary_color=2a62e0";

export async function generateMetadata(): Promise<Metadata> {
  const c = siteContent.contact;
  const canonical = new URL("/contact", getSiteUrl()).toString();
  const image = { url: "/opengraph-image", alt: ogAlt, type: ogType, width: ogSize.width, height: ogSize.height };
  return {
    title: c.meta.title,
    description: c.meta.description,
    alternates: { canonical },
    openGraph: {
      title: `${c.meta.title} | Bolt Fusion Tech`,
      description: c.meta.description,
      type: "website",
      url: canonical,
      siteName: "Bolt Fusion Tech",
      locale: "en_US",
      images: [image],
    },
    twitter: { card: "summary_large_image", title: `${c.meta.title} | Bolt Fusion Tech`, description: c.meta.description, images: [image] },
  };
}

/**
 * /contact (2026-09-16): the routes to a conversation that closed the old
 * homepage, in one place. The panel's words, the booking calendar
 * (`id="schedule"`, where every Schedule a Call lands) and the email are the
 * old homepage's, unchanged; the short project form (`id="project"`, where
 * Tell Us About Your Project lands) opens the visitor's email app — the
 * existing mechanism, no backend. One h1.
 */
export default function ContactPage() {
  const c = siteContent.contact;
  const site = getSiteUrl().toString();
  const crumbs = {
    "@context": "https://schema.org",
    ...breadcrumbLd(site, [
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact" },
    ]),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(crumbs) }} />
      <SiteShell ground="graphite">
        <section className="bf-pagehead" aria-labelledby="contact-title">
          <div className="bf-wrap bf-pagehead__inner">
            <p className="bf-eyebrow">{c.eyebrow}</p>
            <p className="bf-status-line">
              <span className="bf-status-line__dot" aria-hidden="true" />
              {c.statusLabel}
            </p>
            <h1 id="contact-title" className="bf-pagehead__title">
              {c.title}
            </h1>
            <p className="bf-lead">{c.body}</p>
            <p className="bf-actions">
              <Cta href={c.primaryCta.href} cta="schedule">
                {c.primaryCta.label}
              </Cta>
              <Cta href={c.emailHref} variant="ghost">
                {c.emailLabel}
              </Cta>
            </p>
          </div>
        </section>

        <section id="schedule" className="bf-section" aria-labelledby="schedule-title">
          <div className="bf-wrap">
            <div className="bf-head">
              <h2 id="schedule-title" className="bf-h2">
                <FigureText text={c.schedule.title} />
              </h2>
              <p className="bf-lead">
                <FigureText text={c.schedule.blurb} />
              </p>
            </div>
            <div className="bf-calendar">
              <iframe
                title={c.schedule.frameTitle}
                src={CALENDLY_SRC}
                loading="lazy"
                allow="camera; microphone; fullscreen; payment"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        <section id="project" className="bf-section" aria-labelledby="project-title">
          <div className="bf-wrap bf-project">
            <div className="bf-head">
              <h2 id="project-title" className="bf-h2">
                {c.project.title}
              </h2>
              <p className="bf-lead">{c.project.lead}</p>
              <p className="bf-project__fallback">
                {c.project.fallback} <a href={c.emailHref}>{c.emailAddress}</a>
              </p>
            </div>
            <ContactForm copy={c.project} email={c.emailAddress} />
          </div>
        </section>
      </SiteShell>
    </>
  );
}
