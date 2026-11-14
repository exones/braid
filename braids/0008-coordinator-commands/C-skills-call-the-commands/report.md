## What changed
- `braid` skill and workflow: Run an item uses `braid start` (and says it makes the worktree the coordinator launches the worker on as `existing_worktree`, in `~/braid-worktrees`); "Starting the next item" uses `braid next`; Resuming uses `braid status` / `braid next`; after a merge `braid clean --yes` replaces removing worktrees by hand.
- New rule: a review still blocking after two fix rounds gets the `ask:quality` label (Ground rules, Auto mode stop).
- `ci.yml` and README: `epic/**` trigger and `backlog/**` skip removed.
- `src/board/github.ts`: injectable clock (`setGithubClock`); `test/github.test.ts` freezes it, so the "share one gh read" test no longer depends on wall-clock time.

## Why
The commands from 0008/A and B do these steps; the skills should call them. The flaky test failed when it ran longer than the 3 s sharing window.

## Validation
`npm run verify` passes.

## Open
The skills are not shorter in lines (the replaced steps were about as long as the added one-line rules); `braid-worker` needed no change.

For later items: `setGithubClock` is exported from `src/board/github.ts`; `src/board/t3.ts` has the same Date.now sharing window (not touched, its tests use ttlMs).
Needs the user: none
