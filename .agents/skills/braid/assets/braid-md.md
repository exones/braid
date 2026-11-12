---
gate: <command that must pass before every PR, run from the repository root>
main: main
backlog: backlog/
ci: []
shell: "pwsh 7 or bash; <optional: other shell facts>"
setup: "<optional: run first in a new worktree, for example npm ci>"
test: "<optional: focused test command, for example npx vitest run <file>>"
run: <optional: command that starts the app locally for manual or UI checks, and its URL if it serves one>
models:
  coordinator: <provider / model / options>
  worker:
    story: <provider / model / options>
    task: <provider / model / options>
    spike: <provider / model / options>
    L: <provider / model / options; optional tier key, also S: or M:; wins over the kind keys>
  reviewer: <provider / model / options; skill: <skill name> (optional)>
---

# <project> for braid agents

Facts agents need and can't guess. Keep it short; general engineering practice doesn't belong here.

- `backlog`: the Backlog.md folder (`backlog/config.yml` and `backlog/tasks/`). Items are its tasks.
- Backlog.md: install `backlog.md@1.55.3` globally (`npm install -g backlog.md@1.55.3`). On Linux and macOS call plain `backlog`. On Windows call the native `backlog.exe` from pwsh 7, because the shims can silently cut a multi-line `--description` and drop `--ac`. Agent shells keep no variables between commands: resolve the path once with this lookup, which prints it, and use the printed absolute path literally (`& '<printed path>' task …`):

  ```powershell
  $p = (Get-Command volta -ErrorAction SilentlyContinue) ? (volta which backlog 2>$null) : $null
  if (-not $p) { $p = (Get-Command backlog).Source }
  $backlog = node -p "require(process.argv[1]).resolveBinaryPath()" (Join-Path (Split-Path $p) 'node_modules/backlog.md/resolveBinary.cjs')
  $backlog
  ```

  `--version` of that path must print `1.55.3`. Never `npx`, `backlog.cmd`, `cmd.exe` or Windows PowerShell 5.1. Quote Markdown and labels (`--labels 'kind:story,tier:M'`) in single quotes; give a multi-line field as one argument. Don't edit task files by hand, except to resolve a Git merge conflict in one.
- `ci`: check names that must be green on a PR. `[]` means every reported check; `none` means the project has no hosted CI, and the gate run before the PR is the evidence.
- `run`: how agents start the app to try it or take screenshots. Leave it out if there is nothing to run.
- `models`: `provider / model-id / key=value, ...`, with the exact IDs and option names the host lists (in T3: `orchestrator_capabilities`). Options left out mean host defaults. `<role>.<tier>` (tier: S, M, L) is the model for items of that tier, `<role>.<kind>` (kind: story, task, spike) for that kind of item, and a plain `<role>` for every item; the tier key wins over the kind key, so a tier L spike uses `L`. `skill:` names a skill the agent must use.
- Real user data: <where the app keeps it>. Agents never touch it; a task may allow a read-only look.
- Hard limits: <anything agents must never do here, for example publish, touch production, edit generated files>
- Conventions: <commit style, code layout, test location, anything project-specific>
