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
    remotePatterns: [
      // Admin-uploaded images (Vercel Blob).
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
    // AVIF first (best compression for the large section photos), then WebP.
    formats: ["image/avif", "image/webp"],
    // Optimized image variants rarely change — cache them for 31 days.
    minimumCacheTTL: 2678400,
  },
  experimental: {
    // Barrel packages imported widely — tree-shake to trim client JS.
    optimizePackageImports: ["framer-motion", "@react-three/drei"],
  },
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
