"use client";

import { useEffect } from "react";

import type { SceneHandle } from "./scene";

/**
 * The hero's 3D scene loader. It renders NOTHING, on the server or the client:
 * no element, no text, no layout. Everything the hero says stays server HTML,
 * and the poster `<img data-hero-poster>` stays the LCP element.
 *
 * It runs only while ALL of these hold:
 *   - `(pointer: fine) and (min-width: 1025px)` matches;
 *   - `prefers-reduced-motion` is not `reduce`;
 *   - Save-Data is off (`navigator.connection.saveData`).
 * Otherwise it does nothing: no observer, no import, no canvas, no context.
 * The conditions are watched live. When they stop holding (the window narrows
 * below 1025, reduced motion is switched on) the scene is torn down and every
 * GPU resource disposed; the poster was never hidden, so nothing changes on
 * screen but the canvas going.
 *
 * When they hold, it waits for BOTH the first `largest-contentful-paint` entry
 * (a buffered PerformanceObserver) AND the window's `load` event, then for an
 * idle callback (with a timeout fallback where requestIdleCallback is missing),
 * and only then imports `./scene`, a separate chunk that is never part of the
 * initial JavaScript. The canvas goes inside the page's `[data-hero-field]`,
 * absolutely positioned over the field's box, `aria-hidden`, at opacity 0. It
 * fades in once the scene's first frame is drawn, and the field gets
 * `data-scene-ready`. The poster stays rendered underneath; it is never hidden
 * or removed (verify-site check 28).
 *
 * The pause control (components/site/MotionToggle): once the scene has drawn,
 * `#hero` carries `data-scene="live"`, which shows "Pause motion". The button
 * sets `html[data-motion="paused"]` and dispatches `bf:motion` with
 * `{ paused }`; the scene stops its loop and resumes on the next event. A
 * scene that mounts while the attribute is set draws its first frame and waits.
 * `data-scene` goes on teardown.
 *
 * The field is found by `document.querySelector`: a component that renders
 * nothing has no node to call `closest()` from, and the page has one field.
 */

const DESKTOP = "(pointer: fine) and (min-width: 1025px)";
const REDUCED = "(prefers-reduced-motion: reduce)";
const FADE_MS = 700;

type Connection = EventTarget & { saveData?: boolean };
const connection = () => (navigator as Navigator & { connection?: Connection }).connection;

/** The first largest-contentful-paint entry, buffered. */
function firstLcp(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof PerformanceObserver === "undefined" || !PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint")) {
      resolve(); // no LCP in this browser: the load event alone gates
      return;
    }
    /* A tab loaded in the background reports no LCP at all. If the page was
       hidden before its first entry, the first time it is shown stands in. */
    let hiddenEarly = document.visibilityState === "hidden";
    const done = () => {
      po.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      resolve();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenEarly = true;
      else if (hiddenEarly) done();
    };
    const po = new PerformanceObserver((list) => {
      if (list.getEntries().length) done();
    });
    po.observe({ type: "largest-contentful-paint", buffered: true });
    document.addEventListener("visibilitychange", onVisibility);
  });
}

/** The window's load event (already over if the document is complete). */
function loaded(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", () => resolve(), { once: true });
  });
}

function idle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => resolve(), { timeout: 3000 });
    else setTimeout(resolve, 300);
  });
}

type Mount = { dead: boolean; handle?: SceneHandle; canvas?: HTMLCanvasElement; field?: HTMLElement; hero?: HTMLElement | null };

/** The hero's pause control (components/site/MotionToggle) sets this on <html>. */
const motionPaused = () => document.documentElement.dataset.motion === "paused";

export default function HeroScene() {
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP);
    const reduced = window.matchMedia(REDUCED);
    const net = connection();
    const allowed = () => desktop.matches && !reduced.matches && net?.saveData !== true;

    let gate: Promise<unknown> | null = null;
    let current: Mount | null = null;

    const teardown = () => {
      const m = current;
      current = null;
      if (!m) return;
      m.dead = true;
      m.handle?.dispose();
      m.canvas?.remove();
      m.field?.removeAttribute("data-scene-ready");
      m.hero?.removeAttribute("data-scene");
    };

    const mount = async () => {
      if (current) return;
      const m: Mount = { dead: false };
      current = m;
      gate ??= Promise.all([firstLcp(), loaded()]);
      await gate;
      await idle();
      if (m.dead) return;
      const field = document.querySelector<HTMLElement>("[data-hero-field]");
      if (!field) return;
      /* A failed import (offline, a deploy in between) leaves the poster. The
         mount stays current, so it is not retried in a loop. */
      const mod = await import("./scene").catch(() => null);
      if (m.dead || !mod) return;

      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.cssText = `position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity ${FADE_MS}ms ease-out;pointer-events:none`;
      field.append(canvas);
      const handle = mod.createScene(canvas, {
        /* already paused by the visitor: draw t = 0, run no loop */
        paused: motionPaused(),
        /* a lost context: drop the canvas; the poster is already underneath */
        onLost: () => {
          if (current === m) teardown();
        },
      });
      if (!handle) {
        canvas.remove(); // no WebGL: the poster stays, and nothing retries
        return;
      }
      Object.assign(m, { handle, canvas, field, hero: field.closest<HTMLElement>("#hero") });
      handle.ready.then(() => {
        if (m.dead) return;
        field.setAttribute("data-scene-ready", "");
        /* shows the hero's "Pause motion" button; it stays while paused, so it can resume */
        m.hero?.setAttribute("data-scene", "live");
        canvas.style.opacity = "1";
      });
    };

    const onChange = () => (allowed() ? void mount() : teardown());
    /* the pause control: { paused } in the event, the <html> attribute as a fallback */
    const onMotion = (e: Event) => {
      const paused = (e as CustomEvent<{ paused?: boolean } | null>).detail?.paused;
      current?.handle?.setPaused(typeof paused === "boolean" ? paused : motionPaused());
    };
    desktop.addEventListener("change", onChange);
    reduced.addEventListener("change", onChange);
    net?.addEventListener?.("change", onChange);
    window.addEventListener("bf:motion", onMotion);
    if (allowed()) void mount();

    return () => {
      desktop.removeEventListener("change", onChange);
      reduced.removeEventListener("change", onChange);
      net?.removeEventListener?.("change", onChange);
      window.removeEventListener("bf:motion", onMotion);
      teardown();
    };
  }, []);

  return null;
}
