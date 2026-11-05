# B: batch coordinator records and decisions

- Kind: task. Tier: L. UI: no.
- Expected size: about 90–140 changed lines in three existing files.
- Branch: `item/006-b-coordinator-cadence`, from the epic tip pinned at launch.
- PR into: `epic/006-run-findings`. Result to: coordinator thread set at launch.

## Goal

Replace per-transition pushes with useful, conventional milestone commits and
keep user decisions and the approved run order predictable. Findings 30, 31,
38, 40, 41 and 66.

## Start here

- `.agents/skills/braid-coordinate/SKILL.md`: plan, run, accept and user messages.
- `.agents/skills/braid-coordinate/references/workflow.md`: status persistence.
- `.agents/skills/braid-coordinate/assets/epic.md`: table and run-order wording.
- `epics/reports/run-001-triage.md`: item B cadence and exceptions.

## Change

Update these three files together so none still requires an immediate commit
for every status. Explain durable snapshots versus interim GitHub/thread state.
Add concise decision-tool/fallback and approved-order guidance where it belongs.

## Already decided

Commit the plan, completed-item/next-start batches, actual blocks/cancellations
and settled brief/decision changes. Commit a needed brief change before dispatch.
Use Conventional Commits, e.g. `docs(epic): complete A and start B`. Intermediate
review/PR/merge-ready transitions have no separate routine commit. Approximately
one routine coordinator commit per item is a target, not a hard quota.

Append new work by default. Ask before reordering approved work. Use the host
question tool if available, otherwise numbered questions with lettered options
and a recommendation; include storage semantics when asking for a path.

## Out of scope

History rewriting, author identity, Git hooks, commit linting, changing merge
authority, new status stores or a commit for every thread link.

## Done when

- A normal item yields one combined completion/next-start commit, while review
  and merge-ready messages produce none of their own.
- Related answers are batched; a genuinely blocking decision is persisted
  promptly and does not get lost under a rigid commit quota.
- Neither a side request nor an unanswered question silently changes run order.
- Both question-tool and no-question-tool cases are clear and concise.
- `npm run verify`, edited-skill validation and PR checks pass.

## Check with

Run `npm run verify` and validate the coordinator skill frontmatter. Walk through
the scenarios above and search the three changed files for obsolete per-status
commit instructions. No new policy-test framework.
