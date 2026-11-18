---
id: '0027/A'
title: "braid list --open: every unfinished braid, wherever it lives"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: []
order: 10
---

## Goal

The coordinator needs one command that shows every unfinished braid before it plans a new one. `braid list` reads only the working tree, so on `main` it misses braids that live on their braid branch or are being drafted on a `plan/` branch. `braid list --open` lists them all, with enough of each goal to judge overlap.

Expected size: about 200 lines in 5 files.

## Start here

- `src/braids/branches.ts`: `braidBranches` and `loadLiveBraids`, which already merge the working tree with braid and strand branches (used by `braid status` and `braid clean`). They don't read `plan/` branches.
- `src/commands/braids.ts`: `listBraids`, today's `braid list`. Braid 0025 (on `braid/0025-sweep-inbox-counts`, not started) will change it too (an `Inbox:` line); don't wait for it. If 0025 is merged into `main` before your PR, merge `main` into the braid branch and yours.
- `src/cli.ts`: the `list` case, which refuses any argument today.
- `src/board/github.ts`: how planning PRs (`plan/<slug>` into `braid/<number>-<slug>`) are recognised. A `plan/` branch's name holds no braid number; its `braids/` tree does.
- `docs/braids-format.md`: the `braid list` entry under the commands.

## Change

- `braid list --open`: one block per braid whose status is not `Done`, in number order: id, status, title, where it was read (`main`, `braid/<number>-<slug>`, `plan/<slug>`, local or `origin/`), then the first paragraph of its `## Goal` section (cut at about 300 characters), then its strands one per line as `braid list` shows them.
- Sources: what `loadLiveBraids` reads, plus local and `origin/` `plan/*` branches not merged into HEAD. From a `plan/` branch take only the braids no other source has; a `plan/` copy never overrides a braid branch's or the working tree's copy.
- `--no-fetch` as on `braid new`; without it, fetch first, and on a failed fetch warn and go on with what is local.
- `braid new` ends its output with one line, `Open braids: <n> (braid list --open)`, counting what `braid list --open` would show, the new braid excluded.
- `docs/braids-format.md`: the option and the `braid new` line. `README.md` only if it lists `braid list` options.
- Tests in `test/` with a fixture repository: a braid only on a braid branch, one only on a local `plan/` branch, one on `main` that is Done (not shown), one Outline on `main` (shown).

## Already decided

- Plain `braid list` keeps its output as it is.
- No overlap detection in the CLI: the coordinator reads the goals and judges.
- Old `plan/` branches whose braids are already on `main` or a braid branch add nothing; one merged into HEAD is skipped, as braid branches are.

## Out of scope

- The `related` field (0027/B) and the skill (0027/C).
- The board.

## Completion

- [x] `braid list --open` lists a braid found only on a braid branch and one only on a local `plan/` branch, with their sources, and leaves out Done braids (tests)
- [x] `braid list` without the option prints what it did before (test)
- [x] `braid new` prints the `Open braids:` line (test)
- [x] `docs/braids-format.md` describes both
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## plan

- `loadOpenBraids` in `src/braids/branches.ts`: `loadLiveBraids` plus braids found only on local or `origin/` `plan/*` branches not merged into HEAD (newest copy first; never overriding another source), Done filtered out.
- `listOpen` and `openBraidsLine` in `src/commands/braids.ts`; `--open` and `--no-fetch` in `src/cli.ts`; the `Open braids:` line at the end of `braid new`.
- Tests with a fixture repository (`test/open.test.ts`); update `braid new` expectations; `docs/braids-format.md`.
