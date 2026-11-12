# B: The `braid` skill: plan, story, grow, finish

- Kind: story.
- Tier: L.
- UI: no.
- Expected size: about 270 lines in 6 files, all new.
- Branch: `item/008-b-braid-skill` at `<short sha>`.
- PR into: `epic/008-braid-backlog`.
- Result to: thread `<coordinator thread id>`.

## Goal

A user can start one skill, `braid`, with a goal or a single task in any repository that has a
`BRAID.md` and Backlog.md, and get the work planned, run one worker at a time, reviewed, merged and
reported. The same skill handles a one-PR story and a story that grows into phases.

## Start here

- `../epic.md`, "Design" and "Backlog.md facts", and `../reports/A.md`: the data model, the
  invocation rule and the config this skill must use.
- `.agents/skills/braid-coordinate/SKILL.md` and its `references/workflow.md` and `assets/`: the
  base. Copy what still applies rather than rewriting it.
- `epics/reports/run-001-chinese-trainer.md`: what went well and badly in the first real run.

## Change

- `.agents/skills/braid/SKILL.md`: the coordinator role. Sections: project facts; ground rules;
  plan; run an item; grow; accept and merge; fixes; finish; talking to the user; resuming.
- `.agents/skills/braid/references/workflow.md`: items as Backlog.md tasks, labels, statuses,
  ordinal, dependencies, branches and merges per case (story into `main`; grown story or planned
  goal as `epic/<task-id>-<slug>`), tiers, checks, reports.
- `.agents/skills/braid/assets/task.md`: the brief as task sections and the exact `backlog task
  create` and `edit` commands that fill them.
- `.agents/skills/braid/assets/braid-md.md`: the `BRAID.md` template with the Backlog.md facts
  (`backlog` folder, invocation, pinned version) replacing `epics`.
- `.agents/skills/braid/assets/review.md`: copied from `braid-coordinate`, adjusted for tasks.
- `.agents/skills/braid/assets/backlog-config.yml`: `../reports/A-config.yml`, the committed
  `backlog/config.yml` a project copies instead of running `backlog init`.

## Already decided

- Built from `braid-coordinate`; keep its project facts, model selection, thread naming, tiers,
  review, recap format, milestone commits and the rule that the coordinator never writes product
  code.
- Include the user's draft refinements: confirm the plan with the user, in as many rounds as
  needed, before committing it; and the worker's final summary in the task is the item's report.
- The design points in `../epic.md` ("One item type", "Task = brief", "Who writes what",
  "Files travel with the work", "Growth") are settled.
- The user merges every item PR into an epic branch, S and M included, for the MVP. The
  coordinator still reviews by tier, checks CI and sends the recap, then waits for the merge.
- No `In Review` status: an open PR is "in review".
- Growth mandate: the coordinator may add up to two subtasks or one prerequisite task of tier S or
  M without asking, and records why in the parent's notes and the next recap. A change to the goal
  or acceptance criteria, or new tier L work, goes to the user first.
- Planning: tasks, not drafts, so IDs stay stable; a planning PR into `main` is the approval.
- An item whose PR is merged is done; status changes reach `main` only through merges.
- Agents call Backlog.md the way `../reports/A.md` says: `backlog.md@1.55.3` installed globally,
  plain `backlog` from pwsh 7 or bash, never `npx`, `backlog.cmd`, `cmd.exe` or Windows PowerShell
  5.1, Markdown in single quotes, one argument per multi-line field. They never edit task files by
  hand, except to resolve a Git merge conflict in one.
- Setup copies `assets/backlog-config.yml`; if `init` runs at all, it runs with
  `--agent-instructions none` and `EDITOR`/`VISUAL` unset. The target's `AGENTS.md` gets no
  Backlog.md block.
- The skill states the six overrides of `backlog instructions` in `../reports/A.md` ("Agent
  instructions" table) and points to `backlog instructions <guide>` for the rest.
- The skill folder is self-contained: no links outside `.agents/skills/braid/` (the docs gate
  checks this).

## Out of scope

- Parallel workers, locks and a scheduler.
- Changing `braid-coordinate` or `braid-worker` (C changes the worker).
- Installer, README, `AGENTS.md` and decisions (D).

## Done when

- A fresh agent reading only the skill can do, without guessing: plan a goal into tasks; run one
  story into `main`; turn a running story into phases after a worker's growth proposal; finish a
  phased item with one PR into `main`; resume from the repository and GitHub after losing its chat.
- The PR description walks through those five cases step by step against the skill text, naming
  the section that covers each step.
- Failure modes covered in the text: a worker's growth proposal beyond the mandate; a task edited on
  two branches; a draft promoted after something depends on it; a worker that ends without a
  report; the board showing `main`'s copy of a status rather than the newest; a merge conflict in
  a task file.
- `SKILL.md` stays under 200 lines.
- The `gate` command from `BRAID.md` passes and the PR checks are green.

## Check with

```powershell
npm run verify
```
