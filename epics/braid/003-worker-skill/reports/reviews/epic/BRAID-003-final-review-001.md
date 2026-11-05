# BRAID-003-final-review-001: final epic integration

One records finding. The delivery items are merged into this epic history, K stays deferred, and the integrated policy agrees on the listed rules. Watch survival, unassisted repair, and exactly-once delivery stay unproven. PR 25's current-head proof passed. This pass is not a GitHub approval or a merge.

Parent: BRAID-003. Pass: 001.
Reviewer: independent review role, Grok 4.7. Not an implementation author for this epic.
Agent/assignment name: BRAID-003-final-review-001.
Report/checkpoint: `epics/braid/003-worker-skill/reports/reviews/epic/BRAID-003-final-review-001.md`, `epics/braid/003-worker-skill/checkpoints/reviews/epic/BRAID-003-final-review-001.md`.
Candidate: `a6eecbd9cd62b33139f3af902a329418d3a94cf9`. Base: `1dd5cb735c4614b75d96c0694c8c6d0a939f2605`.
PR: https://github.com/exones/braid/pull/25, OPEN, MERGEABLE. Head and base match those SHAs. `git rev-list --count a6eecbd..1dd5cb7` is 0.
Pass state: findings. Date: 2026-11-05.
Item status is not copied here. See [One home for status](../../../../../../docs/agile-workflow.md#one-home-for-status).

## Scope and evidence

Milestone review of the integrated epic head, not a new pass over each item's behavior. Review checkout `C:/worktrees/agento/t3-c2b31e84`, branch `t3/c2b31e84`, HEAD `a6eecbd9cd62b33139f3af902a329418d3a94cf9`, confirmed against `origin/epic/braid-003-worker-skill` after `git fetch origin`. No second checkout. No author source edits, commits, pushes, or pull-request comments.

Read [AGENTS.md](../../../../../../AGENTS.md), [review conventions](../../../../../../docs/agile-workflow.md#review-gates-and-indexing), [record ownership](../../../../../../docs/agile-workflow.md#record-ownership), [review records](../../../../../../epics/report-format.md#review-records), the [review template](../../../../../../.agents/skills/braid-coordinate/assets/review.md), [Epic and item branches](../../../../../../.agents/skills/braid-coordinate/references/delivery.md#epic-and-item-branches) through the human merge stop, [epic.md](../../../epic.md), both skill entrypoints, [T3 continuation](../../../../../../.agents/skills/braid-worker/references/t3-continuation.md), [delegation](../../../../../../.agents/skills/braid-coordinate/references/delegation.md), the assignment-packet asset, [agent handoff](../../../../../../docs/agent-handoff.md), [roadmap](../../../../../../docs/roadmap.md), and D24 in [decisions](../../../../../../docs/decisions.md). Item reports were opened only to check merge records: the acceptance files, [D triage](../../../reports/D-coordinator-triage.md), the opening of [G](../../../reports/G.md), and [K](../../../backlog/K-coordinator-push-timing.md).

`git diff --stat 1dd5cb7 a6eecbd` is 164 files, 11862 insertions, 341 deletions. The done commit `a6eecbd` changes only `epic.md` and `checkpoints/current.md`.

## Findings

### F1. Medium. D is marked done while the resume file still says PR 23 is open, and the acceptance record is missing

Files: [epic.md](../../../epic.md) line 61, [checkpoints/current.md](../../../checkpoints/current.md) lines 2–4 and 11, [reports/D-coordinator-triage.md](../../../reports/D-coordinator-triage.md) line 3, [checkpoints/log.md](../../../checkpoints/log.md) line 42. `reports/D-acceptance.md` is absent.

Failure: at `a6eecbd`, the epic row says D is done and merged as `a7cbf76`. The same commit's resume file says that, and also says the records are local only and that PR 23 is OPEN on `faca856` (lines 4 and 11). The triage still says no technical acceptance, human merge, or Done is recorded. The log's last line is the 2026-11-05T12:00:24Z review launch. [Record ownership](../../../../../../docs/agile-workflow.md#record-ownership) and the [acceptance record](../../../../../../epics/report-format.md#acceptance-record) require `reports/D-acceptance.md` after the human merge.

Expected: one acceptance file with checked head `faca8568a0b22aba2a443d4ed2c2d28fd0783564`, base `3101d8405e0b0eba0f3c2f11a719a77eba5d888e`, the cleanup run facts, merge `a7cbf760a920db90c2dec34e5d9364161286232b`, and review 001 with no findings. `checkpoints/current.md` names that merge without calling PR 23 open. The log gains a merge line.

Evidence: `a7cbf760a920db90c2dec34e5d9364161286232b` is a merge of PR 23 whose parents are `3101d84` then `faca856`, and it is an ancestor of this head. The merge is real. The written closeout is not.

## Acceptance assessment

1. **Proven for the merges. F1 is the D closeout gap.** Every delivery row is `done` and its merge commit is an ancestor of `a6eecbd`. K is `backlog`, deferred in the epic and in `backlog/K-coordinator-push-timing.md`, with no dispatch.

   | Item | Merge commit on this head | Where it lands |
   | --- | --- | --- |
   | A | `a2120bfa084a32212a780a0fdc095c38d8869ef5` | main and epic; reviewed `c86bc399` is an ancestor |
   | B | `71071ef4bbf380213a5f5cd1b74eb458016b14e3` (PR 9), then main via E | main and epic |
   | C | `4e7e976a4030f23d63b846f156a307a7b70fc870` (PR 10), then main via E | main and epic |
   | E | `7707524a0b5a007794f22fab6ae1439d93458bb6` | main and epic; accepted `f6b136099` is an ancestor |
   | G | `5c9f38fc4e43740ec5c83b6c403dbb42604dc07c` | epic. No `reports/G-acceptance.md`; the epic row and this commit are the merge evidence |
   | F | `7ddc561501affe73fcd6fb29fe50a23c763f2dc2` | epic; accepted `f8c1f5bda` is an ancestor |
   | H | `2b6c2f407d275ed1faa2dc2768278fcfa302aaf9` | epic; accepted `7b56b82ae` is an ancestor |
   | J | `d30e3a93a2a3690934d059357eb2ed9b1494d6ca` | epic; tree `a5168f1558b4f6e56019a7044d39bac9370eb53a` matches reviewed `d28e052` |
   | I | `d66843cfb23b1c5c3891732c458d30d2b077fae1` | epic; tree `74eac2da893d1fa1af1dd7a20b29c8f65ec65696` matches reviewed `4fed09d` |
   | D | `a7cbf760a920db90c2dec34e5d9364161286232b` | epic; parents frozen `3101d84` and reviewed `faca856` |
   | K | none | deferred; outside the delivery sequence |

   A, B, and C reached main through PR 11, which matches the rule that history already on main stays. Their early acceptance files still describe the pre-merge wait; [E acceptance](../../../reports/E-acceptance.md) records the main merge.

2. **Proven.** These files agree on the checked topics: `AGENTS.md`, both `SKILL.md` files, the worker continuation reference, the assignment-packet asset, the coordinator delivery and delegation references, the review template, `docs/agile-workflow.md`, `docs/agent-handoff.md`, `epics/report-format.md`, and `docs/roadmap.md`.

   - Provider settings live only in [AGENTS.md](../../../../../../AGENTS.md#providers-and-roles). The skills and handoff point there and do not embed a model id.
   - Review naming and paths live in [review conventions](../../../../../../docs/agile-workflow.md#review-gates-and-indexing). The other files link there.
   - The human merge stop is [delivery.md](../../../../../../.agents/skills/braid-coordinate/references/delivery.md#human-merge-stop). Green CI and review are not a merge in AGENTS, the workflow Definition of Done, the report format, the handoff, and both skills.
   - Item branches start from the epic tip and target the epic. One epic pull request targets main. Item Done is the epic merge. Epic completion and release stay separate.
   - A top-level item thread watches its own pull request, ends the turn, and one wake drives one result. The coordinator dedupes by head. The parent relay is only an explicitly selected delegated-child route.
   - `npm run verify` is the offline pre-PR gate for implementation. Records-only epic pushes use `scripts/Test-CoordinatorRecordsGate.ps1` and do not replace that gate.
   - `scripts/Test-PrProof.ps1` lines 1–2 call the command temporary and superseded by stage 2 gate reports. [Roadmap](../../../../../../docs/roadmap.md) line 25 says the same and says it is not a product command. The skills run it when the checkout provides it, outside `npm run verify`.

3. **Proven.** The three limits stay unproven in AGENTS, D24, the coordinator skill, and [t3-continuation.md](../../../../../../.agents/skills/braid-worker/references/t3-continuation.md) line 26. G's report and D's triage keep the same limit. No maintained file treats watch survival, unassisted repair, or exactly-once delivery as settled.

4. **Proven.** `.github/workflows/` contains `ci.yml` and `release.yml`. `d-trial-canary.yml` and `validation/D/trial/canary.txt` are absent at this head. `scripts/Verify.ps1` and `ci.yml` do not call `Invoke-DFixtures.ps1`. The retained `validation/D/` files are evidence. They are not a CI job.

5. **Proven.** Checks below. Hosted proof is current on this open pull request.

## Checks

- `git fetch origin`, then `git diff --stat 1dd5cb735c4614b75d96c0694c8c6d0a939f2605 a6eecbd9cd62b33139f3af902a329418d3a94cf9`.
- PATH `npm ci` exited 1: `EBADENGINE`. Actual Node `v24.19.0`, npm `11.17.0`. The package requires Node `>=26.13.0 <27`.
- Pinned toolchain `C:/worktrees/agento/t3-c2b31e84/.tools/node/node-v26.13.0-win-x64`, SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a`. `npm ci` with that Node `v26.13.0` / npm `11.20.0` exited 0.
- `npm run verify` with that toolchain exited 0. Docs gate `text=316`, `suppressed=7`, `exclusions=7`. Tests 40 pass, 0 fail. Packed install candidate true, worktree-dirty false, source `a6eecbd9cd62b33139f3af902a329418d3a94cf9`, tarball SHA-256 `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36`. pwsh `7.6.9`. This run was on the clean candidate, before these review files existed.
- `pwsh -NoProfile -File scripts/Test-PrProof.ps1 -PullRequest 25` exited 0. Verdict `PASS`, `proofScope` `current`, `currentReady` true, `skipArtifacts` false, final view still open, head recheck unchanged. Push run `42024960532` attempt 1 and pull_request run `42025263331` attempt 1: Ubuntu and Windows `verify` jobs, steps Install dependencies, Verify, and Upload packed tarball, all success. Pull-request source `c186e4f85430a49f8dc46609dea81cf83c809e11`, parents `1dd5cb735c4614b75d96c0694c8c6d0a939f2605` then `a6eecbd9cd62b33139f3af902a329418d3a94cf9`. All four tarball digests match `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36`. CI was already complete at the single check; this pass did not wait.

## Triage and gate

F1 is open. The coordinator records fixed, refuted, or deferred against `a6eecbd` or the fix revision. This file is the technical review record. It is not a GitHub approval and it does not merge PR 25. A later independent recheck would be `BRAID-003-final-review-002`.

Epic completion still needs the outcome report, the retrospective, and the human merge of this epic pull request into main. Registry publication stays separate.

## Resume

Next owner is the coordinator: repair F1 in an epic records commit, then continue the outcome report, retrospective, and the human merge stop for PR 25. Suggested shared status stays in progress.

Limits: item behavior was not re-tried. External skill validators were not run. `npm audit` reported 9 moderate advisories during `npm ci`; that output is not a verify failure and was not investigated. The epic text still names the milestone pass `BRAID-003-review-001`; this assignment keeps `BRAID-003-final-review-001`.
