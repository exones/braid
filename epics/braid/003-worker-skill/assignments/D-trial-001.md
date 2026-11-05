# D resume: one guided live failure/repair trial and delivery

Resume SAME D worker from `checkpoints/D.md`. Root `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof`, branch `item/braid-003-d-worker-behavior-proof`, expected current HEAD `2591a5a8757134944be0c261257f17210c123741`, clean/local/unpushed/no PR. Do not replay startup, fixture setup, initial planning or old preparation returns. Same Grok4.7 High/500K, immutable operating pin `d66843cfb23b1c5c3891732c458d30d2b077fae1` outside checkout. No product controller; package0.1.1/schema1 unchanged.

## Reconcile once and act

Open own checkpoint first, then this packet and `reports/D-recheck-001-coordinator.md` plus `reports/evidence/D/recheck-001-trace.json` from coordinator context supplied at resume. The one focused recheck is finished: full instruction stdout observed, no search/answer access, correct current/stale failure classification, zero writes, natural completion. Earlier three probes' successes AND loading/blinding limits remain historical facts; do not erase them. Assess current D report with this evidence, not another subject or fixture replay.

Your ordinal4 assessment handoff was explicitly stopped with `braid003-d-assessment-handoff-stop-001`, post-read confirmed interrupted/activeRunId null before the recheck. All four subject runs ended naturally. Preserve old->new run lineage and evaluator interventions as limits. No more loading/blinding tests.

Merge the EXACT published epic tip supplied with this resume into your existing branch, preserving local D commits. The coordinator keeps that target stable through this live CI/review cycle, with subsequent status/review records committed locally until the human merge, reusing I's scoped proof-window tactic. No general K policy change. Do not chase unpublished coordinator commits. Independently resolve the actual target before final proof; outside remote movement is reconciled explicitly, never cached away.

Concrete first useful action after reconciliation: add only the temporary workflow and canary described below. The trial design is settled; do not write another operating manual or investigate alternatives absent a concrete blocker.

## Owned scope and frozen behavior

Original D-owned validation files, `reports/D.md`, `checkpoints/D.md`, plus ONLY `.github/workflows/d-trial-canary.yml` and `epics/braid/003-worker-skill/validation/D/trial/canary.txt` for this trial. Existing CI workflow, Verify/proof scripts, product code, installed skill pin, package/schema, shared epic/current/log and other worktrees stay outside your write scope. No agents, live subject launch, reset/clean/rebase/force-push, merge into epic/main or publication.

Use ONE existing named item branch and ONE PR into `epic/braid-003-worker-skill`. This assignment explicitly authorizes the bounded added canary failure on that branch only; it is a research stimulus, not permission to weaken an existing check. Normal CI must continue passing. Record setup as guided: you know the canary path and success condition. A successful repair without parent intervention demonstrates this one guided lifecycle, not general unassisted diagnosis/recovery.

## F: publish and observe the one failure

- Add workflow named `D controlled canary`, contents:read only, one Ubuntu job/check named `d-trial-canary`. Reuse checkout pinned in current CI (`3d3c42e5aac5ba805825da76410c181273ba90b1`), persist-credentials false, shell pwsh. No new action/version/provider research.
- Trigger push only on `item/braid-003-d-worker-behavior-proof`, pull_request only targeting the epic; path filters only this workflow and canary file. Guard the job against other head branches as well. No schedule/pull_request_target/secrets, polling or artificial delay.
- Steps include checkout, `Record canary source` printing actual checked-out HEAD/parents, and `Require canary GOOD`: read literal canary bytes and require exactly UTF-8 `GOOD` plus one LF (hex474F4F440A). Missing/mismatching bytes exit1 with a clear reason. Never make this step pass conditionally on CI failure or a waiver.
- Seed canary with `BAD` plus LF. Run full `npm run verify`; it must pass locally without bypasses. Update own report/checkpoint BEFORE F push, naming phase, branch, local probe versus candidate, frozen declared check set and next action. Commit scoped F, push `git push -u origin item/braid-003-d-worker-behavior-proof`, create one PR into epic, immediately link per host rules, watch, one catch-up snapshot, then end turn if pending. No self-queue/timers/loops.
- Watch wake or catch-up failure drives SAME-worker diagnosis of actual current-head canary run/attempt/job/step/log. Distinguish whether an actual wake occurred or only catch-up observed failure. Preserve exact F ids/head/event/source and failed step. Do not manufacture a claim. Existing CI F jobs must ultimately be verified SUCCESS; they may finish after the repair push. No need to download F archives solely for negative-proof duplication.

