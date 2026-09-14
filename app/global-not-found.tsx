import type { Metadata } from "next";
import NotFound from "next/dist/client/components/builtin/not-found";
import "./global-not-found.css";

import { rootMetadata } from "@/lib/root-metadata";

/* The 404 for every URL that matches no page. The app has two root layouts —
   app/(home) and app/(site) — and none at the top of app/, so Next has no
   layout to put its 404 in; `experimental.globalNotFound` (next.config.ts)
   makes it render this file instead, as a complete document.

   It reproduces the 404 as it was under the single app/layout.tsx — the same
   computed styles and the same pixels — around Next's own built-in not-found
   page, unchanged. Its stylesheet is its own, app/global-not-found.css: the
   few rules of app/globals.css that reached this page. Importing globals.css
   itself put the 404 in the (site) layout's CSS chunk, and Next then preloaded
   that chunk's Inter face on every page, the homepage included.

   It declares NO fonts. The built-in 404 sets its own font inline
   (system-ui), so no text here ever painted in Inter, Satoshi or Commit Mono,
   and the page requests no font file. Declaring them here cost every OTHER
   page. Preloaded, Next put this file's three preloads on every page's
   <head> — on /, 174KB of the other design's faces beside the 34KB LCP poster
   on a 1.6Mbps link: the 1736ms mobile LCP miss. Not preloaded, its second set
   of @font-face rules (the same families, other file URLs) was loaded on every
   inner page and won, so each face downloaded twice. If the 404 ever shows
   text in the site's faces, it must not declare its own next/font instances
   (verify-site checks 25 and 31).

   The built-in 404 comes from a Next-internal module. There is no public
   export of it in Next 16.1: `next/navigation` has notFound(), a function, and
   `next/error` is the Pages Router's class component, which needs a client
   boundary here, sets its title through next/head (inert in the App Router),
   and lays the page out differently (line-heights 48/28px against 49/49px),
   so the 404 would no longer look as it does. See CLAUDE.md, Routes. */
export const metadata: Metadata = {
  ...rootMetadata,
  title: "404: This page could not be found.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NotFound />
      </body>
    </html>
  );
}
