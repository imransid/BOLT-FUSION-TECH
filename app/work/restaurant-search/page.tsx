import type { Metadata } from "next";

import CaseStudy from "@/components/CaseStudy";
import { SiteContentProvider } from "@/context/SiteContentContext";
import { getSiteContent } from "@/lib/load-site-content";
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
const TITLE = "Intelligent restaurant search — multi-tenant AI retrieval | Case study";
const DESCRIPTION =
  "How we built a multi-tenant restaurant discovery microservice: natural-language queries classified before any paid inference runs, keeping most traffic on a sub-100ms path and average model spend near $0.001 per AI-assisted query.";

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteUrl();
  const canonical = new URL("/work/restaurant-search", site).toString();
  const ogImage = new URL("/projects/case-fnb-smart-search.png", site).toString();
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      type: "article",
      url: canonical,
      siteName: "Bolt Fusion Tech",
      locale: "en_US",
      images: [{ url: ogImage, alt: "Intelligent restaurant search — case study" }],
    },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  };
}

export default async function RestaurantSearchPage() {
  const content = await getSiteContent();
  return (
    <SiteContentProvider value={content}>
      <main>
        <CaseStudy />
      </main>
    </SiteContentProvider>
  );
}
