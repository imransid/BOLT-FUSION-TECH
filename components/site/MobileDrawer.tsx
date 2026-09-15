"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import Logo from "./Logo";

type NavLink = { label: string; href: string };

const subscribeNothing = () => () => {};

/**
 * The burger, the drawer and its overlay in one component, so the open state,
 * the focus trap and the burger's aria-expanded cannot drift apart. Below the
 * header's own breakpoint (1200px) it is the site's navigation.
 *
 *  · Open: a modal dialog. Focus moves into it, Tab and Shift+Tab cycle inside
 *    it, Escape or the close button closes it and returns focus to the burger,
 *    and the page behind does not scroll.
 *  · Closed: both parts carry `hidden` — not rendered, not focusable, not in
 *    the accessibility tree.
 *  · In the server HTML the drawer is rendered beside the burger, hidden, so
 *    the burger's aria-controls names an element before any script runs; after
 *    mount it is portalled to <body>, because the header is a sticky box that
 *    moves with a transform, and a fixed element inside a transformed ancestor
 *    is positioned against that ancestor, not the viewport. Without JavaScript
 *    the burger cannot open it: below 1200px a reader without script navigates
 *    by the footer and the page's own links.
 */
export default function MobileDrawer({
  links,
  cta,
  current,
}: {
  links: readonly NavLink[];
  cta: NavLink;
  current?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  /* A link inside the drawer navigates, so focus follows the page, not the
     burger; closing any other way hands focus back to the burger. */
  const focusBurgerOnClose = useRef(true);

  const close = useCallback((toBurger: boolean) => {
    focusBurgerOnClose.current = toBurger;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const burger = burgerRef.current;
    if (!panel) return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";

    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    /* The burger only exists below 1200px; if the window grows past it with
       the drawer open, close it rather than strand the overlay. */
    const wide = window.matchMedia("(min-width: 1200px)");
    const onWide = () => {
      if (wide.matches) close(false);
    };

    document.addEventListener("keydown", onKeyDown);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      wide.removeEventListener("change", onWide);
      root.style.overflow = overflow;
      if (focusBurgerOnClose.current) burger?.focus();
      focusBurgerOnClose.current = true;
    };
  }, [open, close]);

  /* The portal target exists only on the client: false during SSR, true after
     hydration, without a setState in an effect. */
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  const panel = (
    <>
      <div className="bf-drawer-overlay" hidden={!open} aria-hidden="true" onClick={() => close(true)} />
      <div id="bf-drawer" ref={panelRef} className="bf-drawer" role="dialog" aria-modal="true" aria-label="Menu" hidden={!open}>
        <div className="bf-drawer__top">
          <Logo logotype />
          <button type="button" className="bf-drawer__close" aria-label="Close menu" onClick={() => close(true)}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          </button>
        </div>
        {/* The navigation landmark below 1200px, where the header's own <nav>
            is not rendered. */}
        <nav aria-label="Primary" className="bf-drawer__nav">
          <ul className="bf-drawer__menu">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="bf-drawer__link"
                  aria-current={current === l.href ? "page" : undefined}
                  onClick={() => close(false)}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href={cta.href} className="bf-btn bf-btn--primary bf-btn--md bf-drawer__cta" data-cta="schedule" onClick={() => close(false)}>
          {cta.label}
        </a>
      </div>
    </>
  );

  return (
    <>
      <button
        ref={burgerRef}
        type="button"
        className="bf-header__burger"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="bf-drawer"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
          <path d="M4 7h16M4 12h16M4 17h10" fill="none" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      </button>
      {mounted ? createPortal(panel, document.body) : panel}
    </>
  );
}
