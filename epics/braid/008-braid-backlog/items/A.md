# A: Backlog.md setup for agents on Windows and in worktrees

- Kind: spike.
- Tier: S.
- UI: no.
- Expected size: one report of about 80 lines plus a proposed `config.yml`.
- Branch: `item/008-a-backlog-setup` at `<short sha>`.
- PR into: `epic/008-braid-backlog`.
- Result to: thread `<coordinator thread id>`.

## Goal

Question: how should braid agents install, call and configure Backlog.md so that Cursor, Codex and
Claude agents on Windows and Linux can create and edit tasks reliably, each in its own worktree?
Time box: 90 minutes. The answer fixes the invocation rule, the committed `config.yml` and the
`AGENTS.md` handling that B writes into the skill.

## Start here

- `../epic.md`, sections "Design" and "Backlog.md facts": what is already known; don't re-probe it.
- `https://github.com/MrLesk/Backlog.md` README and `ADVANCED-CONFIG.md`.
- `backlog instructions overview`, `task-creation`, `task-execution`, `task-finalization`: the
  rules Backlog.md gives agents.

## Change

- `reports/A.md` in the epic folder: answers, evidence (commands and what they printed), and
  proposed changes to B's brief.
- `reports/A-config.yml` in the epic folder: the recommended committed `backlog/config.yml`.

## Already decided

- Use a pinned `backlog.md` version; 1.55.3 is current.
- Prefer the CLI over MCP. Look at MCP only if no CLI invocation passes multi-line text on Windows.
- Experiments run in throwaway repositories under the temp folder, never in this checkout.

## Out of scope

- Writing the skill, changing `braid-worker`, or adding Backlog.md to this repository.
- The web UI beyond the one cross-branch check below.

## Done when

- Invocation: one way to call `backlog` that keeps multi-line text and every option from PowerShell
  7 and Git Bash on Windows (for example a global install's `.ps1` shim, `node <pkg>/cli.js`, or
  the native binary), and confirmation that plain `backlog` works on Linux (CI or WSL).
- Configuration: statuses, `task_prefix`, `check_active_branches`, `remote_operations`,
  `auto_commit`, Definition of Done defaults, and how to keep `default_editor` out of the committed
  file.
- Agent instructions: the conflicts between `backlog instructions` and braid's rules (for example
  "never create tasks on your own initiative", "never edit task files directly"), and whether
  `init` should write its `AGENTS.md` block or the `braid` skill should carry what is needed.
- Worktrees: whether the board, browser and new IDs run from one worktree see tasks on other local
  branches, and whether `backlog browser` shows a newer status from another branch (the CLI
  doesn't).
- The `gate` command from `BRAID.md` passes and the PR checks are green.

## Check with

```powershell
npm run verify
```
