import type { Metadata } from "next";

import FigureText from "@/components/FigureText";
import BookingCalendar from "@/components/site/BookingCalendar";
import ContactForm from "@/components/site/ContactForm";
import Cta from "@/components/site/Cta";
import SiteShell from "@/components/site/SiteShell";
import { pages } from "@/content/pages";
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
 * /contact (2026-09-16; laid out in two columns 2026-09-28): the routes to a
 * conversation, in one place. The panel's words, the booking calendar
 * (`id="schedule"`, where every Schedule a Call lands) and the email are the
 * old homepage's, unchanged; the short project form (`id="project"`, where
 * Tell Us About Your Project lands) opens the visitor's email app — the
 * existing mechanism, no backend. One h1.
 *
 * From 1025px the head and the calendar sit side by side, so the calendar is
 * in the first viewport: the h1 on the left with what happens when you work
 * with us — /about's four terms, word for word (content/pages.ts) — and the
 * calendar on the right. Below that it is one column in the DOM's order: the
 * h1, then the calendar straight after it, then the rest. There is no button
 * that jumps to a calendar already beside it.
 *
 * The project form's wrapper is `.bf-contact-project`. It was `.bf-project`
 * until 2026-09-28, the name of /work's project CARD: the card rule came later
 * in app/site.css and won, and the form rendered 203px wide in a bordered
 * panel whose heading touched its edge. verify-site check 32 holds the form at
 * 480px or wider at 1440.
 */
export default function ContactPage() {
  const c = siteContent.contact;
  const how = pages.about.howWeWork;
  /* The fallback line is one sentence in the content; the address inside it is
     the link. */
  const [before, after = ""] = c.schedule.fallbackNote.split(c.emailAddress);
  const fallback = { before, after };
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
        <section className="bf-contact" aria-labelledby="contact-title">
          <div className="bf-wrap bf-contact__grid">
            <div className="bf-contact__head">
              <p className="bf-eyebrow">{c.eyebrow}</p>
              <p className="bf-status-line">
                <span className="bf-status-line__dot" aria-hidden="true" />
                {c.statusLabel}
              </p>
              <h1 id="contact-title" className="bf-pagehead__title bf-contact__title">
                {c.title}
              </h1>
            </div>

            <section id="schedule" className="bf-contact__cal" aria-labelledby="schedule-title">
              <div className="bf-contact__calhead">
                <h2 id="schedule-title" className="bf-contact__h2">
                  <FigureText text={c.schedule.title} />
                </h2>
              </div>
              {/* Calendly paints its own white interface and ignores the
                  colour parameters, so the embed is a light card we place on
                  purpose: our caption, generous padding, the design's radius and
                  a hairline. Its height is reserved, so the iframe cannot shift
                  the page when it loads, and the note under it keeps the email
                  and the project form obvious if the third party is blocked. */}
              <BookingCalendar
                caption={c.schedule.caption}
                placeholder={c.schedule.placeholder}
                stalled={c.schedule.stalled}
                frameTitle={c.schedule.frameTitle}
                src={CALENDLY_SRC}
              />
              <p className="bf-calendar__note">
                {fallback.before}
                <a href={c.emailHref}>{c.emailAddress}</a>
                {fallback.after}
              </p>
            </section>

            <div className="bf-contact__next">
              <p className="bf-lead">{c.body}</p>
              <h2 id="contact-terms-title" className="bf-contact__label">
                {how.head.eyebrow}
              </h2>
              <dl className="bf-contact__terms" aria-labelledby="contact-terms-title">
                {how.terms.map((t) => (
                  <div key={t.term} className="bf-contact__term">
                    <dt>{t.term}</dt>
                    <dd>
                      <FigureText text={t.detail} />
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="bf-actions">
                <Cta href={c.emailHref} variant="ghost">
                  {c.emailLabel}
                </Cta>
              </p>
            </div>
          </div>
        </section>

        <section id="project" className="bf-section" aria-labelledby="project-title">
          <div className="bf-wrap bf-contact-project">
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
