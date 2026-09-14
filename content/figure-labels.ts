import type { MetricStatus } from "./schema";

/**
 * Figures that sit INSIDE a sentence, and their labels — CLAUDE.md: "a figure
 * counts wherever it sits, inside a sentence too". <FigureText> renders each
 * entry's chip straight after the figure, in the figure's own wrapper.
 *
 * Every label carries `source`: where its status comes from. A status is never
 * decided in this file without one. (Backlog, CLAUDE.md "A figure labelled
 * shipped with nothing behind it": `shipped` is to require a checked sourceRef;
 * until that is built, `source` is the same idea as a plain string.)
 *
 * `text` is matched verbatim inside the strings a component passes through
 * <FigureText>; the words themselves are never changed.
 *
 * Plain TypeScript, not zod: the case study is a client component and this list
 * must not pull a schema library into its bundle. The checks below fail the
 * build all the same — they run when the module loads, during prerendering.
 */
export type FigureLabel = { text: string; status: MetricStatus; source: string };

const BUDGET =
  'Owner, 2026-09-12: a budget, not a measurement. The 2026-05-02 write-up calls it "budgeted" and "Budgeted hybrid retrieval", and says the architecture "caps model spend at roughly" this figure; nothing in any repo, doc or branch records a measurement.';
const AI_SHARE =
  "Owner, 2026-09-12: a target. It came in the same 2026-05-02 commit with no label and no source, and nothing records a measurement.";

const labels: FigureLabel[] = [
  /* The homepage's AI lane (content/architecture.ts). */
  { text: "Roughly 20% of traffic", status: "target", source: AI_SHARE },
  { text: "~$0.001 per search", status: "target", source: BUDGET },

  /* /work/restaurant-search — the case study's summary and its second lane.
     "caps model spend at roughly" stays as written: it is already honest. */
  { text: "roughly $0.001 per AI-assisted query on average", status: "target", source: BUDGET },
  { text: "~20% of traffic", status: "target", source: AI_SHARE },
  { text: "~$0.001 per search (budgeted)", status: "target", source: BUDGET },
];

function checked(list: FigureLabel[]): readonly FigureLabel[] {
  const seen = new Set<string>();
  for (const l of list) {
    const where = `content/figure-labels.ts, "${l.text}"`;
    if (!l.text.trim()) throw new Error(`${where}: an entry needs the text it labels`);
    if (seen.has(l.text)) throw new Error(`${where}: listed twice`);
    seen.add(l.text);
    if (l.status !== "shipped" && l.status !== "target") throw new Error(`${where}: status must be shipped or target`);
    if (!l.source.trim()) throw new Error(`${where}: a label needs its source — where its status comes from`);
  }
  return list;
}

export const figureLabels = checked(labels);
