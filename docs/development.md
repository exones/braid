# Development

How to build, test and verify braid from a checkout. braid is a strict TypeScript CLI on Node.js, ESM, compiled to `dist/`; PowerShell provides the build and verification automation. GitHub hosts the source and Actions; npm (`@exones/braid`) is the package registry ([npm distribution](npm-distribution.md)). Project facts and limits for agents are in [AGENTS.md](../AGENTS.md); how work is planned, reviewed and merged is in the [workflow](../.agents/skills/braid/references/workflow.md).

## Requirements

- Node.js `>=26.13.0 <27`.
- PowerShell 7.6 or newer (`pwsh`).
- Pester 5.5 or newer for the PowerShell tests: `Install-PSResource -Name Pester -Version 5.7.1 -Scope CurrentUser`. CI installs it when the runner lacks it.

`.tools/`, `node_modules/`, `dist/` and `.braid/` are gitignored. `.agents/` skills and `epics/` evidence stay tracked.

## Node.js toolchain

A compatible `node` already on `PATH`, with the npm that shipped in that same install, is used as-is. A version-manager launcher such as Volta's counts too: the runtime it points to (`process.execPath`) is what gets checked and used. With Volta, `package.json` pins `"volta": { "node": "26.13.0" }`, so `node` inside this checkout is already the right version.

Otherwise, on Windows, the installer reuses or downloads the official Node.js `26.13.0` archive into `%LOCALAPPDATA%\braid\toolchains`. `BRAID_TOOLCHAIN_DIR` can name an absolute alternate root; it does not change the pin or the checksums. The installer does not replace the system Node.js, and it does not read, migrate or delete a checkout-local `.tools/` directory.

From the repository root:

```powershell
$nodeDir = pwsh -NoProfile -File .\scripts\Install-NodeToolchain.ps1
$env:Path = "$nodeDir;$env:Path"
node --version
npm ci
npm run verify
```

The installer writes progress to stderr and only the toolchain directory to stdout. `node --version` prints the selected Node.js version: any compatible 26.x already on `PATH`, or `v26.13.0` for the Windows fallback.

That fallback downloads `https://nodejs.org/dist/v26.13.0/`, checks the archive SHA-256 against that directory's `SHASUMS256.txt`, and also requires the checksum pinned in `scripts/Install-NodeToolchain.ps1`. The published directory is `node-v26.13.0-<platform>` (`win-x64` or `win-arm64`). A later run reuses it offline when `node.exe`, the bundled npm and `.braid-toolchain.json` still match the pin, platform and archive hash. A relative `BRAID_TOOLCHAIN_DIR`, a corrupt completed directory, or a lock held longer than 120 seconds fails with the directory and the recovery step. The corrupt directory is left in place. Other versions are not replaced.

## Install policy

`.npmrc` sets `engine-strict=true`, `strict-allow-scripts=true`, `allow-git=none` and `allow-remote=none`. `npm ci` refuses a Node.js older than 26.13.0, an unreviewed dependency install script, a git dependency and a remote URL dependency. `npm run verify` can be launched by an older npm: `scripts/Verify.ps1` uses the same resolution as the installer and runs the npm that shipped with the selected Node.js.

## Running the CLI

After `npm run build`, run `node dist/cli.js <command>`, for example `node dist/cli.js help`. The commands and exit codes are in [the CLI reference](cli.md).

Focused tests: `npm run build && node --test test/<file>.test.ts`. Pester suites: `pwsh -NoProfile -File scripts/Test-Pester.ps1`. New PowerShell tests are Pester 5 suites under `test/pester/` (`*.Tests.ps1`).

## The gates

Both gates run `scripts/Verify.ps1`, which selects the toolchain first.

`npm run verify` is the quick offline pre-PR gate (about 20 seconds) and the `gate` in [BRAID.md](../BRAID.md):

