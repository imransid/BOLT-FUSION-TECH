import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import NotFound from "next/dist/client/components/builtin/not-found";
import "./globals.css";

import { rootMetadata } from "@/lib/root-metadata";

/* The 404 for every URL that matches no page. The app has two root layouts —
   app/(home) and app/(site) — and none at the top of app/, so Next has no
   layout to put its 404 in; `experimental.globalNotFound` (next.config.ts)
   makes it render this file instead, as a complete document.

   It reproduces the 404 as it was under the single app/layout.tsx: the site's
   own root — the same three faces on <html>, app/globals.css, the same body —
   around Next's own built-in not-found page, unchanged. The fonts are declared
   exactly as in app/(site)/layout.tsx. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const satoshi = localFont({
  variable: "--font-satoshi",
  display: "swap",
  src: [{ path: "../public/fonts/Satoshi-Variable.woff2", weight: "300 900", style: "normal" }],
});

const commitMono = localFont({
  variable: "--font-commit",
  display: "swap",
  src: [{ path: "../public/fonts/CommitMono-Variable.woff2", weight: "200 700", style: "normal" }],
});

export const metadata: Metadata = {
  ...rootMetadata,
  title: "404: This page could not be found.",
};

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${satoshi.variable} ${commitMono.variable} scroll-smooth scroll-pt-20 md:scroll-pt-24`}
    >
      <body className="min-h-dvh overflow-x-clip antialiased bg-black text-white">
        <NotFound />
      </body>
    </html>
  );
}
