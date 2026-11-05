# 006: apply the run 001 findings without growing the skills

Status: in-progress. Implementation approved by the user.
Branch: `epic/006-run-findings` from `main` at `92c9feb`.

## Goal

Fix what the first real run (chinese-trainer epic 001) showed: agents could reach real user data,
workers guessed setup and shell commands, and the coordinator committed far too often, without
Conventional Commits, and decided things it should have asked about. Keep the workflow that worked
and keep the skills about the same size. See the [triage](../../reports/run-001-triage.md) and the
[run report](../../reports/run-001-chinese-trainer.md).

## Scope

In: the two braid skills, their templates and workflow, braid's own `BRAID.md`, and the README
section "Braid skills in other projects".

Out: product or ledger code, new scripts or tests, sandboxing, model changes, author identities,
T3 or provider fixes, history rewriting, releases.

## Items

Rows are in run order. Both are tier L because they change agent instructions: independent review,
then the user's merge. One worker at a time.

| ID | Title | Kind | Tier | Depends on | Status | PR |
| --- | --- | --- | --- | --- | --- | --- |
| A | [Keep agents off real data; exact project facts for workers](items/A.md) | task | L | – | done | [#32](https://github.com/exones/braid/pull/32) |
| B | [Quieter coordinator: milestone commits, questions, UI merges](items/B.md) | task | L | – | in-progress | |

## Decisions

- 2026-11-05: User approved execution with an epic-specific model override: workers use
  `codex / gpt-6-astra / reasoningEffort=medium`; reviewers use
  `codex / gpt-6.1-sol / reasoningEffort=medium`. This supersedes the default models for 006.

- 2026-11-05: Plan only; no workers until the user approves.
- 2026-11-05: Two items instead of four. All changes touch the same few files, and one word budget
  per file is easier to hold with fewer authors. A carries the data-safety fix (P0), so it runs first.
- 2026-11-05: Briefs give the exact wording to use. Workers place it, delete what it replaces and
  keep each file within its word cap; they don't add explanation.
- 2026-11-05: Screenshots and scratch files live outside every checkout, in
  `~/.braid/artifacts/<repo>/<epic>/<ID>/`, so removing a worktree loses nothing. No config field.
- 2026-11-05: `in-review` is dropped as a recorded status: it was only ever committed on its own,
  and the PR shows it. The epic gets `ready for main`; the user's merge marks it done, with no
  commit afterwards.
- 2026-11-05: Not changed: the final report and recap formats, one worker at a time, tiers,
  same-thread fixes, review comments on the PR, the user's merge into `main`, the models.
- 2026-11-05: Deferred: bot identity for agent commits, T3 checkpoint refs, a supervisor or
  `braid status`, sandboxed workers.
