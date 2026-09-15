import ScreenImage from "./ScreenImage";
import type { ReactNode } from "react";

/**
 * A screenshot: one of the site's own images (they are content, with their
 * alt text) in a fixed frame, so it never shifts layout, covering the frame
 * from the top. Its caption — `children`, a <figcaption> or a caption bar —
 * sits BELOW the image, never over it. On the navy banner it takes the dark
 * variant from the `.tw-on-dark` around it (app/techwix.css, "A screenshot").
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
    <figure className="tw-shot" data-tw-reveal={reveal ? "" : undefined}>
      <div className={wide ? "tw-shot__frame tw-shot__frame--wide" : "tw-shot__frame"}>
        <ScreenImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={center ? "tw-shot__img tw-shot__img--center" : "tw-shot__img"}
        />
      </div>
      {children}
    </figure>
  );
}
