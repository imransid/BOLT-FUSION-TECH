import manifest from "@/lib/screenshots.json";

/**
 * A project screenshot, served from pre-encoded AVIF and WebP files through
 * <picture>, never through the Next image optimizer. See CLAUDE.md,
 * "Screenshots are pre-encoded": on 2026-09-16 a long-running `next start` got
 * one optimizer job for a screenshot stuck, and every later request for it hung
 * (a race in the local optimizer; Vercel's image service in production was
 * unaffected). The hero poster is served the same way, for the same reason:
 * nothing on the path of a page's images depends on a job that can stall.
 *
 * A screenshot with no encodes throws, which fails the build. To add one, put it
 * in scripts/encode-screenshots.mjs and run that script.
 *
 * `fill` positions the image over its frame, as next/image's fill did (the
 * frame is the positioned ancestor). `data-screenshot` carries the source path,
 * so verify-site can say which screenshot an <img> is.
 */
type Entry = { width: number; height: number; widths: number[]; base: string };
const shots: Record<string, Entry> = manifest;

export default function ScreenImage({
  src,
  alt,
  sizes,
  fill = false,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const e = shots[src];
  if (!e) throw new Error(`${src} has no pre-encoded screenshots: add it to scripts/encode-screenshots.mjs and run it`);
  const set = (ext: "avif" | "webp") => e.widths.map((w) => `${e.base}-${w}.${ext} ${w}w`).join(", ");
  const largest = e.widths[e.widths.length - 1];
  return (
    <picture>
      <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
      <img
        src={`${e.base}-${largest}.webp`}
        srcSet={set("webp")}
        sizes={sizes}
        alt={alt}
        width={e.width}
        height={e.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        data-screenshot={src}
        className={className}
        style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : undefined}
      />
    </picture>
  );
}
