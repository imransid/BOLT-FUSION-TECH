import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Real app root — Turbopack can mis-infer `./app` with Yarn PnP / nested repos */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
