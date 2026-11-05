# E: consistent human reports, useful PR records and merge stopping gates

Kind: task. Epic: [BRAID-003](../epic.md).
Owner: one Grok 4.7 Extra High implementation worker, requested specifically for this task. Keep the global provider profile unchanged.
Depends on: approved packet; B/C human merges confirmed on their original feature bases; committed context and explicit main-integration contract below. Priority: before D, retaining all existing IDs.

## Read first

[AGENTS](../../../../AGENTS.md), README, [decisions](../../../../docs/decisions.md), [Agile workflow](../../../../docs/agile-workflow.md), [epic](../epic.md), [current checkpoint](../checkpoints/current.md), [C acceptance](../reports/C-acceptance.md), [C review](../reports/reviews/C/C-assignment-integration-review-001.md), [report format](../../../report-format.md), current worker/coordinator skills, canonical packet and relevant delivery/delegation/T3 references. Use the available skill-creator guidance for skill edits. Read historical analysis only for a specific missing fact; no parent-chat or ignored inspiration prerequisite.

## Value and motivation

The maintainer should understand what each item achieved and why before reading hashes, CI provenance or transport history. One maintained reporting contract prevents the coordinator's exact human briefing from diverging from worker/shared guidance. PRs should support both a human merge decision and later agent continuation. An explicit merge stopping gate prevents locally accepted branches from silently becoming an increasingly long unmerged dependency stack.

## Approved scope

1. Make `epics/report-format.md` the maintained reporting authority. Every item report and delivery briefing starts with one or two plain-language sentences explaining what is now true, then **What changed**, **Why**, **Left for you**, and **Technical record**. Human sections explain practical behavior/value and required human actions; the technical section preserves useful exact evidence. Proportionate length, normally about half a page for a completion briefing, with no filler or compulsory repetition of raw logs.
2. Reference that contract from coordinator/worker skills and relevant handoff/assignment guidance instead of maintaining competing instructions. Apply the explicit report-trigger contract below; do not defer all explanation until merge or epic completion. The coordinator interprets child evidence for the user rather than forwarding an opaque handoff. Reports for a blocked item explain partial work and the blocker honestly, without claiming successful delivery. Routine CI-wait/progress/duplicate-event updates may stay short and do not replace an item briefing.
3. Require PR bodies to have the same human-facing What changed / Why / Left for you account, followed by a distinct **Technical record** suitable for future work: item/context links, exact head/base, relevant checks and run/artifact/source references, review status/findings, limits/blockers and next action. Link detailed evidence instead of dumping transport transcripts. Keep candidate blobs and post-push supplements distinct; no evidence-only head changes to document the head itself.
4. Add a small `.github/PULL_REQUEST_TEMPLATE.md` as the authoring aid, referencing the maintained contract. Align delivery rules and any existing report/packet templates as necessary; avoid a second full reporting handbook. PR content must remain informative when `gh --body-file` bypasses the repository template.
5. Replace the default local-acceptance/stack allowance with a clear coordinator stopping gate: when a dependent item requires a PR to be merged, report the result and exact required human merge, checkpoint, and stop before dispatching that dependent item. Green CI and independent review do not count as merge. Verify actual merge/current dependency facts before resumption. Prepare/revalidate safe base transitions as necessary; no automatic merge, silent stacking, automatic successor dispatch or new approval loop inside an already-authorized item. Workers retain repair/current-head-green responsibility through their own delivery.
6. Reformat the descriptions of existing PRs #9 and #10 into the agreed human-plus-technical form, preserving evidence and accurately reflecting actual review/merge/base state. Description-only edits do not change Git heads or establish new-base CI proof. Coordinator can do this metadata preparation before their human merge; the eventual worker records what was already done rather than repeating it. Do not rewrite historical reports or claim they originally followed the new contract.

## Explicit report triggers and decision content

Produce a coordinator human-facing report after inspecting evidence at each of these boundaries:

