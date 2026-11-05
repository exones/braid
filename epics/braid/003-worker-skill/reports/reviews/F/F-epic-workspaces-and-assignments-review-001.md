# F-epic-workspaces-and-assignments-review-001: epic workspaces and assignments

The epic-branch, workspace, and assignment rules are in the maintained authorities, and the three G limits stay unproven. Three findings remain: the hosted digest check and the artifact download disagree, the pre-watch catch-up has no step, and the F checkpoint says the startup SHA matched a packet that names a different SHA. This review is not a merge.

Parent: BRAID-003/F (`backlog/F-epic-workspaces-and-assignments.md`). Pass: 001.
Reviewer: independent review role, in T3 Code through the Cursor harness, model Grok 4.7 (`grok-4.7`). Not the implementation author.
Agent/assignment name: F-epic-workspaces-and-assignments-review-001.
Report/checkpoint: `epics/braid/003-worker-skill/reports/reviews/F/F-epic-workspaces-and-assignments-review-001.md`, `epics/braid/003-worker-skill/checkpoints/reviews/F/F-epic-workspaces-and-assignments-review-001.md`.
Candidate: `54028a4cc8f6cbdca1a25b9c339eeb0622fe39ac`. Sole parent and PR base: `3b9e92b4c8686fef50ba177bfa9821dd8d9182cf`.
PR: https://github.com/exones/braid/pull/16, OPEN, `reviewDecision` empty, mergeable. Head reconfirmed after the check read.
Status: findings. Date: 2026-11-04.

## Scope and evidence

Reviewed acceptance criteria 1–5 and assignment `assignments/F.md` against Git objects `git diff 3b9e92b4 54028a4`. The item worktree was not read or modified. This checkout stayed at `3b9e92b4` on `t3/50b57a8a`. `git fetch origin item/braid-003-f-epic-workspaces` set `FETCH_HEAD` to the candidate.

**Diff.** One commit, 18 files, 175 insertions, 41 deletions. Skills, delivery/delegation, AGENTS, Agile, decisions, handoff, directory map, epic index, report format, and new `reports/F.md` plus `checkpoints/F.md`. No product, package, workflow, or schema path. `git diff --check` exited 0.

**Preserved.** Under `reports/`, `checkpoints/`, and `validation/`, the only names in the diff are the two new F files. `execution-policy-proposal.md` and `validation/G/operator-reference.md` are unchanged. Historical `reports/*-assignment.md` paths were not edited.

**Provider, stop, and review index.** The AGENTS provider paragraph is still the only profile: Sol High for coordination; Grok 4.7 High with 500K context for implementation and independent reviews; Cursor `grok-4.7` with `reasoning_effort` high and `contextWindow` `500k`. The diff inserts the epic paragraph before that section and does not restate a second model. The human merge stop remains the one section in `delivery.md`, now naming the item merge into the epic and the later epic-to-main merge. Review naming, numbering, and pass paths stay in `docs/agile-workflow.md`. The new `assignments/reviews/` path is the same sentence in Agile, the review template, the packet asset, and the directory map.

**Hosted jobs, from `gh run view`, no artifact download.** Both runs are workflow CI, conclusion success, `headSha` `54028a4cc8f6cbdca1a25b9c339eeb0622fe39ac`. Install dependencies, Verify, and Upload packed tarball succeeded on all four jobs. Digests were not compared.

