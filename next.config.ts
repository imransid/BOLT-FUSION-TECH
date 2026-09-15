import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Real app root — Turbopack can mis-infer `./app` with Yarn PnP / nested repos */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  turbopack: {
    root: projectRoot,
  },
  images: {
    // AVIF first (best compression for the large section photos), then WebP.
    formats: ["image/avif", "image/webp"],
    // Optimized image variants rarely change — cache them for 31 days.
    minimumCacheTTL: 2678400,
  },
  // No experimental flags. One root layout (app/layout.tsx) holds every page,
  // so the 404 is the standard app/not-found.tsx inside it.
  async headers() {
    return [
      {
        // Un-hashed /public marketing assets → make them immutable for a year.
        source: "/:all*(svg|png|jpg|jpeg|webp|avif|gif|ico|woff2)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
