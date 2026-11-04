# Agile work organization for braid

## Work hierarchy

- **Epic:** a measurable outcome large enough to need several backlog items. `epic.md` records the problem, scope, success measures, dependencies, decisions, and release evidence.
- **Feature:** optional grouping of related capability inside an epic. Use a heading/field, not another tracking system. Skip it for a small epic.
- **Story:** a small usable outcome, with a beneficiary, value, and testable acceptance criteria. Prefer vertical slices that can be reviewed independently.
- **Task:** an implementation or verification step supporting a story/epic. Keep ordinary steps as a checklist in their parent item; separate only when ownership or dependencies warrant it.
- **Spike:** bounded research with a question, effort/time limit, expected evidence, and a decision or follow-up. It must not become open-ended implementation.

The release roadmap groups capability milestones; an epic is not automatically a fixed-duration sprint. Start with a prioritized flow of work. The worker limit is in [Flow and ownership](#flow-and-ownership). Use a sprint goal or timebox only when scheduling provides value. Do not invent story points, velocity targets, daily ceremonies, or extra roles merely to use Agile names.

## Files

```text
epics/<project>/<NNN>-<slug>/
  epic.md
  backlog/<ID>-<slug>.md
  assignments/<ID>.md
  assignments/reviews/<parent>/<review-name>.md
  checkpoints/current.md
  checkpoints/log.md
  checkpoints/<ID>.md
  reports/<ID>.md
  reports/reviews/<parent>/<review-name>.md
  checkpoints/reviews/<parent>/<review-name>.md
  reports/<ID>-coordinator-triage.md
  reports/<ID>-acceptance.md
  reports/final.md
  retro.md
```

Who writes each file, on which branch, when, and who commits it is [Record ownership](#record-ownership). Historical `reports/<ID>-assignment.md` files stay where they are. New packets use `assignments/`. Do not copy a live packet into both places.

Choose `<ID>` in [Backlog item IDs](#backlog-item-ids). A file under `backlog/` is not necessarily a user story. Tasks within these items are checklists, not separate PR requirements.

## Record ownership

This table is the only statement of writer, branch, write moment, and committer. Other policy files link here.

| File | Writer | Branch | When | Committed by |
| --- | --- | --- | --- | --- |
| `epic.md`, `checkpoints/current.md`, `checkpoints/log.md`, `backlog/*.md` | coordinator | epic | planning, dispatch, triage, acceptance, close; log lines as events happen | coordinator, pushed at each step |
| `assignments/<ID>.md`, `assignments/reviews/<ID>/*` | coordinator | epic | before the item or reviewer launches; a change is a new commit | coordinator |
| product code, project docs, skills, `docs/decisions.md`, `docs/roadmap.md` | worker | item | implementation | worker, via item PR |
| `reports/<ID>.md`, `checkpoints/<ID>.md`, `validation/<ID>/` | worker | item | before each push | worker, via item PR |
| current-head CI proof and result | worker | none: PR comment and result message | after green | not a file |
| `reports/reviews/<ID>/*`, `checkpoints/reviews/<ID>/*` | reviewer | none: returned files plus a PR summary comment | after the green head | coordinator copies into its next epic commit |
| `reports/<ID>-coordinator-triage.md` | coordinator | epic | after review returns | coordinator |
| `reports/<ID>-acceptance.md` | coordinator | epic | after human merge; copied facts in the [acceptance record](../epics/report-format.md#acceptance-record), not only links | coordinator, one acceptance commit |
| `reports/final.md`, `retro.md` | coordinator | epic | epic close, before the main PR | coordinator |
| maintenance or audit records | that session | its own branch and worktree | never inside a live checkout | that session, via its own PR |

## Commit boundary

The item pull request contains the implementation plus `reports/<ID>.md` and `checkpoints/<ID>.md` as they stand at candidate time. After that push, the worker commits no further record file unless a repair changes the head anyway. Hosted proof and the result stay in a pull-request comment and the result message. The coordinator writes what is learned after the push on the epic branch and pushes those records at each boundary. No step leaves a record uncommitted, and no step commits paperwork onto a green head.

Coordinator commits on the epic branch are records-only: the coordinator rows above. Those commits are exempt from independent review. Every other path, including project docs, skills, `docs/decisions.md`, and `docs/roadmap.md`, is an item pull request and is reviewed with that item. A decision is recorded in `epic.md` and carried into `docs/decisions.md` by an item.

A reviewer does not commit. The coordinator copies the returned review files into its next epic commit. A pull request closed without merge gets a coordinator triage note on the epic that says why. The coordinator runs `npm run verify` before pushing its records.

## Now and the log

`checkpoints/current.md` is rewritten at each step. It is about 15 lines: task, actual revisions, live handles, blockers, and one next action. Resuming agents read only this file. Parallel items add one line each. They do not add writers. Workers write only their own `checkpoints/<ID>.md` on the item branch.

`checkpoints/log.md` is append-only. One timestamped line per event (launch, CI result, relay, intervention, decision, merge) carries the identities that trace it: thread, task, clientRequestId, pull request, head, and run. Append without reading the file. Never rewrite or reorder entries. Resuming agents and packets do not load it. When an epic has more than one coordinating writer, each writer gets a separate log file.

Git history keeps earlier `current.md` text. Do not add `checkpoints/history/` snapshots; existing history files stay. The coordinator is the only writer of both files.

```text
# checkpoints/current.md
Task: <ID> <phase>
Revisions: epic <sha>; item <branch> <sha>; PR <url>
Live: <thread or none>
Blockers: <none, or owner and action>
Next: <one action>
```

```text
# checkpoints/log.md
2026-11-04T22:54:58Z merge PR 19 head 4648f7b merge c6d9e2f thread <id> task <id> clientRequestId <id> run <id>
```

## One home for status

Each fact has one home. Every other place links to it or says nothing.

- Item status uses the labels in [Flow and ownership](#flow-and-ownership), plus a short evidence link, and that value lives only in the `epic.md` backlog table. Backlog files carry scope, acceptance, and dependencies.
- What is happening now lives only in `checkpoints/current.md`.
- Epic-level status is the single status line at the top of `epic.md`.
- `epics/README.md` gives each epic one timeless description.
- `AGENTS.md`, `README.md`, skills, templates, and `docs/` state policy, mechanics, the provider preference, and the verified route. Live epic identity, session observations, and which item is underway stay in the homes above. Lasting observations go in the decision log.
- The decision log is dated history.

Until a released controller is adopted, the epic backlog table is the status home. After adoption, machine state owns execution status and the epic references it.

## Backlog item IDs

This section is the authoritative source for backlog item IDs. Planning instructions and templates link here. Epic directories stay `epics/<project>/<NNN>-<slug>/`, and epic IDs such as `BRAID-001` stay as they are. Review names, numbering, and evidence paths stay in [Review gates and indexing](#review-gates-and-indexing). Creating a review does not take a backlog ID.

### Initial sequence

Stories, tasks, and spikes in a newly planned epic share one sequence. When that epic's backlog is first recorded, assign IDs in the prioritized table's order, starting at `A` and continuing `B`, `C`, `D`, through `Z`. The next ID after `Z` is `AA`, then `AB`, in spreadsheet-column order (`AZ`, then `BA`, through `ZZ`, then `AAA`). A new ID is uppercase letters with no digits. The fourth item is `D` whether it is a story, a task, or a spike.

The backlog filename is `backlog/<ID>-<descriptive-slug>.md`. The ID is the filename token before the first hyphen, and the slug is lowercase words separated by hyphens. The epic table, dependency references, `checkpoints/<ID>.md`, and `reports/<ID>.md` use that same ID.

Four items planned in the order "Publish facts", "OIDC guard", "Install scripts", and "npm account" are `A-publish-facts.md`, `B-oidc-guard.md`, `C-install-scripts.md`, and `D-npm-account.md`. Title-derived filenames such as `F-publish-facts.md`, `O-oidc-guard.md`, `S-install-scripts.md`, and `U-npm-account.md` do not follow this rule.

Optional feature labels group related work inside the epic. They are not backlog IDs and do not consume letters from this sequence.

### Existing work, later additions, and reordering

After the backlog is recorded, keep every assigned ID, filename, and valid link. Reordering priority or dependencies leaves filenames and references unchanged. A cancelled item keeps its ID. A later item receives the earliest sequence ID that no file in that epic's `backlog/` directory already uses. Existing filenames stay in place, including IDs chosen outside this sequence.

BRAID-001 keeps `A` (spike), `B` (enabler task), `C` and `D` (stories), `N` (storage naming task), `D1` (this follow-up story), and `I` (cancelled infrastructure spike). `D1` stays this item's ID. The token before the hyphen in `backlog/D1-sequential-backlog-ids.md` is `D1`. Later additions in this epic continue with the letter sequence above, and a new epic starts at `A`. Legacy `R` remains the review alias in the review section. `backlog/R-review.md` already occupies `R`.

## Review gates and indexing

This section is the authoritative source for review naming, numbering, evidence paths, and compatibility. Other instructions and templates link here rather than restating the convention.

Routine implementation reviews belong to the item being reviewed. Name the review agent and assignment `<item-stem>-review-<NNN>`, using the backlog filename without `.md`: `A-preflight-review-001`, then `A-preflight-review-002` for a new independent recheck. For `backlog/D-package.md`, use `D-package-review-001`. A milestone review spanning several items uses the epic ID, for example `BRAID-001-review-001`. Use that same name in the delegation title and report heading. Reviewers are roles; their assignment does not create another story/task letter or a separate delivery PR. Item letters are assigned in [Backlog item IDs](#backlog-item-ids).

Store new passes at `reports/reviews/<parent>/<review-name>.md` and their optional resumable reviewer checkpoints at `checkpoints/reviews/<parent>/<review-name>.md`, for example `reports/reviews/A/A-preflight-review-001.md`. A review assignment packet, when written, lives at `assignments/reviews/<parent>/<review-name>.md`. The pass itself stays under `reports/reviews/`. Record parent, pass, reviewer, exact checked SHA, PR/artifact identity, scope/acceptance, findings, checks, and limits. Findings can be referenced as `A-preflight-review-001/F1`; keep those labels stable through triage. The parent epic/item links the gate and its result. Preserve prior passes rather than overwriting evidence for another revision.

Record fixes/refutations/deferrals against the parent and exact revision. Start numbering at `001` and increment for each new independent review/recheck of that parent, including earlier legacy passes; do not reset it for a new revision or review scope. Thus an epic with legacy passes 01 and 02 next uses `BRAID-001-review-003`. A coordinator's evidence update is not automatically another independent review. Reviews remain required for Done; naming does not change acceptance, model selection, or human merge authority.

Preserve existing IDs, filenames, links, and finding labels as historical evidence. Earlier `<parent>/review-<NN>` IDs and `reports/reviews/<parent>/<NN>.md` paths remain valid; legacy R still maps to `BRAID-001/review-01`. Existing unnumbered review reports also remain in place; inspect the parent's review history before choosing the next unused number. A running assignment keeps its assigned name/output paths until it returns. Do not rename or restart it merely to apply this convention.

## Analysis and refinement

For a goal, inspect existing epic/backlog/checkpoints before creating new work. Record the problem and beneficiary, outcomes, relevant repository/build facts, constraints, unknowns, and risks. Ask only questions that materially change scope or acceptance; record reasonable defaults and continue independent analysis.

Split into the smallest useful stories and necessary spikes/tasks. Explain dependency order and file/resource ownership. Each item has a kind, outcome, scope/non-goals, acceptance criteria, implementation checklist, dependency/ownership fields, required evidence, and a resume/report path. Stories describe user value; technical enablers can describe developer/operator value without forced user-story prose.

Write `epic.md` and item files before dispatch. Assign item IDs from [Backlog item IDs](#backlog-item-ids). Use the coordinator skill's templates for new work; refine existing files instead of duplicating the backlog. A planning-only request ends with a reviewable plan. An execution request can continue within its authorized scope once the next item is ready.

## Definition of Ready

A backlog item is Ready when its outcome and boundaries are clear, dependencies are met, ownership is assigned, required inputs exist, acceptance criteria are testable, and the verification/evidence method is known. A spike is Ready when its question, limit, and required decision are clear. Unrelated external setup does not block local work.

For implementation dispatch, fill the worker's [canonical assignment packet](../.agents/skills/braid-worker/assets/assignment-packet.md), including the execution-skill revision and source path ([Epic branch sync and skill pinning](../.agents/skills/braid-coordinate/references/delivery.md#epic-branch-sync-and-skill-pinning)), and commit it at `assignments/<ID>.md`: committed context, exact dependency and merge facts, checkout and Git ownership, the declared check set, continuation, and outputs. Supply the resulting full context SHA at launch. Record the returned binding separately. Assigned execution/resumption uses [braid-worker](../.agents/skills/braid-worker/SKILL.md); goal-level planning and independent review retain separate entrypoints.

## Definition of Done

For a delivery item: acceptance criteria satisfied, relevant local checks passed, scoped commit and pull request exist, required hosted CI passes on its head, review findings are triaged, and the human-approved merge into the declared epic branch is recorded. That item Done is not epic completion and it is not a release. Epic completion is the final gates plus the human merge of one epic-branch pull request into main. Registry publication stays a separate action. See [Epic and item branches](../.agents/skills/braid-coordinate/references/delivery.md#epic-and-item-branches). The report includes exact evidence and limitations; checkpoint/documentation reflect the outcome. Local acceptance alone stays In Review until the delivery gates are met. Hosted CI and independent review do not count as a human merge. When the next item requires that merge, apply the [human merge stop](../.agents/skills/braid-coordinate/references/delivery.md#human-merge-stop): report the exact action, checkpoint, and do not dispatch the dependent item until the merge is verified. Item reports and user briefings use [report format](../epics/report-format.md).

For a spike: the question is answered with evidence or a concrete blocker, the next decision/action is recorded, and the research/report passes through PR, applicable CI, review, and approved merge. A useful spike need not produce code or artificial product tests.

Done for a story is distinct from a released epic. Missing remote CI/publication evidence remains visible on the epic's release checklist. Manually recording completion in the seed CLI does not create independent gate proof. Do not weaken acceptance criteria after failure; document and justify any genuine correction.

## Flow and ownership

Backlog -> Ready -> In Progress -> In Review -> Done. Use `blocked` with a specific blocker, owner, and next action when work cannot continue; preserve the prior state for resumption. `cancelled` needs a recorded reason. Persisted labels are lowercase: `backlog`, `ready`, `in-progress`, `in-review`, `done`, `blocked`, `cancelled`. Where a current value is written is [One home for status](#one-home-for-status). Who writes each record is [Record ownership](#record-ownership).

Provider and model settings follow the [provider profile](../AGENTS.md#providers-and-roles). Keep one implementation worker at a time. The default checkout split is one epic worktree and one active item worktree, with one writer in a checkout. See [Workspaces](../.agents/skills/braid-coordinate/references/delivery.md#workspaces). Raise that limit only when the recorded boundaries support it.

Every stage ends with an evidence review and a short retrospective. Turn observed problems into a small fix, a regression check, or a backlog item; preserve the user's original outcome. No skill or status label grants permission to publish, merge, deploy, or change private infrastructure.

The [delivery rules](../.agents/skills/braid-coordinate/references/delivery.md) define commits, pull requests, current-head green handoff, review, and the human merge. A waiting or blocked worker update is nonterminal. README describes usable project state. Live work stays in the epic, `checkpoints/current.md`, and reports.