| Run | Event | Job | Result |
| --- | --- | --- | --- |
| [41917069166](https://github.com/exones/braid/actions/runs/41917069166) | push | verify (windows-latest) `126879434383` | success |
| 41917069166 | push | verify (ubuntu-latest) `126879434947` | success |
| [41917100486](https://github.com/exones/braid/actions/runs/41917100486) | pull_request | verify (ubuntu-latest) `126879543969` | success |
| 41917100486 | pull_request | verify (windows-latest) `126879544385` | success |

## Findings

### F-epic-workspaces-and-assignments-review-001/F1: digest match and artifact download disagree

- **Severity:** Medium.
- **File:** `.agents/skills/braid-worker/references/t3-continuation.md` line 24; `.agents/skills/braid-worker/SKILL.md` line 48.
- **What happens:** Line 24 requires each archive digest to be matched to its provenance record, then says to re-download artifacts only when a job looks wrong. The provenance record and the contained tarball hash are inside the uploaded archive. A successful Install dependencies, Verify, and Upload conclusion does not show that match. The worker skill still requires artifact and provenance evidence on every current-head reconciliation.
- **Effect:** A docs-only worker can treat a green job as the G digest recipe. The same paragraph both requires the comparison and waives the read that produces it.
- **Expected:** One rule. If the frozen set includes the digest and contained-tarball comparison, the first read of each archive is part of verification on every head, including a docs-only change. Do not download that same archive again after the comparison has succeeded. If a packet omits archive bytes, do not also say the digest was matched.

### F-epic-workspaces-and-assignments-review-001/F2: the pre-watch catch-up has no step

- **Severity:** Low.
- **File:** `.agents/skills/braid-worker/references/t3-continuation.md` lines 15 and 22; `.agents/skills/braid-coordinate/SKILL.md` line 34; `epics/braid/003-worker-skill/execution-policy-proposal.md` line 46.
- **What happens:** The numbered route and the short prompt are link, watch, and end the turn. No step queues a readiness read. Line 22 then says one self-queued catch-up is how to read checks that finished before the watch, and not to queue a second snapshot while the first is pending. The approved policy says completed-before-registration checks need one finite self-reconciliation. G lists that snapshot as observed and available, and the adopted wake path still ends the turn right after watching.
- **Effect:** A worker who follows the numbered steps never creates the snapshot the next paragraph regulates. A turn that ends cleanly after watch is not the interruption snapshot in line 18, so nobody is assigned the window G already hit.
- **Expected:** Either queue one labeled snapshot before `watch_pull_request` and still end the turn after the watch, or say the short-prompt route does not read checks that already finished and remove the second-queue rule from that route. Name the actor who closes the window.

### F-epic-workspaces-and-assignments-review-001/F3: the checkpoint says the startup SHA matched the packet

- **Severity:** Low.
- **File:** `epics/braid/003-worker-skill/checkpoints/F.md` line 7. Compared with `epics/braid/003-worker-skill/assignments/F.md` lines 7 and 8 at parent `3b9e92b4`, which this commit does not change.
- **What happens:** The checkpoint says startup HEAD `3b9e92b4c8686fef50ba177bfa9821dd8d9182cf` matched the packet. The packet text names accepted epic tip and start SHA `0bb0ca0b37079fa047596288ea7e44fc8c880b0d`. `3b9e92b4` is the commit that added that packet. `reports/F.md` records the checkout HEAD and does not call it a packet match.
- **Effect:** A resume that compares the checkpoint with the packet sees two authorized start SHAs. The new rule stops writes when the head differs from the packet, so this sentence says the binding check passed when the written SHAs differ.
- **Expected:** Record both facts: the packet text names `0bb0ca0b`, and the checkout HEAD was `3b9e92b4`, the commit that contains the packet. Do not say those SHAs matched.

No finding is raised against the three G limits. Watch survival, unassisted repair, and exactly-once stay unproven at `t3-continuation.md` line 26, AGENTS, D23, and the coordinator short-prompt bullet. Repair stays a worker duty at worker `SKILL.md` line 46 without a claim that the trial showed unassisted repair. Short step-explicit prompts and dedupe-by-head are stated in both skills, the continuation reference, AGENTS, handoff, decisions, and report format. The parent relay is the explicit delegated-child route, not a silent fallback.

## Acceptance assessment

Line references are candidate blobs, except the unchanged packet and execution policy.

| Criterion | Verdict at `54028a4` |
| --- | --- |
| 1. Epic branch, item branch from the epic tip, PR into the epic, one final main PR | Proven. AGENTS, D23, Agile Done, the epic section of `delivery.md`, the human merge stop, the epic template, and the backlog template say this. Item Done is the human merge into the epic. Epic completion and release stay separate. History already on main is left in place. No predecessor-item base. |
| 2. Workspace roles, binding checks, one writer, stopped-clean retirement | Proven as policy. Missing, detached, and wrong-branch checkouts stop writes. No shell worktree, path guess, user cleanup, or force-delete. Existing workspaces are not retired by adopting the policy. |
| 3. `assignments/` packet, fields, launch SHA, accurate records | Partial. The blank asset, `assignments/<ID>.md`, review packets, required fields, a new committed revision for a running change, and historical `reports/<ID>-assignment.md` files are stated, and those historical bytes were not rewritten. F3 is the inaccurate startup sentence. |
| 4. G transport contract, worker-owned pending/red, human merge, no crash promise | Partial. The three unproven limits are stated and not claimed. Pending and failed checks stay with the worker. The human merge stop and release stay separate. F1 overstates the digest check. F2 leaves the catch-up without a step. |
| 5. Validators, links, diff, scenarios, current-head CI | Partial. Both validators, 132 changed-file links, and `git diff --check` passed. Push and pull_request job and step success at this head passed. Archive digests were not compared. The authored scenario list is not D's fresh-agent proof. F1 and F2 are the scenario gaps. |

### Bounded scenario walkthrough

| Situation | Result in the candidate |
| --- | --- |
| New epic before the first plan commit | Pinned named branch from verified main. Do not start on main. |
| Next item after one item merged | Branch from the accepted epic tip. PR targets the epic, not main and not the predecessor branch. |
| Epic finishes | One epic pull request into main. Earlier item checks do not replace that proof. Release stays separate. |
| Dirty user root | Not cleaned, switched, or repurposed. |
| Detached or wrong branch | Affected writes stop. No shell worktree and no user cleanup. |
| Resume and CI wait | Same item checkout and thread. Keep a completed commit. Waiting keeps the worker. |
| Retirement | Only a stopped, clean, owned workspace after review, epic merge, and kept evidence. No force-delete. Adopting the policy retires nothing that already exists. |
| New packet | `assignments/<ID>.md`, committed before the checkout, context SHA at launch, returned binding recorded separately, later change is a new commit. |
| Historical packet | Path and bytes kept. Live packet is not copied into `reports/`. |
| Own watch | Short prompt, end the turn after watch, one result, coordinator dedupes by head. F2 is the missing catch-up step. |
| Interrupted run | Explicit coordinator snapshot. A watch wake is not that recovery. Survival is unproven. |
| Red check | Worker owns it. Unassisted repair is not claimed as demonstrated. |
| Dependent item | Human merge stop before dispatch. Green CI and review are not the merge. |

## Checks and limits

| Check | Result |
| --- | --- |
| Whitespace | `git diff --check 3b9e92b4c8686fef50ba177bfa9821dd8d9182cf 54028a4cc8f6cbdca1a25b9c339eeb0622fe39ac` exited 0. |
| Skill validators | Candidate skill trees extracted from Git to `%TEMP%\f-review-54028a4`. `python -X utf8 -B` `C:/Users/exon/.codex/skills/.system/skill-creator/scripts/quick_validate.py` on `braid-coordinate` and `braid-worker`. Both exited 0, `Skill is valid!`. No validator script exists under `.agents/skills/*/scripts`. |
| Links | 18 changed Markdown files, 132 inline links, 0 unresolved repository paths or heading anchors. Web URLs were not fetched. |
| CI | `gh run view 41917069166` and `41917100486`. Success at this head, as listed above. Artifacts were not downloaded. Logs and provenance bytes were not read. |
| PR | `gh pr view 16`. OPEN, head and base unchanged, no review decision. |

This review did not rerun product tests. It did not claim restart durability, exactly-once delivery, unassisted repair, or that a watch survives interruption. Job success is not a digest match. The item worktree and its index were not used.

## Triage and gate

F1, F2, and F3 are open at `54028a4cc8f6cbdca1a25b9c339eeb0622fe39ac`. This file is not a GitHub approval, not coordinator acceptance, not Done, and not a merge. D stays stopped until the human merge into the epic is verified.

## Resume

Coordinator reads these two uncommitted files and triages F1–F3 against this exact head. A repair stays on the item branch and needs a new current-head proof. No reviewer push, link, watch, merge, or successor was started.
