#!/usr/bin/env node
/* THE RUN 2 EXPECTATION TABLE, evaluated (2026-09-16).
     node gate-expect.mjs <cases.json> <misuse.json> [<control.json>]
   cases.json   the table as gate-cases.py applied it (each case's status)
   misuse.json  the suite's report on the patched build
   control.json the suite's report on the same HEAD, unpatched (RUN 1)
   Each report may be a comma-separated list — the suite's and
   scripts/probe-scene.mjs's (2026-09-29), whose checks are `probe:<name>` —
   read as one.
   A case passes when its check FAILED on the patched build with a finding
   matching its regex — its OWN finding. With a control, that regex must match
   NOTHING on the clean build: a regex that also matches a finding the clean
   tree already has would "fail as expected" without the patch, and prove
   nothing. Exit 0 all failed as expected; 1 a case did not (or its regex
   matches the clean tree); 2 none missed, but some case is waiting. */
import { readFileSync } from "node:fs";

const [casesFile, misuseFile, controlFile] = process.argv.slice(2);
const cases = JSON.parse(readFileSync(casesFile, "utf8"));
const read = (list) => ({ results: list.split(",").flatMap((f) => JSON.parse(readFileSync(f, "utf8")).results) });
const report = read(misuseFile);
const control = controlFile ? read(controlFile) : null;
const by = Object.fromEntries(report.results.map((c) => [c.id, c]));
const cby = control ? Object.fromEntries(control.results.map((c) => [c.id, c])) : null;
let miss = 0;
let waiting = 0;
const pad = (s, n) => String(s).padEnd(n);
for (const c of cases) {
  if (c.status === "retired") {
    console.log(`  ${pad(c.name, 62)} → check ${pad(c.check, 2)} → RETIRED — ${c.detail}`);
    continue;
  }
  if (c.status === "waiting") {
    waiting++;
    console.log(`  ${pad(c.name, 62)} → check ${pad(c.check, 2)} → WAITING — ${c.detail}`);
    continue;
  }
  const re = new RegExp(c.expect);
  const chk = by[c.check];
  if (!chk) {
    miss++;
    console.log(`  ${pad(c.name, 62)} → check ${pad(c.check, 2)} → NOT RUN — the report has no check ${c.check}`);
    continue;
  }
  const hit = chk.status === "FAIL" && chk.findings.find((f) => re.test(f));
  const clean = cby?.[c.check]?.findings.find((f) => re.test(f));
  if (clean) {
    miss++;
    console.log(`  ${pad(c.name, 62)} → check ${pad(c.check, 2)} → PROVES NOTHING — its finding is already on the clean build: ${clean.slice(0, 140)}`);
    continue;
  }
  if (!hit) miss++;
  console.log(`  ${pad(c.name, 62)} → check ${pad(c.check, 2)} → ${hit ? "FAILED as expected" : "DID NOT FAIL"}${hit ? `  (${hit.slice(0, 140)})` : ""}${c.reanchor ? `  [re-anchor after the ${c.reanchor} wave]` : ""}`);
}
if (!control) console.log("  (no control report: the regexes were not checked against the clean build)");
const applied = cases.filter((c) => c.status === "applied").length;
console.log(miss ? `  RUN 2: ${miss} case(s) DID NOT FAIL as expected` : waiting ? `  RUN 2: every applied case failed its check (${applied}); ${waiting} waiting` : `  RUN 2: all ${applied} cases failed their check`);
process.exit(miss ? 1 : waiting ? 2 : 0);
