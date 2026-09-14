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
   (verify-site check 3), so the stylesheet uses only these.

   Preloaded, both: every face here is painted in the FIRST viewport at 390,
   768 and 1440 — the logo sets "Bolt" in Barlow 500, "Fusion" in Barlow 700 and
   "Tech" in Jost 500, the headline is Barlow 600, the subtext Jost 400 and the
   buttons Jost 600 (measured 2026-09-15). That is four latin files, 74KB: three
   Barlow statics at 16KB and one 26KB Jost variable file for all three weights.
   A face that stops being painted above the fold should get `preload: false`,
   not a place in this list. The other design's faces must never be preloaded
   here (verify-site checks 25 and 31; see app/global-not-found.tsx). */
const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["500", "600", "700"], display: "swap", preload: true });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", preload: true });

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
      {/* .tw-root: the homepage's scope, for styling shared components such as
          <FigureText> from techwix.css without changing them. */}
      <body className="tw-root">{children}</body>
    </html>
  );
}
