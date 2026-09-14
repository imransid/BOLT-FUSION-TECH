import LogoMarkSvg from "@/components/LogoMarkSvg";

/**
 * The homepage's logo: our mark, in the dark tile it was drawn for, beside the
 * wordmark set in the homepage's faces (app/(home)/techwix.css, "The logo").
 *
 * The wordmark is the element marked `data-logotype`. WCAG 2.2 SC 1.4.3 exempts
 * logotypes from the contrast requirement, and verify-site exempts THIS element
 * from its two contrast checks (18 and 20) and nothing else — check 18 fails if
 * a data-logotype element ever holds anything but "Bolt Fusion Tech", so the
 * attribute cannot quietly become a small-text exemption. Nothing but the three
 * words goes inside it.
 *
 * No hooks and no "use client": the mark's gradient ids come from `uid`, so each
 * instance on the page passes its own.
 */
export default function Logo({ uid }: { uid: string }) {
  return (
    <span className="tw-logo">
      <span className="tw-logo__tile" aria-hidden="true">
        <LogoMarkSvg uid={uid} />
      </span>
      <span data-logotype className="tw-logo__words">
        <span className="tw-logo__bolt">Bolt</span>
        <span className="tw-logo__fusion">Fusion</span>
        <span className="tw-logo__techrow">
          <span className="tw-logo__dot" aria-hidden="true" />
          <span className="tw-logo__line" aria-hidden="true" />
          <span className="tw-logo__tech">Tech</span>
        </span>
      </span>
    </span>
  );
}
