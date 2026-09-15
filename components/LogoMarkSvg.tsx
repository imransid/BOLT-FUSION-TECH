import { MARK_BOWLS, MARK_STEM, MARK_VIEWBOX, type MarkVariant } from "@/lib/mark";

/**
 * The Forward Monogram — the drawing only (geometry in lib/mark.ts). No hooks,
 * no motion, no "use client", no gradients and so no ids: any number of
 * instances can share a page, and a server component can render it.
 *
 *  · The stem and the upper bowl are `currentColor`; the lower bowl is the one
 *    accent, `var(--brand)` (app/site.css sets it to the site's brand blue inside
 *    the site's shell; on the older pages it resolves to their own brand).
 *  · `mono` draws all three parts in currentColor.
 *  · The share image renders outside CSS (satori), where neither currentColor
 *    nor a variable resolves: it passes `color` and `accent` as real colours.
 *
 * Decorative wherever it appears: the wordmark or the link around it names the
 * company (components/site/Logo.tsx).
 */
export default function LogoMarkSvg({
  className,
  size,
  color = "currentColor",
  accent = "var(--brand)",
  mono = false,
  variant = "standard",
}: {
  className?: string;
  size?: number;
  color?: string;
  accent?: string;
  mono?: boolean;
  variant?: MarkVariant;
}) {
  const b = MARK_BOWLS[variant];
  return (
    <svg
      viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      width={size}
      height={size}
      fill={color}
    >
      <rect x={MARK_STEM.x} y={MARK_STEM.y} width={MARK_STEM.width} height={MARK_STEM.height} />
      <polygon points={b.upper} />
      <polygon points={b.lower} fill={mono ? color : accent} />
    </svg>
  );
}
