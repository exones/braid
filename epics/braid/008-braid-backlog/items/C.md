# C: Worker takes a Backlog.md task as its brief

- Kind: story.
- Tier: L.
- UI: no.
- Expected size: about 60 changed lines in 1–2 files.
- Branch: `item/008-c-worker-task-brief` at `<short sha>`.
- PR into: `epic/008-braid-backlog`.
- Result to: thread `<coordinator thread id>`.

## Goal

`braid-worker` can do an item whose brief is a Backlog.md task (`TASK-12`, `TASK-12.1`) as well as
an item brief file, so the `braid` skill can hand it work without a second worker skill.

## Start here

- `.agents/skills/braid/SKILL.md` (merged in #38): override 2, "Run an item" (the first message
  the worker receives), "Grow and adjust" and "Finish" hold the worker's part of the contract;
  `references/workflow.md` "One writer per branch"; `assets/task.md` for the exact commands.
- `.agents/skills/braid-worker/SKILL.md`: what changes.
- `.agents/skills/braid/assets/braid-md.md` and the skill's ground rules: how to call Backlog.md
  (this supersedes `../reports/A.md`'s rule).

## Change

- `.agents/skills/braid-worker/SKILL.md`:
  - Start: when the brief is a task ID, read it with `backlog task view <ID> --plain`, including the
    parent task if it has one. Call Backlog.md as `braid`'s `assets/task.md` says (on Windows the
    native `backlog.exe` by its printed path). The PR goes into the base branch the first message
    names: `main` for a story, the epic branch for a subtask.
  - Work: set the task In Progress in the first commit; write the plan into the task before
    coding; append notes for decisions and findings; apply task changes the coordinator sends; on
    growth, stop and send a proposal (absorb, split or phases) to the coordinator, then do the
    worker's part of the decided path as `braid` "Grow and adjust" describes (merge the branch the
    coordinator names and add the `--dep` with existing dependencies repeated; write a wait note in
    the task's notes; commit and push before stopping for phases).
  - Deliver: check the acceptance criteria and Definition of Done items it proved, write the final
    summary, set the task to Done in the last commit before reporting green.
  - Spikes: the answer goes in the task's final summary or a doc the task links to.
- The fix-round line ("repeat steps 3–5"): say that step 5 removed the PR watch, so the worker
  calls `watch_pull_request` again after pushing fixes. In 008/B a worker assumed the watch was
  still active, ended its turn and never reported.
- Its `description` front matter, if the trigger text needs it.

## Already decided

- One worker skill; the existing brief-file path keeps working unchanged.
- The worker doesn't create, split or restructure tasks, and doesn't change other tasks' status.
- The final summary in the task replaces a separate `reports/<ID>.md` for task briefs; the chat
  report format stays.
- Growth proposal in chat: what was found, the three options with rough sizes, and the worker's
  recommendation.

## Out of scope

- Standalone mode (epic 007). 007 is parked: build on `main`'s `braid-worker`, not on
  `epic/007-standalone-worker` or PR #35.
- Coordinator or installer changes.

## Done when

- A fresh agent reading the worker skill with a task-ID brief knows where the brief is, where its
  plan and report go, when to set Done, and what to do on growth.
- The brief-file path reads exactly as before for an assigned `items/<ID>.md` brief.
- The PR description walks one task-ID item and one brief-file item through the skill.
- The `gate` command from `BRAID.md` passes and the PR checks are green.

## Check with

```powershell
npm run verify
```
