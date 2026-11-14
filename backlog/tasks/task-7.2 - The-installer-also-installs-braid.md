---
id: TASK-7.2
title: The installer also installs braid
status: To Do
assignee: []
created_date: '2026-11-14T11:18:00Z'
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
- [ ] #1 Running the installer from a ref installs that ref's braid globally and braid --version matches; -SkipCli leaves the CLI alone
- [ ] #2 Pester tests cover the CLI step with npm stubbed
- [ ] #3 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
