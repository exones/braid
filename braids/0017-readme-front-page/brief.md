---
id: '0017'
title: "README front page with the brand design"
status: In Progress
labels: ["kind:story", "tier:L", "ask:process"]
dependencies: []
delivery: epic
---

## Goal

Turn `README.md` into the front page of an open-source project: the braid logo from `design/`, a one-line pitch, what braid does and how, a quick start, a board screenshot and links into the docs. The detailed content it holds today moves into `docs/`, kept only where it is still true, so nothing useful is lost. Readers: someone landing on the GitHub repository for the first time.

Expected size: about 400 lines in 8 files (mostly moved text), plus one image.

## Start here

- `README.md`: today's content; sort each part into "front page", "moves to docs/" or "out of date, drop".
- `design/README.md`: the brand pack; the logo lockups, colours and the README header snippet.
- `docs/board.md`, `docs/braids-format.md`, `docs/decisions.md` (D16, D29, D31, D33), `docs/roadmap.md`, `docs/npm-distribution.md`: the existing docs the new pages link to and must agree with.
- `AGENTS.md` lines 9 and 33, `BRAID.md` `setup:`, `docs/npm-distribution.md` step 8, `scripts/Test-Pester.ps1` line 2: the places that point at README sections.
- `src/cli.ts` help text and `braid help`: the real command list for the CLI page.

## Change

- `README.md`: rewrite as a front page. Header with the logo (a `<picture>` with the `-reversed` lockup for dark mode and `-color` for light, per `design/README.md`); a short tagline; badges that are true today (CI, MIT licence; no npm badge while nothing is published); "What is braid" (coordinator, workers, reviewers; braids and strands; the ledger in `braids/`; the user merges); "How it works" in a few steps or a small diagram; a board screenshot; "Quick start" (install the skills and CLI with `scripts/Install-Skills.ps1`, add `BRAID.md`, start a thread with `braid`); a short CLI taste (a handful of commands, not the full list); a documentation table; contributing in two lines pointing to `docs/development.md`; licence.
- `docs/getting-started.md` (new): installing the skills and CLI, `Install-Skills.ps1` options and behaviour, setting up a target repository and `BRAID.md`, Backlog.md import, auto mode and merging, seeing the board. From README "Braid skills in other projects".
- `docs/cli.md` (new): the full command reference and exit codes (usage errors 1, broken braid files 2), checked against `braid help`.
- `docs/development.md` (new): requirements, the toolchain installer, `.npmrc` policy, `npm run verify` and `verify:full`, CI. From README "Build and verify", "CLI" and "Continuous integration".
- `docs/images/board.png` (new, or a name you choose under `docs/`): a fresh screenshot of `braid board --demo`, no mockup caption.
- `AGENTS.md` line 9 and line 33, `BRAID.md` `setup:`: repoint to `docs/development.md` and `docs/getting-started.md`. Change only those pointers.
- `docs/npm-distribution.md` step 8 and `scripts/Test-Pester.ps1` comment: repoint likewise.

## Already decided

- The user approved repointing `AGENTS.md` and `BRAID.md` from the README to the new docs (2026-11-17); hence tier L and `ask:process`. No other edits to those files.
- Fresh screenshot from `braid board --demo`, not a mockup.
- Images and links are relative paths; they render on GitHub. npm is not published yet (`docs/npm-distribution.md`), so no npm install instructions as the main path.
- Drop "Durable context" as a section: its useful links go in the documentation table; the line about the gitignored MVP plan and "the next implementation agent should…" go.
- D16 holds: the README describes the product and its use, never work status.
- The brand: Ledger Navy `#082A48`, Strand Violet `#7835EF`; GitHub Markdown can't set fonts or colours, so the brand shows through the logo and screenshot only. Don't retype the wordmark.

## Out of scope

- The skills under `.agents/skills/`, CI workflows, the gate scripts' behaviour, `design/` contents.
- Publishing, the GitHub social preview upload or any repository setting (the README may mention the file for the user).
- Rewriting `docs/board.md`, `docs/braids-format.md` or `docs/decisions.md` beyond fixing a link.

## Acceptance

- [ ] The README opens with the logo (light and dark variants) and a one-line pitch, and reads as a project front page: what, how, screenshot, quick start, docs, contributing, licence; under about 120 lines.
- [ ] Every still-true fact from the old README is in `docs/getting-started.md`, `docs/cli.md` or `docs/development.md`, or the report lists what was dropped as out of date and why.
- [ ] `docs/cli.md` matches `braid help` command for command.
- [ ] `AGENTS.md`, `BRAID.md`, `docs/npm-distribution.md` and `scripts/Test-Pester.ps1` no longer point at removed README sections; nothing else in `AGENTS.md` or `BRAID.md` changed.
- [ ] The README renders correctly on GitHub in light and dark mode (checked on the PR branch; screenshots of both in the report's artifacts).

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
