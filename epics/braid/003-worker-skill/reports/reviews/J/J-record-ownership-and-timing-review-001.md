# J-record-ownership-and-timing-review-001: record ownership and timing

The ownership table, the acceptance-file example, the current/log split, the main-sync rule, and the skill pin are in place at `ed03974840664d8580af2f998c9046d9562a66bd`, and the four hosted verify jobs succeeded on that head. Three instructions still tell a worker or coordinator to write a record after the push or to put the review file on the item pull request. Human merge of PR 20 remains open.

Parent: BRAID-003/J (`backlog/J-record-ownership-and-timing.md`). Pass: 001.
Reviewer: independent review role, Grok 4.7. Not the implementation author.
Agent/assignment name: J-record-ownership-and-timing-review-001.
Report/checkpoint: `epics/braid/003-worker-skill/reports/reviews/J/J-record-ownership-and-timing-review-001.md`, `epics/braid/003-worker-skill/checkpoints/reviews/J/J-record-ownership-and-timing-review-001.md`.
Assignment packet: loaded with `git show 42838dd5493c06732c37ed54a6740ad2dcd7ab66:epics/braid/003-worker-skill/assignments/reviews/J/J-record-ownership-and-timing-review-001.md`. That object is not in the candidate tree.
Candidate: `ed03974840664d8580af2f998c9046d9562a66bd`. Base: `2b823f9fb7918b8db04d8cf985be327cdad28f70`.
PR: https://github.com/exones/braid/pull/20, OPEN, MERGEABLE, `reviewDecision` empty. Head and base reconfirmed after the checks.
Pass state: findings. Date: 2026-11-05.
Item status is not copied here. See [One home for status](../../../../../../docs/agile-workflow.md#one-home-for-status).

## Scope and evidence

Reviewed acceptance criteria 1–10 against the candidate. The review checkout is `C:/worktrees/agento/review-braid-003-j-001`, branch `review/braid-003-j-001`, HEAD `ed03974840664d8580af2f998c9046d9562a66bd`. The author checkout `C:/worktrees/agento/item-braid-003-j-record-ownership` was read with `git status` and `git rev-parse` only. It is on `item/braid-003-j-record-ownership` at the same commit, clean, and was not written.

Read AGENTS.md, README.md, `docs/decisions.md`, the epic and `checkpoints/current.md` as assignment context, the J backlog and assignment, `reports/J.md`, `checkpoints/J.md`, the review conventions, the review template, and `epics/report-format.md`. The candidate diff is one commit, 22 files, `+253/-87`. `git diff --check` on the range exited 0. Live epic status migration is out of scope and is not treated as a defect.

**Word counts.** Whitespace-separated tokens from `git show` of the dispatch tip and this head. The report's table matches: 12,543 to 13,699, delta 1,156, 9.22 percent. The historical 12,385 figure at `02e3a5c` was not the baseline the assignment told the worker to measure.

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `AGENTS.md` | 1688 | 1689 | 1 |
| `.agents/skills/braid-worker/SKILL.md` | 1665 | 1670 | 5 |
| `.agents/skills/braid-coordinate/SKILL.md` | 1347 | 1360 | 13 |
| `.agents/skills/braid-worker/assets/assignment-packet.md` | 804 | 839 | 35 |
| `.agents/skills/braid-worker/references/t3-continuation.md` | 1683 | 1692 | 9 |
| `.agents/skills/braid-coordinate/references/delivery.md` | 1941 | 2166 | 225 |
| `.agents/skills/braid-coordinate/references/delegation.md` | 719 | 732 | 13 |
| `docs/agile-workflow.md` | 1692 | 2459 | 767 |
| `epics/report-format.md` | 1004 | 1092 | 88 |
| **Total** | **12543** | **13699** | **1156** |

**Status search.** Searched `AGENTS.md`, `README.md`, `epics/README.md`, `.agents/skills/`, the epic, backlog, and review templates, and `docs/` except the dated decision log, for `Current epic`, `Seed execution`, `active session`, `session reports`, `Planning only`, and `Begin with`, plus a `Status:` line at the start of a paragraph. None of those live-status phrases remain. The backlog template has no `Status:` line. The epic template keeps one status line. `docs/forgejo-tailscale.md` line 45 still says to complete seed task I. The opening edited by J classifies that remainder as historical design rationale. It is not a second status home.

**Checks on this checkout.** Node v26.13.0 and npm 11.20.0 from `.tools/node/node-v26.13.0-win-x64` after `npm ci` (200 packages). `scripts/Test-DocsGate.ps1` exited 0: `suppressed=7 exclusions=7 text=235`. Both `python -X utf8 -B` `quick_validate.py` runs exited 0, `Skill is valid!`. Full `npm run verify` was not repeated. The author's local verify remains the dirty pre-commit probe in `reports/J.md` (`worktree-dirty True`, `candidate False`, `text=233`).

**Hosted jobs, from `gh run view` and the Verify logs. Artifacts were not downloaded.** These jobs show a clean gate. They are not proof that the lifecycle below is free of the record-write contradictions.

| Run | Event | Job | Checkout | Result |
| --- | --- | --- | --- | --- |
| [41932405287](https://github.com/exones/braid/actions/runs/41932405287) attempt 1 | push | verify (ubuntu-latest) `126932327373` | `ed03974840664d8580af2f998c9046d9562a66bd` | success; docs gate `text=235`; package proof clean at that SHA |
| 41932405287 | push | verify (windows-latest) `126932327860` | `ed03974840664d8580af2f998c9046d9562a66bd` | success; same docs-gate count; package proof clean at that SHA |
| [41932413772](https://github.com/exones/braid/actions/runs/41932413772) attempt 1 | pull_request | verify (ubuntu-latest) `126932356211` | merge-test `5cc51e37dc457551537718dd2b2c9fe024e08914` | success; `BRAID_PR_HEAD_SHA` is the candidate; package proof clean at the merge-test |
| 41932413772 | pull_request | verify (windows-latest) `126932355613` | `5cc51e37dc457551537718dd2b2c9fe024e08914` | success; same head variable and merge-test proof |

Install dependencies, Verify, and Upload packed tarball succeeded on all four jobs. GitHub records merge-test parents as base `2b823f9fb7918b8db04d8cf985be327cdad28f70` then head `ed03974840664d8580af2f998c9046d9562a66bd`. The pull-request log says `HEAD is now at 5cc51e3 Merge ed039748… into 2b823f9f…`. The current pull-request head is still the candidate.

## Findings

### J-record-ownership-and-timing-review-001/F1: task end and a post-push blocker still rewrite the worker record

- **Severity:** Medium.
- **File:** `AGENTS.md` lines 69–73; `.agents/skills/braid-worker/SKILL.md` lines 14 and 60.
- **What happens:** Commit boundary says the worker's report and checkpoint are committed before the push, and a later record commit happens only when a repair changes the head. At a green head the task is ending. `AGENTS.md` still says that before ending the task the worker updates the owned checkpoint, including checks, and writes the report. Those checks exist only after the push. The worker skill says these skills cannot waive project instructions, and an unresolved conflict goes back to the coordinator before the affected action. The same skill tells a worker who is blocked, with no independent work left, to checkpoint and yield. A CI-access or transport failure is discovered after the push.
- **Effect:** The worker commits the checkpoint onto the green head, leaves it dirty in the item worktree, or stops and reports the conflict. The first two are the outcomes this item removes. The third stalls every green handoff and every post-push blocker until the coordinator resolves the conflict.
- **Expected:** After the push, the committed report and checkpoint stay as they are. Checks, the pull-request identity, and a blocker go in the pull-request comment and the result message. The finish list and the blocker step say that.

### J-record-ownership-and-timing-review-001/F2: the legacy relay still checkpoints after the push

- **Severity:** Medium.
- **File:** `.agents/skills/braid-worker/references/t3-continuation.md` lines 36 and 48.
- **What happens:** The top-level route now puts current-head facts in a pull-request comment. The legacy parent relay, still selectable when a packet says so, does this after the push and the pull request exist: "checkpoints the full head and check set". After a failed check it says to push, link, and then checkpoint and yield for the new head, and that a later evidence commit needs its own proof.
- **Effect:** The checkpoint write after the pull request is another commit, which replaces the head just pushed, or it stays uncommitted. An evidence commit after green is a paperwork commit. Either result is the record-timing failure this item is removing, on a route the skill still documents.
- **Expected:** That route records the head and check set in the result the parent already relays. The checkpoint file changes only inside a repair commit that also changes the implementation. The evidence-commit step is removed.

### J-record-ownership-and-timing-review-001/F3: delivery still attaches review evidence to the item pull request

- **Severity:** Medium.
- **File:** `.agents/skills/braid-coordinate/references/delivery.md` line 7.
- **What happens:** Line 5 says review reports do not belong to the delivery pull request and links the ownership table. The next paragraph says to index passes and findings, then "attach their evidence and fixes to the parent's delivery PR." The table says the reviewer returns the files and the coordinator commits them on the epic. The item pull request receives a summary comment. Fixes already belong on the item pull request.
- **Effect:** After the green head, a coordinator following line 7 commits the review report onto the item branch and moves the reviewed head, or asks the worker to add a file the worker cannot add without a new commit.
- **Expected:** Repair commits stay on the item pull request. The review files are copied into the next epic commit. Line 7 does not send the review record to the item pull request.

## Acceptance assessment

| Criterion | Verdict at `ed039748` |
| --- | --- |
| 1. One writer, branch, write moment, and committer, and other policy files link to that table | Contradicted for review evidence by F3. The four-column table in `docs/agile-workflow.md` lines 41–52 is the only such table. Worker, coordinator, and reviewer instructions otherwise point at it. The coordinator skill's checkpoint paragraph still says to update decisions when they change; the epic template's decisions section is coordinator-owned, and that sentence does not name `docs/decisions.md`. |
| 2. Full lifecycle, including one review-fix round, with no green-head record commit and no record left uncommitted | Contradicted by F1 and F2. `reports/J.md` lines 29–38 walk dispatch, implement, push, green comment, review, a repair commit that includes the report and checkpoint because the head changes, merge, and acceptance. That walkthrough itself does not add a paperwork commit. The instructions in F1 and F2 still do. |
| 3. Acceptance file lists the copied facts, says a link is not the record, and shows an example | Proven. `epics/report-format.md` lines 70–81 list checked head, base, run, attempt, job, conclusion, required steps, merge SHA, review pass, reviewed head, findings, and triage, and say a link to a comment or a run is not the record. The epic template points at that section. |
| 4. Review-report contradiction gone; records-only exemption and item-PR rule stated once and linked | Contradicted by F3. The old sentence that placed review reports on the delivery pull request was replaced at `delivery.md` line 5. The records-only exemption and the item-PR rule for every other path, including `docs/decisions.md`, are in Commit boundary and are linked from the review step. D25 records the same decision in the decision log. |
| 5. `current.md` / `log.md` split, with examples, resume behavior, and one writer including parallel items | Proven. `docs/agile-workflow.md` lines 62–82. `current.md` is rewritten and is the resume file. `log.md` is append-only, one line with thread, task, clientRequestId, pull request, head, and run, and is not read on resume. Both examples are there. The coordinator is the only writer; parallel items add lines. |
| 6. One status home; the named search is clean; backlog template has no status line | Proven. Search result above. Item status is the epic table, now-state is `checkpoints/current.md`, and epic status is the single line on `epic.md`. `epics/README.md` keeps a timeless description. |
| 7. Main sync stated once and referenced from the coordinator boundary step | Proven. `delivery.md` lines 25–29: count `git rev-list --count <epic>..origin/main` after merge and before the next dispatch, merge commit rather than rebase, conflict through a pull request into the epic, another sync before the epic pull request into main, and an open item pull request merges the new epic tip and reruns proof. The coordinator skill's delivery section points at that anchor before the next dispatch. |
| 8. Skill pin documented, packet field present, one dispatch names revision and path | Proven. `delivery.md` line 31. The packet asset's Execution skill field names the revision and source path. The walkthrough names `ac5027c00433daf3fcaf111348fa7f87c270eef2` and `.agents/skills/braid-worker/SKILL.md`. A skill edit applies to a later item only after the coordinator records adoption in `epic.md`. Recording the rule leaves an already dispatched revision unchanged. |
| 9. Named policy files grow by about 10 percent or less, each rule once, counts in the report | Proven. Combined growth is 1,156 words, 9.22 percent, from the dispatch tip. The new rules live in the sections above; the other edits link to them. |
| 10. Local and four-job `npm run verify`, both validators, independent review, human merge | Hosted gate proven, as the table above. Both validators passed on this checkout. The docs gate passed here with the same `text=235` count as the four jobs. Full local `npm run verify` was not re-run; the author's run was a dirty probe, not a clean candidate proof. This pass is the independent review and it has findings. Human merge of PR 20 is open, so J is not Done. |

Human merge into the epic, exact-head review before that merge, `npm run verify`, one implementation worker, and the refusal to treat a label as publish or merge authority all remain. Coordinator record commits on the epic are exempt from independent review, which is the agreed limit and is tied to the coordinator rows. A clean main sync is a merge commit; a conflicting sync is a pull request. Item Done and the epic pull request into main still require a human merge.

## Triage and gate

F1, F2, and F3 are open. GitHub `reviewDecision` is empty. This file is the technical gate record. It is not a GitHub approval and it is not a merge. The coordinator's user briefing follows `epics/report-format.md`.

## Resume

Coordinator triages F1–F3 against this head and keeps I and D stopped. Owned outputs stay uncommitted:

- `epics/braid/003-worker-skill/reports/reviews/J/J-record-ownership-and-timing-review-001.md`
- `epics/braid/003-worker-skill/checkpoints/reviews/J/J-record-ownership-and-timing-review-001.md`

Proposed shared status: J stays in review on PR 20 at `ed03974840664d8580af2f998c9046d9562a66bd` until these findings are triaged. The reviewer stops. No merge is requested.
