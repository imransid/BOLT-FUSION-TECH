"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { CloseIcon, MenuIcon } from "./icons";
import Logo from "./Logo";

type NavLink = { label: string; href: string };

const subscribeNothing = () => () => {};

/**
 * The burger, the drawer and its overlay in one component, so the open state,
 * the focus trap and the burger's aria-expanded cannot drift apart.
 *
 *  · Open: a modal dialog. Focus moves into it, Tab and Shift+Tab cycle inside
 *    it, Escape or the close button closes it and returns focus to the burger,
 *    and the page behind does not scroll.
 *  · Closed: both parts carry `hidden` — not rendered, not focusable, not in
 *    the accessibility tree.
 *  · The panel is portalled to <body>: the header is a sticky box that moves
 *    with a transform, and a fixed element inside a transformed ancestor is
 *    positioned against that ancestor, not the viewport.
 */
export default function MobileDrawer({ links, ctaLabel, ctaHref }: { links: readonly NavLink[]; ctaLabel: string; ctaHref: string }) {
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
      if (focusBurgerOnClose.current) burgerRef.current?.focus();
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
      <div className="tw-drawer-overlay" hidden={!open} aria-hidden="true" onClick={() => close(true)} />
      <div id="tw-drawer" ref={panelRef} className="tw-drawer" role="dialog" aria-modal="true" aria-label="Menu" hidden={!open}>
        <div className="tw-drawer__top">
          <Logo uid="tw-drawer-logo" />
          <button type="button" className="tw-drawer__close" aria-label="Close menu" onClick={() => close(true)}>
            <CloseIcon />
          </button>
        </div>
        {/* The navigation landmark below 1200px, where the header's own <nav>
            is not rendered (A5). */}
        <nav aria-label="Primary">
          <ul className="tw-drawer__menu">
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="tw-drawer__link" onClick={() => close(false)}>
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a href={ctaHref} className="tw-drawer__link" onClick={() => close(false)}>
                {ctaLabel}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );

  return (
    <>
      <button
        ref={burgerRef}
        type="button"
        className="tw-header__burger"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="tw-drawer"
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>
      {/* In the server HTML the drawer is rendered here, hidden, so the
          burger's aria-controls names an element before any script runs (A4);
          after mount it moves to <body>. */}
      {mounted ? createPortal(panel, document.body) : panel}
    </>
  );
}
