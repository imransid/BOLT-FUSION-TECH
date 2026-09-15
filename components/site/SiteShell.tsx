import type { ReactNode } from "react";

import { siteContent } from "@/content/site";

import Footer from "./Footer";
import Header from "./Header";
import SiteMotion from "./SiteMotion";

/**
 * Every page's frame (owner's redesign, 2026-09-16): the header, the page's
 * <main id="main"> — the skip link's target — and the footer, with the quiet
 * motion. `current` is the header link to mark as this page ("/work").
 *
 * `ground="graphite"` paints the redesign's dark ground behind the page (the
 * homepage, /contact, and each inner page as the next wave moves it); an inner
 * page still in the older design passes nothing and keeps its own light bands
 * (components/techwix/PageShell). app/site.css paints <body> to match whichever
 * ground the page's <main> carries, so overscroll never shows the other one.
 */
export default function SiteShell({
  children,
  current,
  ground,
}: {
  children: ReactNode;
  current?: string;
  ground?: "graphite";
}) {
  const { navigation, footer } = siteContent;
  return (
    <>
      <Header navigation={navigation} current={current} />
      <main id="main" className={ground === "graphite" ? "bf-main" : undefined}>
        {children}
      </main>
      <Footer footer={footer} />
      <SiteMotion />
    </>
  );
}
