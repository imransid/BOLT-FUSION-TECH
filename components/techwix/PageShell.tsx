import type { ReactNode } from "react";

import { siteContent } from "@/content/site";

import Footer from "./Footer";
import Header from "./Header";
import RevealObserver from "./RevealObserver";

/**
 * Every page but the homepage, and the 404: the homepage's header and footer
 * around the page's own <main>, and the reveal. The header's anchors point at
 * the homepage ("/#services"); back to top goes to the header, which every page
 * has. `current` is the header link to mark as this page ("/work").
 */
export default function PageShell({ children, current }: { children: ReactNode; current?: string }) {
  const { navbar, footer } = siteContent;
  return (
    <>
      <Header navbar={navbar} base="/" current={current} />
      <main id="main">{children}</main>
      <Footer footer={footer} topHref="#masthead" />
      <RevealObserver />
    </>
  );
}
