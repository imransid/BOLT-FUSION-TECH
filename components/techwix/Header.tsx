import type { SiteContent } from "@/content/site-schema";

import Button from "./Button";
import HeadroomController from "./HeadroomController";
import Logo from "./Logo";
import MobileDrawer from "./MobileDrawer";

/**
 * The clone's header: white, sticky, and headroom — it slides away on the way
 * down and comes back on the way up (HeadroomController). The theme's search,
 * cart, dropdown menus and logo are gone: this site has no search or shop, its
 * navigation is flat, and the mark is ours. Below 1200px the links move into
 * the drawer; below 768px the button does too.
 *
 * The same header on every page. On the homepage its links are anchors on the
 * page; every other page passes `base="/"`, which points the same anchors at
 * the homepage ("/#services") and the logo at "/". `current` marks the link to
 * the page being shown with aria-current.
 */
export default function Header({
  navbar,
  base = "",
  current,
}: {
  navbar: SiteContent["navbar"];
  base?: "" | "/";
  current?: string;
}) {
  const at = (href: string) => (base && href.startsWith("#") ? `${base}${href}` : href);
  const links = navbar.links.map((l) => ({ label: l.label, href: at(l.href) }));
  const cta = at("#schedule");
  return (
    <header id="masthead" className="tw-header headroom headroom--top headroom--pinned headroom--not-bottom">
      <div className="tw-header__bar">
        <a href={base ? "/" : "#hero"} className="tw-header__logo-link">
          <Logo uid="tw-header-logo" />
        </a>

        <nav className="tw-header__nav" aria-label="Primary">
          <ul className="tw-header__menu">
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.href} aria-current={current && l.href === current ? "page" : undefined}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="tw-header__right">
          <Button href={cta} variant="header" className="tw-header__cta">
            {navbar.scheduleCtaLabel}
          </Button>
          <MobileDrawer links={links} ctaLabel={navbar.scheduleCtaLabel} ctaHref={cta} />
        </div>
      </div>
      <HeadroomController targetId="masthead" />
    </header>
  );
}
