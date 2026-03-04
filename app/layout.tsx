import { ReactNode } from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import Footer from "layout/footer/footer";
import WidthSizeProvider from "providers/width-size/width-size-provider";
import ScrollProvider from "providers/scroll/scroll-provider";
import Compose from "utils/compose/compose";
import { InterFont, SyneFont } from "theme/font";
import "styles/globals.css";

type RootLayoutProps = {
  children: ReactNode;
  session: never;
};

export const metadata: Metadata = {
  title: "BOLT FUSION TECH — Software Agency",
  description: "Full-stack software agency: mobile apps, backends, AI, robotics, ERP & SaaS. Secure, scalable, delivered.",
  icons: {
    icon: "/favicon.ico",
  },
  other: {
    "theme-color": "#0a0a0f",
    "color-scheme": "dark",
    "twitter:title": "BOLT FUSION TECH — Software Agency",
    "twitter:description": "Full-stack software agency: mobile apps, backends, AI, robotics, ERP & SaaS. Secure, scalable, delivered.",
    "twitter:url": "https://software-agency-website.vercel.app/",
    "twitter:domain": "software-agency-website.vercel.app",
    "twitter:card": "summary_large_image",
    "og:title": "BOLT FUSION TECH — Software Agency",
    "og:description": "Full-stack software agency: mobile apps, backends, AI, robotics, ERP & SaaS. Secure, scalable, delivered.",
    "og:url": "https://software-agency-website.vercel.app/",
    "og:type": "website",
  },
};

const RootLayout = async ({ children }: RootLayoutProps) => {
  const Providers = [WidthSizeProvider, ScrollProvider];

  return (
    <html lang="en">
      <body className={`${InterFont.variable} ${SyneFont.variable} ${InterFont.className} font-sans antialiased`}>
        <Compose providers={Providers as never}>
          {children}
          <Footer />
          <Analytics />
        </Compose>
      </body>
    </html>
  );
};

export default RootLayout;
