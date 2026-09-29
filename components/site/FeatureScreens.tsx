import FigureText from "@/components/FigureText";
import type { Project } from "@/content/schema";
import { longDate } from "@/lib/dates";

import { ArrowUpRightIcon } from "./icons";
import ScreenImage from "./ScreenImage";

/**
 * The screens where our features live (the owner, 2026-09-30; CLAUDE.md,
 * "Projects and attribution"). Feature work never shows a view of the whole
 * app — the app is the client's — only these: the client's own published
 * screenshots (Bazzile's App Store listing), cropped to the phone's screen,
 * each captioned with the one feature of its role it shows.
 *
 * Each screen is a <figure data-feature-screen>, its caption a <figcaption>
 * under it, never over it. That is verify-site check 9's contract: every
 * project screenshot on a feature-work card sits in one, is one of its
 * project's `featureScreens` in content/projects.ts (known by the file it
 * serves), and has a visible caption naming one of the features its role
 * names — that screen's own. The frames are fixed 1:2 boxes, so nothing
 * shifts as the lazy screens load (check 29).
 */
export default function FeatureScreens({ p, sizes, className = "" }: { p: Project; sizes: string; className?: string }) {
  if (!p.featureScreens.length) return null;
  return (
    <ul className={`bf-screens${className ? ` ${className}` : ""}`} aria-label={`${p.name}: the screens where our features live`}>
      {p.featureScreens.map((s) => (
        <li key={s.image.src} className="bf-screens__item">
          <figure className="bf-screen" data-feature-screen>
            <div className="bf-screen__frame">
              <ScreenImage src={s.image.src} alt={s.image.alt} sizes={sizes} fill className="bf-screen__img" />
            </div>
            <figcaption className="bf-screen__cap">{s.caption}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

/**
 * A public figure about the client's app (the owner, 2026-09-30): Google
 * Play's install band for Bazzile, shown as what it is — the store's count
 * for the whole app, linked to the listing it was read off, with the day it
 * was read. Never our metric: the figure is a per-instance exemption in
 * content/figure-labels.ts (check 8), and its line says whose reach it is.
 * The figure and its source are one link, so the source is never apart from it.
 */
export function PublicStat({ p, className = "" }: { p: Project; className?: string }) {
  const s = p.publicStat;
  if (!s) return null;
  return (
    <div className={`bf-pubstat${className ? ` ${className}` : ""}`} data-public-stat>
      <a className="bf-pubstat__fig" href={s.href} target="_blank" rel="noopener noreferrer">
        <FigureText text={s.text} />
        <ArrowUpRightIcon className="bf-pubstat__icon" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <p className="bf-pubstat__note">
        {s.source}. Read {longDate(s.read)}.
      </p>
    </div>
  );
}
