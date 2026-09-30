import type { SiteContent } from "@/content/site-schema";

import Logo from "./Logo";

/**
 * The site's footer, on every page (SPEC §5): "Bolt Fusion Tech" and "Engineering
 * intelligent systems for the real world.", then the navigation, the social
 * accounts written out as text, the contact route and Schedule a Call; under a
 * hairline, the copyright, the privacy policy and back to top. Registered
 * entity details join the base row when the owner supplies them — there is no
 * slot for them until then.
 *
 * Its Schedule a Call is the ghost (2026-09-29, fix pass B; the design
 * review): the close's filled one is 354px above it on every page that ends
 * in one, and a view holds one primary.
 *
 * The name here is plain text in the lockup, not the `data-logotype` wordmark:
 * it meets contrast on its own (checks 18 and 20). The column labels are not
 * headings, so the page's outline stays the page's.
 */
export default function Footer({ footer }: { footer: SiteContent["footer"] }) {
  return (
    <footer className="bf-footer">
      <div className="bf-footer__inner">
        <div className="bf-footer__brand">
          <Logo />
          <p className="bf-footer__tagline">{footer.tagline}</p>
          <a href={footer.cta.href} className="bf-btn bf-btn--ghost bf-btn--sm" data-cta="schedule">
            {footer.cta.label}
          </a>
        </div>

        <nav className="bf-footer__col" aria-label="Footer">
          <p className="bf-footer__label">{footer.navHeading}</p>
          <ul>
            {footer.nav.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="bf-footer__col">
          <p className="bf-footer__label">{footer.socialHeading}</p>
          <ul>
            {footer.socialLinks.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.name}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="bf-footer__col">
          <p className="bf-footer__label">{footer.contactHeading}</p>
          <ul>
            <li>
              <a href={footer.email.href}>{footer.email.label}</a>
            </li>
            <li>
              <a href="/contact">Contact page</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="bf-footer__base">
        <p className="bf-footer__legal">
          <span>{footer.copyrightName}</span> <span>{footer.rightsLine}</span>
        </p>
        <ul className="bf-footer__legal-links">
          {footer.legal.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
        <a href="#masthead" className="bf-footer__top">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
            <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
          {footer.backToTopLabel}
        </a>
      </div>
    </footer>
  );
}
