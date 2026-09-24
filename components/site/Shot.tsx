import type { ReactNode } from "react";

import ScreenImage from "./ScreenImage";

/**
 * A screenshot: one of the site's own images (content, with its alt text) in
 * a fixed frame, so it never shifts layout, covering the frame from the top.
 * Its caption — `children`, a <figcaption> or a caption bar — sits BELOW the
 * image, never over it.
 */
export default function Shot({
  src,
  alt,
  sizes,
  wide = false,
  center = false,
  priority = false,
  reveal = false,
  children,
}: {
  src: string;
  alt: string;
  sizes: string;
  wide?: boolean;
  center?: boolean;
  priority?: boolean;
  reveal?: boolean;
  children?: ReactNode;
}) {
  return (
    <figure className="bf-shot" data-bf-reveal={reveal ? "" : undefined}>
      <div className={wide ? "bf-shot__frame bf-shot__frame--wide" : "bf-shot__frame"}>
        <ScreenImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={center ? "bf-shot__img bf-shot__img--center" : "bf-shot__img"}
        />
      </div>
      {children}
    </figure>
  );
}
