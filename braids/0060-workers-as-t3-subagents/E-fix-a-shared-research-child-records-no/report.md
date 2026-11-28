Fixes the data loss the PM found in the live check of PR #324: `braid clean` could remove the coordinator's own checkout and `t3/` branch, because a `shared` research child's T3 folder is its parent's.

**What changed**

- `braid launch --role research --child` records the child with no folder and no branch (`src/commands/requests.ts`).
- `braid clean` ignores the folder and branch of a research record, so records made before this fix are safe too; only the record goes.
- One guard in `src/commands/clean.ts` covers every removal clean makes (recorded threads, item branches and worktrees, old review checkouts, planning branches): the main checkout, the caller's checkout and any other running thread's folder or branch are kept, with the reason. A protected `t3/` branch of a removable checkout is kept and named; the checkout still goes. For this the T3 snapshot now lists the folder and branch of every running thread it reads (`occupied`, `src/board/t3.ts`).
- A research child has the role `researcher`: `braid status` says `research running`, the limits list and pause targets say `researcher`, clean says `research thread`, `braid accept` says "a research thread … is still running". On the board its card shows the agent-running icon instead of the review one, and Open thread carries the research emoji.

**Validation**

- Three new tests in `test/reviews.test.ts`: the PM's reproduction (a research child with the parent's folder, and an older record that holds it) leaves the checkout and branch; a running thread's folder and branch and the caller's checkout are kept; the research labels in status, the snapshot and the limits list.
- `npm run verify` exit 0: 783 tests pass, 0 fail (about 14 minutes locally).
- Docs updated: `docs/cli.md`, `docs/board.md`, `docs/braids-format.md`, and `braid --help`'s line for `clean`.

**Open**

- A running thread that T3's thread list leaves out and braid has no record of (an unrecorded subagent) is not seen by the guard; the main and caller checkouts are still kept.
- When T3 can't be read, clean still removes merged item branches and worktrees as before (with its note); recorded threads' checkouts are all kept.

Decisions: The card of a lone running researcher shows "agent running" rather than a new research icon, to keep the change small. The guard covers all of clean's removals, not only recorded threads, so the Completion box holds for every path.
For later items: `T3Thread.role` and pause target `kind` now include `researcher`; the T3 snapshot has `occupied`.
Needs the user: none
