# Task B: TypeScript foundation and early CI

Status: done. Date: 2026-11-03.
Backlog item: `epics/agento/001-seed/backlog/B-foundation.md`. Checkout/branch/HEAD: `C:\code\agento`; `main`; `dc6e3c47aefa974f48124edeae934e471aa99bbe`. The work is uncommitted. Origin is `https://github.com/exones/agento.git`. No push, PR, merge, release, or npm publication was performed.

## Outcome

B is a local, reviewable foundation. One private package named `agento` at candidate `0.1.0` builds a strict TypeScript ESM CLI to `dist/cli.js`. The package bin name is `agento`. The executable prints help and version, and it exits 1 for commands this build does not implement. It does not create `.crew/`.

`scripts/Verify.ps1`, exposed as `npm run verify`, is the local and Actions gate. It typechecks, builds, and runs the `node:test` smoke checks, and it stops on the first nonzero native exit code. `.github/workflows/ci.yml` calls that same entrypoint on Windows and Linux. That workflow is prepared only. GitHub has not run it.

Acceptance mapping:

- Clean `npm ci` under Node.js `v26.13.0` / npm `11.20.0` succeeded.
- `npm run verify` and `pwsh -NoProfile -File .\scripts\Verify.ps1` passed after the candidate was restored.
- Help, version, and unknown-command output matched the contract, including an npm-generated `agento.cmd` shim.
- A temporary type error made `Verify.ps1` exit 1 before build or tests. Restoring it made the gate exit 0.
- No ledger, T3, publishing, or merge automation was added. `private` remains true.

## Evidence

