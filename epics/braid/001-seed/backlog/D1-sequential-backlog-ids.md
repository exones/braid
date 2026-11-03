# D1: sequential letters for newly planned backlog items

Kind: story. Epic: AGENTO-001. Feature: coordinator workflow follow-up.
Status: done. Owner: one Grok 4.7 Extra High implementation worker through Cursor. Depends on: D delivered and human-merged in PR #2 at `d81f4a5` (satisfied). Policy merge `3a46c9e` in PR #4. Proof head `d22b4bb` passed Windows/Ubuntu CI and was human-merged in PR #5 at `ecf0d7c`. Review `D1-sequential-backlog-ids-review-001` reported no findings on that head. Not a release.
Priority: immediately after D, before other new delivery work in this epic.

As the person browsing an epic's files, I want new backlog items named in a predictable letter sequence so the folder is easy to follow without decoding initials chosen from each item's title.

## Read first

`AGENTS.md`, `README.md`, `docs/decisions.md`, `docs/agile-workflow.md`, `.agents/skills/agento-coordinate/SKILL.md` and its epic/backlog templates, this epic, `checkpoints/current.md`, `reports/D.md`, `reports/D-review.md`, and `reports/review-naming.md`. Resolve D's actual merge state before starting.

## Problem and scope

The user supplied a screenshot of a separately planned epic whose files used title-derived IDs such as `F-publish-facts.md`, `O-oidc-guard.md`, `S-install-scripts.md`, and `U-npm-account.md`. They expected sequential A, B, C, D, and so on. This is evidence supplied by the user; do not inspect or change that separate tree.

Improve the coordinator's planning instructions for future epics, covering stories, tasks, and spikes. Define the convention once in the Agile workflow and make skill/template entry points read or reference it. Keep the already agreed review convention authoritative in its current section.

This is a documentation/skill behavior change. It does not change CLI ID validation, the manual ledger schema, or existing epic IDs. Do not rename existing items, reports, review findings, or the separate epic shown in the screenshot. D1 is the user-requested insertion after D in this existing epic, not a new default numbering scheme.

## Acceptance criteria

1. Given a newly planned epic, its initial backlog uses one sequence beginning A, B, C, D, continuing alphabetically across stories, tasks, and spikes. IDs are assigned in the initial planned order, rather than from title initials or separate counters for each kind.
2. Given those IDs, backlog filenames use `<ID>-<descriptive-slug>.md`, and the epic table, dependency references, and planned report/checkpoint paths agree. Reviews follow the existing review convention and do not consume backlog letters.
3. Given an existing epic being resumed, refinement preserves its assigned IDs and valid links. The convention explains later additions/reordering and continuation beyond Z without renumbering existing work; the D1 insertion remains stable.
4. The naming policy has one authoritative section in `docs/agile-workflow.md`. Relevant planning instructions/templates route to it instead of reproducing the rule. README changes, if needed, are limited to stable contributor links.
5. A fresh, bounded planning-only exercise from a short natural-language goal demonstrates sequential filenames and consistent references for multiple backlog items, without supplying the expected IDs in the exercise prompt. Retain the exact tested revision, generated plan, checks, and limits. The exercise must not implement its example goal or create production work in another tree.
6. Documentation links/anchors, skill validation, and formatting pass. Deliver the actual change with applicable CI, independent review, and human-approved merge before marking D1 Done. No product-code tests are required solely to mirror documentation wording.

## Implementation checklist

- [x] Inspect current planning entry points and identify why arbitrary/title-derived IDs remain possible.
- [x] Define the convention centrally, including stable existing IDs and later additions.
- [x] Route the coordinator skill and relevant templates to that section.
- [x] Run and inspect the bounded fresh planning exercise; retain concrete evidence. Coordinator accepted the three-story A/B/C case on exact `da4792a`; see [validation record](../reports/D1-validation.md) for artifacts, checks, and limits.
- [x] Validate links, skill structure, and formatting. Windows/Ubuntu CI passed on `d22b4bb` (PR run 41697190559, push run 41696892902). Independent review reported no findings. Human merge of that head is `ecf0d7c`.

## Ownership, review, and output

One assigned implementation worker owns the scoped documentation/skill edits, `checkpoints/D1.md`, and `reports/D1.md`. The coordinator owns `epic.md` and `checkpoints/current.md`. Review names and evidence paths follow [the authoritative review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing).

Delivery resumed by the user after D merged. Assigned checkout `C:\code\agento`, branch `feat/sequential-backlog-ids`, based on latest main `709de209b7fd39980a2134f6c574306c8485d7bf`. Follow `reports/D1-assignment.md`: the worker implements/validates the guidance, commits, pushes, opens and immediately links its PR, then stops. The coordinator arranges the independent fresh planning exercise and review; the worker launches no agents. Report introduced behavior, meaningful checks, exact exercise/review revisions, limits, and unresolved decisions. Stop after D1. No publication, release, infrastructure changes, or stage 2 implementation.
