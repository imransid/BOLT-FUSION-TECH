import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import LogoMarkSvg from "@/components/LogoMarkSvg";
import { CANONICAL_DESCRIPTION } from "@/content/canonical";

/* The site-wide social share card (1200x630), in the studio redesign's design
   (2026-10-24): the paper ground, the Forward Monogram with its one cobalt
   part, the wordmark and the canonical description word for word as the
   headline (COPY.md, "Company description — canonical"; verify-site check 12
   reads it in the alt text), in Archivo set expanded, as the site sets its
   headings, over a hairline rule. No gradient, no glow.

   The faces are Archivo 500 and 600 at the site's heading width (116%), as
   static WOFF instances in assets/fonts with their SIL OFL licence beside
   them: the renderer (satori) reads TTF, OTF or WOFF — not the WOFF2 files
   next/font serves the pages, and not a variable font. Read at build time.
   satori resolves neither CSS variables nor currentColor, so the mark gets real
   colours. */
export const alt = `Bolt Fusion Tech — ${CANONICAL_DESCRIPTION}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* app/site.css tokens, as literal colours */
const GROUND = "#F3F1EC";
const TEXT = "#121316";
const MUTED = "#5C5E65";
const BRAND = "#2B44FF";
const LINE = "#DCD8CE";

export default async function OpengraphImage() {
  const [medium, semibold] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Archivo-Expanded-500.woff")),
    readFile(join(process.cwd(), "assets/fonts/Archivo-Expanded-600.woff")),
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
          fontFamily: "Archivo",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 19 }}>
          <LogoMarkSvg size={64} color={TEXT} accent={BRAND} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, fontSize: 36, letterSpacing: "-0.03em" }}>
            <span style={{ fontWeight: 600 }}>Bolt Fusion</span>
            <span style={{ fontWeight: 500, color: MUTED }}>Tech</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.01em", color: BRAND }}>Software. Intelligence. Automation. Machines.</div>
          <div style={{ fontSize: 52, fontWeight: 600, lineHeight: 1.06, letterSpacing: "-0.04em", maxWidth: 1040 }}>
            {CANONICAL_DESCRIPTION}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 22, borderTop: `1px solid ${LINE}`, fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", color: MUTED }}>
          <span>boltfusiontech.com</span>
          <span>Engineering intelligent systems for the real world.</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: medium, weight: 500, style: "normal" },
        { name: "Archivo", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}
