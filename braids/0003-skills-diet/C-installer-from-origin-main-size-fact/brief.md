---
id: '0003/C'
title: "Installer from origin/main; size fact without braids"
status: In Progress
labels: ["kind:story", "tier:S"]
dependencies: []
order: 5
---

## Goal

Two small fixes: the installer installs what is on GitHub's `main`, and `braid facts` measures only the real change of a PR.

Expected size: about 40 to 100 lines in 5 files, with tests.

## Start here

- `scripts/Install-Skills.ps1` (`$Ref = 'main'`), its Pester test under `test/pester/`, README "braid skills in other projects".
- `src/commands/facts.ts` (the size fact), `docs/braids-format.md`.

## Change

- `Install-Skills.ps1` without `-Ref` runs `git fetch` and installs `origin/main`, not the local `main` (a stale local `main` once installed old skills, 2026-11-13). README and a Pester test follow.
- `braid facts`: the size fact leaves `braids/**` (the item's brief, report and logs) out of the lines changed, as PR-size tools leave out generated files (user, 2026-11-15). `docs/braids-format.md` and a test follow.

## Out of scope

- The skills (0003/A, 0003/B).

## Acceptance

- [x] The installer without `-Ref` fetches and installs `origin/main`; a Pester test covers it
- [x] The size fact ignores `braids/**`; a test covers it

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. `Install-Skills.ps1`: `-Ref` defaults to empty; without it run `git fetch origin main` and use `origin/main` (fetch failure is fatal). With `-Ref` nothing is fetched.
2. `facts.ts`: the numstat for the size fact excludes `braids` with a pathspec.
3. Tests: Pester (stale local main, origin ahead; test repo gets a bare origin, commits are pushed) and a facts test with a big `braids/` change.
4. README and `docs/braids-format.md` text.
