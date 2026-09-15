import type { MetricStatus } from "./schema";

/**
 * Figures that sit INSIDE a sentence — CLAUDE.md: "a figure counts wherever it
 * sits, inside a sentence too". Each entry is one of two things:
 *
 * - a LABEL, `{ text, status, source }`. <FigureText> renders the figure with
 *   its shipped/target chip straight after it, inside the figure's own
 *   `data-status` wrapper. `source` says where the status comes from; a status
 *   is never decided in this file without one. (Backlog, CLAUDE.md "A figure
 *   labelled shipped with nothing behind it": `shipped` is to require a checked
 *   sourceRef; until that is built, `source` is the same idea as a plain string.)
 * - an EXEMPTION, `{ text, exempt }`: a setting or a term, not a performance
 *   claim, so no chip can honestly apply. <FigureText> wraps it in
 *   `data-figure-exempt="<reason>"`. The reason is about THIS instance, never a
 *   category phrase (owner, 2026-09-11: "NO CATEGORY EXEMPTION for terms and
 *   specs"). One exemption covers one figure; verify-site check 8 fails one
 *   that covers two, and so it does a label.
 *
 * `text` is matched verbatim inside the strings a component passes through
 * <FigureText>; the words themselves are never changed. Keep `text` specific to
 * its instance: a short, generic string would label or exempt every sentence
 * that happens to contain it.
 *
 * Plain TypeScript, not zod: <FigureText> has no "use client" and can render in
 * a client component, so this list must not pull a schema library into a
 * bundle. The checks below fail the build all the same — they run when the
 * module loads, during prerendering.
 */
export type FigureLabel = { text: string; status: MetricStatus; source: string } | { text: string; exempt: string };

const BUDGET =
  'Owner, 2026-09-12: a budget, not a measurement. The 2026-05-02 write-up calls it "budgeted" and "Budgeted hybrid retrieval", and says the architecture "caps model spend at roughly" this figure; nothing in any repo, doc or branch records a measurement.';
const AI_SHARE =
  "Owner, 2026-09-12: a target. It came in the same 2026-05-02 commit with no label and no source, and nothing records a measurement.";
const SEARCH_RESPONSE =
  'content/metrics.ts `search-response` (<100ms, shipped); public/llms.txt: "resolves on a sub-100ms path (`shipped`)". Owner-approved, relayed 2026-09-14.';
const LANE_LATENCY =
  'The write-up\'s own words: the lane read "<80ms target", "<1200ms target" or "<15ms target" before the word became this chip. Owner-approved, relayed 2026-09-14.';
const HIT_RATE =
  'The write-up calls it a "goal"; the cache lane elsewhere on the site reads "30–40% hit rate target". Owner-approved, relayed 2026-09-14.';
const ZERO_MARGINAL =
  "Owner-approved, relayed 2026-09-14: the keyword lane makes no model call, so its marginal model cost is zero by construction.";
const HAIKU_ROUTING = "content/metrics.ts `haiku-routing` (~90%, shipped). Owner-approved, relayed 2026-09-14.";
const HOME_LATENCY =
  'The restaurant write-up gives each lane\'s latency as a target ("<80ms target", "<1200ms target", "<15ms target"); the homepage lanes state the same figures in words. Owner-approved, relayed 2026-09-15.';
const HOME_HIT_RATE =
  'The lane read "30–40% hit rate target" before the word became this chip; the write-up calls it a "goal". Owner-approved, relayed 2026-09-15.';
const TRAFFIC_SHARE =
  "Owner, 2026-09-15: a target. The keyword lane's share is the complement of the AI lane's ~20%, ruled a target on 2026-09-12; it came in the same 2026-05-02 commit, and its only `shipped` label came from COPY.md's metric table with no source.";
const WARMCHATS =
  'WarmChats KPIs `24/7` and `<60s` are target; content/metrics.ts `first-reply` (<60s) is target; the KPI caption calls these figures "automation targets". Owner-approved, relayed 2026-09-14.';

