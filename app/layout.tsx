import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

import RevealController from "@/components/RevealController";
import { getSiteUrl } from "@/lib/site-url";

// Variable font (single axis file, all weights) — self-hosted with display:swap
// and an automatic size-adjusted fallback (eliminates web-font swap CLS).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Brand display font for headings — was referenced as "Satoshi" in CSS but never
// actually loaded; now self-hosted via next/font/local.
const satoshi = localFont({
  variable: "--font-satoshi",
  display: "swap",
  src: [{ path: "../public/fonts/Satoshi-Variable.woff2", weight: "300 900", style: "normal" }],
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
  src: [{ path: "../public/fonts/CommitMono-Variable.woff2", weight: "200 700", style: "normal" }],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
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
