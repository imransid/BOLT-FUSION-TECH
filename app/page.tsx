import type { Metadata } from "next";
import { Fragment } from "react";

import Faq from "@/components/site/home/Faq";
import FinalCta from "@/components/site/home/FinalCta";
import Hero from "@/components/site/home/Hero";
import HowWeBuild from "@/components/site/home/HowWeBuild";
import HowWeWork from "@/components/site/home/HowWeWork";
import Industries from "@/components/site/home/Industries";
import InsightsTeaser from "@/components/site/home/InsightsTeaser";
import Stories from "@/components/site/home/Stories";
import WhatWeEngineer from "@/components/site/home/WhatWeEngineer";
import SiteShell from "@/components/site/SiteShell";
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
    case "stories":
      return <Stories work={c.recentWorks} lanesTitle={c.caseStudy.lanesSectionTitle} />;
    case "how_we_work":
      return <HowWeWork team={c.team} />;
    case "what_we_engineer":
      return <WhatWeEngineer />;
    case "how_we_build":
      return <HowWeBuild />;
    case "industries":
      return <Industries />;
    case "faq":
      /* the Insights teaser sits before the FAQ (SPEC §6) */
      return (
        <>
          <InsightsTeaser />
          <Faq faq={c.faq} />
        </>
      );
    case "final_cta":
      return <FinalCta cta={c.finalCta} />;
    default:
      return null;
  }
}

/**
 * The homepage — the owner's redesign of 2026-09-16 (SPEC §5), "Software.
 * Intelligence. Automation. Machines.", ordered since 2026-09-28 for a buyer
 * deciding whether to hire (the owner: "make it easy for clients to hire";
 * DECISIONS 2026-09-28, item 1). The sections, in `site.sectionOrder`: the
 * hero, with its proof line; the engineering stories with the proof strip
 * (#recent-work); how we work with you — the terms, the engagement models,
 * the pilot and the headcount; what we engineer, one ledger row per
 * capability; how we build; the industries with delivered work; the Insights
 * teaser and the FAQ; the final call to action. The capability deep dives and
 * the system map are on /capabilities, the stack by layer on /engineering, the
 * full Team section on /about, and the booking calendar on /contact.
 *
 * Every section is a server component. The scripts on the page: the header's
 * headroom and drawer, the hero's pause control and three.js scene
 * (components/field), and the quiet motion (components/site/SiteMotion).
 */
export default function Home() {
  const content = siteContent;
  const { sectionOrder, sectionVisibility } = content.site;
  const siteUrl = getSiteUrl().toString();
  const sameAs = content.footer.socialLinks.map((l) => l.url);
  // FAQPage is built from the very items the FAQ section renders, and only when
  // it renders: one source, so the markup and the page cannot diverge.
  const renderedFaq = sectionOrder.includes("faq") && isVisible(sectionVisibility, "faq") ? content.faq.items : [];
  // One Service node per capability, when the capabilities render — since
  // 2026-09-28 in the "What we engineer" ledger, which absorbed the six
  // capability sections.
  const withServices = sectionOrder.includes("what_we_engineer") && isVisible(sectionVisibility, "what_we_engineer");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Escape `<` so a "</script>" in any content string can't break out of
          // the JSON-LD block.
          __html: jsonLdHtml(
            buildGraph(siteUrl, sameAs, renderedFaq, [breadcrumbLd(siteUrl, [{ name: "Home", path: "/" }])], withServices),
          ),
        }}
      />
      <SiteShell ground="graphite" headerCtaQuiet>
        {sectionOrder.map((id) =>
          isVisible(sectionVisibility, id) ? <Fragment key={id}>{renderSection(id, content)}</Fragment> : null,
        )}
      </SiteShell>
    </>
  );
}
