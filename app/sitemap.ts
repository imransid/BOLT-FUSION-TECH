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
  ];
}
