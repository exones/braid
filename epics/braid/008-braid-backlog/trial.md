# Trial guide: braid on Backlog.md

How to try the new flow on a real project in an isolated setup, and what to write down. No agent has
judged agent behavior in this epic: your trial does. Everything here is run by you; nothing needs
this epic's files open.

You talk only to `braid` (the coordinator). `braid-worker` is the skill of the worker threads it
launches; you never start it yourself.

## 0. Before you start

- D (install and routing) and G (drop `braid-coordinate`) must be merged into the epic branch
  first: they make `scripts/Install-Skills.ps1` install `braid` and remove the old coordinator.
- Node.js 26 and PowerShell 7.6+ (`pwsh`), Git and `gh` signed in, and a T3 project for the target
  repository.
- Check the Backlog.md commands once, with no agents (downloads `backlog.md@1.55.3` into a temp
  folder and removes it; also checks Volta if you have it):

  ```powershell
  pwsh -NoProfile -File scripts/Test-BraidBacklogFlow.ps1
  ```

  It must end with `N of N checks passed`. If not, stop and report the failing line.

## 1. Install the skills from the epic branch

The installer copies the `braid` and `braid-*` folders of the commit you give it into your usual
skill folders (`~/.claude/skills`, `~/.codex/skills`, `~/.cursor/skills`, `~/.braid/skills`). It
replaces the `braid-worker` it installed earlier and removes the old `braid-coordinate`, because
that folder carries its stamp but is no longer in the epic branch. A folder it didn't install is
never touched. Run it from a checkout of the epic branch:

```powershell
git fetch origin
git worktree add --detach ../braid-trial-skills origin/epic/008-braid-backlog
Set-Location ../braid-trial-skills
pwsh -NoProfile -File ./scripts/Install-Skills.ps1 -Ref HEAD
```

It prints the commit it installed; write that commit in the findings. Then in the target project
start a thread and ask "Open your `braid` skill's `SKILL.md` and tell me its full path and whether
the text mentions Backlog.md". The path must be under your skills folder, and the text must mention
Backlog.md.

**Undo:** `main`'s installer doesn't know `braid` until this epic merges, so delete it first (only
where the installer put it), then reinstall from a checkout of `main` and remove the trial checkout:

```powershell
foreach ($d in '.claude', '.codex', '.cursor', '.braid') {
  $s = Join-Path $HOME "$d/skills/braid"
  if (Test-Path (Join-Path $s '.braid-install.json')) { Remove-Item -Recurse -Force $s }
}
pwsh -NoProfile -File ./scripts/Install-Skills.ps1        # in a checkout of main
git worktree remove --force ../braid-trial-skills
```

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
5. In T3, add the folder as a project and start a thread there with `braid`. The first message can
   be just the goal.

Never point the trial at a repository whose `main` you can't afford to change.

## 3. Scenarios

Do them in order; each one is a separate coordinator thread unless it says otherwise. Run the target's
gate yourself afterwards when you merge, as you normally would.

| # | Scenario | You say | Expect |
| --- | --- | --- | --- |
| 1 | Plan a goal | A goal of several steps, for example "add a settings page with three options, storage and tests" | A plan with a parent task and subtasks (titles, kinds, tiers, order, dependencies, acceptance criteria) shown to you before anything is committed. Planning PR on `plan/<slug>`; merging it is your approval. Then an `epic/<id>-<slug>` branch. |
| 2 | One story | A fresh small change that fits one PR, for example "rename X to Y everywhere" or "add a `--version` flag" (not a subtask of scenario 1's goal: those run on the epic, not as stories) | A story has no planning PR: your confirmation of the plan in chat is the approval. Then one task, a worker on `item/<id>-<slug>` that sets In Progress first, writes a plan, and ends with Done and a final summary in the same PR. One review for tier M, none for S beyond the coordinator reading the diff. A recap and your merge; `main` then shows Done. |
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
  thread named `<repo> <task-id> <role>: <title>`, a recap in the agreed shape, no merge by the agent. The coordinator
  watches the item PR while it waits and unwatches it when the recap asks for your merge, and
  unwatches its own planning and final PRs once their checks are green and any review is done. A missed
  unwatch keeps the thread out of your inbox; if a PR is waiting for you but the thread isn't in your
  inbox, that is a finding.
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

Header facts to write above the table: the skills' installed commit, the target repository, the
models used, the Backlog.md version (`--version`) and whether the flow script passed.

**Trial 1, 2026-11-12.** Skills installed from `1dac47b`. Target: `exones/openclaw` (main branch
`restrict-agent-tools`, `ci: none`), scenario 2 only: TASK-1 "Read HTML-only letters as checked plain
text", story, tier L, PR exones/openclaw#16. Models: coordinator Opus 5.5 medium; worker Opus 5.5
medium (tier L); reviewer Grok 4.6 in Cursor, effort high, fast mode off, no skill. Backlog.md
1.55.3; the coordinator's one-time setup check passed; the flow script was not run.

| # | Scenario | Time | Kind | What happened | Proposed change |
| --- | --- | --- | --- | --- | --- |
| 1 | 2 | 13:49–15:26 | good | The whole story worked: setup was missing, so the coordinator asked and put it in the story's first commit (the user's choice); it stopped after the plan as asked; it wrote the user's model choices into `BRAID.md`; on "run TASK-1" it launched the worker; two blocking reviews were fixed and the third re-check was clean; recap, merge, deploy. | None. |
| 2 | 2 | 14:02 | bug | The first worker launch failed with `branch_already_exists`: the skill pushes the story branch (so it is in the local repository) and then says to launch with a worktree strategy, which creates the branch. The coordinator created the worktree itself and launched on `existing_worktree`. Same for every subtask. | Done: the skill now says to create the worktree and launch on it. |
| 3 | 2 | 14:25 | gap | The skill put the reviewer "in its own worktree on the PR branch", which Git refuses while the worker's worktree holds the branch. The coordinator used a worktree detached at the head commit. | Done: the skill says detached at the PR's head. |
| 4 | 2 | 15:21 | gap | The user saw TASK-1 as Done before merging, in the browser run from the worker's worktree. Expected (the worker sets Done in its PR), but not documented. From `main` the board was unavailable until the merge, because the setup came with the story. | Done: the workflow and README say what Done means before the merge. A separate setup PR is optional; no change. |
| 5 | 2 | 15:22 | gap | The user changed the task's type in the browser running in the worker's worktree; the edit was saved there, uncommitted, and the browser kept the folder locked during clean-up. | Done: the README and workflow say to run the browser from your own checkout of `main`, to look, and to change tasks through `braid`; the skill's clean-up removes the item's worktrees. |
| 6 | 2 | 14:36–15:10 | cost | The first two review reports reached the coordinator about 30 minutes late, as extra turns, after it had already taken the results from the threads. It recognized them as stale. | None. |
| 7 | 2 | 15:23 | ask | The coordinator merged PR #16 and deleted its branch after "ok merge, lgtm". The skill says the user merges. | Open: allow the coordinator to merge when the user explicitly asks? |
| 8 | 2 | 13:50 | bug | Minor: while planning it said "I'll send it to an independent review next"; no review of the plan happened. | None. |
