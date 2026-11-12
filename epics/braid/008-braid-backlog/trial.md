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

## 1. Install the skills into their own config folder

**Why a separate folder.** You already have older `braid-coordinate` and `braid-worker` installed
globally. Claude Code's documentation says that when a personal skill (`~/.claude/skills/`) and a
project skill (`.claude/skills/`) share a name, the personal one wins
([skills, "Resolve skills that share a name"](https://code.claude.com/docs/en/skills)). So copying
the new versions into the target repository's `.claude/skills/` would leave the old ones running.
It would work only for `braid`, which has no older copy. Claude Code also documents that
`CLAUDE_CONFIG_DIR` moves everything that lives under `~/.claude`, skills included
([.claude directory](https://code.claude.com/docs/en/claude-directory)). A session started with that
variable set therefore sees only the skills in that folder, and your global ones are never read or
written.

Recommended setup: a trial config folder, `~/.claude-braid-trial`, used only by the sessions that
run the trial. A separate OS user or a VM would isolate even more, but costs a second login and
profile; use one only if the steps below fail. Everything below is PowerShell 7.

**Install** (needs D merged into the epic branch). The installer copies the skill folders of the
checkout it runs from (it picks the `braid` and `braid-*` folders from its own checkout, and the
`-Ref` only chooses which commit's files are copied), so run it from a checkout of the epic branch,
not from `main`:

```powershell
$trial = Join-Path $HOME '.claude-braid-trial'
git fetch origin
git worktree add --detach ..\braid-trial-skills origin/epic/008-braid-backlog   # a checkout of the epic branch
Set-Location ..\braid-trial-skills
pwsh -NoProfile -File .\scripts\Install-Skills.ps1 -Ref HEAD -Target (Join-Path $trial 'skills')
```

It prints the commit it installed and writes `.braid-install.json` into each skill. Write that
commit in the findings. Because `-Target` replaces the default folders, nothing in `~/.claude`,
`~/.codex`, `~/.cursor` or `~/.braid` is touched.

**Use it.** Start every trial session with the variable set, in the same shell:

```powershell
$env:CLAUDE_CONFIG_DIR = $trial
claude        # first time only: /login. This folder has its own login, settings and history.
```

The folder starts empty of your usual settings, permissions, MCP servers, plugins and your global
`CLAUDE.md` (which changes how agents behave, so the trial runs without your personal instructions
unless you copy it in). Copy `~/.claude/settings.json` and `~/.claude/CLAUDE.md` into it if you want
them; plugins and personal MCP servers (`.claude.json`) are not worth copying for this trial.

**T3.** The models in `BRAID.md` run through T3's `Claude_Everix` provider, which starts Claude
Code processes. That each of those processes, including the worker threads the coordinator launches,
inherits `CLAUDE_CONFIG_DIR` from the T3 process is **not verified**: the documentation above covers
Claude Code, not T3, and I couldn't test T3 from here. To give the best chance, quit T3 and start it
from a shell where `$env:CLAUDE_CONFIG_DIR = $trial` is set (check T3's provider settings for a
config-directory or environment field too). Then check before trusting it: in the target project
start a thread and ask "Open your `braid` skill's `SKILL.md` and tell me its full path and whether
the text mentions Backlog.md". The path must be under `.claude-braid-trial\skills`, and the text must
mention Backlog.md. Do the same for a worker thread the first time one starts (the thread's skill
reads show its path).

**If T3 doesn't pick it up**, the plain fallback is to move the old global copies out of
`~/.claude/skills` for the trial and back afterwards. Move them, don't rename them in place: Claude
Code also takes a skill's name from the `name:` line in its `SKILL.md`, so a renamed folder in the
same place would still load next to the new one.

```powershell
$g = Join-Path $HOME '.claude\skills'
$backup = Join-Path $HOME '.claude-braid-pre-trial'
New-Item -ItemType Directory -Force $backup | Out-Null
foreach ($n in 'braid-coordinate', 'braid-worker') { if (Test-Path "$g\$n") { Move-Item "$g\$n" "$backup\$n" } }
pwsh -NoProfile -File .\scripts\Install-Skills.ps1 -Ref HEAD -Target $g   # from the epic checkout above
```

Restore afterwards (define `$g` and `$backup` again in a new shell): delete `$g\braid`,
`$g\braid-coordinate` and `$g\braid-worker`, then `Move-Item "$backup\$n" "$g\$n"` for each of the
two old ones, and delete `$backup`. (The installer refuses to replace a folder it didn't install
unless `-Force` is given, which is why the old ones are moved first.)

**Undo the recommended setup:** first copy anything you need for the findings out of
`~/.claude-braid-trial` (its transcripts go with it). Close the trial sessions, and if you started T3
from the shell that had the variable, quit T3 and start it normally; otherwise it keeps using the
trial folder. Then, in a new shell:

```powershell
$trial = Join-Path $HOME '.claude-braid-trial'
Remove-Item Env:CLAUDE_CONFIG_DIR -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $trial
git worktree remove --force ..\braid-trial-skills   # from the checkout you ran `git worktree add` in
```

Your global skills, settings and history were never touched. Other hosts (Codex, Cursor) are out of
this trial: the models are Claude's, and the steps above don't write to their folders.

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
5. In T3 (started with `CLAUDE_CONFIG_DIR` set, step 1), add the folder as a project and start a thread there with `braid`. The first message can be
   just the goal.

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

| # | Scenario | Time | Kind | What happened | Proposed change |
| --- | --- | --- | --- | --- | --- |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

Header facts to write above the table: the skills' installed commit, the target repository, the
models used, the Backlog.md version (`--version`) and whether the flow script passed.
