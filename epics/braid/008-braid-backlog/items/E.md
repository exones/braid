# E: Pilot: one story, one story that grows

- Kind: spike.
- Tier: S.
- UI: no.
- Expected size: one run report of about 100 lines.
- Branch: `item/008-e-pilot` at `<short sha>`.
- PR into: `epic/008-braid-backlog`.
- Result to: thread `<coordinator thread id>`.

## Goal

Question: does `braid` deliver real work end to end with Backlog.md, and what has to change before
it replaces `braid-coordinate`? Time box: one working session. The answer decides whether D's
"keep `braid-coordinate`" note can be removed and what the parallel-execution epic starts from.

## Start here

- `epics/reports/run-001-chinese-trainer.md`: the format and level of detail to follow.
- The target repository's `BRAID.md` and the README setup steps from D.

## Change

- `epics/reports/run-002-<target>.md`: timeline, findings table (good / gap / minor with proposed
  changes), and proposed follow-up items.

## Already decided

- The user installs the skills from the epic branch (`Install-Skills.ps1 -Ref
  epic/008-braid-backlog`) and starts the `braid` coordinator in the target repository; this item
  observes and records.
- Two runs: a one-PR story into the target's `main`, and a story planned as one PR that turns into
  phases during the run (prepared so that a real prerequisite exists).
- One worker at a time; models from the target's `BRAID.md`.

## Out of scope

- Fixing the skills during the pilot; findings become follow-up items.
- Parallel runs.

## Done when

- Both runs reached a merged PR into the target's `main`, or the report says where and why they
  stopped.
- The report covers: planning PR, growth proposal and decision, task files on each branch versus
  `main`, the worker's plan and summary in the task, recaps, resume after a lost chat if it
  happened, and time to first edit.
- The `gate` command from `BRAID.md` passes and the PR checks are green.

## Check with

```powershell
npm run verify
```
