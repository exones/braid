---
id: '0029'
title: "Sweep: leftovers from 0027"
status: To Do
labels: ["kind:task", "tier:L", "sweep", "ask:process"]
dependencies: []
delivery: epic
---

## Goal

Sweep of the three leftovers from the 0027 reviews (Planning looks at the other open braids): fewer Git processes behind `braid list --open` and `braid check`, the `docs/cli.md` options, and one line of the brief template. Runs after 0027 is merged into `main`: merge `main` into this branch first, since every file it fixes comes with 0027. Approved by the user on 2026-11-18 as one sweep story.

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

## Already decided

- Related to 0028 (Board: fast first open and fast item open, on `braid/0028-board-fast-first-open-and-fast-item-open`, being planned, no brief pushed yet): it may speed up the same branch reads (`loadLiveBraids`) that leftover hr41 is about. Before starting, read its brief (`braid view 0028`); if it already changes the reader, do item 1 on top of it or drop item 1 and say so, and don't duplicate it.
- No behaviour change in what `braid list --open`, `braid view` and `braid check` show.

## Out of scope

- Anything not in the three leftovers.

## Completion

- [ ] Git process counts and timings of `braid list --open`, `braid view --links` and `braid check`, before and after, in report.md, with the 0027 tests passing unchanged
- [ ] `docs/cli.md` lists `--links`, `--related` and `--open`
- [ ] The template's `related` line points at Plan step 3 without restating it
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