## R: same-worker repair and positive proof

- Repair only the canary bytes to `GOOD` plus LF, retaining the check's success condition. Update own candidate-time records in that substantive repair commit, run `npm run verify`, commit/push/link same branch/PR. Existing watch persists; do not re-register it on a wake. End turn if pending; real events drive next verification. No coordinator repair takeover.
- On R require BOTH events' latest-attempt canary jobs and all named steps SUCCESS, with actual source mapping: push source=R, PR source=merge-test whose parents are frozen target then R. Retain run/job/attempt/source identities and logs. Missing/skipped/pending/inaccessible never counts.
- Also require complete standard CI set on R, full artifacts via `scripts/Test-PrProof.ps1 -PullRequest <number>` (no SkipArtifacts), `proofScope=current`, currentReady true, final PR still open on same ref, actual base/final reread stable. The script covers CI, NOT the added canary; check the extra workflow independently.
- Post concise F failure and R success evidence on the same PR BEFORE cleanup. This post-push evidence stays in PR comment/result, not a paperwork-only commit onto R. Ensure standard F CI jobs/required steps completed success and report any unexpected baseline failure honestly.

## C: decommission the proven trial fixture and deliver

Only AFTER F failure and complete R positive proof, remove exactly the two temporary files with native literal-path operations (no recursive directory deletion). This is predeclared decommission after the extra check passed, not deletion of a failing test to manufacture green. Preserve F/R evidence. Update D report/checkpoint with observed trial, measured results, limitations and next review action in the same substantive cleanup commit. Do not merge a red or canary-bearing head into the epic.

Run full `npm run verify`, commit/push/link C. Final declared hosted set is standard `.github/workflows/ci.yml`, push and pull_request, Ubuntu/Windows verify, Install dependencies/Verify/Upload packed tarball all SUCCESS, latest attempts/current head. Extra canary is decommissioned by design; its required historical R success is retained separately. Full archive/tarball/provenance/source proof REQUIRED on C via adopted finite proof command, no SkipArtifacts. Final head/base/state/ref reread must match; no green old-head substitution.

No source skill edits planned; validators required separately only if skill edits become necessary and are scoped back first. No full coordinator suite or extra permanent product tests. Record local dirty probes honestly; hosted clean candidate evidence is separate. Preserve meaningful failed gates and diagnose actual scope failures.

## Return and boundaries

Top-level own PR link/watch/wake/repair route under host rules, no polling/sleep/readiness generations/provider substitution. Handle naturally observed stuck yield/queued continuation as one precise transport blocker with preserved identities, not self-restart. Retain item ownership on pending/blocker; user-owned blockers identify exact nonsecret action. No parent messages for routine unchanged pending; no duplicate ready result for F/R. In-scope repairs stay here.

After complete C proof, unwatch and send ONE final-head result via t3_thread_send to coordinator `8a3c206a-9192-498f-b90a-19b5bf807c8c`: actual root/branch/full C head/frozen base/PR, F and R trial identities/source/failure->success, whether wake/catch-up and any interventions, C CI/artifact digests/provenance, local checks/limits, D report/checkpoint paths. Post same concise proof as own PR comment. Stop. Independent `D-worker-behavior-proof-review-001` and human merge still follow; do not award acceptance/Done or start final epic work.
