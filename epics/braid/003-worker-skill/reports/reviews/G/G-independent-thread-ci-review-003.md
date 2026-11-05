# G-independent-thread-ci-review-003: recheck of the PR 15 watch-wake probe

Commit `b0ef14a1b3e6944b71e83bf535514543d64ad3e7` records a minimal watch-wake probe that matches the PR 15 evidence, and its operator reference keeps watch survival, unassisted repair, and exactly-once unproven. The same commit's report and checkpoint still state the pre-probe F contract as current. One finding. This review is not a merge decision.

Parent: BRAID-003/G. Pass: 003. Reviewer: independent review role, in T3 Code through the Cursor harness, model Grok 4.7 (`grok-4.7`).
Agent/assignment name: G-independent-thread-ci-review-003.
Report/checkpoint: `epics/braid/003-worker-skill/reports/reviews/G/G-independent-thread-ci-review-003.md`, `epics/braid/003-worker-skill/checkpoints/reviews/G/G-independent-thread-ci-review-003.md`.
Candidate: `b0ef14a1b3e6944b71e83bf535514543d64ad3e7`. Parent: `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. Base: `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8`. PR: https://github.com/exones/braid/pull/13, OPEN, `mergedAt` null, head `b0ef14a1b3e6944b71e83bf535514543d64ad3e7`.
Prior pass: `epics/braid/003-worker-skill/reports/reviews/G/G-independent-thread-ci-review-002.md` at `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`.
Status: findings. Date: 2026-11-04.

## Scope and evidence

Recheck of the diff from review 002's head to this head. Confirm the PR 15 claims against the supplied probe facts and GitHub, confirm the three named limits stay unproven, confirm the original negative run remains in the history, confirm review and human-merge gates remain, confirm links and anchors, and confirm `git diff --check`. The item worktree was not read or modified.

**Sources read.** Review conventions in [docs/agile-workflow.md](../../../../../../docs/agile-workflow.md#review-gates-and-indexing), [report format](../../../../../../epics/report-format.md), the review template, reviews 001 and 002, and the three blobs at `b0ef14a1` named below.

**Diff, from Git objects.** `b0ef14a1` has one parent, `9b043f0`. `git diff --numstat 9b043f0 b0ef14a1` is three files, 114 insertions and 10 deletions:

- `epics/braid/003-worker-skill/checkpoints/G.md`, 59 insertions and 2 deletions
- `epics/braid/003-worker-skill/reports/G.md`, 41 insertions
- `epics/braid/003-worker-skill/validation/G/operator-reference.md`, 14 insertions and 8 deletions

`git diff --check 9b043f0 b0ef14a1` exited 0 with no output. From the epic base `180f2e0`, those three paths are the added G documents. `gh api repos/exones/braid/pulls/13` reports `merge_commit_sha` `1a3ce2a2897ab28c504737d9489c5909395af9c8`. That object was not fetched.

**Links at `b0ef14a1`.** Every relative link in the three changed files resolves to a blob in that commit. The anchors resolve: `#follow-up-watch-probe-pr-15` from `## Follow-up watch probe (PR 15)`, `#frozen-hosted-proof`, `#3-independent-t3-workers-and-pr-waiting` from `## 3. Independent T3 workers and PR waiting`, `#review-gates-and-indexing`, and `#human-merge-stop`.

**Probe PR 15, from GitHub.** https://github.com/exones/braid/pull/15 is CLOSED, `mergedAt` null, `closedAt` 2026-11-04T21:02:17Z, closer `exones`, head `242b20cc76566b4db713a02c91c57f8d43e0efad`. The head ref was deleted at 21:02:30Z. `gh pr checks 15` shows four successful jobs:

