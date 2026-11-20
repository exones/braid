## What changed

`braid start <id>` can be run again. When the item's branch is already checked out in the worktree folder `start` would make (for a strand, at or after the braid branch's tip; for a story, sharing history with `main`), it creates and pushes nothing, prints the three lines with `branch <name> (already started)` and exits 0. The check runs before the ready check, because the pushed branch makes a started item look not ready. A branch checked out in another folder, or a strand branch that lacks its base, still fails and says what was found. A branch with no worktree keeps the old behaviour.

## Why

A coordinator whose session lost the result of `braid start` can retry without cleaning up (inbox idea 2026-11-20-80k2).

## Validation

`npm run verify` passes (387 tests). New tests: second start of a strand (also after work on the branch), second start of a planned story and of one `start` made (also after `main` moved), a branch in another folder, a strand branch off its base. The old "branch exists" test now removes the worktree first.

## Open

For a story the base check is only "shares history with main", since main moves on while the story runs.

For later items: none
Needs the user: none
