---
id: '0081'
title: "braid review refuses another thread's checkout, and clean names the kept folder"
status: To Do
labels: ["kind:story", "tier:S"]
dependencies: []
related: ['0060']
delivery: main
autonomy: free
---

## Goal

A follow-up to 0060 from the PM's re-check of PR #324 (leftovers 2026-11-26-kw5d and 2026-11-26-5y6e; the user's choice (a)). 0060/E made `braid launch --role research --child` record no folder or branch for a `shared` research child. But `braid review <id> --thread <thread>`, if it is used for a shared researcher by mistake, still records the parent's checkout as the child's folder, and `braid clean` then deletes that folder once the thread is idle. Close that path, and make clean's line for a research record name the folder it kept.

Expected size: about 60 lines in 3-4 files, tests included.

## Start here

- `src/commands/review.ts` (or wherever `braid review --thread` records a thread) and `src/braids/reviews.ts` (`recordChild`, how 0060/E records a research child with no folder).
- `src/commands/clean.ts`: the guard 0060/E added (main checkout, caller's checkout, running threads' folders) and the research record line ("no checkout").
- `t3 thread show --json` shape: `braids/0060-workers-as-t3-subagents/sources.md` S10.

## Change

- `braid review --thread <thread>` (and `braid launch --child` for any role) refuses to record a folder or branch that T3 says belongs to another thread, or that is the caller's own checkout or the main checkout: it records the thread with no folder and no branch and says why in one line (so the board still sees the thread), or refuses, whichever keeps the board's view; say which in report.md.
- `braid clean`'s line for a research record (or any record with no folder) names the folder it kept and why, instead of only "no checkout".
- Regression tests with T3 faked: `braid review --thread` for a thread whose `worktreePath` is the caller's checkout records no folder, and `braid clean` afterwards leaves that checkout and its branch in place; the clean line names the kept folder.

## Out of scope

- The other leftovers (2026-11-26-k3fv, 1b0r, dxqo).

## Completion

- [ ] `braid review --thread` records no folder or branch that is another thread's, the caller's or the main checkout, with a regression test
- [ ] `braid clean`'s line for a research record names the kept folder, with a test
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
