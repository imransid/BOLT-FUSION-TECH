import type { Metadata } from "next";

import { getSiteUrl } from "@/lib/site-url";

/* The site-wide metadata. There are two root layouts — app/(home) for the
   homepage in the clone's design and app/(site) for every other page — and
   they share this one object, so the title template, description, icons and
   robots cannot drift apart. It is the old app/layout.tsx's metadata, moved
   here unchanged. */
export const rootMetadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Bolt Fusion Tech",
    template: "%s | Bolt Fusion Tech",
  },
  description:
    "We build AI systems that are still running in six months. Bolt Fusion Tech is a senior engineering team working across the UK, Malaysia and Bangladesh.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Bolt Fusion Tech — AI systems that are still running in six months",
    description:
      "We build AI systems that are still running in six months. Bolt Fusion Tech is a senior engineering team working across the UK, Malaysia and Bangladesh.",
    type: "website",
    locale: "en_US",
    siteName: "Bolt Fusion Tech",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bolt Fusion Tech — AI systems that are still running in six months",
    description:
      "We build AI systems that are still running in six months. Bolt Fusion Tech is a senior engineering team working across the UK, Malaysia and Bangladesh.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};
