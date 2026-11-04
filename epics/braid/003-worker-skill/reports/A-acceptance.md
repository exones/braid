# A technical acceptance and B dependency handoff

Date: 2026-11-04. Coordinator-owned. A status: In Review pending human merge; technical prerequisite for B accepted.

## What is now established

The bounded trial demonstrates a legal parent-owned CI-event relay while the same assigned worker retains diagnosis, repair, current-head verification and final handoff. Direct child watches remain forbidden. Stable item/thread/worktree ownership does not require preservation of an individual task ID.

One readiness handshake reconciled completed-before-registration checks. The registered watch then delivered an actual controlled failure; the worker inspected its logs before restoring GOOD. H2's enabled-canary green proof preceded planned archive cleanup. The same subscription delivered later-head success; worker independently verified final H3 jobs, uploads, artifact digests and provenance before its green handoff. Parent teardown returned `wasWatching: true`, `watching: false` after handoff.

## Review and evidence

- Exact reviewed implementation candidate: `c86bc3990a63a5b18d582782e54f9a3cffa18928`, [PR #8](https://github.com/exones/braid/pull/8).
- [Independent pass A-worker-ci-wait-review-001](reviews/A/A-worker-ci-wait-review-001.md): no actionable findings; coordinator inspected its actual report/checkpoint and accepts the bounded result. No formal GitHub approval is implied.
- Final author [report](A.md) and [checkpoint](../checkpoints/A.md) are retained byte-for-byte from reviewed post-push supplements: SHA-256 `b37ce98666d58f803584c763bc89400c0ad703e66ae78f5baab417f2019c1161` and `7166fde71642398b314bf3a83a4c324923dadbe0fa88b66aef1781841a6a88b5`. They were not H3 Git blobs; this handoff commit makes them available to the next isolated worker without rewriting the checked A head.
- Retained review report/checkpoint SHA-256: `236d38692332776224260853054aee3a35bb7b93ce1a6f0991b1aafa68b21d6a` / `ffae922902ec775c2b3b44410708a86a2d31ae0aeb314c17a6e017d6f8a46ba8`.
- H3 attempt-1 [push run 41789149321](https://github.com/exones/braid/actions/runs/41789149321) and [PR run 41789153808](https://github.com/exones/braid/actions/runs/41789153808): both Windows/Ubuntu Verify and upload steps succeeded. Reviewer independently checked API/log/artifact bytes/digests/provenance, exact intermediate diffs, archived-canary behavior, and actual parent/worker event ordering.

The [coordinator triage](A-coordinator-triage.md), [trial packet](A-trial-assignment.md), and [historical relay checkpoint](../checkpoints/history/A-relay-2026-11-04.md) retain orchestration history. They are evidence, not current instructions to replay. The compact current checkpoint owns the next action.

## Limits and decisions

No arbitrary restart/watch durability, exactly-once delivery, every missed-event failure case, other host/provider, cross-platform byte reproducibility, release, or product automation is proved. Existing product tests/gates were preserved; the single disposable canary was archived only after its repair passed. No repeat trial or product gate is needed to accept unchanged evidence.

A's PR and plan PR #6 still report OPEN; no merge SHA/timestamp exists at this handoff. A is not Done. Human merge remains required. Under the shared delivery rule allowing explicit branch ordering after local acceptance, B can proceed from this viable reviewed result without pretending A is merged.

## B branch ordering and readiness

At the safe boundary after author and reviewer stopped, coordinator created `feat/003-b-worker-skill` from exact H3. Existing dirty status/diffs/untracked hashes were verified unchanged. Only accepted A evidence/review outputs and coordinator-owned epic-003 status/handoff files are included in the B context commit; unrelated profile/other-epic edits remain unstaged.

B's tool-managed worker checkout must start at that committed handoff revision and retain its generated owned branch. Its PR base is `t3/85fcb290` (A's branch at H3), producing a separate B layer rather than duplicating A's open delivery into another main-base PR. Merge order is plan #6, A #8, then B. Retarget/reconcile B's base after earlier human merges at a safe boundary; revalidate affected current-head proof. Do not merge, force-push or silently assume a deleted/updated base.

B owns only the new worker skill directory and B report/checkpoint. C retains routing/deduplication. Sol High remains the user-authorized epic-specific worker choice; provider settings are not embedded in reusable skill content. The proved relay supports ordinary B delivery: pending/failed checks keep ownership with the worker, parent transports actual events, and only current-head green worker return is successful handoff.