const labels: FigureLabel[] = [
  /* The homepage's AI lane (content/architecture.ts). */
  { text: "Roughly 20% of traffic", status: "target", source: AI_SHARE },
  { text: "~$0.001 per search", status: "target", source: BUDGET },

  /* /work/restaurant-search — the case study's summary and its second lane.
     "caps model spend at roughly" stays as written: it is already honest. */
  { text: "roughly $0.001 per AI-assisted query on average", status: "target", source: BUDGET },
  { text: "~20% of traffic", status: "target", source: AI_SHARE },
  { text: "~$0.001 per search (budgeted)", status: "target", source: BUDGET },

  /* /work/restaurant-search — the summary, the lane headers, the lane copy and
     the first KPI card's hint. */
  { text: "~80% of traffic", status: "target", source: TRAFFIC_SHARE },
  { text: "~80% of queries", status: "target", source: TRAFFIC_SHARE },
  { text: "sub-100ms path", status: "shipped", source: SEARCH_RESPONSE },
  { text: "<80ms", status: "target", source: LANE_LATENCY },
  { text: "<1200ms", status: "target", source: LANE_LATENCY },
  { text: "<15ms", status: "target", source: LANE_LATENCY },
  { text: "Hit-rate goal 30–40%", status: "target", source: HIT_RATE },
  { text: "$0 marginal cost per query", status: "shipped", source: ZERO_MARGINAL },
  { text: "~90% of AI calls", status: "shipped", source: HAIKU_ROUTING },

  /* /work/restaurant-search — settings and properties: each exempt for its own reason. */
  { text: "Redis with 30s TTL", exempt: "How long the cache lane keeps a hashed result key in Redis: a configured TTL, not a measured result" },
  { text: "result cache (30s)", exempt: "The TTL configured on the Redis result cache in the stack list: a setting, not a performance claim" },
  { text: "intent cache (60s)", exempt: "The TTL configured on the semantic intent cache: a setting, not a performance claim" },
  { text: "100/min/tenant", exempt: "The per-tenant cap the service puts on LLM calls: a configured limit, not a throughput claim" },
  { text: "(1536-d)", exempt: "The vector size of OpenAI's text-embedding-3-small: a property of that model, not a claim about this system" },
  { text: "every 6h", exempt: "How often the GoldenKeys cron job rebuilds the filter chips: a schedule setting, not a performance claim" },

  /* The homepage (components/techwix): the lanes, the WarmChats card, and the
     metric label "Search response, 80% of traffic" on / and /work. The bare
     "80% of traffic" is the label's; inside "Roughly 80% of traffic" and
     "~80% of traffic" the longer entry starts first and wins (FigureText). */
  { text: "Roughly 80% of traffic", status: "target", source: TRAFFIC_SHARE },
  { text: "80% of traffic", status: "target", source: TRAFFIC_SHARE },
  { text: "under 80ms", status: "target", source: HOME_LATENCY },
  { text: "under 1200ms", status: "target", source: HOME_LATENCY },
  { text: "Under 15ms", status: "target", source: HOME_LATENCY },
  { text: "30–40% hit rate", status: "target", source: HOME_HIT_RATE },
  { text: "$0 marginal cost", status: "shipped", source: ZERO_MARGINAL },
  { text: "books showings 24/7", status: "target", source: WARMCHATS },

  /* The homepage's terms, each exempt for its own reason. Where two entries match
     overlapping words the earlier match wins (FigureText), so "MVP in 8–16 weeks"
     is the hero's and the bare "8–16 weeks" is the engagement table's cell. The
     two "Start a 2-week pilot" buttons (hero, how we work) are the same words and
     share one entry: the same term, for the same reason. A button's exemption
     covers its whole label: the button lays its children out as flex items, so a
     span around part of the label would open a gap inside it. */
  { text: "MVP in 8–16 weeks", exempt: "The delivery window the hero gives a production MVP: an engagement term, not a performance claim" },
  { text: "8–16 weeks", exempt: "The timeline the engagement-models table gives an MVP build: a contract term, not a performance claim" },
  { text: "4–8 hours of overlap", exempt: "The daily working-hours overlap with US and EU clients the hero commits to: a contract term, not a performance claim" },
  { text: "Start a 2-week pilot", exempt: "The fixed length of the paid pilot this button starts: a contract term, not a performance claim" },
  { text: "Pick a time (30 min)", exempt: "The length of the intro call this calendar button books: a meeting length, not a performance claim" },
  { text: "30\u2011minute intro call", exempt: "The length of the intro call offered above the booking calendar: a meeting length, not a performance claim" },
  /* Not visible text: the booking calendar frame's title, its accessible name
     (components/techwix/Contact.tsx). verify-site check 8 reads attributes too. */
  { text: "Schedule a 30-minute call", exempt: "The length of the intro call the booking calendar's frame books, as its title names it: a meeting length, not a performance claim" },
  { text: "30-second TTL", exempt: "How long the homepage's cache lane keeps a result in Redis: a configured TTL, not a performance claim" },

  /* /work's track record (content/projects.ts) and the llms files. A span of
     years joined by a dash reads as a range; this one is a date. */
  { text: "2020–2022", exempt: "The years one of our engineers worked on Go Smart at Brain Station 23: a date range, not a performance claim" },

  /* /work/warmchats — hardcoded in its component; the copy lock yields to the label rule. */
  { text: "follows up 24/7", status: "target", source: WARMCHATS },
  { text: "calendar, 24/7", status: "target", source: WARMCHATS },
  { text: "within 60 seconds", status: "target", source: WARMCHATS },
  { text: "in under 60s", status: "target", source: WARMCHATS },
];

/* The same test verify-site check 8 applies in the browser, so a bad reason
   fails the build before it can reach a page. */
const PLACEHOLDER = new Set(["reason", "todo", "tbd", "n/a", "na", "-", "x", "ok", "exempt", "none"]);
function reasonProblem(reason: string): string {
  const r = reason.trim();
  if (!reason) return "is empty";
  if (!r) return "is only whitespace";
  const low = r.toLowerCase().replace(/[.!…:]+$/, "");
  if (PLACEHOLDER.has(low) || /^(todo|tbd|fixme|xxx|placeholder)\b/.test(low)) return `"${r}" is a placeholder`;
  if (!/\s/.test(r)) return `"${r}" is a single word`;
  if (r.length < 12) return `"${r}" is under 12 characters`;
  return "";
}

function checked(list: FigureLabel[]): readonly FigureLabel[] {
  const seen = new Set<string>();
  for (const l of list) {
    const where = `content/figure-labels.ts, "${l.text}"`;
    if (!l.text.trim()) throw new Error(`${where}: an entry needs the text it labels`);
    if (seen.has(l.text)) throw new Error(`${where}: listed twice`);
    seen.add(l.text);
    if ("exempt" in l) {
      const bad = reasonProblem(l.exempt);
      if (bad) throw new Error(`${where}: the exemption's reason ${bad} — say why THIS figure is not a performance claim`);
      continue;
    }
    if (l.status !== "shipped" && l.status !== "target") throw new Error(`${where}: status must be shipped or target`);
    if (!l.source.trim()) throw new Error(`${where}: a label needs its source — where its status comes from`);
  }
  return list;
}

export const figureLabels = checked(labels);