| Trigger | What the user needs to understand |
| --- | --- |
| An item finishes its assigned work or reaches a delivery outcome | What was achieved, practical effect/value, actual local/CI/review/merge state and what happens next. Worker GREEN is a delivery result ready for review, not delivery Done or merge. Do not wait for the epic to finish. |
| A blocker or decision requires the user's attention | What changed or was completed so far, what is blocked now, the exact user action/decision, options and recommendation where useful, impact of waiting, and what can still proceed. Report promptly; do not wait for item closure or retry indefinitely. |
| A substantive subagent return | Implementation delivery, completed research, or independent review result is inspected and translated into what was done, what was found, what is happening now and the coordinator's proposed next action. A child evidence packet does not itself discharge the coordinator briefing requirement. Findings the worker can fix stay worker-owned, with user involvement only where needed. |
| A meaningful milestone or human merge gate | Explain the new state, completed outcome, remaining gates, exact merge/decision requested and the next permitted action. Examples: review disposition, ready for human merge, merged item/phase, epic outcome. |

Overlapping triggers from the same event require one report, not multiple reports. A later substantive result uses the same form with the changed facts and concise context rather than repeating the entire history. Routine nonterminal CI waiting/readiness acknowledgements, duplicate same-head notifications, unchanged pending status or child transport/task housekeeping are short progress updates unless they create a user-owned blocker or meaningful milestone. An item ending blocked still gets its outcome account even if no successful delivery occurred.

The opening must identify the present state and what is happening next. **What changed** is relative to the previous substantive report, including useful partial work. **Why** explains the practical reason/impact. **Left for you** explicitly says whether anything needs user attention; if blocked it names the current blocker and exact action/decision, otherwise says no user action is needed and identifies the next owner/action. Put revision/check/review/base/transport detail in **Technical record**, retaining enough references to resume. Never make a user infer current blockers or merge readiness from hashes or a delegated-task status label. Scale the account to the amount of new information; keep meaningful human explanation without boilerplate.

## Approved sequencing and actual merge context

User approval is now recorded; do not ask again for routine authorized E work. Preserve the current accepted C head/review; this is a separate follow-up task, not a retroactive C defect or a review-only backlog item.

GitHub confirms #9 merged at `71071ef4bbf380213a5f5cd1b74eb458016b14e3` (2026-11-04T12:21:39Z) into `t3/85fcb290`, and #10 at `4e7e976a4030f23d63b846f156a307a7b70fc870` (12:22:05Z) into `t3/fa4ebcc5`. These are real human merges, but main remains `a2120bfa084a32212a780a0fdc095c38d8869ef5` and does not contain B/C. Main and merged C diverge from A `c86bc39`; current main contains unrelated accepted history that must be preserved.

Prepare E from the committed coordinator context and reconcile the three exact main/B-merge/C-merge inputs into the worker's one generated branch before E implementation. These pinned local integration merges are explicitly authorized Git preparation, not permission to merge a PR remotely. Preserve current main product/CI/epic002 bytes and accepted B/C behavior; resolve policy/report-context overlap only within assigned ownership, retaining final supplements. Unexpected product/CI conflicts require a scoped blocker, not an invented resolution. No branch inventory, guessed worktree, history rewrite, force-push or silent provider change.

E's single PR targets `main`, carrying the accepted B/C changes, preserved coordinator evidence and E's new policy/template changes. Explain the grouping and separate prior B/C review from new integrated-head proof. This reconciles already-merged feature branches without another stacked dependent PR or claims that B/C were merged to main. Run new complete local/hosted gates and independent review on the resulting integration head. Obtain E's human merge before starting D; no automatic merge or successor.

Coordinator has already reformatted #9/#10 descriptions and linked them immediately after each edit. Both source heads are unchanged. The worker verifies/records those edits without repeating them; source/report evidence and old-base checks remain distinct from E integration proof. See [E assignment](../reports/E-assignment.md).

Out of scope: product/tests/CI/package/release changes, new orchestration automation or report linter, generic workflow redesign, changed provider defaults, modifying completed evidence/IDs, D evaluation, merge/publish/deploy authority. Preserve unrelated seed/epic002 changes and any existing index ownership.

## Acceptance criteria

