# braid

braid is a TypeScript/Node.js CLI for agent-driven work. PowerShell provides build and verification automation. GitHub hosts source and Actions; npm (`@exones/braid`) is the package registry. Licensed under [MIT](LICENSE).

The CLI reads the braids (work items) and strands (their parts) in a repository's `braids/` folder; the format is in [docs/braids-format.md](docs/braids-format.md):

```powershell
braid list          # braids and their strands, with status and run order
braid view 0002     # one braid: fields, report, logs, strands and its brief
braid view 0002/A   # one strand
braid --version     # print the version
braid help          # show usage
```

For how work is planned, assigned to agents, reviewed and merged, see the [workflow](.agents/skills/braid/references/workflow.md) and [AGENTS.md](AGENTS.md).

## Build and verify

braid requires Node.js `>=26.13.0 <27`, PowerShell 7.6 or newer (`pwsh`), and Pester 5.5 or newer for the PowerShell tests (`Install-PSResource -Name Pester -Version 5.7.1 -Scope CurrentUser`; CI installs it when the runner lacks it). A compatible `node` already on `PATH`, with the npm that shipped in that same install, is used as-is. A version-manager launcher such as Volta's counts too: the runtime it points to (`process.execPath`) is what gets checked and used. With Volta, `package.json` pins `"volta": { "node": "26.13.0" }`, so `node` inside this checkout is already the right version. Otherwise, on Windows, the installer reuses or downloads the official Node.js `26.13.0` archive into `%LOCALAPPDATA%\braid\toolchains`. `BRAID_TOOLCHAIN_DIR` can name an absolute alternate root; it does not change the pin or the checksums. The installer does not replace the system Node.js, and it does not read, migrate, or delete a checkout-local `.tools/` directory. `.tools/`, `node_modules/`, `dist/`, and `.braid/` are gitignored. `.agents/` skills and `epics/` evidence stay tracked.

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
- `scripts/Test-Package.ps1`, which rebuilds, runs `npm pack --ignore-scripts`, installs that exact tarball in a temporary directory outside this checkout, and runs `braid --version` and `braid help` through the installed executable.

Run `verify:full` locally when you change those tools, `.npmrc`, packaging or the release workflow. External skill validators are not part of either gate; run them when a change edits skill content.

Both stop on the first native command with a nonzero exit code and return that code. Dependencies must already be installed with `npm ci`. A dirty worktree is a pre-commit probe. GitHub Actions sets `BRAID_REQUIRE_CLEAN=1`, so the hosted pack must come from a clean checkout. The tarball and its provenance file are written to `artifacts/package/` and are not committed.

## Braid skills in other projects

The agent skills `braid`, `braid-worker` and `braid-reviewer` are developed in `.agents/skills/` and can drive work in any repository. Each skill folder is self-contained: the docs gate fails if a skill links outside its own folder.

