import LogoMarkSvg from "@/components/LogoMarkSvg";

/**
 * The Forward Monogram's lockups (SPEC §2):
 *
 *   horizontal  the mark, then the wordmark; the gap is 0.3 x the mark's height
 *   stacked     the mark above the wordmark, for square avatars
 *   mark        the mark alone — favicons, app icons, GitHub, LinkedIn, documents
 *
 * The wordmark: "Bolt Fusion" in Archivo 700, set expanded, then "Tech" in
 * Archivo 500 in the muted colour. Title case, never tracked capitals, and the legal
 * name stays whole. Clear space is one stem width on every side (a sixth of the
 * mark's height); the minimum is 16px for the mark and 100px for a lockup.
 * The sizes and colours are in app/site.css ("The logo").
 *
 * `logotype` marks the wordmark `data-logotype` — the WCAG 1.4.3 logotype
 * exemption, checks 18 and 20 — and that element holds exactly "Bolt Fusion
 * Tech", nothing more. Only the header's logo and the drawer's (hidden until
 * opened) are marked, so one is rendered at a time. Everywhere else the name is
 * plain text and meets contrast on its own (it does: #ECEFF4 and #9AA3B4 on the
 * site's grounds).
 */
export default function Logo({
  lockup = "horizontal",
  logotype = false,
  className = "",
}: {
  lockup?: "horizontal" | "stacked" | "mark";
  logotype?: boolean;
  className?: string;
}) {
  return (
    <span className={`bf-logo bf-logo--${lockup}${className ? ` ${className}` : ""}`}>
      <LogoMarkSvg className="bf-logo__mark" />
      {lockup === "mark" ? null : (
        <span className="bf-wordmark" data-logotype={logotype ? "" : undefined}>
          <span className="bf-wordmark__name">Bolt Fusion</span> <span className="bf-wordmark__tech">Tech</span>
        </span>
      )}
    </span>
  );
}
