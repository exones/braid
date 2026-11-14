---
id: '0007/B'
title: "The installer also installs braid"
status: Done
labels: ["kind:story", "tier:S", "ask:process"]
dependencies: ['0007/A']
order: 20
---

Goal: installing the braid skills on a machine also installs the matching `braid` CLI, so the skills can always call it.

Expected size: about 100 to 200 lines with tests.

Start here (read in this order):
- `scripts/Install-Skills.ps1` and its Pester tests under `test/pester/`: how a committed ref is exported and installed, and the `.braid-install.json` stamp.
- `package.json` (`bin`, `files`, `build`) and the README sections on the skills in other projects.

Change:
- The installer builds the CLI from the same ref it installs the skills from (`npm ci`, `npm run build`, `npm pack`) and installs that tarball globally (`npm install -g <tarball>`); then checks that `braid --version` prints the version it installed, and records it in the stamp. `-SkipCli` skips this.
- The README says how to install and what the installer does; the skills' missing-`braid` message (TASK-7.3) points here.

Already decided (don't re-investigate): no npm publishing yet; install from the same ref as the skills; pwsh 7 on Windows and Ubuntu.

Out of scope: publishing, other package managers, the skills' text (TASK-7.3).

## Acceptance

- [x] Running the installer from a ref installs that ref's braid globally and braid --version matches; -SkipCli leaves the CLI alone
- [x] Pester tests cover the CLI step with npm stubbed
- [x] npm run verify passes; CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open

## Plan

1. Install-Skills.ps1: add -SkipCli, plus test seams -NpmCommand and -BraidCommand (default npm, braid).
2. Reorder: collision checks first, then the CLI step, then stamping and copying, so a CLI failure leaves skills untouched.
3. CLI step: export the whole ref to a temp folder, run npm ci, npm run build, npm pack, npm install -g <tarball>, then check braid --version prints "braid <package.json version>"; fail otherwise. Record the version in the stamp (cliVersion).
4. Pester: existing tests pass -SkipCli; new tests stub npm and braid (scripts in TestDrive): command sequence, global install of the tarball, version mismatch fails, -SkipCli never calls npm, missing package.json fails.
5. README: install and installer behavior.
