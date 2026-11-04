# Agile work organization for braid

## Work hierarchy

- **Epic:** a measurable outcome large enough to need several backlog items. `epic.md` records the problem, scope, success measures, dependencies, decisions, and release evidence.
- **Feature:** optional grouping of related capability inside an epic. Use a heading/field, not another tracking system. Skip it for a small epic.
- **Story:** a small usable outcome, with a beneficiary, value, and testable acceptance criteria. Prefer vertical slices that can be reviewed independently.
- **Task:** an implementation or verification step supporting a story/epic. Keep ordinary steps as a checklist in their parent item; separate only when ownership or dependencies warrant it.
- **Spike:** bounded research with a question, effort/time limit, expected evidence, and a decision or follow-up. It must not become open-ended implementation.

The release roadmap groups capability milestones; an epic is not automatically a fixed-duration sprint. Start with a prioritized flow of work and WIP limit one. Use a sprint goal/timebox only when scheduling provides value. Do not invent story points, velocity targets, daily ceremonies, or extra roles merely to use Agile names.

## Files

```text
epics/<project>/<NNN>-<slug>/
  epic.md                  # epic outcome and prioritized backlog index
  backlog/<ID>-<slug>.md   # story, enabler/task, or spike; includes kind/acceptance
  checkpoints/current.md  # coordinator-owned handoff
  checkpoints/<ID>.md     # worker-owned handoff
  reports/<ID>.md         # evidence and proposed status update
  reports/reviews/<parent>/<review-name>.md      # exact-revision review pass
  checkpoints/reviews/<parent>/<review-name>.md # reviewer-owned resume point
  reports/final.md        # epic outcome and release evidence
  retro.md                # observed lessons and follow-up backlog items
```

Choose `<ID>` in [Backlog item IDs](#backlog-item-ids). A file under `backlog/` is not necessarily a user story. Tasks within these items are checklists, not separate PR requirements.

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

Store new passes at `reports/reviews/<parent>/<review-name>.md` and their optional resumable reviewer checkpoints at `checkpoints/reviews/<parent>/<review-name>.md`, for example `reports/reviews/A/A-preflight-review-001.md`. Record parent, pass, reviewer, exact checked SHA, PR/artifact identity, scope/acceptance, findings, checks, and limits. Findings can be referenced as `A-preflight-review-001/F1`; keep those labels stable through triage. The parent epic/item links the gate and its result. Preserve prior passes rather than overwriting evidence for another revision.

Record fixes/refutations/deferrals against the parent and exact revision. Start numbering at `001` and increment for each new independent review/recheck of that parent, including earlier legacy passes; do not reset it for a new revision or review scope. Thus an epic with legacy passes 01 and 02 next uses `BRAID-001-review-003`. A coordinator's evidence update is not automatically another independent review. Reviews remain required for Done; naming does not change acceptance, model selection, or human merge authority.

Preserve existing IDs, filenames, links, and finding labels as historical evidence. Earlier `<parent>/review-<NN>` IDs and `reports/reviews/<parent>/<NN>.md` paths remain valid; legacy R still maps to `BRAID-001/review-01`. Existing unnumbered review reports also remain in place; inspect the parent's review history before choosing the next unused number. A running assignment keeps its assigned name/output paths until it returns. Do not rename or restart it merely to apply this convention.

## Analysis and refinement

For a goal, inspect existing epic/backlog/checkpoints before creating new work. Record the problem and beneficiary, outcomes, relevant repository/build facts, constraints, unknowns, and risks. Ask only questions that materially change scope or acceptance; record reasonable defaults and continue independent analysis.

Split into the smallest useful stories and necessary spikes/tasks. Explain dependency order and file/resource ownership. Each item has a kind, outcome, scope/non-goals, acceptance criteria, implementation checklist, dependency/ownership fields, required evidence, and a resume/report path. Stories describe user value; technical enablers can describe developer/operator value without forced user-story prose.

Write `epic.md` and item files before dispatch. Assign item IDs from [Backlog item IDs](#backlog-item-ids). Use the coordinator skill's templates for new work; refine existing files instead of duplicating the backlog. A planning-only request ends with a reviewable plan. An execution request can continue within its authorized scope once the next item is ready.

## Definition of Ready

A backlog item is Ready when its outcome and boundaries are clear, dependencies are met, ownership is assigned, required inputs exist, acceptance criteria are testable, and the verification/evidence method is known. A spike is Ready when its question, limit, and required decision are clear. Unrelated external setup does not block local work.

For implementation dispatch, fill the worker's [canonical assignment packet](../.agents/skills/braid-worker/assets/assignment-packet.md): committed or explicitly supplied context, exact dependency/merge and checkout/Git/ownership facts, declared check set and supported continuation. Assigned execution/resumption uses [braid-worker](../.agents/skills/braid-worker/SKILL.md); goal-level planning and independent review retain separate entrypoints.

## Definition of Done

For a delivery item: acceptance criteria satisfied, relevant local checks passed, scoped commit/PR exists, required hosted CI passes on its head, review findings are triaged, and human-approved merge is recorded. The report includes exact evidence and limitations; checkpoint/documentation reflect the outcome. Local acceptance alone stays In Review until the delivery gates are met.

For a spike: the question is answered with evidence or a concrete blocker, the next decision/action is recorded, and the research/report passes through PR, applicable CI, review, and approved merge. A useful spike need not produce code or artificial product tests.

Done for a story is distinct from a released epic. Missing remote CI/publication evidence remains visible on the epic's release checklist. Manually recording completion in the seed CLI does not create independent gate proof. Do not weaken acceptance criteria after failure; document and justify any genuine correction.

## Flow and ownership

Backlog -> Ready -> In Progress -> In Review -> Done. Use `blocked` with a specific blocker/owner/next action when progress cannot continue; preserve the prior state for resumption. `cancelled` needs a recorded reason. Use lowercase persisted labels: `backlog`, `ready`, `in-progress`, `in-review`, `done`, `blocked`, `cancelled`.

Provider/model/settings follow the authoritative [provider profile](../AGENTS.md#providers-and-roles). The coordinator owns epic/backlog status and shared checkpoint. Each worker owns its item checkpoint/report and implementation scope. Keep one seed worker at a time. Subsequent epics can raise WIP only when tool capabilities and boundaries support it.

Every stage ends with an evidence review and short retrospective. Turn observed problems into a small fix, regression check, or backlog item; preserve the user's original outcome. No skill or status label grants permission to publish, merge, deploy, or change private infrastructure.

The canonical [delivery rules](../.agents/skills/braid-coordinate/references/delivery.md) define semantic commits, PR/head/CI/review evidence, green-only worker handoff, the local-only bootstrap transition, and README boundaries. Waiting/blocked worker updates are nonterminal ownership updates, not successful delivery or new persisted statuses. README describes usable project state; all operational progress belongs in epic/checkpoint/report files.
