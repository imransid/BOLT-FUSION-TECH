"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * One primary in view (2026-09-29, fix pass B; the design review): while a
 * filled Schedule a Call in the page itself is on screen — the hero's, the
 * proof's, the ledger's, the close's — the header's own Schedule a Call steps
 * down to the ghost treatment (`data-quiet`, app/site.css), and takes its fill
 * back once none is. On the first screen the header's and the hero's were
 * both filled, and so was every pinned header over one of the page's calls.
 *
 * An IntersectionObserver on those buttons, inset by the header's height (a
 * button under the header is not in view), re-read after a client-side
 * navigation (`usePathname`). A data attribute, not an inline style: nothing
 * here moves, and under reduced motion the swap has no transition. The server
 * sends the header's call quiet on `/`, where the hero's is on the first
 * screen (Header's `ctaQuiet`), and filled everywhere else. Renders nothing.
 */
export default function HeaderCtaQuiet({ targetId }: { targetId: string }) {
  const path = usePathname();
  useEffect(() => {
    const header = document.getElementById(targetId);
    const cta = header?.querySelector<HTMLElement>(".bf-header__cta");
    if (!header || !cta || typeof IntersectionObserver === "undefined") return;
    const calls = [...document.querySelectorAll<HTMLElement>('main [data-cta="schedule"].bf-btn--primary')];
    const seen = new Set<Element>();
    const apply = () => cta.toggleAttribute("data-quiet", seen.size > 0);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target);
          else seen.delete(e.target);
        }
        apply();
      },
      { rootMargin: `-${Math.round(header.getBoundingClientRect().height)}px 0px 0px 0px` },
    );
    for (const c of calls) io.observe(c);
    if (!calls.length) apply();
    return () => io.disconnect();
  }, [targetId, path]);
  return null;
}
