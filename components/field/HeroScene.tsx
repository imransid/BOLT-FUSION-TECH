"use client";

import { useEffect } from "react";

import { loaded, lcpSeen } from "@/components/motion/lcp";

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
 * idle callback (with a timeout fallback where requestIdleCallback is missing).
 * The browser reports no LCP after the reader's first input, so that input,
 * or 3s after load, stands in for the entry (components/motion/lcp.ts, the
 * Signal's wait too): with the entry alone, a wheel, a key or a click before
 * the first paint left the scene waiting for ever (2026-09-29). Then it
 * imports `./scene`, a separate chunk that is never part of the
 * initial JavaScript. The canvas goes inside the page's `[data-hero-field]`,
 * absolutely positioned over the field's box, `aria-hidden`, at opacity 0. It
 * fades in once the scene's first frame is drawn, and the field gets
 * `data-scene-ready`. The poster stays rendered underneath; it is never hidden
 * or removed (verify-site check 28).
 *
 * Once the scene has drawn, `#hero` carries `data-scene="live"` (the field's
 * grab cursor reads it); it goes on teardown. There is no pause control since
 * 2026-10-24 — the owner: "remove Pause motion button, all time should be
 * move but mouse to control". The scene runs whenever it is on screen and
 * the tab is visible; reduced motion still never mounts it.
 *
 * The field is found by `document.querySelector`: a component that renders
 * nothing has no node to call `closest()` from, and the page has one field.
 */

const DESKTOP = "(pointer: fine) and (min-width: 1025px)";
const REDUCED = "(prefers-reduced-motion: reduce)";
const FADE_MS = 700;

type Connection = EventTarget & { saveData?: boolean };
const connection = () => (navigator as Navigator & { connection?: Connection }).connection;

function idle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => resolve(), { timeout: 3000 });
    else setTimeout(resolve, 300);
  });
}

type Mount = { dead: boolean; handle?: SceneHandle; canvas?: HTMLCanvasElement; field?: HTMLElement; hero?: HTMLElement | null };

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
      gate ??= Promise.all([lcpSeen(), loaded()]);
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
        m.hero?.setAttribute("data-scene", "live");
        canvas.style.opacity = "1";
      });
    };

    const onChange = () => (allowed() ? void mount() : teardown());
    desktop.addEventListener("change", onChange);
    reduced.addEventListener("change", onChange);
    net?.addEventListener?.("change", onChange);
    if (allowed()) void mount();

    return () => {
      desktop.removeEventListener("change", onChange);
      reduced.removeEventListener("change", onChange);
      net?.removeEventListener?.("change", onChange);
      teardown();
    };
  }, []);

  return null;
}
