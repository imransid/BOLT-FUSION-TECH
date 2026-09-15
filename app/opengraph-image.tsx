import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import LogoMarkSvg from "@/components/LogoMarkSvg";
import { CANONICAL_DESCRIPTION } from "@/content/canonical";

/* The site-wide social share card (1200x630), in the engineering redesign's
   design (owner, 2026-09-16): the graphite ground, the Forward Monogram with
   its one brand-blue part, the wordmark in Barlow 700 and 500, a hairline rule,
   and the canonical description word for word as the headline (COPY.md,
   "Company description — canonical"; verify-site check 12 reads it in the alt
   text). No gradient, no glow: those belong to the hero scene and the diagrams.

   The faces are Barlow 500, 600 and 700 as TrueType files in assets/fonts,
   with their SIL OFL licence beside them: the renderer (satori) reads TTF, OTF
   or WOFF, not the WOFF2 files next/font serves the pages. Read at build time.
   satori resolves neither CSS variables nor currentColor, so the mark gets real
   colours. */
export const alt = `Bolt Fusion Tech — ${CANONICAL_DESCRIPTION}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* app/site.css tokens, as literal colours */
const GROUND = "#07090D";
const TEXT = "#ECEFF4";
const MUTED = "#9AA3B4";
const BRAND = "#4C86FF";
const LINE = "#232A36";

export default async function OpengraphImage() {
  const [medium, semibold, bold] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Barlow-Medium.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Barlow-SemiBold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Barlow-Bold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 80px 64px",
          backgroundColor: GROUND,
          color: TEXT,
          fontFamily: "Barlow",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 19 }}>
          <LogoMarkSvg size={64} color={TEXT} accent={BRAND} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, fontSize: 38, letterSpacing: "-0.01em" }}>
            <span style={{ fontWeight: 700 }}>Bolt Fusion</span>
            <span style={{ fontWeight: 500, color: MUTED }}>Tech</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: BRAND }}>Software. Intelligence. Automation. Machines.</div>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.015em", maxWidth: 1020 }}>
            {CANONICAL_DESCRIPTION}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 22, borderTop: `1px solid ${LINE}`, fontSize: 24, fontWeight: 500, color: MUTED }}>
          <span>boltfusiontech.com</span>
          <span>Engineering intelligent systems for the real world.</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Barlow", data: medium, weight: 500, style: "normal" },
        { name: "Barlow", data: semibold, weight: 600, style: "normal" },
        { name: "Barlow", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
