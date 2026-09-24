#!/bin/bash
# THE GATE (2026-09-16, the engineering redesign). Nothing goes to production
# unless RUN 1 is all green, every RUN 2 case fails as expected, and RUN 3
# refuses every bad content. Built from merged-verify-final.sh and
# fx/validate-next.sh (both left unedited).
#
#   scripts/gate/gate.sh                   the gate for this repository's HEAD
#   SRC=<worktree> scripts/gate/gate.sh    another worktree's HEAD
#
# RUN 1  a FRESH copy of HEAD ($SP/g1-copy), installed and built, served fresh
#        on :3465 (a long-lived `next start` once hung an optimizer request —
#        CLAUDE.md, check 10); the load average printed; the full suite with
#        --repo, all 33 checks. Every failing finding is real: there is no
#        pending allowance.
# then   scripts/gate/gate-proof.sh — RUN 2 and RUN 3 on :3466, with RUN 1's
#        report as the control for the expectation table.
# Exit 0 GATE PASSED · 1 GATE FAILED · 3 aborted, no verdict.
set -u
export PATH=/opt/homebrew/bin:$PATH NEXT_TELEMETRY_DISABLED=1 YARN_ENABLE_TELEMETRY=0
# Scripts beside this file; scratch copies and reports under $GATE_TMP (default
# $TMPDIR/bf-gate); SRC is the worktree whose committed HEAD is verified (default:
# the repository this script is in). Moved into the repository 2026-09-24: the
# gate lived in a session scratchpad and was lost with it once.
E=$(cd "$(dirname "$0")" && pwd)
SP=${GATE_TMP:-${TMPDIR:-/tmp}/bf-gate}
SRC=${SRC:-$(git -C "$E" rev-parse --show-toplevel)}
mkdir -p "$SP"
R=$SP/g1-copy
OUT=$SP/g1-out
PORT=3465
CHECKS=33
REAL=0; SRV=
mkdir -p $OUT
load() { uptime | sed 's/.*load averages*: //'; }
guard() {
  local kb; kb=$(df -k / | tail -1 | awk '{print $4}')
  if [ "$kb" -lt 1572864 ]; then echo "ABORT before $1: $(df -h / | tail -1 | awk '{print $4}') free; the gate needs 1.5 GB. Nothing further was attempted."; exit 3; fi
}
die() { echo "ABORT: $1"; [ -n "${2:-}" ] && tail -15 "$2" | sed 's/^/    /'; exit 3; }
stop() { if [ -n "$SRV" ]; then kill $SRV 2>/dev/null; wait $SRV 2>/dev/null; SRV=; sleep 1; fi; }
trap stop EXIT

lsof -tiTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1 && die "something is already listening on :$PORT — stop it; RUN 1 needs a fresh server"
HEAD=$(git -C "$SRC" rev-parse --short HEAD) || die "no git HEAD in $SRC"
echo "=== THE GATE — $(git -C "$SRC" rev-parse --abbrev-ref HEAD) @ $HEAD"
echo "  load average at the start: $(load)"
[ -z "$(git -C "$SRC" status --short --untracked-files=no)" ] || echo "  note: $SRC has uncommitted changes — the gate verifies the committed HEAD only"
guard "the copy"
rm -rf $R && mkdir -p $R && (cd "$SRC" && git archive HEAD | tar -x -C $R) || die "could not copy HEAD"
cd $R && git init -q && git add -A && git -c user.name=gate -c user.email=gate@local commit -q -m "HEAD copy of $HEAD" || die "could not commit the copy"
cp -cR "$SRC/node_modules" $R/node_modules 2>/dev/null
guard "the install"
yarn install --immutable > $OUT/install.log 2>&1 || die "yarn install failed" $OUT/install.log
guard "the build"
yarn build > $OUT/build.log 2>&1 || die "the build failed" $OUT/build.log
echo "  install and build ok"
yarn start -p $PORT > $OUT/server.log 2>&1 & SRV=$!
for i in $(seq 1 90); do curl -s -o /dev/null http://localhost:$PORT/ && break; sleep 1; done
curl -s -o /dev/null http://localhost:$PORT/ || die "the server did not come up on :$PORT" $OUT/server.log

echo "=== RUN 1 — the full suite with --repo, a fresh server on :$PORT (load average $(load))"
rm -f $OUT/run1.json
node scripts/verify-site.mjs --base http://localhost:$PORT --repo . --json $OUT/run1.json > $OUT/run1.txt 2>&1; rc=$?
echo "  suite exit $rc (load average $(load))"
{ [ $rc -eq 0 ] || [ $rc -eq 1 ]; } || { tail -20 $OUT/run1.txt; die "the suite died (exit $rc) — no verdict"; }
[ -s $OUT/run1.json ] || die "the suite wrote no JSON report"
node -e 'const r=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const ids=new Set(r.results.map(c=>c.id));const miss=[];for(let i=1;i<=Number(process.argv[2]);i++)if(!ids.has(i))miss.push(i);if(miss.length){console.log("  the report lacks checks: "+miss.join(", "));process.exit(1)}' $OUT/run1.json $CHECKS || die "the suite report does not hold all $CHECKS checks"
echo "--- measured (checks 25, 28, 29)"
node - $OUT/run1.json <<'JS'
const r = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
for (const c of r.results) {
  if (c.id === 29) for (const i of c.info) console.log(`  29 · ${i}`);
  if (c.id === 28) for (const i of c.info.filter((x) => /settled poster|^\/ @\d+.*img/.test(x))) console.log(`  28 · ${i.slice(0, 230)}`);
  if (c.id === 25) for (const i of c.info.filter((x) => /the scene chunk|allowed profile|^\/ @(390|768|1024)|tablet|Save-Data|reduced motion/.test(x))) console.log(`  25 · ${i.slice(0, 230)}`);
}
JS
echo "--- RUN 1: every failing finding is real (there is no pending allowance)"
node - $OUT/run1.json <<'JS' || REAL=1
const r = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
const real = [];
for (const c of r.results) {
  if (c.status === "SKIP") real.push(`${c.id} SKIPPED — ${c.info.join("; ")}`);
  else if (c.status === "FAIL") for (const f of c.findings) real.push(`check ${c.id}: ${f}`);
}
const failed = r.results.filter((c) => c.status !== "PASS").map((c) => c.id);
console.log(`  ${r.results.length - failed.length} of ${r.results.length} checks pass${failed.length ? `; not passing: ${failed.join(", ")}` : ""}`);
for (const x of real) console.log(`    ✗ ${x.slice(0, 300)}`);
console.log(real.length ? `  RUN 1: ${real.length} REAL FAILURE(S)` : "  RUN 1: every check passes");
process.exitCode = real.length ? 1 : 0;
JS
stop
echo "$HEAD" > $OUT/run1.sha

CONTROL=$OUT/run1.json CONTROL_SHA=$HEAD SRC="$SRC" bash $E/gate-proof.sh; prc=$?
[ $prc -eq 3 ] && die "the proof aborted — no verdict"

echo "=== GATE VERDICT for $HEAD (load average $(load))"
case $prc in 0) PROOF=PASSED ;; 2) PROOF=INCOMPLETE ;; *) PROOF=FAILED ;; esac
echo "  RUN 1 real failures: $([ $REAL = 0 ] && echo none || echo YES) · the proof (RUN 2 + RUN 3): $PROOF"
if [ $REAL = 0 ] && [ $prc -eq 0 ]; then echo "  GATE PASSED"; exit 0; else echo "  GATE FAILED"; exit 1; fi
