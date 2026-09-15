/**
 * The Forward Monogram (engineering redesign SPEC §2, owner 2026-09-16): a B
 * built from three engineered parts — a vertical stem and two angular bowls
 * that point forward like chevrons — fused with narrow seams. It reads as B,
 * as forward motion, and as parts assembled into one structure. No lightning
 * bolt.
 *
 * This file is the ONE source of the mark's geometry. Every drawing of it reads
 * from here: components/LogoMarkSvg.tsx (the header, the drawer, the footer,
 * the WarmChats sign-off and the share image) and scripts/generate-icons.mjs
 * (favicon.svg, app/favicon.ico and the apple-touch icon). Erasable TypeScript
 * only — no enums, no namespaces — so that node script imports it as it is.
 *
 * On a 48-unit grid:
 *   stem         x 9–17, y 6–42
 *   upper bowl   19,6 28,6 36,14 28,22 19,22
 *   lower bowl   19,24 30,24 39,33 30,42 19,42 — the one accent (--brand)
 * The seams are 2 units: stem to bowls, and bowl to bowl.
 *
 * Below 24px (favicons) the seams widen to 3 units: both bowls move right by 1
 * and the lower bowl down by 1, and the mark is one colour on the brand ground.
 */
export const MARK_VIEWBOX = 48;

export const MARK_STEM = { x: 9, y: 6, width: 8, height: 36 } as const;

export const MARK_BOWLS = {
  standard: {
    upper: "19,6 28,6 36,14 28,22 19,22",
    lower: "19,24 30,24 39,33 30,42 19,42",
  },
  /* the favicon cut: 3-unit seams */
  small: {
    upper: "20,6 29,6 37,14 29,22 20,22",
    lower: "20,25 31,25 40,34 31,43 20,43",
  },
} as const;

export type MarkVariant = keyof typeof MARK_BOWLS;

/** Clear space is one stem width on every side (SPEC §2). */
export const MARK_CLEAR_SPACE = MARK_STEM.width;

/**
 * The mark as a standalone SVG document, for files that live outside React:
 * the favicon and the icons. `ground` paints a square behind it (with `radius`
 * in grid units); `scale` shrinks the mark about the centre, to leave clear
 * space inside an icon's tile. The small cut sits half a unit right and down of
 * centre, so it is nudged back.
 */
export function markSvg({
  variant = "standard",
  ink,
  accent,
  ground,
  radius = 0,
  scale = 1,
  size,
}: {
  variant?: MarkVariant;
  ink: string;
  accent?: string;
  ground?: string;
  radius?: number;
  scale?: number;
  size?: number;
}): string {
  const b = MARK_BOWLS[variant];
  const nudge = variant === "small" ? -0.5 : 0;
  const c = MARK_VIEWBOX / 2;
  const transform = `translate(${c + nudge} ${c + nudge}) scale(${scale}) translate(${-c} ${-c})`;
  const dims = size ? ` width="${size}" height="${size}"` : "";
  const tile = ground ? `<rect width="${MARK_VIEWBOX}" height="${MARK_VIEWBOX}" rx="${radius}" fill="${ground}"/>` : "";
  const s = MARK_STEM;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}"${dims}>` +
    tile +
    `<g transform="${transform}" fill="${ink}">` +
    `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}"/>` +
    `<polygon points="${b.upper}"/>` +
    `<polygon points="${b.lower}" fill="${accent ?? ink}"/>` +
    `</g></svg>`
  );
}