1. Every item report/worker delivery/coordinator acceptance has an unambiguous human-first structure and the explicit trigger contract above from one maintained authority. Item outcomes, user-attention blockers, substantive child returns and milestones each produce an inspected coordinator account of what changed, current state/blocker, exact user action if any and next owner/action. Overlapping triggers are combined; routine progress remains concise and cannot substitute for the item briefing.
2. New PR template and delivery instructions produce the same human account plus useful technical continuation evidence. Both existing #9/#10 descriptions follow the agreed form without losing evidence or misrepresenting their checked revisions/base/review/merge state.
3. A green, independently reviewed but unmerged prerequisite blocks dispatch of its dependent item. Coordinator checkpoints the exact human action and stops; actual merge evidence is required to resume. Pending/failed checks remain worker-owned and cannot become a successful handoff or merge-ready claim.
4. Policy and bounded scenario walkthroughs cover implementation GREEN while review is pending; no-findings and findings review returns; user-owned blocker mid-item with useful partial work; ordinary CI waiting/duplicate notifications; overlapping milestone triggers; green-but-unmerged stopping gate; actual merge/resumption; changed head/base needing revalidation; and human/technical PR readers. They show the expected report or concise progress decision, state/action clarity and no false Done claim. These are authored consistency checks, not D's fresh-agent behavioral proof or a claim of automatic enforcement.
5. Skill validators, relevant links/anchors, scoped whitespace/diff and applicable repository local/hosted gates pass. Provider settings, role ownership, green-only delivery, historical evidence and unrelated changes remain intact. No new product tests merely mirror prose.

## Tasks and ownership

- [x] User approved E; actual #9/#10 feature-base merges inspected; descriptions reformatted with source heads unchanged.
- [ ] Commit complete canonical context/packet and dispatch exactly one requested Grok worker with pinned integration inputs.
- [ ] Worker consolidates reporting/merge rules and template, validates bounded scenarios, delivers through current-head green and stops.

Worker may edit `epics/report-format.md`, coordinator/worker skills, relevant coordinator delivery/delegation references, necessary handoff/assignment/report templates, `.github/PULL_REQUEST_TEMPLATE.md`, and necessary consistency regions in AGENTS/Agile/decisions. Own E report/checkpoint and item delivery fields. Coordinator owns epic/current/shared gates and existing PR metadata preparation; no concurrent writers. During integration only, retain the newer committed coordinator epic/current/status/supplement content if older incoming context conflicts; report proposed status changes instead of becoming the coordinator. Preserve reviewed worker implementation from C. Keep changes minimal, cite the authority rather than duplicate it.

## Provider and delivery contract

Requested task-specific route, capability-verified on 2026-11-04: T3 provider `cursor`, model `grok-4.7`, `target.options` = `{"reasoning_effort":"xhigh","contextWindow":"500k"}`. Do not silently substitute Sol/High or change the global AGENTS profile. At dispatch follow host capability refresh rules. Use one tool-managed isolated checkout from committed input, retain its generated owned branch and record actual returned root/branch/head. Coordinator passes actual full context SHA after commit; expected origin `https://github.com/exones/braid.git`, initial clean tree/index, main PR base, no existing E PR. Integration inputs above are now actual fetched Git objects. Details in [assignment](../reports/E-assignment.md).

Scoped Conventional Commit/owned push/new PR after local gates; parent-only finite CI relay; same worker owns real failure repair and complete current-head green proof. Frozen hosted set remains CI push and pull_request, Windows/Ubuntu Verify and Upload steps, required artifacts/source mapping and final head confirmation. No canary or additional A trial. New independent pass `E-reporting-and-merge-gates-review-001` follows candidate/green handoff under [review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing), then coordinator triage and human merge. No automatic successor D.

## Report and resume

Worker wrote `reports/E.md` and `checkpoints/E.md` and stopped after current-head green proof. Independent pass001 accepted; final author/reviewer supplements remain distinct from candidate blobs. Human main merge now verified and E delivered. Current next action: refine [execution policy](../execution-policy-proposal.md) with the user before any new assignment. No active worker/watch or D, release or automatic merge.
