import "server-only";

/** Primary production hostname — used on Vercel when VERCEL_ENV=production and no explicit SITE_URL is set. */
export const PRODUCTION_SITE_ORIGIN = "https://boltfusiontech.com";

/**
 * Canonical origin for metadata (Open Graph, Twitter, JSON-LD, sitemap).
 * Override with NEXT_PUBLIC_SITE_URL or SITE_URL when needed (e.g. staging).
 * On Vercel production we default to PRODUCTION_SITE_URL so canonicals match
 * https://boltfusiontech.com/ ; previews still use VERCEL_URL.
 */
export function getSiteUrl(): URL {
  let raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    (process.env.VERCEL_ENV === "production" ? PRODUCTION_SITE_ORIGIN : null) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3000";

  raw = raw.trim();
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }
  const normalized = raw.replace(/\/+$/, "");
  return new URL(normalized);
}
