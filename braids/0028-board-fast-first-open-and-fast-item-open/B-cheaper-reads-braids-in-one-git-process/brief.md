---
id: '0028/B'
title: "Cheaper reads: braids in one git process, T3 shows only when needed"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: ['0028/A']
order: 20
---

## Goal

Each background read of 0028/A gets cheaper, so the board's data is fresh sooner: the braids from branches are read through one `git cat-file --batch` process instead of one `git` per file, and T3 runs `thread show` only for running threads it hasn't shown yet or whose `updatedAt` changed since.

Expected size: about 250 lines in 5 files, tests included.

## Start here

- `braids/0028-board-fast-first-open-and-fast-item-open/brief.md` and 0028/A's report (the timing line and its numbers).
- `src/braids/branches.ts`: `loadLiveBraids`, `folders` (`git ls-tree`), `gitTree.read` (`git cat-file blob`), `inHead` (`git merge-base --is-ancestor`).
- `src/board/t3.ts`: `readFresh`, `show`, `pool`. `t3 thread list --json` gives `threadId`, `status`, `title`, `link` and `updatedAt`, but no `worktreePath` or pending count; those come only from `thread show`.
- `src/board/inbox.ts` and `src/inbox/` (`readInbox`): the inbox read costs about 1.4 s; find out why.

## Change

- `src/braids/branches.ts`: blob reads through `git cat-file --batch` (one process per read of the braids), keeping the per-commit caches. Reduce or batch the merge-base checks if the timing line shows they matter.
- `src/board/t3.ts`: remember each running thread's `thread show` result with its `updatedAt`; show it again only when that changed or the thread is new. Any failure still gives `unavailable`.
- The inbox read: make it cheaper if the 1.4 s has an avoidable cause; otherwise say why in report.md.

## Already decided

- Reads stay through the `git` and `t3` CLIs; no T3 HTTP API and no access to T3's storage.
- What is read, and how items and threads are matched, doesn't change.

## Out of scope

- The page and the snapshot logic (0028/A).

## Completion

- [ ] A test shows the braids from branches are read through one `git cat-file --batch` process and come out the same as before
- [ ] A test shows a running thread with an unchanged `updatedAt` isn't shown again, and one with a changed `updatedAt` is
- [ ] report.md gives the timing line's numbers per source before and after on this repository
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
