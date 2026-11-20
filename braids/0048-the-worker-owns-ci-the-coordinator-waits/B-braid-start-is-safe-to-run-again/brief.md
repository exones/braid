---
id: '0048/B'
title: "braid start is safe to run again"
status: In Progress
labels: ["kind:task", "tier:S"]
dependencies: []
order: 20
---

## Goal

`braid start <id>` can be run again safely. When the item is already started as asked (its branch exists and its worktree is in the braid worktree folder on that branch, at or after the expected base), it prints the same three lines with "already started" and exits 0 instead of failing. A coordinator whose session lost the result of a `braid start` can then retry without cleaning up first.

Expected size: about 100 lines in 3 files.

## Start here

- `src/commands/start.ts`: today it fails with "already has the branch", "already exists" or "checked out in a worktree; nothing was created" (around lines 91 to 142).
- Its tests, and `docs/cli.md` for `braid start`.
- Inbox idea `2026-11-20-80k2`: in braid 0040 an orphaned `braid start` pushed its branch 9 s after the resumed coordinator had looked for it.

## Change

- `src/commands/start.ts`: detect "already started as asked" for a strand and for a planned story, report it and exit 0. Anything else in the way (a folder that isn't that worktree, a branch on another line of commits, a worktree elsewhere) still fails, with a message that says what was found.
- Tests for both cases, and the docs line.

## Already decided

- A re-run creates and pushes nothing new.

## Out of scope

- `braid clean`, and starting from the board.

## Plan

- `startCommand` first checks "already started": the item's branch (local or pushed) is checked out in the worktree `start` would make, and for a strand its HEAD contains the braid branch tip. A story only has to be on its branch in its folder (main moves on while it runs). It prints `branch <name> (already started)`, `commit`, `folder` and creates nothing. This runs before the ready check, because the pushed branch makes the item look started.
- A branch checked out in another folder, or a strand branch that lacks its base, fails and names what was found. No worktree yet keeps the old behaviour.
- Tests: strand and story run twice; branch elsewhere; branch off its base. Docs line in `docs/cli.md` and `docs/braids-format.md`.

## Completion

- [ ] Running `braid start <id>` twice on a strand and on a planned story succeeds both times, the second printing "already started" with the branch, commit and folder; tests cover it.
- [ ] A start that finds something else in the way still fails and names it; tests cover it.
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
