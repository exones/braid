# I scoped repair: review002/F1

Resume the SAME implementation worker, checkout, branch and PR21. Open `epics/braid/003-worker-skill/checkpoints/I.md` first; its pre-push snapshot is historical. Then read this committed packet and the copied review002 report. Reuse the original pinned operating skill `C:/Users/exon/.codex/braid-pins/d30e3a93a2a3690934d059357eb2ed9b1494d6ca/.agents/skills/braid-worker/SKILL.md`. No new checkout, PR, provider or initial discovery.

## Verified facts and boundary

Author root `C:/worktrees/agento/item-braid-003-i-pr-proof`, branch `item/braid-003-i-pr-proof`, HEAD `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777`, clean. PR21 open and mergeable, target `epic/braid-003-worker-skill`. The actual remote target remains frozen at `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`. Coordinator review/status commits stay LOCAL until human merge. Do not merge those unpublished coordinator commits into I or chase them. Read the supplied context as Git objects. Report independent remote movement rather than treating stale proof as current.

Review001/F1 is resolved at d5fbbff: live-ref resolution, stale-base failure including waived artifacts, and historical scope separation were independently verified. Review002/F1 Medium is accepted and open: final Get-PullRequestView discards the second state/baseRefName, leaving currentReady true if the PR closes or retargets during downloads while old ref/head stay unchanged. Current evidence on d5fbbff was obtained while the PR remained open on the frozen target; it is valid for that observed snapshot, not proof that the race is safe. Reviewer is stopped. Review files are retained under reports/checkpoints/reviews/I.

## Required repair

1. Carry the final PR state and target branch identity through the live model and judgment. Current PASS requires the PR to remain open with the same target repository/ref identity, head and live tip. Closing, merging or retargeting during a current proof must exit1/currentReady false, including a retarget to a different branch at the SAME SHA. Do not silently turn an in-flight current proof into historical success. An initially merged historical snapshot retains its separately labelled behavior.
2. Resolve/check the final target tip and merge-test identity/ordered parents against final PR identity before current PASS. Fail closed on missing/auth/schema/ref/merge-test errors; retain digest and job checks plus FAIL/PENDING precedence. Expose useful initial/final identity diagnostics without changing the prose gate definition or adding a bypass.
3. Add focused deterministic regressions for open-to-closed, open-to-merged, and target-name change (including equal tip SHA), and unchanged open identity. Exercise the actual live-model second-read seam with stubbed gh/API responses or an equivalent bounded harness, so fixtures cannot pass while live code drops fields. No live close/retarget mutation of PR21 is authorized. Preserve stale-head/base, historical, attempt, failure/pending and artifact regressions. No unrelated refactor or expansion into reviewer limits.

## Delivery and return

Own original I proof/fixture files and necessary pre-push I report/checkpoint updates. Run focused regressions, full `npm run verify`, and skill validators only if skill content changes. Commit the repair before push on the SAME branch/PR. Full current-head hosted proof and all four archive/tarball/provenance/source checks remain REQUIRED, no SkipArtifacts. Preserve frozen target7714587; no coordinator branch push, human merge or D.

Use your top-level own link/watch/wake/repair route, no polling/self-queue/agents. After complete independently verified current-head green proof, unwatch and send ONE result for the new head to coordinator `8a3c206a-9192-498f-b90a-19b5bf807c8c`, with root/branch/head/base, final PR identity/state, run/job/artifact/digest/source facts and limits. Put post-push facts in the PR comment/result, not a paperwork-only commit. A fresh independent review003 follows green; it is not part of your task. Stop after I. Human merge and D remain stopped.
