#!/bin/bash
# THE PROOF — RUN 2 and RUN 3 of the gate, on a copy of HEAD (2026-09-16, the
# engineering redesign). Built from fx/validate-next.sh and merged-verify-final.sh
# (both left unedited).
#
#   scripts/gate/gate-proof.sh                       the proof for this repository's HEAD; it runs its own control
#   SRC=<worktree> scripts/gate/gate-proof.sh        another worktree's HEAD
#   CONTROL=<run1.json> CONTROL_SHA=<sha> ...        a full-suite report of the SAME HEAD, unpatched
#                                                    (gate.sh passes its RUN 1's) — else RUN 2a makes one
#   CONTROL_PROBE=<run1-probe.json>                  scripts/probe-scene.mjs's report of it (gate.sh's RUN 1)
#
# RUN 2  every misuse case in scripts/gate/gate-cases.py patched into one build;
#        the suite runs with --repo and an --only list DERIVED from the case
#        table; each case must FAIL its own check with its own finding, and that
#        finding must not already be on the unpatched build (the control).
#        scripts/probe-scene.mjs runs beside it, with an --only list derived
#        from PROBE_CASES, for the hero scene's cases (2026-09-29).
# RUN 3  four bad-content builds the schema must refuse, each with its own words
#        in the build log.
# Port 3466 only; the copy is $SP/gp-copy; logs and reports in $SP/gp-out.
# Exit 0 PROOF PASSED · 1 PROOF FAILED · 2 PROOF INCOMPLETE (a case waits on a
# wave) · 3 aborted, no verdict.
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
R=$SP/gp-copy
OUT=$SP/gp-out
PORT=3466
MISS=0; BAD=0; WAIT=0; SRV=
mkdir -p $OUT
load() { uptime | sed 's/.*load averages*: //'; }
guard() {
  local kb; kb=$(df -k / | tail -1 | awk '{print $4}')
  if [ "$kb" -lt 1572864 ]; then echo "ABORT before $1: $(df -h / | tail -1 | awk '{print $4}') free; the proof needs 1.5 GB. Nothing further was attempted."; exit 3; fi
}
die() { echo "ABORT: $1"; [ -n "${2:-}" ] && tail -15 "$2" | sed 's/^/    /'; exit 3; }
stop() { if [ -n "$SRV" ]; then kill $SRV 2>/dev/null; wait $SRV 2>/dev/null; SRV=; sleep 1; fi; }
trap stop EXIT
serve() {
  yarn start -p $PORT > $OUT/server.log 2>&1 & SRV=$!
  for i in $(seq 1 90); do curl -s -o /dev/null http://localhost:$PORT/ && return 0; sleep 1; done
  die "the server did not come up on :$PORT" $OUT/server.log
}
# $1 the report, $2 its text: a suite that dies is not a pass
suite() {
  rm -f "$1"
  node scripts/verify-site.mjs --base http://localhost:$PORT --repo . --only "$ONLY" --json "$1" > "$2" 2>&1; local rc=$?
  { [ $rc -eq 0 ] || [ $rc -eq 1 ]; } || { tail -20 "$2"; die "the suite died (exit $rc) — no verdict"; }
  [ -s "$1" ] || die "the suite wrote no JSON report"
}
# the same for scripts/probe-scene.mjs, the hero scene's pixels over time
probe() {
  rm -f "$1"
  node scripts/probe-scene.mjs --base http://localhost:$PORT --only "$PONLY" --json "$1" > "$2" 2>&1; local rc=$?
  { [ $rc -eq 0 ] || [ $rc -eq 1 ]; } || { tail -20 "$2"; die "probe-scene died (exit $rc) — no verdict"; }
  [ -s "$1" ] || die "probe-scene wrote no JSON report"
}

lsof -tiTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1 && die "something is already listening on :$PORT"
HEAD=$(git -C "$SRC" rev-parse --short HEAD) || die "no git HEAD in $SRC"
echo "=== THE PROOF — $(git -C "$SRC" rev-parse --abbrev-ref HEAD) @ $HEAD (load average $(load))"
ONLY=$(python3 $E/gate-cases.py only) || die "the case table did not load"
PONLY=$(python3 $E/gate-cases.py probe-only) || die "the case table did not load"
echo "  --only $ONLY  — derived from the expectation table (scripts/gate/gate-cases.py), never written by hand"
echo "  probe-scene --only $PONLY  — derived from PROBE_CASES"
guard "the copy"
rm -rf $R && mkdir -p $R && (cd "$SRC" && git archive HEAD | tar -x -C $R) || die "could not copy HEAD"
cd $R && git init -q && git add -A && git -c user.name=gate -c user.email=gate@local commit -q -m "HEAD copy of $HEAD" || die "could not commit the copy"
cp -cR "$SRC/node_modules" $R/node_modules 2>/dev/null
yarn install --immutable > $OUT/install.log 2>&1 || die "yarn install failed" $OUT/install.log
echo "  copied $HEAD to $R and installed"

