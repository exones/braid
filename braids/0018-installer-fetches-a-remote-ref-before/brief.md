---
id: '0018'
title: "Installer fetches a remote ref before installing"
status: In Progress
labels: ["kind:story", "tier:S", "ask:process"]
dependencies: []
delivery: epic
---

## Goal

`Install-Skills.ps1 -Ref origin/<branch>` installs what is on GitHub now, not a stale local copy of that remote branch. On 2026-11-17, `-Ref origin/main` right after merging PR #111 installed the previous `main` (7e3617b), because only the run without `-Ref` fetches (user, 2026-11-17).

Expected size: about 40 lines in 3 files, with tests.

## Start here

- `scripts/Install-Skills.ps1` lines 15 to 67: the fetch runs only when `-Ref` is empty.
- The installer's Pester suite under `test/pester/`: 0003/C's fixture has a bare `origin` and a stale-local-`main` test to copy.
- `docs/getting-started.md`, "Install the skills and the CLI".

## Change

- `scripts/Install-Skills.ps1`: when `-Ref` names a remote-tracking branch (`origin/<branch>`), run `git fetch origin <branch>` first; a failed fetch stops the install, as without `-Ref`. Other refs (a local branch, a tag, a commit) are installed as they are.
- `docs/getting-started.md`: one clause saying so.

## Already decided

- Fetch only for `origin/<branch>`; a local branch is the user's to update.

## Out of scope

- Remotes other than `origin`; changes to what gets installed.

## Completion

- [ ] `-Ref origin/main` with a stale local `origin/main` installs the remote's head (Pester test)
- [ ] A failed fetch with `-Ref origin/<branch>` stops before anything is installed (Pester test)
- [ ] A local branch or commit ref is installed without a fetch (Pester test)
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
