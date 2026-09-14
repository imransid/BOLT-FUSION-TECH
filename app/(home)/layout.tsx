import type { Metadata, Viewport } from "next";
import { Barlow, Jost } from "next/font/google";
import "./techwix.css";

import { rootMetadata } from "@/lib/root-metadata";

/* The homepage's own root layout, in the Techwix clone's design. It is the
   only place that loads app/(home)/techwix.css and the clone's two families,
   so no other page loads either (verify-site check 25 and the split-design
   rule). Every other page has app/(site)/layout.tsx.

   The weights are the ones the clone paints, counted off its rendered page:
   Barlow 500 / 600 / 700 for headings, Jost 400 / 500 / 600 for text. All
   normal — it paints no italic. A weight outside these would be synthesised
   (verify-site check 3), so the stylesheet uses only these. */
const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["500", "600", "700"], display: "swap" });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = rootMetadata;

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      /* Extensions mutate <html> before React hydrates; this suppresses the
         warning for this element's own attributes only (see (site)/layout). */
      suppressHydrationWarning
      /* The font variables live on <html>, which is :root, where
         techwix.css declares the tokens that read them. */
      className={`${barlow.variable} ${jost.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