# the control: the same checks on the same HEAD, unpatched
if [ -n "${CONTROL:-}" ] && [ -s "${CONTROL:-}" ] && [ -n "${CONTROL_PROBE:-}" ] && [ -s "${CONTROL_PROBE:-}" ] && [ "${CONTROL_SHA:-}" = "$HEAD" ]; then
  echo "  control: $CONTROL and $CONTROL_PROBE — RUN 1 of $HEAD"
else
  [ -n "${CONTROL:-}" ] && echo "  the control given is not a report of $HEAD — making one"
  echo "=== RUN 2a — the control: the --only checks on the unpatched copy"
  guard "the control build"
  yarn build > $OUT/control-build.log 2>&1 || die "the control build failed" $OUT/control-build.log
  serve; suite $OUT/control.json $OUT/control.txt; probe $OUT/control-probe.json $OUT/control-probe.txt; stop
  CONTROL=$OUT/control.json
  CONTROL_PROBE=$OUT/control-probe.json
  echo "  control made: $CONTROL and $CONTROL_PROBE"
fi

echo "=== RUN 2 — deliberate misuse: every case in one build, each attributed by its own finding"
python3 $E/gate-cases.py apply $R $OUT/cases.json || die "the patches did not apply"
guard "the misuse build"
rm -rf .next
yarn build > $OUT/misuse-build.log 2>&1 || die "the misuse build failed" $OUT/misuse-build.log
echo "  misuse build ok (load average $(load))"
serve; suite $OUT/misuse.json $OUT/misuse.txt; probe $OUT/misuse-probe.json $OUT/misuse-probe.txt; stop
echo "--- RUN 2 expectation table"
node $E/gate-expect.mjs $OUT/cases.json $OUT/misuse.json,$OUT/misuse-probe.json "$CONTROL,$CONTROL_PROBE"; rc=$?
case $rc in 0) ;; 1) MISS=1 ;; 2) WAIT=1 ;; *) die "the expectation table did not run (exit $rc)" ;; esac

echo "=== RUN 3 — bad content: the build must refuse each, in the schema's own words"
git checkout -q -- . && git clean -fdq -e node_modules && [ -z "$(git status --short)" ] || die "the misuse patches did not come out cleanly: $(git status --short | head -5 | tr '\n' ' ')"
while IFS=$'\t' read -r label file name pats; do
  python3 $E/gate-cases.py bad $R "$label" || die "RUN 3 ($label): the patch did not apply"
  guard "validation build ($label)"
  if yarn build > $OUT/bad-$label.log 2>&1; then
    BAD=1; echo "  ($label) $name — ACCEPTED: the build took it"
  else
    ok=1; IFS=$'\t' read -r -a want <<< "$pats"
    for p in "${want[@]}"; do grep -qE "$p" $OUT/bad-$label.log || ok=0; done
    if [ $ok = 1 ]; then echo "  ($label) $name — refused, as it must:"; grep -m1 -E "${want[0]}" $OUT/bad-$label.log | cut -c1-220 | sed 's/^/      /'
    else BAD=1; echo "  ($label) $name — UNSURE: the build failed, but its log lacks the schema's refusal (${want[*]}); unsure is a failure:"; grep -m3 -iE "error" $OUT/bad-$label.log | cut -c1-200 | sed 's/^/      /'; fi
  fi
  git checkout -q -- "$file"
done < <(python3 $E/gate-cases.py bad-list)
[ -z "$(git status --short)" ] || die "RUN 3 left changes behind: $(git status --short | head -3 | tr '\n' ' ')"

echo "=== PROOF VERDICT for $HEAD (load average $(load))"
echo "  RUN 2 cases that did not fail: $([ $MISS = 0 ] && echo none || echo YES) · waiting on a wave: $([ $WAIT = 0 ] && echo none || echo YES) · RUN 3 bad content accepted or unsure: $([ $BAD = 0 ] && echo none || echo YES)"
if [ $MISS = 0 ] && [ $BAD = 0 ] && [ $WAIT = 0 ]; then echo "  PROOF PASSED"; exit 0
elif [ $MISS = 0 ] && [ $BAD = 0 ]; then echo "  PROOF INCOMPLETE — every applied case failed as expected and all bad content was refused, but some case waits on a wave (above)"; exit 2
else echo "  PROOF FAILED"; exit 1; fi
