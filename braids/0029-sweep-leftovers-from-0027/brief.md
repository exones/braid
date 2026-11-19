---
id: '0029'
title: "Sweep: leftovers from 0027"
status: Done
labels: ["kind:task", "tier:L", "sweep", "ask:process"]
dependencies: []
delivery: epic
---

## Goal

Sweep of four leftovers from 0027 (Planning looks at the other open braids): fewer Git processes behind `braid list --open` and `braid check`, the `docs/cli.md` options, one line of the brief template, and a CLI version bump for the format change. Runs after 0027 is merged into `main`: merge `main` into this branch first, since every file it fixes comes with 0027. Approved by the user on 2026-11-18 as one sweep story.

Expected size: about 150 lines in 5 files.

## Start here

- `src/braids/branches.ts`: `braidBranches`, `planBranches`, `gitTree`, `inHead`, `loadLiveBraids`, `loadKnownBraids`: one `merge-base` per ref, `ls-tree -r` of all of `braids/` per branch read, and one `cat-file blob` per file.
- `src/commands/braids.ts`: `listOpen`, `viewItem`; `src/braids/check.ts`: the `related` check.
- `docs/cli.md`, `docs/braids-format.md`.
- `.agents/skills/braid/assets/brief.md`, "Fields".

## Change

1. Leftover 2026-11-18-hr41, from review 0027/B (https://github.com/exones/braid/pull/146#issuecomment-6987584298, https://github.com/exones/braid/pull/146), "braid view on a braid reads every branch for back-links":

   > viewItem (src/commands/braids.ts) calls loadKnownBraids for Linked from:, the same Git scan as braid list --open --no-fetch: braid view 0027 went from about 0.4 s to 3.4 s on this repository, and braid check pays it once any brief has related. A reader that loads only brief.md per braid, with fewer git calls, would bring view, check and list --open back under a second.

   Since then plain `braid view` no longer scans (0027/B: back-links only with `--links`); what remains is `braid list --open`, `braid view --links` and `braid check`. Profile first (count the Git processes and time them on this repository), then cut the processes: one `for-each-ref --no-merged HEAD` (or equivalent) instead of a `merge-base` per ref; one long-running `git cat-file --batch` for every blob read; `ls-tree` limited to the folders needed instead of `-r` of all of `braids/`. Results must stay the same: the existing tests of 0027 pass unchanged. Give the process counts and timings before and after in the report.
2. Leftover 2026-11-18-r8xz, from review 0027/B (https://github.com/exones/braid/pull/146#issuecomment-6988028060), "docs/cli.md lacks braid view --links and --related":

   > docs/cli.md says it mirrors braid help, but its braid view entry has no --links and its braid new and braid edit entries have no --related (both added by 0027/B; braid help and docs/braids-format.md have them). Add the two options so the CLI page matches help.

   Also check `braid list --open` there.
3. Leftover 2026-11-18-6pyw, from review 0027/C (https://github.com/exones/braid/pull/147#issuecomment-6988675551), "Brief template restates what related means":

   > .agents/skills/braid/assets/brief.md, "Fields": the related line repeats "overlaps, takes a decision from, or splits work with", which docs/braids-format.md and the skill Plan step 3 already say. The skills keep each rule in one place; the line should only point at Plan step 3 and say each link also gets a line under "Already decided".

4. Leftover 2026-11-18-5an0, from 0027 (https://github.com/exones/braid/pull/148), "braid --version does not change when the brief format does" (added to this sweep by the user on 2026-11-19):

   > package.json still says 0.1.1 after 0027 added the related front-matter key (PR #148), which a CLI built before it rejects (unknown key: related). Both print braid 0.1.1, so neither the user nor scripts/Install-Skills.ps1 (it records cliVersion in its stamp) can tell an old CLI from a new one. Bumping the version with a format change, or a format version the CLI prints, would make the update visible.

   Bump the version in `package.json` (and its lock file) so this branch's CLI is distinguishable from 0.1.1. Nothing is published (`docs/npm-distribution.md`). Propose in the report how future format changes keep the version honest; a skill or `AGENTS.md` change is not part of this sweep.

## Already decided

- Related to 0028 (Board: fast first open and fast item open, on `braid/0028-board-fast-first-open-and-fast-item-open`, being planned, no brief pushed yet): it may speed up the same branch reads (`loadLiveBraids`) that leftover hr41 is about. Before starting, read its brief (`braid view 0028`); if it already changes the reader, do item 1 on top of it or drop item 1 and say so, and don't duplicate it.
- No behaviour change in what `braid list --open`, `braid view` and `braid check` show.

## Out of scope

- Anything not in the four leftovers.

## Completion

- [x] Git process counts and timings of `braid list --open`, `braid view --links` and `braid check`, before and after, in report.md, with the 0027 tests passing unchanged
- [x] `docs/cli.md` lists `--links`, `--related` and `--open`
- [x] The template's `related` line points at Plan step 3 without restating it
- [x] `braid --version` on this branch prints a version above 0.1.1
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Profile `braid list --open`, `braid view --links` and `braid check` (with one `related`) on this repository: Git processes by kind and time.
2. Reuse 0028's batch reader: share its `cat-file --batch` output parser in `src/braids/gitio.ts` with a synchronous `catBatchSync`, and read every `brief.md` of the branches read through it.
3. Replace the `merge-base` per ref with one `git for-each-ref --merged=<HEAD>` over the braid/strand refs, one over the `plan/` refs, and one per braid branch tip for its strands; the async board path (`prefetchLive`) uses the same.
4. Keep `ls-tree -r` of `braids/` per branch if profiling shows it is cheap (it is: about 50 ms, three calls).
5. Docs: `docs/cli.md` (`--open`, `--links`, `--related`), `docs/braids-format.md` timing line; template `related` line; version 0.2.0.
