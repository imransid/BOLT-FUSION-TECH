import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "../globals.css";

import RevealController from "@/components/RevealController";
import { rootMetadata } from "@/lib/root-metadata";

/* The root layout of every page EXCEPT the homepage — /work, both write-ups and
   the privacy policy, in the site's own design. The homepage has its own root
   layout in app/(home), in the clone's design: two root layouts, so neither
   design's stylesheet or fonts ever load on the other's pages. This file is the
   old app/layout.tsx, moved; what it renders is unchanged. */

/* Preloads, measured 2026-09-15 (verify-site check 25 reads every page's own):
   a layout's preload lands on EVERY page under it, so only a face all of them
   paint in the first viewport earns one. Inter does, on all four. Satoshi and
   Commit Mono do not — /privacy-policy renders neither anywhere, and /work
   shows Commit Mono above the fold only at 1440 — so they are `preload: false`
   and load when a page uses them, display: swap over a size-adjusted fallback. */
// Variable font (single axis file, all weights) — self-hosted with display:swap
// and an automatic size-adjusted fallback (eliminates web-font swap CLS).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// Brand display font for headings — was referenced as "Satoshi" in CSS but never
// actually loaded; now self-hosted via next/font/local.
const satoshi = localFont({
  variable: "--font-satoshi",
  display: "swap",
  preload: false,
  src: [{ path: "../../public/fonts/Satoshi-Variable.woff2", weight: "300 900", style: "normal" }],
});

/* Commit Mono — machine values ONLY (query strings, ms, $, model names, stack
 * items); never decorative labels. Not on Google Fonts, so it is self-hosted
 * from public/fonts/CommitMono-Variable.woff2. Licence: SIL OFL 1.1, text kept
 * beside the file at public/fonts/CommitMono-LICENSE-OFL.txt as the OFL requires.
 *
 * The tokens that name these faces are defined in app/globals.css.
 */

const commitMono = localFont({
  variable: "--font-commit",
  display: "swap",
  preload: false,
  src: [{ path: "../../public/fonts/CommitMono-Variable.woff2", weight: "200 700", style: "normal" }],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      /* Browser extensions mutate <html> before React hydrates — a CRX launcher
         adds crxlauncher / crxlauncher-bridged here, and password managers and
         theme switchers do the same. React then reports an attribute mismatch it
         cannot patch. This suppresses the warning for THIS element's own
         attributes only (one level deep, never its children), which is exactly
         the surface we do not control. Verified in extension-free Chrome: <html>
         carries only lang and class, and no hydration error is raised. */
      suppressHydrationWarning
      /* Font variables live HERE, not on <body>. A custom property whose value
         contains var() is substituted on the element where it is DECLARED, and
         the design tokens are declared at :root. With these classes on <body>
         the tokens resolved against an undefined variable, became the
         guaranteed-invalid value, and inherited that invalidity site-wide. */
      className={`${inter.variable} ${satoshi.variable} ${commitMono.variable} scroll-smooth scroll-pt-20 md:scroll-pt-24`}
    >
      <body className="min-h-dvh overflow-x-clip antialiased bg-black text-white">
        <RevealController />
        {children}
      </body>
    </html>
  );
}
