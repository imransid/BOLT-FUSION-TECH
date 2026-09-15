import type { Metadata } from "next";
import { Fragment } from "react";

import Architecture from "@/components/techwix/Architecture";
import { Contact, Schedule } from "@/components/techwix/Contact";
import Faq from "@/components/techwix/Faq";
import Footer from "@/components/techwix/Footer";
import Header from "@/components/techwix/Header";
import Hero from "@/components/techwix/Hero";
import HowWeWork from "@/components/techwix/HowWeWork";
import Proof from "@/components/techwix/Proof";
import RevealObserver from "@/components/techwix/RevealObserver";
import Team from "@/components/techwix/Team";
import type { SectionId, SiteContent } from "@/content/site-schema";
import { siteContent } from "@/content/site";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbLd, buildGraph, jsonLdHtml } from "@/lib/structured-data";

import { alt as ogAlt, contentType as ogType, size as ogSize } from "./opengraph-image";

export async function generateMetadata(): Promise<Metadata> {
  const c = siteContent;
  const site = getSiteUrl();
  const canonical = site.toString();

  // The social image is app/opengraph-image.tsx (1200×630), named here as the
  // other pages name it: this page sets its own `openGraph` and `twitter`,
  // which replace the layout's whole objects, images included.
  const image = { url: "/opengraph-image", alt: ogAlt, type: ogType, width: ogSize.width, height: ogSize.height };
  return {
    title: { absolute: c.meta.title },
    description: c.meta.description,
    alternates: { canonical },
    openGraph: {
      title: c.meta.ogTitle,
      description: c.meta.ogDescription,
      type: "website",
      url: canonical,
      siteName: "Bolt Fusion Tech",
      locale: "en_US",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: c.meta.ogTitle,
      description: c.meta.ogDescription,
      images: [image],
    },
  };
}

function isVisible(visibility: Record<string, boolean>, id: SectionId): boolean {
  return visibility[id] !== false;
}

function renderSection(id: SectionId, c: SiteContent) {
  switch (id) {
    case "hero":
      return <Hero hero={c.hero} />;
    case "recent_works":
      return <Proof work={c.recentWorks} />;
    case "architecture":
      return <Architecture />;
    case "how_we_work":
      return <HowWeWork />;
    case "team":
      return <Team team={c.team} />;
    case "faq":
      return <Faq faq={c.faq} />;
    case "cta":
      return <Contact cta={c.cta} />;
    case "schedule_embed":
      return <Schedule blurb={c.scheduleEmbed.blurb} />;
    default:
      return null;
  }
}

/**
 * The homepage, in the Techwix clone's design (decided 2026-09-11): the six
 * sections that argue, in `site.sectionOrder` — the hero with its proof strip,
 * the two write-ups, the architecture, how we work, the team, and questions
 * and contact (the FAQ, the contact panel, the booking calendar). About and
 * Services were cut (COPY.md, "Removed from the homepage").
 *
 * Every section is a server component; the only script on the page is the
 * header's headroom, the mobile drawer and the reveal. No canvas and no WebGL
 * in this step.
 */
export default function Home() {
  const content = siteContent;
  const { sectionOrder, sectionVisibility } = content.site;
  const siteUrl = getSiteUrl().toString();
  const sameAs = content.footer.socialLinks.map((l) => l.url);
  // FAQPage is built from the very items the FAQ section renders, and only when
  // it renders: one source, so the markup and the page cannot diverge.
  const renderedFaq = sectionOrder.includes("faq") && isVisible(sectionVisibility, "faq") ? content.faq.items : [];
  // Person nodes likewise come from the roster the Team section renders.
  const renderedTeam = sectionOrder.includes("team") && isVisible(sectionVisibility, "team") ? content.team.roster : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Escape `<` so a "</script>" in any content string can't break out of
          // the JSON-LD block.
          __html: jsonLdHtml(
            buildGraph(siteUrl, sameAs, renderedFaq, renderedTeam, [breadcrumbLd(siteUrl, [{ name: "Home", path: "/" }])]),
          ),
        }}
      />
      <Header navbar={content.navbar} />
      <main>
        {sectionOrder.map((id) =>
          isVisible(sectionVisibility, id) ? <Fragment key={id}>{renderSection(id, content)}</Fragment> : null,
        )}
      </main>
      <Footer footer={content.footer} />
      <RevealObserver />
    </>
  );
}
