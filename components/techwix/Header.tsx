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
 */
export default function Header({ navbar }: { navbar: SiteContent["navbar"] }) {
  return (
    <header id="masthead" className="tw-header headroom headroom--top headroom--pinned headroom--not-bottom">
      <div className="tw-header__bar">
        <a href="#hero" className="tw-header__logo-link">
          <Logo uid="tw-header-logo" />
        </a>

        <nav className="tw-header__nav" aria-label="Primary">
          <ul className="tw-header__menu">
            {navbar.links.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="tw-header__right">
          <Button href="#schedule" variant="header" className="tw-header__cta">
            {navbar.scheduleCtaLabel}
          </Button>
          <MobileDrawer links={navbar.links} ctaLabel={navbar.scheduleCtaLabel} ctaHref="#schedule" />
        </div>
      </div>
      <HeadroomController targetId="masthead" />
    </header>
  );
}
