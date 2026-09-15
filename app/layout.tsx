import type { Metadata, Viewport } from "next";
import { Barlow, Jost } from "next/font/google";
import "./techwix.css";

import { getSiteUrl } from "@/lib/site-url";

/* The site's one root layout, for every page and the 404. One design: the
   Techwix clone's (app/techwix.css), in Barlow and Jost, and nothing else —
   the owner retired the site's old dark design on 2026-09-15 (CLAUDE.md,
   "Design language"). verify-site check 31 holds that line.

   The weights are the ones the clone paints, counted off its rendered page:
   Barlow 500 / 600 / 700 for headings, Jost 400 / 500 / 600 for text. All
   normal — it paints no italic. A weight outside these would be synthesised
   (verify-site check 3), so the stylesheet uses only these.

   Preloaded, both: every face here is painted in the FIRST viewport of every
   page at 390, 768 and 1440 — the header's logo sets "Bolt" in Barlow 500,
   "Fusion" in Barlow 700 and "Tech" in Jost 500, every page's h1 is Barlow 600,
   its text Jost 400 and its buttons Jost 600. That is four latin files, 74KB:
   three Barlow statics at 16KB and one 26KB Jost variable file for all three
   weights. A preload lands on every page this layout wraps, so a face that
   stops being painted above the fold on any of them gets `preload: false`,
   not a place in this list (verify-site check 25 reads every page's own). */
const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["500", "600", "700"], display: "swap", preload: true });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", preload: true });

const DESCRIPTION =
  "We build AI systems that are still running in six months. Bolt Fusion Tech is a senior engineering team working across the UK, Malaysia and Bangladesh.";
const OG_TITLE = "Bolt Fusion Tech — AI systems that are still running in six months";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

/* The site-wide metadata: the title template, the canonical description
   (COPY.md, "Company description — canonical"), icons and robots. Pages add
   their own title, description, canonical and share image. */
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Bolt Fusion Tech",
    template: "%s | Bolt Fusion Tech",
  },
  description: DESCRIPTION,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: OG_TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "en_US",
    siteName: "Bolt Fusion Tech",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      /* Browser extensions mutate <html> before React hydrates — password
         managers, theme switchers and launchers add attributes here, and React
         then reports a mismatch it cannot patch. This suppresses the warning for
         THIS element's own attributes only (one level deep, never its
         children), which is exactly the surface we do not control. */
      suppressHydrationWarning
      /* The font variables live on <html>, which is :root, where techwix.css
         declares the tokens that read them. On <body>, every token would
         resolve against an undefined variable and the whole site would render
         in the system font (verify-site checks 1 and 2). */
      className={`${barlow.variable} ${jost.variable}`}
    >
      {/* .tw-root: the design's scope, kept for the rules that style shared
          pieces such as <FigureText>'s chip. */}
      <body className="tw-root">{children}</body>
    </html>
  );
}
