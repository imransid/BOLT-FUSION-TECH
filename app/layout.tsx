import type { Metadata, Viewport } from "next";
import { Barlow, Jost } from "next/font/google";
import "./site.css";

import { CANONICAL_DESCRIPTION } from "@/content/canonical";
import { getSiteUrl } from "@/lib/site-url";

/* The site's one root layout, for every page and the 404.

   One stylesheet: app/site.css, the owner's engineering redesign of
   2026-09-16 — the graphite ground, the type ramp, the shell (header, drawer,
   footer) and every page. Every class is `bf-`. The Techwix design and its
   stylesheet, app/techwix.css, were retired the same day, once the inner pages
   had moved.

   The faces: Barlow 500 / 600 / 700 and Jost 400 / 500 / 600 — no new family
   (SPEC §3; verify-site checks 2 and 31). All normal, no italic. A weight
   outside these would be synthesised (check 3), so neither stylesheet uses one.

   Preloaded, both: every page paints each face — the header's wordmark sets
   "Bolt Fusion" in Barlow 700 and "Tech" in Barlow 500, every button and the
   footer's Schedule a Call are Barlow 600, the text is Jost. That is four latin
   files: three Barlow statics and one Jost variable file for all three weights.
   A preload lands on every page this layout wraps, so a face that stops being
   painted on any of them gets `preload: false`, not a place in this list
   (verify-site check 25 reads every page's own). */
const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["500", "600", "700"], display: "swap", preload: true });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", preload: true });

/* The canonical description, alone: a meta description is 50–160 characters
   (verify-site check 26) and the canonical line is 117 of them, so nothing
   follows it here. COPY.md, "Company description — canonical"; the owner
   changed the line on 2026-09-16. The fuller description — the company line,
   what we build, how we work — is the Organization node's
   (lib/structured-data.ts), which has no length limit. */
const DESCRIPTION = CANONICAL_DESCRIPTION;
const OG_TITLE = "Bolt Fusion Tech — Build what's next.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  /* the header's graphite, on every page */
  themeColor: "#07090d",
};

/* The site-wide metadata: the title template, the canonical description,
   icons and robots. Pages add their own title, description, canonical and
   share image. The icons are generated from the Forward Monogram by
   scripts/generate-icons.mjs; app/favicon.ico is served by Next's convention
   beside them. */
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
      /* The font variables live on <html>, which is :root, where both
         stylesheets declare the tokens that read them. On <body>, every token
         would resolve against an undefined variable and the whole site would
         render in the system font (verify-site checks 1 and 2). */
      className={`${barlow.variable} ${jost.variable}`}
    >
      <body>
        {/* The first stop on every page: past the header to the page's own
            content. Hidden until focused. Interface text. */}
        <a className="bf-skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