| Check | Exact command or method | Result | Revision/log/CI/PR link |
| --- | --- | --- | --- |
| Toolchain install | `pwsh -NoProfile -File .\scripts\Install-NodeToolchain.ps1` | Exit 0. Downloaded `https://nodejs.org/dist/v26.13.0/node-v26.13.0-win-x64.zip` and `SHASUMS256.txt`. SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a` matched the pinned hash and the official line. Extracted to `C:\code\agento\.tools\node\node-v26.13.0-win-x64`. | Local only. No commit. |
| Installer stdout | `Start-Process pwsh -RedirectStandardOutput` and `$nodeDir = pwsh -NoProfile -File .\scripts\Install-NodeToolchain.ps1` | Stdout was the directory plus a newline. The assignment was `C:\code\agento\.tools\node\node-v26.13.0-win-x64`, and `node.exe` exists there. Progress went to stderr. | Local only. |
| Selected Node | Toolchain `node.exe --version` and bundled `npm-cli.js --version` | `v26.13.0` and npm `11.20.0`. | Local only. |
| System Node unchanged | With `.tools\node` removed from `PATH`: `node --version`, `Get-Command node` | `v24.19.0` at `C:\Program Files\Volta\node.exe`. npm `11.17.0` at `C:\Program Files\Volta\npm.exe`. PowerShell is `7.6.9`. | Local only. |
| Lockfile install | Toolchain on `PATH`, delete `node_modules`, `npm ci` | Exit 0. `added 4 packages, and audited 5 packages`. `package-lock.json` is lockfileVersion 3. | Local only. |
| Engine floor | Copy `package.json`, `package-lock.json`, and `.npmrc` to a temp directory and run system `npm ci` on Node `v24.19.0` | Exit 1. npm error `EBADENGINE`: required `>=26.13.0 <27`, actual `v24.19.0`. The repo `node_modules` was not used for this check. | Local only. |
| Verify | `pwsh -NoProfile -File .\scripts\Verify.ps1` after the type error was removed | Exit 0. Printed Node `v26.13.0` and npm `11.20.0` from the toolchain `npm-cli.js`. Typecheck, build, and 7 tests passed. | Local only. |
| Verify from system npm | System Node `v24.19.0` on `PATH`, then `npm run verify` | Exit 0. The script still selected toolchain Node `v26.13.0` and npm `11.20.0` before the three stages. | Local only. |
| CLI process | Toolchain `node` `spawnSync` of `dist/cli.js` in a temp directory whose name contains a space | `--help`, `-v`/`--version`, and no arguments: exit 0, stderr empty. Version stdout is `agento 0.1.0\n`. `init`: exit 1, stdout empty, stderr `error: unknown command: init\nRun agento --help.\n`. `--help status`: the same shape for `status`. `.crew` was not created. | Local only. |
| Bin shim | Toolchain `npm install --prefix <temp> C:\code\agento`, then `node_modules\.bin\agento.cmd` | Shim existed. `--version` exit 0, stdout `agento 0.1.0`. `story add` exit 1 with the unknown-command text. The prefix had no `.crew`. | Local only. |
| Native failure | Append `export const nativeStageFailure: number = "fail";` to `src/main.ts`, run `pwsh -NoProfile -File .\scripts\Verify.ps1` | Exit 1. Typecheck reported `src/main.ts(40,14): error TS2322`. Build and test output were absent. Direct `spawnSync` of that `tsc` also returned status 1. | Local only. |
| Restore | Remove that export and rerun `pwsh -NoProfile -File .\scripts\Verify.ps1` | The symbol is gone. Exit 0. 7 tests passed. `Test-Path .\.crew` was false. | Local only. |
| Repository `.crew` | `Test-Path .\.crew` | False after the CLI runs and the final gate. | Local only. |
| Remote CI | Not run. No push. | `.github/workflows/ci.yml` is prepared. There is no Actions run URL. | Unverified. |

`SHASUMS256.txt.sig` was not checked. Integrity evidence is the SHA-256 comparison with the official `SHASUMS256.txt` line and the hash stored in the installer.

## Decisions

- Local pin is the official Node.js `26.13.0` zip, not the machine's Node 24. Actions uses the contract value `node-version: "26"` plus `check-latest: true`, because hosted images cache Node 22 and 24 and an old cached 26.x could sit below `26.13.0`. Current `latest-v26.x` is `26.13.0`.
- The Windows x64 archive hash recorded on 2026-11-03 is `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a`. The arm64 zip hash is pinned too. The installer refuses the archive when the download, the official checksum line, and the pin disagree.
- TypeScript is `7.0.2` and `@types/node` is `26.6.6`. Product tests use `node:test`. Pester was not added. The lockfile includes TypeScript's optional platform packages.
- `scripts/Verify.ps1` runs the `npm-cli.js` shipped inside the selected Node directory. The Windows `npm.cmd` shim can hand execution to a prefix npm from another install; calling `npm-cli.js` with the selected `node.exe` keeps the gate on npm `11.20.0`.
- `.npmrc` sets `engine-strict=true`. That rejects `npm ci` on Node 24. It does not stop an older npm from launching `npm run verify`; the verify script still switches to the pinned Node 26 toolchain before typecheck.
- Help describes only help and version. No command word, including a lone valid `--root`, prints that help and does not touch the filesystem. Option syntax errors (`unknown`, `duplicate`, `invalid`, and a missing `--root` value) are reported before help or version. When the parse succeeds and help is absent, `--version`/`-v` prints the package version even if command words are also present. `--help` with a command word is the unknown-command error. There is no known subcommand in this build.
- `--version` reads `version` from the `package.json` one directory above the compiled entry, so a packed install can print the shipped version. The candidate text is `agento 0.1.0`.
- Runner PowerShell was checked from `actions/runner-images` on 2026-11-03. Windows Server 2025 readme image `20261021.299.1` lists PowerShell 7.6.7, and the 2026-10-30 image update lists 7.6.9. Ubuntu 24.04 and 26.04 readmes list PowerShell 7.6.9. `ubuntu-latest` is moving to 26.04 through 2026-11-19. Both current images meet `pwsh` 7.6.0, so the workflow does not install another PowerShell. It fails the job if the runner is older.
- Action pins, from `gh api` commit lookups on 2026-11-03: `actions/checkout` `v7.0.1` commit `3d3c42e5aac5ba805825da76410c181273ba90b1` (current major; v7 blocks unsafe fork checkout on `pull_request_target`) and `actions/setup-node` `v7.1.0` commit `949feb2413d6458794dcd2491c4babbbce0c15c1` (current release). The workflow requests only `contents: read` and does not use T3, Tailscale, npm tokens, or Forgejo.
- No license field was added. A left that choice open, and B does not need it to verify.
- The contract was not changed.

## Open points

- Remote Windows/Linux Actions has not run. Who can produce that evidence: the coordinator or user, by committing and pushing the workflow. B was not allowed to push.
- `SHASUMS256.txt.sig` was not verified. The SHA-256 check above is the integrity evidence.
- npm account, scope, and trusted publishing remain publication prerequisites. They do not block B or C. The package stays `private: true`.
- Help for a known subcommand has no positive B case because B implements no subcommand. C owns that text when it adds ledger commands.

## Resume

Coordinator: review this report and the foundation, then update the shared epic row and current checkpoint. The next backlog item is C, the manual ledger. C's dependency is B's local gate, which passed here. C is ready to assign after that acceptance. It was not started.

## Proposed shared status

Set B to `in-review` until the coordinator accepts the evidence. Suggested epic row:

```text
| B | enabler task | F1 | [Foundation and CI](backlog/B-foundation.md) | A contract accepted | in-review | [reports/B.md](reports/B.md); local verify passed on Node v26.13.0; Actions prepared, not run |
```

In `checkpoints/current.md`, record HEAD `dc6e3c47aefa974f48124edeae934e471aa99bbe`, uncommitted B foundation plus the existing planning changes, local gate passed, remote CI not run, and the next action as review of `reports/B.md` before assigning C. Leave C at `backlog` until that review accepts B.
