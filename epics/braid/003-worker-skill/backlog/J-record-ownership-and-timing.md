# J: one writer, one branch and one moment for every epic record

Kind: task. Epic: [BRAID-003](../epic.md).
Status: backlog. Owner: unassigned. Depends on: H merged into the epic (H edits the same skills, packet asset and AGENTS). Proposed order: after H, before I and D.

## Read first

AGENTS.md, `docs/decisions.md`, [Agile workflow files and ownership](../../../../docs/agile-workflow.md#files), [delivery rules](../../../../.agents/skills/braid-coordinate/references/delivery.md), both skills and the [assignment packet](../../../../.agents/skills/braid-worker/assets/assignment-packet.md), [report format](../../../../epics/report-format.md), [directory map](../../../../docs/directory-structure.md), this epic and its current checkpoint. Evidence of the problem: `reports/worktree-cleanup.md` (still uncommitted in the coordinator checkout when J was written) and the epic's first-parent history since `0e10d3b`.

## Value

Epic records under `epics/` have per-role owners for a few files, but no rule says which branch each record lives on or when it is written. Observed in BRAID-003:

- Records written after a push either change the PR head (invalidating its green proof) or stay uncommitted. The coordinator epic checkout carries uncommitted "local supplements"; retiring 26 worktrees needed hash-matching and archiving 84 leftover evidence files.
- `delivery.md` says review reports belong to the item PR, which is impossible without a new head after review; in practice the coordinator copies them and commits directly to the epic.
- Coordinator-authored skill, AGENTS, decisions and roadmap changes land on the epic without an item PR or review.
- `checkpoints/current.md` has grown into a long append-only log a fresh agent must parse.
- A maintenance session wrote files into the live coordinator checkout.

The coordinator, workers, reviewers and the maintainer get one table that answers "who writes this file, on which branch, when, and who commits it", and no workflow step that requires a dirty tree or a post-green commit.

## Scope and non-goals

Adopt this agreed ownership matrix (user agreed 2026-11-04) as the single authority in `docs/agile-workflow.md`, replacing the per-file owner comments in its Files section, and link to it from other places rather than restating it:

| File | Writer | Branch | When | Committed by |
| --- | --- | --- | --- | --- |
| `epic.md`, `checkpoints/current.md`, `checkpoints/history/`, `backlog/*.md` | coordinator | epic | planning, dispatch, triage, acceptance, close | coordinator, pushed at each step |
| `assignments/<ID>.md`, `assignments/reviews/<ID>/*` | coordinator | epic | before the item or reviewer launches; a change is a new commit | coordinator |
| product code, project docs, skills, `docs/decisions.md`, `docs/roadmap.md` | worker | item | implementation | worker, via item PR |
| `reports/<ID>.md`, `checkpoints/<ID>.md`, `validation/<ID>/` | worker | item | before each push | worker, via item PR |
| current-head CI proof and result | worker | none: PR comment and result message | after green | not a file |
| `reports/reviews/<ID>/*`, `checkpoints/reviews/<ID>/*` | reviewer | none: returned files plus a PR summary comment | after the green head | coordinator copies into its next epic commit |
| `reports/<ID>-coordinator-triage.md` | coordinator | epic | after review returns | coordinator |
| `reports/<ID>-acceptance.md` | coordinator | epic | after human merge: merge SHA, accepted head, run IDs, review link | coordinator, one acceptance commit |
| `reports/final.md`, `retro.md` | coordinator | epic | epic close, before the main PR | coordinator |
| maintenance/audit records | that session | its own branch/worktree | never inside a live checkout | that session, via its own PR |

Also, in the owning authorities:

- Worker: after the first push, no further record file commits unless a repair changes the head anyway; the green proof goes in a PR comment and the result message. Replace the "post-push evidence supplements" wording accordingly.
- Coordinator: commit and push its own records immediately at each boundary; never carry uncommitted records. Coordinator commits to the epic are records-only (the files listed as coordinator-owned) and are explicitly exempt from independent review; any other path needs an item PR. A decision is recorded in `epic.md` and carried into `docs/decisions.md` by an item.
- Reviewer: returns its files and posts a short PR summary comment; it does not commit to the item or epic branch.
- Fix the `delivery.md` sentence placing review reports in the delivery PR.
- `checkpoints/current.md` is a short overwritten "now" state (task, actual revisions, live handles, blockers, one next action); superseded entries move to `checkpoints/history/`. Update the epic template and report-format/checkpoint guidance to match.
- Remove the stale global "Current epic/checkpoint" pointers from AGENTS.md in favour of [the epic index](../../../README.md).

Non-goals: a separate records branch or out-of-git state (later roadmap), moving or rewriting historical records, restructuring this epic's existing `current.md` (the coordinator does that once at adoption), product/CLI/schema/CI changes, automation that enforces the matrix.

## Acceptance criteria

1. Given any file type in the matrix, the maintained docs name exactly one writer, branch, write moment and committer, and every other policy file links to that one table instead of restating it.
2. Given the full item lifecycle (dispatch, implement, push, CI green, review, fix, merge, acceptance), no step in the skills, packet asset, delivery rules or report format requires a commit to a green PR head for records, or leaves a record uncommitted in any worktree. Shown with a written walkthrough of the lifecycle against the changed text, including one review-fix round.
3. The review-report contradiction in `delivery.md` is gone; the records-only coordinator commit exemption and the "project docs only via item PRs" rule are stated once and linked.
4. The `current.md`/`history/` split is described in the epic template and checkpoint guidance with a short placeholder example; AGENTS.md has no stale current-epic pointer.
5. `npm run verify` (H's single gate) passes locally and in all four CI jobs on the current head; both skill validators pass; independent review and human merge into the epic.

## Implementation tasks

- [ ] Add the matrix to `docs/agile-workflow.md#files`; reduce other mentions to links.
- [ ] Update worker skill, coordinator skill, delegation, packet asset, delivery, report format, directory map, epic template, AGENTS.
- [ ] Write the lifecycle walkthrough in `reports/J.md`.
- [ ] Run gates; deliver through PR into the epic.

## Ownership and verification

Worker owns the files listed in the implementation tasks plus `reports/J.md` and `checkpoints/J.md`. Coordinator owns this backlog file, `epic.md`, `current.md` and the J assignment. Checks: `npm run verify`, both `quick_validate.py` runs, all four CI jobs on the current head. Docs-only: artifact download not required unless the packet says otherwise.

## Review gates

`J-record-ownership-and-timing-review-001` on the exact green head: checks each matrix row against the changed text, the lifecycle walkthrough, and that no gate or human-merge rule was weakened. [Review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing).

## Delivery record

Named item branch from the accepted epic tip, PR into `epic/braid-003-worker-skill`, Conventional Commits, checked head, local gate, hosted CI, review triage, human merge into the epic and merge SHA. The epic PR into main stays separate.

## Report and resume

Write `checkpoints/J.md` and `reports/J.md` per [report format](../../../../epics/report-format.md). Stop after this item.
