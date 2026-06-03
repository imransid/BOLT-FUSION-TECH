import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();
  return [
    {
      url: base.toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/work/warmchats", base).toString(),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: new URL("/privacy-policy", base).toString(),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
