# Report: 0021 Board Start: no branch clash

## What changed

- Start's branch is always `coordinator/<n>-<slug>`: every braid on the board is already in `braids/`, so the `plan/<slug>` branch is gone. With a braid branch it starts from `origin/braid/…`; without one, from `origin/<main>`, and the first message says the item exists and is to be detailed or run, not planned again.
- Before launching, Start runs `git fetch origin`, checks the base exists, lists local and remote branches and adds `-2`, `-3`, … to a taken name. A failed fetch, missing base or failed listing refuses with `Start: <reason>`; nothing is launched.
- `braid clean` also removes merged `plan/<slug>` branches and their worktree when clean; it skips a dirty, busy or checked-out one and says so.
- Docs: `docs/board.md`, `docs/cli.md`, D52. The Start dialog's base line no longer says "plans on plan/…".

## Why

The first real Start (0020) failed in T3 on the leftover `plan/gap-inbox`, and 0020's coordinator got a stale local `main`.

## Validation

`test/board-start.test.ts` (fake git/t3: fetch order, origin bases, suffixes, refusals, message) and `test/start.test.ts` (real repo: clean of plan branches). `npm run verify` passes.

## Open

A braid branch that exists only locally falls back to the local branch as base. Start's check and the `git worktree add` are not atomic (a branch created in between still clashes).

For later items: none.
Needs the user: none.