1. Tracked Markdown relative links and heading anchors, using pinned `remark-cli` and `remark-validate-links`. The check runs with its working directory set to the repository being scanned. `inspiration/` and external URLs are excluded. Paths listed as frozen in `scripts/markdown-link-exclusions.json` (closed records kept as written) are not link-checked, but their text still is. A skill under `.agents/skills/<name>/` must not link outside its own folder, except to another braid skill.
2. Tracked-text LF line endings and trailing whitespace. The check reads Git index blobs and worktree bytes, so a clean checkout and a local edit are both covered.
3. The OIDC release-shape guard.
4. `npm run typecheck` (`tsc -p tsconfig.json --noEmit` and `tsc -p web/tsconfig.json --noEmit` for the board's web app), `npm run build` (`tsc -p tsconfig.build.json` and `vite build --config web/vite.config.ts`) and `npm run test` (`scripts/Test-Node.ps1`: `node --test --test-reporter spec test`, every suite under `test/`, with `--test-concurrency` at half the cores so a gate leaves room for the board; no cap when `CI` is set).

On a machine where several gates may start at once, `braid gate` runs this gate with at most two at a time ([the CLI reference](cli.md)). CI runs `npm run verify:full` directly.

`npm run verify:full` (`Verify.ps1 -Full`) is what CI and the release workflow run. It adds the tooling tests and the package proof:

- The docs-gate negatives: a disposable repository that must fail for a broken link or anchor, a CR line ending, trailing whitespace and a skill linking outside its folder (a braid skill may link to another braid skill), and must pass for a broken link under a frozen path.
- The install-policy guard: real installs that `.npmrc` must refuse.
- The shared Node.js toolchain fixture: PATH precedence, shared-store reuse, checksum and metadata failures, concurrency, lock timeout and interruption, in disposable roots without downloading Node.js.
- `scripts/Test-Pester.ps1`, which runs the Pester suites under `test/pester/`.
- `scripts/Test-Package.ps1`, which rebuilds, runs `npm pack --ignore-scripts`, installs that exact tarball in a temporary directory outside this checkout, and runs `braid --version` and `braid help` through the installed executable.

Run `verify:full` locally when you change those tools, `.npmrc`, packaging or the release workflow. External skill validators are not part of either gate; run them when a change edits skill content.

Both stop on the first native command with a nonzero exit code and return that code. Dependencies must already be installed with `npm ci`. A dirty worktree is a pre-commit probe. GitHub Actions sets `BRAID_REQUIRE_CLEAN=1`, so the hosted pack must come from a clean checkout. The tarball and its provenance file are written to `artifacts/package/` and are not committed.

## Continuous integration

`.github/workflows/ci.yml` runs `npm ci` and `npm run verify:full` on `windows-latest` and `ubuntu-latest` with `shell: pwsh` and Node.js `26`, for pull requests and for pushes to `main`; a push to a braid or story branch (`braid/<number>-<slug>`) starts no run, since the PR runs test the same code (`braid wait` answers a merge on a braid branch from the merged strand's PR run, D71). A push to `main` that only changes files under `epics/` (past records) or `braids/` (briefs, reports and logs) doesn't run CI. Setup-node puts that runtime on `PATH`, so CI uses it instead of the shared Windows store. The job fails if `pwsh` is older than 7.6.0. Verification requires a clean checkout and uploads `artifacts/package/` as a workflow artifact. That upload is not a GitHub Release and not an npm publication.

On Windows the job sets `TEMP` and `TMP` to a folder under `$RUNNER_TEMP` (on D:) before setup-node and `npm ci`. The hosted runner's default temporary folder is on the slow C: drive, and the tests create thousands of small files and Git repositories there; the 0057/A spike measured `node --test` 13–21% faster in paired runs with the move. The two slowest test files are split in two so the test runner can run the halves on separate threads: `done.test.ts` and `done-merge.test.ts` share `test/support/done-fixtures.ts`, and `start.test.ts` and `start-clean.test.ts` share `test/support/start-fixtures.ts`.

The workflow uses pinned checkout, setup-node and upload-artifact actions and the runner's PowerShell installation. It needs no T3 access, private infrastructure or npm publishing credentials. `.github/workflows/release.yml` is a manual dispatch and is not part of the pull-request gate.

## Contributing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), and PRs are merged with merge commits. Run `npm run verify` before every PR. Keep code and scripts cross-platform: CI runs on Windows and Ubuntu.
