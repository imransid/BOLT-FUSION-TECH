import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

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
    "We design, build, and ship reliable web and mobile products—clear roadmaps, senior engineers, and delivery you can plan around.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Bolt Fusion Tech – Custom Software & Product Engineering",
    description:
      "Partner with a product-minded engineering team to launch faster, reduce risk, and scale with confidence.",
    type: "website",
    locale: "en_US",
    siteName: "Bolt Fusion Tech",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bolt Fusion Tech – Custom Software & Product Engineering",
    description:
      "Partner with a product-minded engineering team to launch faster, reduce risk, and scale with confidence.",
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
    <html lang="en" className="scroll-smooth scroll-pt-20 md:scroll-pt-24">
      <body
        className={`${inter.variable} ${satoshi.variable} min-h-dvh overflow-x-clip antialiased bg-black text-white`}
      >
        {/* Grain noise overlay */}
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
