import type { ReactNode } from "react";

import MotionLoader from "@/components/motion/MotionLoader";
import { siteContent } from "@/content/site";

import Footer from "./Footer";
import Header from "./Header";
import SiteMotion from "./SiteMotion";

/**
 * Every page's frame (owner's redesign, 2026-09-16): the header, the page's
 * <main id="main"> — the skip link's target — and the footer, with the quiet
 * motion: the CSS reveal and flow for everyone (SiteMotion), and the Signal
 * system's loader (components/motion), which renders nothing and loads gsap
 * only on a desktop that allows motion. `current` is the header link to mark
 * as this page ("/work").
 *
 * `ground="graphite"` paints the redesign's dark ground behind the page: the
 * main gets `.bf-main`, which carries the body type and the ground, and
 * app/site.css paints <html> and <body> to match. Since the Techwix design was
 * retired (2026-09-16) there is no other ground, so it is the default; every
 * page still says so.
 */
export default function SiteShell({
  children,
  current,
  ground = "graphite",
  headerCtaQuiet = false,
}: {
  children: ReactNode;
  current?: string;
  ground?: "graphite";
  /** The header's Schedule a Call starts quiet: the page has its own on the
   *  first screen (the homepage's hero). components/site/HeaderCtaQuiet. */
  headerCtaQuiet?: boolean;
}) {
  const { navigation, footer } = siteContent;
  return (
    <>
      <Header navigation={navigation} current={current} ctaQuiet={headerCtaQuiet} />
      <main id="main" className={ground === "graphite" ? "bf-main" : undefined}>
        {children}
      </main>
      <Footer footer={footer} />
      <SiteMotion />
      <MotionLoader />
    </>
  );
}
