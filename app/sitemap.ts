import type { MetadataRoute } from "next";

import { insights } from "@/content/insights";
import { getSiteUrl } from "@/lib/site-url";

/* Every public route. Verify-site reads its routes from here, so a page is
   covered by the suite the day it lands in this list; check 30 wants an
   inventory for each. The articles come from content/insights.ts, the same
   entries /insights lists and generateStaticParams builds. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();
  const page = (path: string, changeFrequency: "weekly" | "monthly" | "yearly", priority: number, lastModified: Date = now) => ({
    url: new URL(path, base).toString(),
    lastModified,
    changeFrequency,
    priority,
  });
  return [
    page("/", "weekly", 1),
    page("/work", "monthly", 0.9),
    page("/work/restaurant-search", "monthly", 0.8),
    page("/work/warmchats", "monthly", 0.8),
    page("/capabilities", "monthly", 0.8),
    page("/industries", "monthly", 0.7),
    page("/engineering", "monthly", 0.7),
    page("/about", "monthly", 0.7),
    page("/insights", "weekly", 0.7),
    ...insights.map((a) => page(`/insights/${a.slug}`, "monthly", 0.6, new Date(`${a.datePublished}T00:00:00Z`))),
    page("/contact", "monthly", 0.7),
    page("/privacy-policy", "yearly", 0.3),
  ];
}
