# Trial guide: braid on Backlog.md

How to try the new flow on a real project in an isolated setup, and what to write down. No agent has
judged agent behavior in this epic: your trial does. Everything here is run by you; nothing needs
this epic's files open.

You talk only to `braid` (the coordinator). `braid-worker` is the skill of the worker threads it
launches; you never start it yourself.

## 0. Before you start

- D (install and routing) must be merged into the epic branch first: it makes
  `scripts/Install-Skills.ps1` install `braid` next to `braid-*`. Until then `braid` isn't installed.
- Node.js 26 and PowerShell 7.6+ (`pwsh`), Git and `gh` signed in, and a T3 project for the target
  repository.
- Check the Backlog.md commands once, with no agents (downloads `backlog.md@1.55.3` into a temp
  folder and removes it; also checks Volta if you have it):

  ```powershell
  pwsh -NoProfile -File scripts/Test-BraidBacklogFlow.ps1
  ```

  It must end with `N of N checks passed`. If not, stop and report the failing line.

## 1. Install the skills from the epic branch

From a checkout of this repository (any branch, the script reads the ref):

```powershell
git fetch origin
pwsh -NoProfile -File .\scripts\Install-Skills.ps1 -Ref origin/epic/008-braid-backlog
```

This copies `braid`, `braid-coordinate` and `braid-worker` into `~/.cursor/skills`, `~/.codex/skills`,
`~/.claude/skills` and `~/.braid/skills`, with `.braid-install.json` naming the commit. To keep the
trial away from your usual folders, add `-Target <folder>` (it replaces the defaults) and point the
agent host at that folder. Note the commit it prints; write it in the findings. Skills installed
from `main` later replace these.

## 2. Prepare the target repository

Use a scratch repository you don't mind losing: a new GitHub repository, or a fork or copy of a
small project, cloned to its own folder. It needs a GitHub remote, because workers open PRs.

1. Install Backlog.md (once per machine): `npm install -g backlog.md@1.55.3`
   (with Volta: `volta install backlog.md@1.55.3`).
2. On `main` of the target, create `BRAID.md` from the template
   `.agents/skills/braid/assets/braid-md.md` of this repository: fill in `gate`, `ci` (`none` if the
   project has no hosted CI), `setup`, `test`, `run` and the `models` lines with the IDs your host
   lists (in T3: the models in this repository's `BRAID.md`, provider `Claude_Everix`).
3. Copy `.agents/skills/braid/assets/backlog-config.yml` to `backlog/config.yml` and set
   `project_name`. Don't run `backlog init`. (If you skip this step, `braid` does it itself on first
   use; do it by hand once so you see the files.)
4. Commit both on `main` and push: `docs: add BRAID.md and Backlog.md config`.
5. In T3, add the folder as a project and start a thread there with `braid`. The first message can be
   just the goal.

Never point the trial at a repository whose `main` you can't afford to change.

## 3. Scenarios

Do them in order; each one is a separate coordinator thread unless it says otherwise. Run the target's
gate yourself afterwards when you merge, as you normally would.

| # | Scenario | You say | Expect |
| --- | --- | --- | --- |
| 1 | Plan a goal | A goal of several steps, for example "add a settings page with three options, storage and tests" | A plan with a parent task and subtasks (titles, kinds, tiers, order, dependencies, acceptance criteria) shown to you before anything is committed. Planning PR on `plan/<slug>`; merging it is your approval. Then an `epic/<id>-<slug>` branch. |
| 2 | One story | A small change that fits one PR, for example "run TASK-n" for a story created in scenario 1, or "rename X to Y everywhere" | One task, a worker on `item/<id>-<slug>` that sets In Progress first, writes a plan, and ends with Done and a final summary in the same PR. One review for tier M, none for S beyond the coordinator reading the diff. A recap and your merge; `main` then shows Done. |
| 3 | A story that grows | A story whose real size is hidden, for example "add export to CSV" in a project where the data layer needs a refactor first | The worker stops and sends one proposal (absorb, prerequisite or phases). The coordinator follows its mandate (up to two small subtasks or one prerequisite without asking) or asks you for more. A grown story becomes an `epic/` branch with subtasks and one final PR into `main`. IDs stay unique. |
| 4 | Resume after a lost chat | In the middle of scenario 1 or 3 (a worker running or a PR open), close the coordinator thread. Start a new thread with `braid` and say "continue" | It rebuilds the state from `BRAID.md`, Git branches, `gh pr list` and Backlog.md (not from the old chat), says what is running and what is next, and does not relaunch a running item or duplicate a PR. |

## 4. What to watch for

- **Commands:** does anyone run `npx backlog`, `backlog.cmd` or edit task files by hand? Do multi-line
  descriptions, plans and summaries arrive whole, with their acceptance criteria? (Look at a task with
  `backlog task view <id> --plain`.)
- **Ownership:** only the worker commits to its item branch; the coordinator never sets a running
  item's status; tasks change on `main` only by merged PRs, so `main` shows Done exactly when the work
  is merged.
- **Plan quality:** lowest tier that fits, testable criteria, real dependencies only, plan confirmed
  with you first. Is the task text enough for a worker, without it re-investigating?
- **Workflow:** one worker at a time, the right model and effort per tier (L uses Opus 5.5 medium), a
  thread named `<repo> <task-id> <role>: <title>`, a recap in the agreed shape, no merge by the agent.
- **Cost of the flow:** minutes from your goal to the plan, from launch to the first edit, from
  report to recap, and anything an agent asked you that it could have decided.
- **Failure modes:** a stopped worker, red CI, a merge conflict in a task file, a worker proposing
  growth beyond the mandate. How did the coordinator react, and was it what the skill says?
- **Clean-up:** your checkout stays on the branch you left it; no stray `.braid/` or `.agento/` edits;
  nothing committed to `main` that you didn't merge.

## 5. Findings

Fill one row per observation, with the time and the thread or PR it came from. Kinds: `good` (worked
as meant), `gap` (the skill doesn't say what to do), `bug` (the skill says one thing, the agent or
Backlog.md did another), `cost` (slow or noisy), `ask` (something you'd change).

| # | Scenario | Time | Kind | What happened | Proposed change |
| --- | --- | --- | --- | --- | --- |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

Header facts to write above the table: the skills' installed commit, the target repository, the
models used, the Backlog.md version (`--version`) and whether the flow script passed.
