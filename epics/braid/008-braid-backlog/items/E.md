# E: Isolated flow check and the user's trial guide

- Kind: task.
- Tier: M.
- UI: no.
- Expected size: about 150 lines in 2 files.
- Branch: `item/008-e-flow-check` at `<short sha>`.
- PR into: `epic/008-braid-backlog`.
- Result to: thread `<coordinator thread id>`.

## Goal

Check everything about the new flow that can be checked without running agents, and give the user
what they need to try `braid` on a real project in an isolated environment. Agents don't judge
agent behavior in this epic; the user's trial does.

## Start here

- `.agents/skills/braid/references/workflow.md` and `assets/task.md` (from B): the exact Backlog.md
  commands the skill prescribes.
- `.agents/skills/braid-worker/SKILL.md` (from C): the worker's commands.
- The `braid` skill's invocation rule (it supersedes `../reports/A.md`'s) and its
  `assets/backlog-config.yml`.
- `epics/reports/run-001-chinese-trainer.md`: what the user looked at in the last real run.

## Change

- `scripts/Test-BraidBacklogFlow.ps1`: in a throwaway Git repository under the temp folder, with the
  pinned `backlog.md` and the recommended config, run the command sequence the skills prescribe and
  assert the resulting files and Git state:
  1. Planning branch: a parent task with two subtasks, labels, acceptance criteria, a dependency
     and ordinal; merge into `main`.
  2. Story: item branch from `main`; the worker's plan, notes, checked acceptance criteria, final
     summary and Done; merge; `main` shows Done with the summary.
  3. Growth: a running story gets a prerequisite subtask on an `epic/<task-id>-<slug>` branch; IDs
     stay unique across branches; the final merge brings every status to `main`.
  4. Multi-line text and later options survive on Windows through the skill's invocation, also
     under a Node shim such as Volta.
- `epics/braid/008-braid-backlog/trial.md`: the user's trial guide: install the skills from the
  epic branch into an isolated setup, prepare a target repository (`BRAID.md`, Backlog.md init,
  config), the scenarios to try (plan a goal, one story, a story that grows, resume after a lost
  chat), and what to watch for, as a findings table to fill in.

## Already decided

- The script is not part of the `gate` or CI: it downloads `backlog.md`, and the gate is offline.
  It is run by hand and documented in the trial guide.
- It never touches the user's real skill folders or repositories; everything lives in temp folders
  it removes at the end.

## Out of scope

- Running coordinators or workers.
- Changing the skills; mismatches found here go back to B or C as fixes.

## Done when

- The script passes on Windows in PowerShell 7, and the PR shows its output.
- Each command in the script matches a command in the skills, or the PR lists the difference.
- The trial guide lets the user set up and run the four scenarios without reading this epic.
- The `gate` command from `BRAID.md` passes and the PR checks are green.

## Check with

```powershell
npm run verify
pwsh -NoProfile -File scripts/Test-BraidBacklogFlow.ps1
```
