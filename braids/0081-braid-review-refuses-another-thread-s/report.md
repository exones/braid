`braid review --thread` and `braid launch --child` no longer record a checkout that isn't the child's own, so `braid clean` can't delete it. `braid clean` now names the folder it keeps and why.

What changed:

- Both commands **record the thread, not refuse it**, so the board still sees it. When the folder T3 gives is the main checkout or the caller's, the branch is the one checked out in either, T3 gives the folder or branch to the thread's parent (`parentThreadId`) too, or another recorded thread has it, the record gets no `folder` or `branch`. It gets `kept: {folder, why}`, and the output says why in one line (`src/commands/requests.ts`, `src/board/t3.ts`).
- `braid clean` removes only the record of a research or `kept` child: `record only, kept checkout <folder>: <why>`. It runs the same parent check at clean time, so a record made before this change, or one made without a folder, keeps the parent's checkout too (`src/commands/clean.ts`).
- Tests (`test/reviews.test.ts`): the caller's, main, parent's and another recorded thread's checkout, and older records. Two existing tests changed with the behaviour: the main-checkout test now writes its old-style record directly, and one fixture's branch is `t3/zzz` instead of `main`, because a thread on the main checkout's branch is no longer recorded with a folder.
- Docs: `docs/cli.md`, `docs/braids-format.md` and the `braid review` help line.

Validation: `npm run verify` passed locally, 786 tests, 0 failed, about 17 minutes.

Open:

- When T3 can't show the parent thread, the parent check finds nothing; the main checkout, caller, branch and recorded-thread checks still apply.
- A checkout shared with a thread that is neither the parent nor recorded isn't detected when it is recorded. `braid clean` still keeps it while that thread runs.

Decisions: record the thread with no folder rather than refuse it (the board keeps seeing it); also treat another recorded thread's checkout as not the child's own (leftover kw5d names it); no entry in docs/decisions.md, as this closes a gap in D117's behaviour.
For later items: review records may now carry `kept: {folder, why}` in `.braid/reviews.json`; `Where` (`src/board/t3.ts`) now has `parent`.
Needs the user: none
