import type { ReactNode } from "react";

import SiteShell from "@/components/site/SiteShell";

import RevealObserver from "./RevealObserver";

/**
 * The inner pages still in the older design — /work, both write-ups, the
 * privacy policy and the 404 — inside the site's one shell since 2026-09-16:
 * the redesign's header, navigation and footer (components/site), around the
 * page's own light bands, with the older design's reveal for the blocks those
 * pages mark `data-tw-reveal`. The next wave restyles each page onto the
 * redesign and moves it to SiteShell directly; this file goes with the last.
 * `current` is the header link to mark as this page ("/work").
 */
export default function PageShell({ children, current }: { children: ReactNode; current?: string }) {
  return (
    <SiteShell current={current}>
      {children}
      <RevealObserver />
    </SiteShell>
  );
}