- `braid` is the one skill you talk to, for work of any size: a goal, a single story, or "run TASK-12". It decides whether the work is a story or a goal, keeps the items as [Backlog.md](https://github.com/MrLesk/Backlog.md) tasks in the target repository, and launches the workers.
- `braid-worker` and `braid-reviewer` are the skills of the worker and reviewer threads a coordinator launches. You don't start them yourself.
- Ordinary questions and small direct edits need no skill.

To make them available to Cursor, Codex and Claude in every project, install them from a committed ref:

```powershell
pwsh -NoProfile -File .\scripts\Install-Skills.ps1               # from main
pwsh -NoProfile -File .\scripts\Install-Skills.ps1 -Ref <branch>  # to try a branch
```

The script copies `.agents/skills/braid` and `.agents/skills/braid-*` from that ref into `~/.cursor/skills`, `~/.codex/skills`, `~/.claude/skills` and `~/.braid/skills`, and writes `.braid-install.json` (ref and commit) into each installed skill. Uncommitted edits are never installed. To update after a skill change is merged, run it again. A folder of the same name that the script did not install is left alone unless `-Force` is given. Every target is checked before anything is replaced, and an installed braid skill that is no longer in the ref (such as the old `braid-coordinate`) is removed. `-Target` replaces the default folders.

A target repository needs a `BRAID.md` at its root with the facts the skills read: the `gate` command, the `main` branch, the required `ci` checks (`none` if it has no hosted CI), `auto: allowed` to permit auto mode, optional `shell`, `setup` and `test` commands, how to `run` the app, and `models`: the provider, model and options for each role, with optional overrides per tier (`worker.L`) or kind (`worker.spike`); the tier key wins over the kind key, then the plain role. A role may name a skill, such as `braid-reviewer` for the reviewer. Agents keep screenshots and scratch files in `~/.braid/artifacts/`, outside every checkout.

To set up a target repository for `braid`:

1. Install Backlog.md once per machine, at the pinned version: `npm install -g backlog.md@1.55.3` (with Volta: `volta install backlog.md@1.55.3`).
2. Create `BRAID.md` from the [`braid` template](.agents/skills/braid/assets/braid-md.md). It adds the `backlog` folder and the rule for calling Backlog.md (on Windows the native `backlog.exe` from pwsh 7, never `npx` or `backlog.cmd`).
3. Copy [backlog-config.yml](.agents/skills/braid/assets/backlog-config.yml) to `backlog/config.yml` and set `project_name`. Don't run `backlog init`, and don't add a Backlog.md block to `AGENTS.md`. If you skip this step, `braid` does it on first use.
4. Commit both on `main` and push, add the repository as a T3 project and start a thread there with `braid`.

**Auto mode.** You merge every PR yourself, unless you tell `braid` to merge one ("merge it" after its recap, and it merges exactly the commit it showed you) or auto mode merges a subtask into its epic branch; auto mode never merges a story or the final PR into `main`. For a goal, you can ask for auto mode if `BRAID.md` has `auto: allowed` and real CI (`ci` not `none`): `braid` then merges each subtask PR into the epic branch itself once the worker is green, an independent review found nothing blocking, CI is green and nobody flagged a stop case, and it leaves a comment on the PR saying why. It stops and asks you on any stop case, when a review is still blocking after 2 rounds of fixes, or when branch protection refuses; "stop auto" or "pause" switches it off. A goal's plan is merged into its epic branch, so `main` gets its tasks with the final PR, and the board on `main` shows each running subtask's own status.

To see the items, run `backlog browser` (or `backlog board`) in your own checkout of `main`. It also shows tasks that so far exist only on item branches. A task whose PR is waiting for your merge already reads Done there, because the worker sets Done in that PR. Choose "Group by milestone" to see each goal in its own lane. Use the browser to look, not to edit: it saves edits into the checkout it runs from, and a worker's worktree belongs to the worker. Ask `braid` for task changes.

This repository's own [BRAID.md](BRAID.md) and `backlog/` are an example; `epics/` holds its past records, read-only. Why `braid` keeps items in Backlog.md is decision D30 in [docs/decisions.md](docs/decisions.md).

## CLI

After `npm run build`, run `node dist/cli.js --version` or `node dist/cli.js help`. Both exit 0. An unknown command prints an error to stderr and exits 1.

## Continuous integration

`.github/workflows/ci.yml` runs `npm ci` and `npm run verify:full` on `windows-latest` and `ubuntu-latest` with `shell: pwsh` and Node.js `26`, for pull requests and for pushes to `main` and `epic/**` branches. A push that only changes files under `epics/` (past records) or `backlog/` (Backlog.md tasks) doesn't run CI. Setup-node puts that runtime on `PATH`, so CI uses it instead of the shared Windows store. The job fails if `pwsh` is older than 7.6.0. Verification requires a clean checkout and uploads `artifacts/package/` as a workflow artifact. That upload is not a GitHub Release and not an npm publication.

The workflow uses pinned checkout, setup-node, and upload-artifact actions and the runner's PowerShell installation. It needs no T3 access, private infrastructure, or npm publishing credentials. `.github/workflows/release.yml` is a manual dispatch and is not part of this pull-request gate.

## Durable context

- [Workflow](.agents/skills/braid/references/workflow.md): items, tiers, branches, merges, and checks.
- [Decisions](docs/decisions.md): current requirements and their rationale.
- [Roadmap](docs/roadmap.md): what comes next.
- [braid skill](.agents/skills/braid/SKILL.md) (goals and stories in Backlog.md), [worker skill](.agents/skills/braid-worker/SKILL.md) and [reviewer skill](.agents/skills/braid-reviewer/SKILL.md): how agents plan, do and review items.
- [npm distribution](docs/npm-distribution.md): selected release path and account/setup steps needed before publication.
- [Epics](epics/README.md): past epics, read-only; new work is in `backlog/`.
- Original MVP plan `t3_multi-agent_mvp_86005e32.plan.md` (gitignored local input, not a tracked file): longer-term design input. Its PowerShell-only implementation and original milestone order have been superseded by the decisions and roadmap above.
- [Inspiration](inspiration/README.md): reference material; its historical permissions, hosts, credentials, and deployment instructions do not authorize actions for this project.

The next implementation agent should preserve these files and continue from the current checkpoint. A chat transcript must not be required to continue.
