import { ImageResponse } from "next/og";

// Site-wide default social share card (1200×630). Used for every route unless a
// page provides its own opengraph-image — replaces the oversized 1.5 MB PNG.
export const alt = "Bolt Fusion Tech — Custom Software & Product Engineering";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#050506",
          backgroundImage:
            "radial-gradient(circle at 25% 18%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(circle at 85% 88%, rgba(251,191,36,0.16), transparent 55%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundImage: "linear-gradient(135deg, #22d3ee, #fbbf24)",
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Bolt Fusion Tech
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: "900px",
            }}
          >
            Custom Software & Product Engineering
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.7)", maxWidth: "880px" }}>
            Senior engineers, clear roadmaps, and delivery you can plan around.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "14px",
            fontSize: 22,
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
          }}
        >
          <span>Web</span>
          <span>·</span>
          <span>Mobile</span>
          <span>·</span>
          <span>AI</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
