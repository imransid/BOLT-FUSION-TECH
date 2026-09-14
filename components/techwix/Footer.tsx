import LogoMarkSvg from "@/components/LogoMarkSvg";
import type { SiteContent } from "@/content/site-schema";

import { ArrowUpIcon } from "./icons";

/**
 * The clone's flat navy footer with the site's own furniture (content/site.ts,
 * `footer`): the copyright line, the three social accounts written out as text
 * (the theme's icon font is not ours), the privacy policy and back to top.
 */
export default function Footer({ footer }: { footer: SiteContent["footer"] }) {
  return (
    <footer className="tw-footer tw-on-dark">
      <div className="tw-footer__inner">
        <p className="tw-footer__brand">
          <LogoMarkSvg uid="tw-footer-mark" className="tw-footer__mark" />
          <span>{footer.copyrightName}</span> <span>{footer.rightsLine}</span>
        </p>
        <ul className="tw-footer__links">
          {footer.socialLinks.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.name}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
          <li>
            <a href="/privacy-policy">Privacy Policy</a>
          </li>
        </ul>
        <a href="#hero" className="tw-footer__top">
          <ArrowUpIcon className="tw-footer__top-icon" />
          {footer.backToTopLabel}
        </a>
      </div>
    </footer>
  );
}
