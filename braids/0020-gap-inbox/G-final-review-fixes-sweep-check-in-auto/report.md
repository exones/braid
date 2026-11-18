## Done

- Auto mode now checks the inbox after each strand merge (`auto-mode.md`, "Merging", step 3): at 3 or more open leftovers it proposes the sweep on the braid's number while strands go on. The skill's "Sweep" step 1 points there instead of implying auto mode sees a recap line.
- The offline warning quotes the first non-empty line of Git's error (the `fatal:` line), not the last; the existing offline test now checks the warning text.
- A write refuses while any worktree has `braid-inbox` checked out. The message names the worktree and says `git switch --detach` or remove it; nothing is changed (no fetch, no commit, no ref move). Tested; `docs/braids-format.md` says so.

## Decisions

- The check runs at the start of each write attempt, before any fetch, inside the lock.

## Validation

`npm run verify` passes (247 tests, including the new worktree test).

For later items: none.
Needs the user: none.
