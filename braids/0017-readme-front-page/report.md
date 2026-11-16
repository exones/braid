# Report: 0017 README front page

## What changed

- `README.md` (94 lines) is now a front page: a `<picture>` header with the primary lockup (`-reversed` in dark mode, `-color` in light), the brand line "Orchestrates agents. Keeps the ledger. Braids the work." as the pitch, CI and MIT badges, What is braid, How it works (five steps), a fresh board screenshot, Quick start, a five-command CLI taste, a documentation table, contributing and licence.
- `docs/getting-started.md` (new): the old "Braid skills in other projects": the skills, `Install-Skills.ps1` and its options, `BRAID.md`, setting up a repository, Backlog.md import, merging and auto mode, the board.
- `docs/cli.md` (new): every command `braid help` lists (23, checked by script against the help output), the options, the old README's example block, and exit codes 0, 1, 2 and 5 as `src/cli.ts` returns them. Per-command detail stays in `docs/braids-format.md#commands`, linked, not copied.
- `docs/development.md` (new): the old "Build and verify", "CLI" and "Continuous integration": requirements, toolchain installer, `.npmrc` policy, the two gates, CI, plus a short contributing paragraph from `AGENTS.md` facts.
- `docs/images/board.png` (new): `braid board --demo`, Edge headless, 1440×860 at 2×.
- Pointers: `AGENTS.md` lines 9 and 33, `BRAID.md` `setup:`, `docs/npm-distribution.md` step 8 and the `scripts/Test-Pester.ps1` comment now point at the new docs. Nothing else in `AGENTS.md` or `BRAID.md` changed.

## Dropped as out of date

- "The next implementation agent should preserve these files…" and the line on the gitignored MVP plan file (as the brief decided).
- The README's description of the project's hosting ("GitHub hosts source and Actions; npm is the package registry") is kept in `docs/development.md`, not on the front page.
- `docs/npm-distribution.md` step 8 pointed at "the README procedure" for installing the tarball outside the checkout; the old README had no such procedure. It now points at `scripts/Test-Package.ps1` as described in development "The gates".

## Validation

- `npm run verify` passes with the new files tracked (docs gate: links and anchors in all new pages; 173 tests).
- `docs/cli.md` checked command by command against `node dist/cli.js help` (same output as the installed `braid help`).
- Rendering checked on GitHub on the PR branch, logged out, Edge headless with light and dark colour schemes: the logo switches lockups, badges and screenshot show. Screenshots: `~/.braid/artifacts/agento/0017/readme-light.png` and `readme-dark.png`.

## Open

- The installed `braid` skill (`.agents/skills/braid/SKILL.md` line 16) still tells users to install from "the braid repository's README, 'Braid skills in other projects'". That section is now `docs/getting-started.md`; the README's Quick start still shows the install command. Skills are out of scope here.

For later items: the braid skill's install pointer (above) should name `docs/getting-started.md`; the README links T3 Code at `https://github.com/pingdotgg/t3code`, worth a glance by the user; the social preview upload (`design/social/braid-social-preview.png`) is still a manual repository setting.
Needs the user: process: the PR edits `AGENTS.md` and `BRAID.md` (pointer lines only, approved 2026-11-17); the user merges.
