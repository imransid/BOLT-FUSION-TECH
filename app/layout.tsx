import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Portfolite – Brand Identity & Package Designer",
  description:
    "Portfolite is a sleek portfolio template for creatives. Crafting bold visual identities and packaging that captivate and inspire.",
  openGraph: {
    title: "Portfolite – Brand Identity & Package Designer",
    description:
      "Crafting bold visual identities and packaging that captivate and inspire.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          href="https://assets.calendly.com/assets/external/widget.css"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased bg-black text-white`}>
        {/* Grain noise overlay */}
        <div className="grain-overlay" aria-hidden="true" />
        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          strategy="afterInteractive"
        />
        <Script id="calendly-init" strategy="afterInteractive">
          {`window.onload = function() { Calendly.initBadgeWidget({ url: 'https://calendly.com/bolttechfusion/30min?background_color=1a1a1a&text_color=ffffff&primary_color=c8c8c8', text: 'Schedule time with me', color: '#0069ff', textColor: '#ffffff', branding: true }); }`}
        </Script>
        {children}
      </body>
    </html>
  );
}
