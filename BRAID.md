---
gate: npm run verify
main: main
backlog: backlog/
ci: [verify (ubuntu-latest), verify (windows-latest)]
shell: pwsh 7.6+
setup: npm ci, with Node.js 26 on PATH (README "Build and verify")
test: "npm run build && node --test test/<file>.test.ts; Pester suites: pwsh -NoProfile -File scripts/Test-Pester.ps1"
run: npm run build, then node dist/cli.js --help (a CLI; no UI)
models:
  coordinator: Claude_Everix / claude-opus-5-5 / effort=high
  worker:
    story: Claude_Everix / claude-sonnet-5-5 / effort=medium
    task: Claude_Everix / claude-sonnet-5-5 / effort=medium
    spike: Claude_Everix / claude-opus-5-5 / effort=medium (researcher)
    L: Claude_Everix / claude-opus-5-5 / effort=medium (tier L items, including spikes as researcher)
  reviewer: cursor / grok-4.6 / effort=high, fastMode=false; skill braid-reviewer
---

# braid for braid agents

- Read installed skills; don't edit them. Documented setup may install/reuse the shared Node.js toolchain. Tests use temporary skill destinations and toolchain stores, never the real installations.
- `backlog`: the Backlog.md folder (`backlog/config.yml` and `backlog/tasks/`). Items are its tasks.
- Backlog.md: install `backlog.md@1.55.3` globally (`npm install -g backlog.md@1.55.3`). On Linux and macOS call plain `backlog`. On Windows call the native `backlog.exe` from pwsh 7, because the shims can silently cut a multi-line `--description` and drop `--ac`. Agent shells keep no variables between commands: resolve the path once with this lookup, which prints it, and use the printed absolute path literally (`& '<printed path>' task …`):

  ```powershell
  $p = (Get-Command volta -ErrorAction SilentlyContinue) ? (volta which backlog 2>$null) : $null
  if (-not $p) { $p = (Get-Command backlog).Source }
  $backlog = node -p "require(process.argv[1]).resolveBinaryPath()" (Join-Path (Split-Path $p) 'node_modules/backlog.md/resolveBinary.cjs')
  $backlog
  ```

  `--version` of that path must print `1.55.3`. Never `npx`, `backlog.cmd`, `cmd.exe` or Windows PowerShell 5.1. Quote Markdown and labels (`--labels 'kind:story,tier:M'`) in single quotes; give a multi-line field as one argument. Don't edit task files by hand, except to resolve a Git merge conflict in one.
- Project facts and hard limits are in [AGENTS.md](AGENTS.md).
- Past epics are in `epics/` (read-only); those before 006 are in the Git tag `archive/process-v1`.
- The braid skills are developed here in `.agents/skills/`. Other projects get them through `scripts/Install-Skills.ps1`.
