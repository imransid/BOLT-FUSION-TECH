"use client";

import { useEffect } from "react";

import { loaded, lcpSeen } from "./lcp";

/**
 * The Signal motion system's loader (owner, 2026-09-28; CLAUDE.md "Motion, as
 * built"). It renders NOTHING, and it is the ONE module that imports gsap —
 * always dynamically, never statically (verify-site check 31).
 *
 * The gate, checked BEFORE any import, so a visitor outside it never requests
 * a byte of gsap (checks 21, 25 and 29):
 *   (min-width: 1025px) and (pointer: fine) and
 *   (prefers-reduced-motion: no-preference), with Save-Data off.
 * Phones, touch tablets, 1024 and below, Save-Data and reduced motion get the
 * CSS motion alone (components/site/SiteMotion.tsx), which runs for everyone
 * and loses nothing when gsap never arrives. A page with nothing to trace (no
 * `[data-bf-flow]` or `[data-bf-trace]` outside the hero) imports nothing.
 *
 * The staging, each step its own task:
 *   1. the first largest-contentful-paint entry AND the load event — then a
 *      macrotask, so nothing starts inside the load event (check 29 fails a
 *      gsap chunk requested before loadEventEnd). The browser reports no LCP
 *      after the reader's first input, so that input stands in for the entry,
 *      and one made before hydration, which nothing here can see, is covered
 *      by giving up on the entry 3s after load (./lcp.ts, the hero scene's
 *      wait too);
 *   2. the hero scene's first frame (`data-scene-ready`) or 3s, whichever comes
 *      first — a desktop whose WebGL context is refused never gets the
 *      attribute; a page with no hero field skips the wait;
 *   3. an idle callback (a timeout where requestIdleCallback is missing);
 *   — the first scroll cuts 2 and 3 short, never 1;
 *   4. gsap core · yield · ScrollTrigger · yield · registerPlugin · yield ·
 *      DrawSVGPlugin · yield · the engine (./signal) · yield · start, and the
 *      engine then arms one section per task.
 * The gate is watched live: the engine builds inside `gsap.matchMedia`, which
 * reverts everything when a media condition stops holding and rebuilds when it
 * holds again; Save-Data is not a media query, so a Save-Data change stops the
 * engine here. A failed import leaves the page as the server sent it.
 */

/* The gate, one condition per line (verify-site's misuse cases patch each alone). */
const WIDE = "(min-width: 1025px)";
const FINE = "(pointer: fine)";
const CALM = "(prefers-reduced-motion: no-preference)";
const GATE = `${WIDE} and ${FINE} and ${CALM}`;
const SCENE_WAIT_MS = 3000;
const IDLE_TIMEOUT_MS = 3000;
/* what the engine animates; nothing in the hero ever does */
const HOSTS = "[data-bf-flow], [data-bf-trace]";

type Connection = EventTarget & { saveData?: boolean };
type Stop = () => void;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/* scheduler.yield where it exists (Chrome, Firefox), a macrotask elsewhere */
const yieldTask = (): Promise<void> => {
  const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  return s?.yield ? s.yield() : sleep(0);
};

/** The hero scene's first frame, or `ms`; no field on the page, no wait. */
function sceneOr(ms: number): Promise<void> {
  const field = document.querySelector("[data-hero-field]");
  if (!field || field.hasAttribute("data-scene-ready")) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      mo.disconnect();
      clearTimeout(t);
      resolve();
    };
    const mo = new MutationObserver(() => field.hasAttribute("data-scene-ready") && done());
    mo.observe(field, { attributes: true, attributeFilter: ["data-scene-ready"] });
    const t = setTimeout(done, ms);
  });
}

const idle = () =>
  new Promise<void>((r) => (typeof requestIdleCallback === "function" ? requestIdleCallback(() => r(), { timeout: IDLE_TIMEOUT_MS }) : setTimeout(r, 300)));

/** Anything to trace on this page, outside the hero. */
const hasHosts = () => [...document.querySelectorAll(HOSTS)].some((h) => !h.closest("#hero"));

export default function MotionLoader() {
  useEffect(() => {
    const gate = window.matchMedia(GATE);
    const net = (navigator as Navigator & { connection?: Connection }).connection;
    const allowed = () => gate.matches && net?.saveData !== true;

    let dead = false;
    let loading = false;
    let stop: Stop | null = null;
    let offScroll = () => {};

    const load = async () => {
      if (loading || stop || !hasHosts()) return;
      loading = true;
      /* the first scroll cuts the scene and idle waits short (never the load wait) */
      const firstScroll = new Promise<void>((r) => {
        const on = () => r();
        window.addEventListener("scroll", on, { once: true, passive: true });
        offScroll = () => window.removeEventListener("scroll", on);
      });
      try {
        await Promise.all([lcpSeen(), loaded()]);
        await sleep(0); /* out of the load event: loadEventEnd is set before this runs */
        await Promise.race([sceneOr(SCENE_WAIT_MS), firstScroll]);
        await Promise.race([idle(), firstScroll]);
        offScroll();
        if (dead || !allowed()) return;
        const { gsap } = await import("gsap");
        await yieldTask();
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        await yieldTask();
        gsap.registerPlugin(ScrollTrigger);
        await yieldTask();
        const { DrawSVGPlugin } = await import("gsap/DrawSVGPlugin");
        gsap.registerPlugin(DrawSVGPlugin);
        await yieldTask();
        const engine = await import("./signal");
        await yieldTask();
        if (dead || !allowed()) return;
        stop = engine.startSignal({ gsap, ScrollTrigger, gate: GATE, yieldTask });
      } catch {
        /* offline, or a deploy in between: the page stays as the server sent it */
      } finally {
        loading = false;
      }
    };

    /* The media conditions turning OFF are gsap.matchMedia's to revert (inside
       the engine, which rebuilds when they hold again); turning ON loads the
       engine the first time. Save-Data switched on stops it here. */
    const onGate = () => void (allowed() && load());
    const onNet = () => {
      if (net?.saveData === true) {
        stop?.();
        stop = null;
      } else onGate();
    };
    gate.addEventListener("change", onGate);
    net?.addEventListener?.("change", onNet);
    onGate();

    return () => {
      dead = true;
      offScroll();
      gate.removeEventListener("change", onGate);
      net?.removeEventListener?.("change", onNet);
      stop?.();
      stop = null;
    };
  }, []);

  return null;
}