| Run | Event | Job | Completed | Result |
| --- | --- | --- | --- | --- |
| [41911669418](https://github.com/exones/braid/actions/runs/41911669418) | push | verify (ubuntu-latest) `126860562255` | 20:59:24Z | success |
| 41911669418 | push | verify (windows-latest) `126860562524` | 21:00:14Z | success |
| [41911693090](https://github.com/exones/braid/actions/runs/41911693090) | pull_request | verify (ubuntu-latest) `126860646114` | 20:59:36Z | success |
| 41911693090 | pull_request | verify (windows-latest) `126860646424` | 21:00:30Z | success |

Both runs are workflow CI, conclusion success, `headSha` `242b20cc76566b4db713a02c91c57f8d43e0efad`. The last job finished at 21:00:30Z, before the stated wake at 21:01:49Z. The close is 28 seconds after that wake.

**This head's jobs, from `gh run view`.** Both runs are conclusion success at `headSha` `b0ef14a1b3e6944b71e83bf535514543d64ad3e7`. Artifacts were not downloaded.

| Run | Event | Job | Result |
| --- | --- | --- | --- |
| [41912995721](https://github.com/exones/braid/actions/runs/41912995721) | push | verify (ubuntu-latest) `126865166061` | success |
| 41912995721 | push | verify (windows-latest) `126865166518` | success |
| [41913008613](https://github.com/exones/braid/actions/runs/41913008613) | pull_request | verify (ubuntu-latest) `126865213272` | success |
| 41913008613 | pull_request | verify (windows-latest) `126865213470` | success |

**Not done.** The probe thread was not re-read. The quoted wake string, watch payloads, and the 20:59:07Z / 21:01:49Z run times are the commit's account checked against the supplied facts, not a new host read. The replacement loop's 46 minutes, 42 messages, and 8 cycles were not re-counted. No push, link, watch, subagent, or merge.

## Findings

### G-independent-thread-ci-review-003/F1: the current F contract is stated two ways

- **Severity:** Medium.
- **File:** `epics/braid/003-worker-skill/reports/G.md` lines 3 and 9; `epics/braid/003-worker-skill/checkpoints/G.md` lines 3, 57, 61, and 114; `epics/braid/003-worker-skill/validation/G/operator-reference.md` lines 101 and 164–183.
- **What happens:** The reference's new intake matches the probe. Lines 166 and 173 let F adopt own-thread completion from one watch wake for a short prompt that ends the turn after watching. Lines 179–181 leave a watch that survives interruption, unassisted repair, and exactly-once as unproven. One observed result is recorded as one observation.
- The report's first new paragraph, line 3, says the same narrow revision. Line 9 then says, in the present tense, that the reference lets F adopt only the pre-probe subset and that F must not rely on same-thread completion driven by a watch wake.
- The checkpoint never mentions PR 15. Line 3 says the continuation result remains negative/partial. Line 57 forbids watch-wake completion. Lines 61 and 114 tell the coordinator to record the result as negative/partial.
- Line 101 says this trial does not manufacture a second pull request to force a wake. Lines 158–160 record throwaway PR 15 as the follow-up that produced the wake.
- **Effect:** A reader of the checkpoint, or of the report's What changed section, withholds the narrow watch-wake behavior the reference and the PR 15 evidence support. A reader of the reference adopts it. Line 101 denies the extra pull request the follow-up section records. The original negative run is still present, and the three unproven limits are still present in the reference. The defect is that those older sentences are still written as the current contract.
- **Expected:** Keep the original negative run, the interruptions, the user rerun, and the duplicate replacement sends as labeled history. State one current F contract in the report, the checkpoint, and the reference: short-prompt completion from a single watch wake is observed; watch survival, unassisted repair, and exactly-once stay unproven; the coordinator still dedupes by head and recovers from interruption with an explicit snapshot. Scope the "no second pull request" sentence to the original run, and say PR 15 is the later follow-up outside that bound.

No finding is raised against the probe's narrow factual account, the preserved original-run history, the retained review and human-merge gates, the links, or the whitespace check. The reference does not claim a watch survived interruption, that the worker repaired a red check, or that one result is a guarantee.

## Acceptance assessment

| Criterion | Verdict at `b0ef14a1` |
| --- | --- |
| 1. Binding | Unchanged from review 002. The reference still records the original binding, including empty replacement branch metadata. PR 15's binding was not re-read. |
| 2. Registration and readiness | The reference still separates the original catch-up snapshot from a watch wake. The PR 15 paragraph adds one watch registration and one later wake. GitHub shows all four PR 15 jobs green before the stated wake. The wake string and payload were not re-read. |
| 3. Same worker verifies before green | Supported for the narrow probe: the supplied facts say run 2 confirmed 4/4, and GitHub shows those four successes. Repair stays unproven. PR 15's checks were already green when the stated wake arrived. |
| 4. Explicit delivery | One probe result is the supplied fact and the reference's observation. Exactly-once stays unproven at reference lines 181. The checkpoint still describes the older duplicate-result limit and does not mention the probe. |
| 5. Spike answer | Partial. The reference answers the watch-wake part for a short prompt and blocks the three unproven contracts. The report and checkpoint still answer the whole continuation as negative. Review 001 and the human merge of PR 13 remain gates. |

## Triage and gate

F1 is open at `b0ef14a1b3e6944b71e83bf535514543d64ad3e7`. This file is not a GitHub approval and not a merge decision. Reviews 001 and 002 stay in place.

## Resume

- Next action: the coordinator triages F1. A scoped fix should make the report and checkpoint carry the reference's current contract and label the original negative run as history. The human merge of https://github.com/exones/braid/pull/13 remains a separate stop.
- Output root: `C:\worktrees\agento\epic-braid-003-worker-skill`. Branch `epic/braid-003-worker-skill`. HEAD `eb091e3c62ececb44ed7c554cbda6617fa5da710`. The two output files are uncommitted. This review did not stage them.
- Limits: host activity for `mcp:launch:ab2782589f6ef8f86490fdf9ff805925a5338ebbdbaaa1b1b466f89015fd2063` was not re-read, so the launch id, the wake text "All 2 checks passed on 242b20c", and the watch payloads `watching` / `wasWatching` were not independently confirmed. GitHub's four green jobs, the closed unmerged PR, and the close time are consistent with the account. Checkpoint line 3 still calls the `9b043f0` proof section uncommitted; that wording is stale inside this commit and does not change the F contract, so it is not a separate finding. Artifact bytes for runs 41912995721, 41913008613, 41911669418, and 41911693090 were not hashed.
- Proposed shared status: G review 003 complete with F1 open at `b0ef14a1`. The narrow probe account matches PR 15. Watch survival, unassisted repair, and exactly-once stay unproven. Not Done, not merged.
