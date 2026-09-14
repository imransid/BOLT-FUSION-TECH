"use client";

import { useEffect } from "react";

/**
 * The header's scroll state machine — the clone's measured headroom.js
 * behaviour, reimplemented rather than imported (branch techwix-replica,
 * CLAUDE.md "Header"):
 *
 *   offset           200   scrollY <= 200 is --top; 201 is --not-top
 *   tolerance.up     7     an upward move must EXCEED 7px to pin
 *   tolerance.down   0     any downward move at all unpins
 *
 * The classes land on the <header> itself; --bottom replaces --not-bottom at
 * scrollY + innerHeight >= scrollHeight. The slide is a CSS transition on
 * .tw-header (app/(home)/techwix.css), dropped under reduced motion; the state
 * machine still runs, because it is functional, not decorative. A focused
 * control inside the header pins it (CSS :focus-within), so a keyboard user
 * never tabs into a header that is off screen. Renders nothing.
 */

const OFFSET = 200;
const TOLERANCE_UP = 7;
const TOLERANCE_DOWN = 0;

export default function HeadroomController({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;

    // Seeded from the real scroll position, so a reload part-way down the page
    // does not read as a large upward move on the first frame.
    let last = window.scrollY;
    let queued = false;

    const apply = () => {
      queued = false;
      const y = window.scrollY;
      const delta = y - last;
      const atTop = y <= OFFSET;
      const atBottom = y + window.innerHeight >= document.documentElement.scrollHeight;

      let pinned: boolean;
      if (atTop) pinned = true;
      else if (delta > TOLERANCE_DOWN) pinned = false;
      else if (-delta > TOLERANCE_UP) pinned = true;
      // Inside the tolerance band nothing changes: small scroll jitter must
      // not flip the header.
      else pinned = el.classList.contains("headroom--pinned");

      el.classList.toggle("headroom--top", atTop);
      el.classList.toggle("headroom--not-top", !atTop);
      el.classList.toggle("headroom--bottom", atBottom);
      el.classList.toggle("headroom--not-bottom", !atBottom);
      el.classList.toggle("headroom--pinned", pinned);
      el.classList.toggle("headroom--unpinned", !pinned);
      last = y;
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => window.removeEventListener("scroll", onScroll);
  }, [targetId]);

  return null;
}
