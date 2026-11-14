## What changed
- `braid` skill and workflow: Run an item uses `braid start` and launches the worker on the folder it prints (`existing_worktree`); "Starting the next item" uses `braid next`; Resuming uses `braid status` / `braid next`; after a merge `braid clean --yes` replaces removing worktrees by hand. Restatements of what the commands do are removed (start's steps, status/next's rules, clean's behavior, the hand-run "read the item branch and gh pr list").
- New rule: a review still blocking after two fix rounds gets the `ask:quality` label (Ground rules, Auto mode stop). It is a flag only; no claim about Needs You (that is braid 0015).
- `ci.yml` and README: `epic/**` trigger and `backlog/**` skip removed.
- `src/board/github.ts`: injectable clock (`setGithubClock`); `test/github.test.ts` freezes it, so the "share one gh read" test no longer depends on wall-clock time.

## Why
The commands from 0008/A and B do these steps; the skills should call them. The flaky test failed when it ran longer than the 3 s sharing window.

## Validation
`npm run verify` passes. Words in `.agents/skills/braid` (SKILL.md, references, assets), `wc -w`: 6,241 before this PR, 6,125 after (the reviewer counted 6,274 before).

## Open
`braid-worker` needed no change.

For later items: `setGithubClock` is exported from `src/board/github.ts`; `src/board/t3.ts` has the same Date.now sharing window (not touched, its tests use ttlMs).
Needs the user: none
