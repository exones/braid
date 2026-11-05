# braid

braid is a TypeScript/Node.js CLI for tracking epics and work items in a local manual ledger. PowerShell provides build and verification automation. GitHub hosts source and Actions; npm is the selected package registry. This build does not dispatch agents.

Project and CLI name: **braid**. Use `braid` as the executable, for example `braid --help` and `braid --version`. See the [naming decision](docs/cli-name.md). The package is public `@exones/braid`. This source is version `0.1.1`. The registry `latest` is `0.1.0`. The command remains `braid`. Source is [exones/braid](https://github.com/exones/braid). The former unscoped name `agento` is a different public package, version 0.1.2 on 2026-11-03.

## Start here

This build implements the schema 1 manual ledger: `init`, `new`, `status`, and `story add/start/block/complete`. See the [contract](docs/seed-contract.md). Completing an item records a manual note; independent verification remains a separate step.

For how work is planned, assigned to agents, reviewed and merged, see the [workflow](.agents/skills/braid-coordinate/references/workflow.md) and [AGENTS.md](AGENTS.md).

## Build and verify

The seed requires Node.js `>=26.13.0 <27`, PowerShell 7.6 or newer (`pwsh`), and Pester 5.5 or newer for the PowerShell tests (`Install-PSResource -Name Pester -Version 5.7.1 -Scope CurrentUser`; CI installs it when the runner lacks it). A compatible `node` already on `PATH`, with the npm that shipped in that same install, is used as-is. Otherwise, on Windows, the installer reuses or downloads the official Node.js `26.13.0` archive into `%LOCALAPPDATA%\braid\toolchains`. `BRAID_TOOLCHAIN_DIR` can name an absolute alternate root; it does not change the pin or the checksums. The installer does not replace the system Node.js, and it does not read, migrate, or delete a checkout-local `.tools/` directory. `.tools/`, `node_modules/`, `dist/`, and `.braid/` are gitignored. `.agents/` skills and `epics/` evidence stay tracked.

From the repository root:

```powershell
$nodeDir = pwsh -NoProfile -File .\scripts\Install-NodeToolchain.ps1
$env:Path = "$nodeDir;$env:Path"
node --version
npm ci
npm run verify
```

The installer writes progress to stderr and writes only the toolchain directory to stdout. `node --version` prints the selected Node.js version: any compatible 26.x already on `PATH`, or `v26.13.0` for the Windows fallback. That fallback downloads `https://nodejs.org/dist/v26.13.0/`, checks the archive SHA-256 against that directory's `SHASUMS256.txt`, and also requires the checksum pinned in `scripts/Install-NodeToolchain.ps1`. The published directory is `node-v26.13.0-<platform>` (`win-x64` or `win-arm64`). A later run reuses it offline when `node.exe`, the bundled npm, and `.braid-toolchain.json` still match the pin, platform, and archive hash. A relative `BRAID_TOOLCHAIN_DIR`, a corrupt completed directory, or a lock held longer than 120 seconds fails with the directory and the recovery step. The corrupt directory is left in place. Other versions are not replaced.

`.npmrc` sets `engine-strict=true`, `strict-allow-scripts=true`, `allow-git=none`, and `allow-remote=none`. `npm ci` refuses a Node.js older than 26.13.0, including this machine's default 24.x install. It also refuses an unreviewed dependency install script, a git dependency, and a remote URL dependency. `npm run verify` can be launched by that older npm; `scripts/Verify.ps1` uses the same resolution as the installer and runs the npm that shipped with the selected Node.js.

Both gates run `scripts/Verify.ps1`, which selects the toolchain first.

`npm run verify` is the quick offline pre-PR gate (about 20 seconds) and the `gate` in [BRAID.md](BRAID.md):

1. Tracked Markdown relative links and heading anchors, using pinned `remark-cli` and `remark-validate-links`. The check runs with its working directory set to the repository being scanned. `inspiration/` and external URLs are excluded. Paths listed as frozen in `scripts/markdown-link-exclusions.json` (closed records kept as written) are not link-checked, but their text still is. A skill under `.agents/skills/<name>/` must not link outside its own folder.
2. Tracked-text LF line endings and trailing whitespace. The check reads Git index blobs and worktree bytes, so a clean checkout and a local edit are both covered.
3. The OIDC release-shape guard.
4. `npm run typecheck` (`tsc -p tsconfig.json --noEmit`), `npm run build` (`tsc -p tsconfig.build.json`) and `npm run test` (`node --test --test-reporter spec test`, every suite under `test/`).

`npm run verify:full` (`Verify.ps1 -Full`) is what CI and the release workflow run. It adds the tooling tests and the package proof:

- The docs-gate negatives: a disposable repository that must fail for a broken link or anchor, a CR line ending, trailing whitespace, and a skill linking outside its folder, and must pass for a broken link under a frozen path.
- The install-policy guard: real installs that `.npmrc` must refuse.
- The shared Node.js toolchain fixture: PATH precedence, shared-store reuse, checksum and metadata failures, concurrency, lock timeout, and interruption, in disposable roots without downloading Node.js.
- `scripts/Test-Pester.ps1`, which runs the Pester suites under `test/pester/`. New PowerShell tests go there.
- `scripts/Test-Package.ps1`, which rebuilds, runs `npm pack --ignore-scripts`, installs that exact tarball in a temporary directory outside this checkout, and runs the ledger scenario through the installed `braid` executable.

Run `verify:full` locally when you change those tools, `.npmrc`, packaging or the release workflow. External skill validators are not part of either gate; run them when a change edits skill content.

Both stop on the first native command with a nonzero exit code and return that code. Dependencies must already be installed with `npm ci`. A dirty worktree is a pre-commit probe. GitHub Actions sets `BRAID_REQUIRE_CLEAN=1`, so the hosted pack must come from a clean checkout. The tarball and its provenance file are written to `artifacts/package/` and are not committed.

## Braid skills in other projects

The agent skills `braid-coordinate` and `braid-worker` are developed in `.agents/skills/` and can drive work in any repository. Each skill folder is self-contained: the docs gate fails if a skill links outside its own folder.

To make them available to Cursor, Codex and Claude in every project, install them from a committed ref:

```powershell
pwsh -NoProfile -File .\scripts\Install-Skills.ps1               # from main
pwsh -NoProfile -File .\scripts\Install-Skills.ps1 -Ref <branch>  # to try a branch
```

The script copies `.agents/skills/braid-*` from that ref into `~/.cursor/skills`, `~/.codex/skills`, `~/.claude/skills` and `~/.braid/skills`, and writes `.braid-install.json` (ref and commit) into each installed skill. Uncommitted edits are never installed. To update after a skill change is merged, run it again. A folder of the same name that the script did not install is left alone unless `-Force` is given. `-Target` replaces the default folders.

A target repository needs a `BRAID.md` at its root with the facts the skills read: the `gate` command, the `main` branch, the `epics` folder, the required `ci` checks, how to `run` the app, and the models per role. Start from the [template](.agents/skills/braid-coordinate/assets/braid-md.md); this repository's own [BRAID.md](BRAID.md) is an example. Add the repository as a T3 project and start the coordinator there.

## CLI

Verification compiles the executable to `dist/cli.js`. `package.json` maps the `braid` bin to that file. This checkout does not put `braid` on `PATH` and does not install a global copy. `package.json` sets `"private": false` for public `@exones/braid`. This checkout does not publish `0.1.1`. To run from source, use the compiled entry:

```powershell
node .\dist\cli.js --help
node .\dist\cli.js --version
node .\dist\cli.js --root "C:\work\demo project" init
```

In the examples below, `braid` means that compiled entry unless a section says the command is the installed executable. Ledger commands do not call T3, Git, or the network.

`--help` and `-h` print help to stdout and exit 0. With no arguments, behavior matches `--help`. Help lists the ledger commands and includes `Completion is a manual record, not gate acceptance.` Help for a known command describes that command. `--help` with an unknown command word exits 1. When help is absent, `--version` and `-v` print one stdout line, `braid 0.1.1`, and exit 0, including when other arguments are present. The version text is the `version` field of the `package.json` shipped beside the compiled entry.

### Manual ledger

Schema 1 stores one manual epic ledger under `<root>/.braid/`. A directory named `.crew/` is not the ledger. This unreleased correction does not migrate, alias, or delete that directory or its contents. The root defaults to the working directory. The epic id is always an explicit argument. Stories, tasks, and spikes share the `story` commands. `--kind` selects the record and defaults to `story`.

```powershell
node .\dist\cli.js init
node .\dist\cli.js new DEMO-001 --title "Demo ledger" --outcome "Track one story by hand"
node .\dist\cli.js story add DEMO-001 S --title "Ship the ledger" --kind story --note "operator note"
node .\dist\cli.js story start DEMO-001 S --next "Write the ledger."
node .\dist\cli.js story block DEMO-001 S --reason "Waiting on review notes"
node .\dist\cli.js story start DEMO-001 S
node .\dist\cli.js story complete DEMO-001 S --evidence "Reviewed the manual record"
node .\dist\cli.js status DEMO-001
```

`story start` from `backlog` prints `started ... in-progress`. `story start` from `blocked` prints `resumed ... in-progress`. `story complete` prints `completed ... manual`. Status shows a done item with `evidence: manual record; not gate acceptance`. That line is the manual record. The CLI does not check the evidence text against a commit, a test run, or a review.

`init` is idempotent for valid schema 1. A second `init` exits 0, prints `already initialized schema 1`, and does not rewrite state or events, even when the event log is unhealthy. `init` does not repair that log. `new` and `story` are not idempotent. Repeating them for an existing id exits 2 and leaves both ledger files unchanged. An invalid transition also exits 2 and leaves the files unchanged.

`task`, `spike`, `story resume`, `story cancel`, and `story set` are unknown commands. There is no command that sets an arbitrary state. `braid task` exits 1 with:

```text
error: unknown command: task
Run braid --help.
```

### State, events, and recovery

`.braid/state.json` is authoritative. `.braid/events.jsonl` is an append-only log of accepted mutations. It is not a replay source. Schema 1 has no repair, replay, or crash-recovery command, and it creates no backup file. The ledger does not edit files under `epics/`.

A mutation writes the next document to `.braid/state.json.tmp`, syncs and closes that handle, then renames the temp file directly over `.braid/state.json` in the same directory. The live state file is not deleted or renamed away first. The event line is appended and synced after that rename. `init`, `new`, `status`, and `story` acquire `.braid/lock` by creating that directory. The first try is immediate. Retries are every 100 ms until 5000 ms after the first try. The CLI does not steal a stale lock. If a process stops while holding the lock, the directory stays. Remove `.braid/lock` only after confirming that no `braid` process is using that root.

These boundaries are what the tests cover:

- A failed replacement before the rename commits leaves the previous state and events in place. `.braid/state.json.tmp` can remain for diagnosis. The CLI does not promote a temp file or an operator backup.
- If the rename commits and the event append then fails, the command exits 5 and prints `error: state updated to revision <n> but the event append failed; not rolled back`. Run `status` before deciding whether to retry. The new state may already be committed. The CLI will not roll it back.
- Status can display committed state when the event file is missing, ends in a partial line, or its complete lines are a contiguous prefix behind the state revision. It warns and does not repair the log. A later mutation refuses those layouts, so a new event cannot hide a gap. Duplicate, skipped, or ahead revisions fail and are left untouched.
- Unknown schema versions, invalid JSON, and invalid state are left byte-for-byte unchanged.
- A symbolic link or Windows junction used as `.braid`, and a non-regular `state.json`, `events.jsonl`, or `state.json.tmp`, is rejected and not opened.

A kill or power loss during the rename or sync is not tested. Same-directory replacement is not a claim of filesystem crash durability. Reconciling a gap, a partial line, or a committed state with a missing event is a manual operator action after copying the diagnostic files aside.

## Install a pinned controller

Development runs pin the published `@exones/braid@0.1.0` controller. Install that verified tarball outside the source checkout. Keep the sibling `braid-0.1.0.provenance.json` with the tarball. That file records version `0.1.0`, the git revision that was packed, whether the worktree was dirty, and the tarball's SHA-256. `braid --version` prints `braid 0.1.0`. It does not print the git revision. Do not use `npm link`, and do not install from a path inside the checkout.

The examples below install that `0.1.0` controller. They do not publish this source's `0.1.1` candidate.

```powershell
$prefix = "C:\tools\braid 0.1.0"
$tarball = "C:\tools\braid-0.1.0.tgz"
New-Item -ItemType Directory -Force -Path $prefix | Out-Null
Set-Location -LiteralPath $prefix
npm init --yes
npm install --ignore-scripts --omit=dev --engine-strict --no-fund --no-audit --no-package-lock $tarball
$braid = Join-Path $prefix "node_modules\.bin\braid.ps1"
& $braid --version

$demo = "C:\work\controller demo"
New-Item -ItemType Directory -Force -Path $demo | Out-Null
& $braid --root $demo init
& $braid --root $demo new DEMO-002 --title "Pinned controller" --outcome "Track one disposable epic by hand"
& $braid --root $demo story add DEMO-002 S --title "Install the controller" --kind story
& $braid --root $demo status DEMO-002
```

On Linux, the executable path is `node_modules/.bin/braid`. Publishing, tagging, and starting the next stage are separate decisions. See [npm distribution](docs/npm-distribution.md).

## Continuous integration

`.github/workflows/ci.yml` runs `npm ci` and `npm run verify:full` on `windows-latest` and `ubuntu-latest` with `shell: pwsh` and Node.js `26`, for pull requests and for pushes to `main` and `epic/**` branches. Setup-node puts that runtime on `PATH`, so CI uses it instead of the shared Windows store. The job fails if `pwsh` is older than 7.6.0. Verification requires a clean checkout and uploads `artifacts/package/` as a workflow artifact. That upload is not a GitHub Release and not an npm publication.

The workflow uses pinned checkout, setup-node, and upload-artifact actions and the runner's PowerShell installation. It needs no T3 access, private infrastructure, or npm publishing credentials. `.github/workflows/release.yml` is a manual dispatch and is not part of this pull-request gate.

## Durable context

- [Workflow](.agents/skills/braid-coordinate/references/workflow.md): epics, item briefs, tiers, branches, merges, and checks.
- [Decisions](docs/decisions.md): current requirements and their rationale.
- [Roadmap](docs/roadmap.md): capability stages and bootstrap promotion gates.
- [Seed contract](docs/seed-contract.md): schema 1 command and storage behavior.
- [Coordinator skill](.agents/skills/braid-coordinate/SKILL.md) and [worker skill](.agents/skills/braid-worker/SKILL.md): how agents plan epics and do items.
- [npm distribution](docs/npm-distribution.md): selected release path and account/setup steps needed before publication.
- [Epics](epics/README.md): current and past epics.
- Original MVP plan `t3_multi-agent_mvp_86005e32.plan.md` (gitignored local input, not a tracked file): longer-term design input. Its PowerShell-only implementation and original milestone order have been superseded by the decisions and roadmap above.
- [Inspiration](inspiration/README.md): reference material; its historical permissions, hosts, credentials, and deployment instructions do not authorize actions for this project.

The next implementation agent should preserve these files and continue from the current checkpoint. A chat transcript must not be required to continue.
