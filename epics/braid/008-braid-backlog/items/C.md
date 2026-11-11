# C: Worker takes a Backlog.md task as its brief

- Kind: story.
- Tier: L.
- UI: no.
- Expected size: about 40 changed lines in 1–2 files.
- Branch: `item/008-c-worker-task-brief` at `<short sha>`.
- PR into: `epic/008-braid-backlog`.
- Result to: thread `<coordinator thread id>`.

## Goal

`braid-worker` can do an item whose brief is a Backlog.md task (`TASK-12`, `TASK-12.1`) as well as
an item brief file, so the `braid` skill can hand it work without a second worker skill.

## Start here

- `.agents/skills/braid/SKILL.md` and `references/workflow.md` (from B): the worker's part of the
  contract.
- `.agents/skills/braid-worker/SKILL.md`: what changes.
- `../reports/A.md`: how to call Backlog.md.

## Change

- `.agents/skills/braid-worker/SKILL.md`:
  - Start: when the brief is a task ID, read it with `backlog task view <ID> --plain`, including the
    parent task if it has one.
  - Work: write the plan into the task before coding; append notes for decisions and findings; on
    growth, stop and send a proposal (absorb, split or phases) to the coordinator.
  - Deliver: check acceptance criteria, write the final summary, set the task to Done in the PR's
    last commit.
  - Spikes: the answer goes in the task's final summary or a doc the task links to.
- Its `description` front matter, if the trigger text needs it.

## Already decided

- One worker skill; the existing brief-file path keeps working unchanged.
- The worker doesn't create, split or restructure tasks, and doesn't change other tasks' status.
- The final summary in the task replaces a separate `reports/<ID>.md` for task briefs; the chat
  report format stays.
- Growth proposal in chat: what was found, the three options with rough sizes, and the worker's
  recommendation.

## Out of scope

- Standalone mode (epic 007) beyond what is needed to avoid conflicting with it.
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
