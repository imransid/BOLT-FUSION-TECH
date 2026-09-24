import type { Metadata } from "next";

import { alt as ogAlt, contentType as ogType, size as ogSize } from "@/app/opengraph-image";

import { getSiteUrl } from "./site-url";

const SITE_NAME = "Bolt Fusion Tech";

/**
 * An inner page's metadata, the way /contact writes its own: the title (the
 * layout's template adds " | Bolt Fusion Tech"), the description, the
 * canonical, and the share card with the site's share image
 * (app/opengraph-image.tsx). A page that sets `openGraph` replaces the
 * layout's whole object, image included, so the image is named here.
 * Verify-site check 26 reads the title, the description and the canonical.
 */
export function pageMetadata({
  path,
  title,
  description,
  article,
}: {
  path: string;
  title: string;
  description: string;
  article?: { publishedTime: string; author: string };
}): Metadata {
  const canonical = new URL(path, getSiteUrl()).toString();
  const image = { url: "/opengraph-image", alt: ogAlt, type: ogType, width: ogSize.width, height: ogSize.height };
  const full = `${title} | ${SITE_NAME}`;
  const shared = { title: full, description, url: canonical, siteName: SITE_NAME, locale: "en_US", images: [image] };
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: article
      ? { ...shared, type: "article", publishedTime: article.publishedTime, authors: [article.author] }
      : { ...shared, type: "website" },
    twitter: { card: "summary_large_image", title: full, description, images: [image] },
  };
}
