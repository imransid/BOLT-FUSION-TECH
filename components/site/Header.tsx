import Link from "next/link";

import type { SiteContent } from "@/content/site-schema";

import HeadroomController from "./HeadroomController";
import Logo from "./Logo";
import MobileDrawer from "./MobileDrawer";

/**
 * The site's header, on every page (owner's redesign, 2026-09-16): the Forward
 * Monogram lockup, the six routes (SPEC §4: Work · Capabilities · Industries ·
 * Engineering · About · Insights) and the prominent Schedule a Call, which goes
 * to the booking calendar on /contact.
 *
 * Graphite, sticky, and headroom: it slides away on the way down and comes back
 * on the way up (HeadroomController). The full navigation shows from 1200px —
 * the header's own breakpoint; below it the links move into the drawer, and
 * below 520px the button does too. `current` marks the page's own link with
 * aria-current. `id="masthead"` is the page's top, which "Back to top" targets.
 *
 * The logo links home with <Link prefetch={false}>: eslint's
 * no-html-link-for-pages wants a literal "/" as a Link (verify-site check 24).
 */
export default function Header({ navigation, current }: { navigation: SiteContent["navigation"]; current?: string }) {
  return (
    <header id="masthead" className="bf-header headroom headroom--top headroom--pinned headroom--not-bottom">
      <div className="bf-header__bar">
        <Link href="/" prefetch={false} className="bf-header__home">
          <Logo logotype />
        </Link>

        <nav className="bf-header__nav" aria-label="Primary">
          <ul className="bf-header__menu">
            {navigation.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} aria-current={current === l.href ? "page" : undefined}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="bf-header__end">
          <a href={navigation.cta.href} className="bf-btn bf-btn--primary bf-btn--sm bf-header__cta" data-cta="schedule">
            {navigation.cta.label}
          </a>
          <MobileDrawer links={navigation.links} cta={navigation.cta} current={current} />
        </div>
      </div>
      <HeadroomController targetId="masthead" />
    </header>
  );
}
