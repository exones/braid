---
id: '0027/D'
title: "braid view reads braids on other branches"
status: Done
labels: ["kind:story", "tier:L", "ask:process"]
dependencies: ['0027/C']
order: 40
---

## Goal

The skill's Look-around step (0027/C) has the coordinator read each overlapping braid's brief with `braid view`, but `braid view` reads only the working tree. From `main` it can't open a braid that lives only on its braid or `plan/` branch (it fails with `no braid <n>`), and for a braid that is on `main` but newer on its branch it shows the stale copy. Those are the braids this goal is about. Found by the final review of PR #148 (https://github.com/exones/braid/pull/148#issuecomment-6988953994); the user chose to fix it before the final merge.

Expected size: about 120 lines in 6 files.

## Start here

- `src/commands/braids.ts`: `viewItem` (uses `loadBraids`, the working tree) and `listOpen`.
- `src/braids/branches.ts`: `braidBranches`, `planBranches`, `loadLiveBraids`, `loadKnownBraids`: which copy wins (newest branch commit not merged into HEAD, a `plan/` copy never overriding another source).
- `test/open.test.ts`: the test "0003 lives only on its branch; braid view reads the working tree", which this strand reverses.
- `.agents/skills/braid/SKILL.md`, "Plan" steps 3 and 5.
- `docs/braids-format.md`: the `braid view` entry; D61 in `docs/decisions.md`.

## Change

- `braid view <id>` (braid or strand) shows the copy `braid list --open` would show: the working tree, unless a braid or strand branch, or a `plan/` branch, holds a newer copy not merged into HEAD, by the same rules as `loadKnownBraids`. Read only that braid number's branches: one `for-each-ref` for the refs, then Git reads only for the matching refs, so a view stays well under a second (state the timings in the report, before and after, on this repository).
- When the copy is not the working tree's, print `Read from: <branch>` after the fields, as `braid list --open` names it.
- `--links` is unchanged.
- `.agents/skills/braid/SKILL.md`: Plan step 3 says `braid view` reads the braid where it lives, in at most a clause; Plan step 5 names `related` among the template's fields.
- `docs/braids-format.md`: the `braid view` entry. D61: one sentence that `braid view` reads the live copy.
- Tests: a braid only on a braid branch, one only on a local `plan/` branch, one on the working tree with a newer copy on its branch (the branch copy and `Read from:`), a strand only on its strand branch, and a braid merged into HEAD (working tree copy, no `Read from:`).

## Already decided

- No `--live` flag: `braid view` always shows the live copy, because a worker or reviewer reading a stale brief is the same problem.
- Commands that write briefs (`braid edit`, `braid brief`, `braid log`, `braid report`) keep reading only the working tree: a writer edits the branch it holds.

## Out of scope

- The sweep's leftovers (faster `braid list --open` and `braid check`, `docs/cli.md`, the template's `related` wording).
- The board.

## Plan

- `src/braids/branches.ts`: `braidBranches`, `loadLiveBraids` and `loadKnownBraids` take an optional braid number. With it, `for-each-ref` lists only that number's braid and strand branches (`braid/<n>-*`, `braid/<n>/*`, local and remote), and `plan/` branches are read only when neither the working tree nor a braid branch has the braid (a `plan/` copy never overrides one anyway). Same winner and HEAD rules, so the copy is the one `braid list --open` shows.
- `src/commands/braids.ts`: `viewItem` loads through `loadKnownBraids(root, number)`; `Read from: <branch>` after the fields when the item's copy came from a branch.
- Tests in `test/open.test.ts`: reverse the old "reads the working tree" assertion and add the five cases.
- Docs: Plan steps 3 and 5 of the braid skill, `docs/braids-format.md` `braid view`, D61.
- Time `braid view` before and after on this repository.

## Completion

- [x] `braid view` shows a braid or strand that lives only on a braid, strand or `plan/` branch, and a newer branch copy over the working tree's, with `Read from:` (tests)
- [x] A merged branch adds nothing: the working tree's copy, no `Read from:` (test)
- [x] Timings of `braid view` before and after in report.md
- [x] Plan steps 3 and 5 of the braid skill, `docs/braids-format.md` and D61 updated
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
