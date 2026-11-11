# A braid task

A task is the brief. The coordinator creates it; the worker fills the plan, notes and final summary.
Run these from pwsh 7 or bash in the checkout that owns the branch. Markdown goes in single quotes;
each multi-line field is one argument with real newlines. The sections:

- Description: the template below (goal, start here, change, already decided, out of scope, size).
- Acceptance criteria: "done when", a few testable points, one `--ac` each.
- Definition of done: the project defaults from `backlog/config.yml`; don't repeat them.
- Labels: `kind:story|task|spike`, `tier:S|M|L`, `ui` for new or noticeably changed user-facing UI.
- Dependencies: real prerequisites only. Ordinal: run order, 10, 20, 30, so one can slot in between.

## Create

```powershell
backlog task create 'Title' --labels kind:story,tier:M --ordinal 10 --dep task-3 --description @'
Goal: <one to three sentences: the outcome and who it is for; for a spike the question, the time box and the decision it feeds>

Expected size: about <N> lines in <K> files.

Start here (read in this order):
- `<path>`: <what to look at and why>

Change:
- `<path>`: <what to add or change>

Already decided (don't re-investigate):
- <a fact or choice>

Out of scope:
- <what not to touch or build>
'@ --ac 'First testable outcome' --ac 'Second testable outcome'
```

For a subtask add `--parent task-12`; it gets ID `TASK-12.1`. Spike: the answer goes in the final
summary; follow-ups are proposed there, not created by the worker. Create tasks, never drafts.
Keep the ID that `create` prints; put it in the PR title and the branch name.

## Edit

```powershell
backlog task edit task-12 --status 'In Progress'                 # coordinator, on the item's branch
backlog task edit task-12 --plan @'
1. ...
'@                                                               # worker, before coding
backlog task edit task-12 --append-notes 'Found X; decided Y.'    # worker, as it goes
backlog task edit task-12 --check-ac 1 --check-ac 2               # worker, only what is proven
backlog task edit task-12 --final-summary @'
What changed, why, validation, anything open.
'@                                                               # worker: this is the item's report
backlog task edit task-12 --status Done                          # in the PR that completes it
backlog task edit task-13 --dep task-12 --ordinal 20             # coordinator, restructuring
backlog task archive task-14                                     # cancelled; say why in its notes first
```

## Read

```powershell
backlog task view task-12 --plain
backlog task list --plain --ready        # unblocked To Do tasks, in run order
backlog task list --plain -p task-12     # a parent's subtasks
backlog doctor                           # duplicate IDs, cycles; run after a merge conflict
```
