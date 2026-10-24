import { Fragment } from "react";

import type { InsightCode } from "@/content/insights-schema";

/* What starts a line comment in each language the articles use: the rest of
   the line is set in the muted colour. Deliberately naive — the snippets are
   short and written for the page — and never a second face: the site loads no
   mono face (verify-site checks 2 and 31), so code is Archivo 500 with tabular
   figures, as every machine value on the site is. */
const COMMENT: Record<InsightCode["language"], string | null> = { typescript: "//", sql: "--", python: "#", text: null };
const LANGUAGE: Record<InsightCode["language"], string> = { typescript: "TypeScript", sql: "SQL", python: "Python", text: "Text" };

/**
 * A code block in an article: the snippet as written (`white-space: pre`, never
 * reflowed), in a box that scrolls sideways on a narrow screen rather than
 * widening the page. The scrolling box is a named region that takes focus, so a
 * keyboard can scroll it too (axe, scrollable-region-focusable), named by the
 * caption under it, which says what the snippet is and where it comes from.
 * Not through <FigureText>: scripts/verify-insights.mjs keeps figures out of
 * code.
 */
export default function CodeBlock({ code, id }: { code: InsightCode; id: string }) {
  const marker = COMMENT[code.language];
  const lines = code.source.split("\n");
  return (
    <figure className="bf-code">
      <div className="bf-code__box">
        <p className="bf-code__lang">{LANGUAGE[code.language]}</p>
        <div className="bf-code__scroll" role="region" aria-labelledby={id} tabIndex={0}>
          <pre className="bf-code__pre">
            <code>
              {lines.map((line, i) => {
                const at = marker ? line.indexOf(marker) : -1;
                return (
                  <Fragment key={i}>
                    {at >= 0 ? (
                      <>
                        {line.slice(0, at)}
                        <span className="bf-code__comment">{line.slice(at)}</span>
                      </>
                    ) : (
                      line
                    )}
                    {i < lines.length - 1 ? "\n" : null}
                  </Fragment>
                );
              })}
            </code>
          </pre>
        </div>
      </div>
      <figcaption id={id} className="bf-code__caption">
        {code.caption}
      </figcaption>
    </figure>
  );
}
