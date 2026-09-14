import { notFound } from "next/navigation";

/* Every URL that matches no page lands here and answers 404 inside the SITE's
   root layout (app/(site)/layout.tsx) — its design, its fonts and its metadata,
   exactly as the 404 did while there was a single app/layout.tsx.

   Without it, an unknown URL renders Next's bare built-in not-found page: with
   two root layouts and none at the top of app/, there is no layout for it to
   sit in, so it shipped unstyled and without the site's metadataBase. "/" is
   the homepage, not this route: a catch-all needs at least one segment. */
export default function Missing() {
  notFound();
}
