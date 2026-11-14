## What changed
- `braid start <id> [--force]` (`src/commands/start.ts`): for a strand it refuses unless the strand is ready as `braid next` decides, or `--force`. It pushes `braid/<number>/<letter>-<slug>` from the braid branch tip (the newest of the local and pushed copy) to `origin`, then adds a worktree on it in `$BRAID_WORKTREES_DIR/<repo>/<number>-<letter>` (default `~/braid-worktrees`), and prints branch, commit and folder. A braid without strands gets `braid/<number>-<slug>` from `main` into `<repo>/<number>`.
- `coordinate.ts`: the per-strand readiness test is now the exported `notReady`, shared by `next` and `start`; `read`, `branchState`, `unreadable`, `freshness` are exported.
- Help, README, `docs/braids-format.md`, and decision D42 (worktree folder).

## Why
The coordinator did these steps by hand before every worker launch.

## Validation
`npm run verify` passes. `test/start.test.ts` runs in temporary repositories with a local bare remote and a temporary worktree folder: branch from the braid tip (not from main), pushed, worktree checked out with upstream and clean, refusals (not ready, branch exists, folder exists, no braid branch, bad ids), `--force`, a story from main, running from inside another worktree, the folder default.

## Open
- The T3 check from the brief is not done: a worker can't launch T3 threads. Only the git side is proved (a worktree in a folder outside the repository, with the branch checked out and tracking its pushed branch). The coordinator checks that T3 accepts `existing_worktree` on a folder in `~/braid-worktrees` when it launches the worker for 0008/C.
- `start` pushes to a remote named `origin` and doesn't fetch; a braid branch only known from an old fetch is used as is.
- A story's readiness: stored `To Do`, dependencies Done, no running thread, no open PR.

For later items: `start` is async like `status` and `next` and lives in `main()` of `src/cli.ts`; `worktreesDir()` is exported from `start.ts` for the skills' docs in 0008/C. The brief didn't give the story worktree folder: it is `<repo>/<number>`.
Needs the user: none
