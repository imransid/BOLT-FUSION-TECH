import type { Metadata } from "next";

import CaseStudy from "@/components/CaseStudy";
import { SiteContentProvider } from "@/context/SiteContentContext";
import { siteContent } from "@/content/site";
import { getSiteUrl } from "@/lib/site-url";

/**
 * The restaurant search write-up, moved off the homepage.
 *
 * PLAN.md §6: "Section 3 absorbs the old sections 3 and 7. The full restaurant
 * write-up moves to /work/restaurant-search." The homepage told this project
 * twice, which PLAN.md §1 lists as wasting the best asset on the site.
 *
 * The existing CaseStudy component and its approved copy are reused verbatim —
 * this is a move, not a rewrite. Nothing here is newly written.
 */
const TITLE = "Intelligent restaurant search — multi-tenant AI retrieval";
const DESCRIPTION =
  "How we built a multi-tenant restaurant search service that classifies queries before any paid inference, keeping most traffic under 100ms.";

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteUrl();
  const canonical = new URL("/work/restaurant-search", site).toString();
  const ogImage = new URL("/projects/case-fnb-smart-search-og.png", site).toString();
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      type: "article",
      url: canonical,
      siteName: "Bolt Fusion Tech",
      locale: "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Intelligent restaurant search — case study" }],
    },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  };
}

export default async function RestaurantSearchPage() {
  const content = siteContent;
  const site = getSiteUrl().toString();
  const url = new URL("/work/restaurant-search", site).toString();
  /* The same BreadcrumbList + Article graph as /work/warmchats — this page had
     none. One deliberate difference: the "Work" crumb points at the /work page
     that exists, where WarmChats' points at the homepage anchor /#recent-work,
     which will not survive the replica becoming `/`. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: site },
          { "@type": "ListItem", position: 2, name: "Work", item: new URL("/work", site).toString() },
          { "@type": "ListItem", position: 3, name: "Restaurant search case study", item: url },
        ],
      },
      {
        "@type": "Article",
        headline: TITLE,
        description: DESCRIPTION,
        image: new URL("/projects/case-fnb-smart-search.png", site).toString(),
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "Bolt Fusion Tech", url: site },
        publisher: { "@type": "Organization", name: "Bolt Fusion Tech", url: site },
      },
    ],
  };
  return (
    <SiteContentProvider value={content}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <main>
        <CaseStudy />
      </main>
    </SiteContentProvider>
  );
}
