---
id: TASK-7.2
title: The installer also installs braid
status: Done
assignee: []
created_date: '2026-11-14T11:18:00Z'
updated_date: '2026-11-14T12:03:00Z'
labels:
  - kind:story
  - tier:S
  - ask:process
milestone: m-4
dependencies:
  - TASK-7.1
parent_task_id: TASK-7
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
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
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Running the installer from a ref installs that ref's braid globally and braid --version matches; -SkipCli leaves the CLI alone
- [x] #2 Pester tests cover the CLI step with npm stubbed
- [x] #3 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Install-Skills.ps1: add -SkipCli, plus test seams -NpmCommand and -BraidCommand (default npm, braid).
2. Reorder: collision checks first, then the CLI step, then stamping and copying, so a CLI failure leaves skills untouched.
3. CLI step: export the whole ref to a temp folder, run npm ci, npm run build, npm pack, npm install -g <tarball>, then check braid --version prints "braid <package.json version>"; fail otherwise. Record the version in the stamp (cliVersion).
4. Pester: existing tests pass -SkipCli; new tests stub npm and braid (scripts in TestDrive): command sequence, global install of the tarball, version mismatch fails, -SkipCli never calls npm, missing package.json fails.
5. README: install and installer behavior.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Changed: scripts/Install-Skills.ps1 now also installs the braid CLI from the same ref as the skills: npm ci, npm run build, npm pack, npm install -g <tarball>, then checks `braid --version` prints `braid <version>`; the version is recorded as cliVersion in the stamp. The CLI step runs before any skill is copied, so a failure leaves installed skills untouched. -SkipCli skips it; -NpmCommand and -BraidCommand are test seams. README documents it.
Why: the skills must always be able to call a matching braid.
Validation: npm run verify passes locally; 5 new Pester tests with npm and braid stubbed (command sequence, version mismatch, npm failure, missing package.json, -SkipCli); CI green on Windows and Ubuntu. The real installer was not run against this machine's global npm.
Open: nothing.
For later items: the stamp gained an optional cliVersion field; the skills' missing-braid message (TASK-7.3) should point to the README "Braid skills in other projects" section. Possible later addition: an -Uninstall or a check mode that reports installed skill/CLI versions against a ref.
Needs the user: none
<!-- SECTION:FINAL_SUMMARY:END -->
