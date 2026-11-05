# I scoped repair: review001/F1

Resume the SAME I worker and item; open `epics/braid/003-worker-skill/checkpoints/I.md` first, then this committed repair packet and the pinned operating skill from the original I assignment. The checkpoint is a pre-push snapshot: reuse existing PR21 and branch, do not recreate its initial commit/PR.

## Current verified facts

Root `C:/worktrees/agento/item-braid-003-i-pr-proof`, attached `item/braid-003-i-pr-proof`, reviewed head `ad0b1b6dc5bf434f487ba0605e269e79194ef1f9`, clean at return. PR21 OPEN. Cached pull-request base4631970 differs from actual target branch dd5b82f before this fix packet. Review001 report/checkpoint are now retained under reports/checkpoints/reviews/I. Original archive bytes and provenance remain valid historical evidence at base4631970; current-epic readiness is withdrawn. Reviewer is stopped. No D or merge action.

User explicitly approved freezing I's target base during the next proof/review cycle. The coordinator pushes this packet/context once, then keeps later status/review commits local until the human I merge. Merge the exact frozen epic tip supplied in the resume message into your existing branch before final repair proof. Keep that base stable; do not loop chasing coordinator records. Report any independent remote movement as a precise blocker. Original execution skill installation/revision d30e3a9 and full artifact gate stay unchanged.

## Finding and approved repair

`I-pr-proof-script-review-001/F1` High is accepted. `Get-PullRequestView` reads `gh pr view baseRefOid`, which can remain cached while the actual target branch advances. Comparing that cached value with itself gave live PASS for merge-test parent4631970 while the epic ref was dd5b82f. Actual base-branch resolution and reread are required.

1. Resolve the PR target repository/ref name and its actual Git branch tip through authoritative GitHub ref/branch data for open PRs. Do not infer the live tip from cached `baseRefOid` or `base.sha`, and do not fetch/checkout user branches to discover it. Preserve recorded snapshot fields separately in the output.
2. For open-PR current readiness, require the merge-test first parent to equal that actual target tip, second parent=head, and require the live tip/head to remain unchanged on the final reread. An advanced base with otherwise identical cached PR fields is FAIL (exit1), retaining old artifact facts as historical diagnostics. Missing/auth/schema/ref-resolution errors must fail closed, not use a cached fallback. Retain existing FAIL/PENDING precedence and all full artifact checks.
3. Preserve backlog criterion1's merged historical-PR example without mislabelling history as current merge readiness. A merged PR can prove its recorded merged snapshot, but output an explicit historical proof scope/state so that PASS cannot be consumed as open/current readiness. Open PRs must never select that path. Make the short caller instructions require current proof scope for active-PR acceptance; do not add a flag that bypasses a stale open base.
4. Add offline regressions for: live base already advanced with unchanged cached PR base, live base advancing during proof, matching unchanged live base, and explicitly labelled merged historical snapshot. Keep the original failure/pending/attempt/source/digest fixtures. Validate relevant updated JSON schema/interface and live code path, not only an unused fixture branch.
5. Focus on F1 and direct consequences. Other review observations are limits, not new assigned findings; do not expand into unrelated refactoring or gate relaxation. Update only the original I-owned proof/fixture/reference files and pre-push worker report/checkpoint as needed.

## Delivery and return

Run focused fixtures, full `npm run verify`, external skill validators for changed skill content, and the original full current-head hosted proof (both events/platforms/required steps, archives, tarballs, provenance/source mapping), with no SkipArtifacts. Historical proof remains distinct. Commit the repair and updated report/checkpoint before push on the same branch/PR; no record-only commit after green.

Use your top-level own link/watch/wake/repair route under host rules, with no polling/self-queue/agents/provider replacement. Keep ownership until the repaired head has independently verified proof against the frozen actual base. Unwatch and send ONE green result per head with exact frozen base/head/live-ref reread, run/job/artifact identities/digests and output paths to coordinator `8a3c206a-9192-498f-b90a-19b5bf807c8c`; post the same facts as concise own PR comment. A precise blocker is nonterminal ownership, not green. Independent review002 and human merge still follow. D remains stopped.
