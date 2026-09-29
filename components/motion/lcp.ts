/**
 * The waits before anything heavy loads, shared by the hero scene's loader
 * (components/field/HeroScene.tsx) and the Signal's (./MotionLoader.tsx), so
 * the two can never disagree about when the page has painted (CLAUDE.md, "The
 * hero field" and "Motion, as built"). Nothing here imports anything.
 *
 * `lcpSeen()` resolves at the FIRST of:
 *   - the first largest-contentful-paint entry (a buffered observer);
 *   - the reader's first key, press, wheel turn, scroll or touch — the
 *     browser reports no LCP entry after the first input, so one made before
 *     the first paint means no entry will ever come;
 *   - LCP_WAIT_MS after the load event — an input made before hydration,
 *     which no listener here can see, ended LCP just the same;
 *   - a tab loaded in the background (it reports no LCP at all) being shown
 *     for the first time.
 * Until 2026-09-29 the scene waited for the entry alone: a wheel, a key or a
 * click before the first paint (at 45-126ms, the first paint at 160-304ms)
 * left it waiting for ever — 5 of 5 trials, no canvas after 25s — while the
 * Signal, which had these fallbacks, started (the engineering review).
 */

/* the reader's inputs after which the browser reports no more LCP entries */
const INPUTS = ["keydown", "pointerdown", "wheel", "scroll", "touchstart"] as const;
/* no LCP entry this long after load means none is coming */
export const LCP_WAIT_MS = 3000;

/** The window's load event (already over if the document is complete). */
export const loaded = () =>
  new Promise<void>((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", () => r(), { once: true })));

/** The first LCP entry, or the first input, or LCP_WAIT_MS after load — whichever comes first. */
export function lcpSeen(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof PerformanceObserver === "undefined" || !PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint")) return resolve();
    let hiddenEarly = document.visibilityState === "hidden";
    let timer: ReturnType<typeof setTimeout> | undefined;
    let over = false;
    const done = () => {
      if (over) return;
      over = true;
      po.disconnect();
      clearTimeout(timer);
      window.removeEventListener("load", arm);
      document.removeEventListener("visibilitychange", onVis);
      for (const t of INPUTS) window.removeEventListener(t, done, true);
      resolve();
    };
    const arm = () => {
      timer = setTimeout(done, LCP_WAIT_MS);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenEarly = true;
      else if (hiddenEarly) done();
    };
    const po = new PerformanceObserver((l) => void (l.getEntries().length && done()));
    po.observe({ type: "largest-contentful-paint", buffered: true });
    document.addEventListener("visibilitychange", onVis);
    for (const t of INPUTS) window.addEventListener(t, done, { capture: true, passive: true });
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
  });
}
