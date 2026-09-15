import type { Metadata } from "next";
import { Fragment } from "react";

import Capabilities from "@/components/site/home/Capabilities";
import Faq from "@/components/site/home/Faq";
import FinalCta from "@/components/site/home/FinalCta";
import Hero from "@/components/site/home/Hero";
import HowWeBuild from "@/components/site/home/HowWeBuild";
import Industries from "@/components/site/home/Industries";
import InsightsTeaser from "@/components/site/home/InsightsTeaser";
import Stories from "@/components/site/home/Stories";
import SystemMapSection from "@/components/site/home/SystemMapSection";
import TechnicalDepth from "@/components/site/home/TechnicalDepth";
import Team from "@/components/site/home/Team";
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
    case "what_we_engineer":
      return <WhatWeEngineer />;
    case "capabilities":
      return <Capabilities />;
    case "system_map":
      return <SystemMapSection />;
    case "industries":
      return <Industries />;
    case "how_we_build":
      return <HowWeBuild />;
    case "technical_depth":
      return <TechnicalDepth />;
    case "stories":
      return <Stories work={c.recentWorks} />;
    case "team":
      return <Team team={c.team} />;
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
 * The homepage — the owner's redesign of 2026-09-16 (SPEC §5): a broad
 * engineering company, "Software. Intelligence. Automation. Machines." The
 * sections, in `site.sectionOrder`: the hero; what we engineer; the six
 * capabilities, each with its own diagram; the system map; industries; how we
 * build; technical depth; the engineering stories with the proof strip; the
 * team; the FAQ; the final call to action. The booking calendar and the
 * contact panel are on /contact.
 *
 * Every section is a server component. The scripts on the page: the header's
 * headroom and drawer, the system map's highlighting, the hero's pause control
 * and the quiet motion (components/site/SiteMotion). No canvas and no WebGL
 * yet — the 3D wave mounts its scene in the hero's field.
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
  // One Service node per capability, when the capabilities render.
  const withServices = sectionOrder.includes("capabilities") && isVisible(sectionVisibility, "capabilities");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Escape `<` so a "</script>" in any content string can't break out of
          // the JSON-LD block.
          __html: jsonLdHtml(
            buildGraph(siteUrl, sameAs, renderedFaq, renderedTeam, [breadcrumbLd(siteUrl, [{ name: "Home", path: "/" }])], withServices),
          ),
        }}
      />
      <SiteShell ground="graphite">
        {sectionOrder.map((id) =>
          isVisible(sectionVisibility, id) ? <Fragment key={id}>{renderSection(id, content)}</Fragment> : null,
        )}
      </SiteShell>
    </>
  );
}
