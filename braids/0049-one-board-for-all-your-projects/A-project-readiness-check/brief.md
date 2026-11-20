---
id: '0049/A'
title: "Project readiness check"
status: Done
labels: ["kind:task", "tier:M"]
dependencies: []
order: 10
---

## Goal

A folder that isn't a working braid project shows an empty board today, with no warning: spike 0045 found chinese-trainer (still on Backlog.md) served `braids: []` and `t3: ok`. After this strand `braid board` and `braid status` say what is wrong and what to do. It helps with one project now, and strands B and C reuse it for every listed project.

Expected size: about 250 lines in 6 files, with tests.

## Start here

- `braids/0045-working-on-several-projects-research-and/report.md`: "What I tried with two checkouts" and follow-up 1.
- `src/commands/board.ts` and `src/board/t3.ts`: how the board finds its root and main checkout and reads T3 (`readT3`, `mainCheckout`); `src/board/github.ts` for the GitHub read.
- `web/src/App.tsx`: the note shown when T3 isn't running (`braid board --demo-t3-down`); the readiness note uses the same style.
- `src/commands/coordinate.ts` (`statusCommand`) and `docs/board.md`, `docs/cli.md`.
- `docs/decisions.md` D33 (the skills stop when a project has `backlog/` and no `braids/`).

## Change

- A readiness module (for example `src/braids/readiness.ts`): one function that takes a folder and returns its problems, each with a short reason and what to do:
  - no `braids/` (and `backlog/` found: run `braid import-backlog`);
  - `BRAID.md` missing, or its front matter unreadable or missing `gate`, `main`, `ci` or `models`;
  - `braid check` errors;
  - T3 doesn't know the main checkout: not checked. The `t3` CLI exposes no project list (`t3 project` has only add, remove and rename), and `t3 thread list --project <folder>` prints `[]` both for a known project with no threads and for an existing folder T3 doesn't know; its threads carry a `projectId` but no folder. The user agreed to drop the check: the `t3` CLI gives no project folder, so even a partial check can't fire. A full check needs `t3 project list --json`.
  - GitHub unreadable (`gh` missing, not authenticated, or the repository unknown).
  T3 not running stays the board's existing note, not a readiness problem.
- `braid board`: the snapshot carries the readiness problems; the page shows them in a note above the lanes, in the T3-down note's style; startup prints one line per problem.
- `braid status`: a line per problem before the strand lines.
- `src/board/demo.ts`: a demo switch (like `--demo-t3-down`) that shows a project with problems.
- `docs/board.md`, `docs/cli.md`; tests for each problem with stubbed `t3` and `gh`.

## Already decided

- No new stored state: readiness is computed at each read.
- T3 unknown is never decided from an empty thread list (review of 0045, leftover 2026-11-20-flmj).
- A project with problems is still served: the board shows what it can read plus the note.

## Out of scope

- A project list, several projects, or any new command (strand B).
- New UI beyond the note: no mockups needed, the note reuses an existing style.

## Completion

- [x] A folder with `backlog/` and no `braids/` shows a note on the board and a line in `braid status` naming `braid import-backlog`
- [x] Missing or incomplete `BRAID.md`, `braid check` errors, and unreadable GitHub each show their own note and line; a T3 project with no threads shows none (the T3 check is not built, see Change)
- [x] A test per problem, with `gh` stubbed
- [x] `docs/board.md` and `docs/cli.md` describe the note and the lines
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. `src/braids/readiness.ts`: `readiness(folder, github)` returns problems (no braids/, BRAID.md, braid check, GitHub from the read the caller already made).
2. Board: `problems` in `BoardData`, note above the lanes, startup lines, `--demo-not-ready`. `braid status`: lines before the strands.
3. Tests in `test/readiness.test.ts`; docs in `docs/board.md`, `docs/cli.md`.
