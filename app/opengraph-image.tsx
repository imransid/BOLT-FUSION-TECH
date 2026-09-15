import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import LogoMarkSvg from "@/components/LogoMarkSvg";

/* The site-wide social share card (1200×630), in the site's design: the hero's
   navy (#01013f), the brand blue (#086ad8), Barlow, and our mark in the dark
   tile it was drawn for. Every page names it except the two write-ups, which
   have their own screenshots.

   Its words are unchanged, and the headline is the canonical description word
   for word (COPY.md, "Company description — canonical"; verify-site check 12
   reads it in the alt text).

   The faces are Barlow 500 and 600 as TrueType files in assets/fonts, with
   their SIL OFL licence beside them: the renderer (satori) reads TTF, OTF or
   WOFF, not the WOFF2 files next/font serves the pages. Read at build time,
   when this image is generated. */
export const alt = "Bolt Fusion Tech — We build AI systems that are still running in six months.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#01013f";
const BRAND = "#086ad8";

export default async function OpengraphImage() {
  const [medium, semibold] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Barlow-Medium.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Barlow-SemiBold.ttf")),
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
          padding: "72px 80px 80px",
          backgroundColor: NAVY,
          color: "#ffffff",
          fontFamily: "Barlow",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: "#0b0b12",
              border: "1px solid rgba(251, 191, 36, 0.35)",
            }}
          >
            <LogoMarkSvg uid="og-mark" size={48} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 600 }}>Bolt Fusion Tech</div>
        </div>

        <div style={{ display: "flex", gap: "36px" }}>
          <div style={{ display: "flex", width: 8, borderRadius: 4, backgroundColor: BRAND }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.08, maxWidth: "940px" }}>
              We build AI systems that are still running in six months.
            </div>
            <div style={{ fontSize: 30, fontWeight: 500, color: "rgba(255, 255, 255, 0.8)", maxWidth: "900px" }}>
              Senior engineers, clear roadmaps, and delivery you can plan around.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Barlow", data: medium, weight: 500, style: "normal" },
        { name: "Barlow", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}
