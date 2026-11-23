# 0069/C report

## What changed

- A forwarded merge handover (`kind: review`, `forwarded`) of a braid a programme runs now counts as "through the PM" (`throughPm`): it shows in the programmes panel as `The PM asks you: merge PR #<n>`, and the braid card keeps its lane with `Waiting on the user, through the PM: …`. A stored Done whose PR lookup misses still reaches the user (the push comes from the request, not the PR).
- `pushesOf` collects those forwards per PM thread into one push: `<repo>: <n> merges wait for you` (one: `<repo> <id>: merge PR #<n>`), a body line `<id> PR #<n>` per PR, high, 👀, opening the PM's thread. The key holds the PRs and their heads; the sequence ID is the PM thread's. The notifier already replaces by sequence ID and clears when a sequence has no push, so join, leave, moved head and none-left needed no notifier change.
- From the 0069/B review: forward push bodies use the braid's title (`Forward` now carries `title`); the details panel copy for a forwarded line says the PM forwarded it.

## Why

The user accepts one notification with two merges instead of one each.

## Validation

`npm run verify` (gate). New tests: `test/notify.test.ts` (one, two, a moved head, back to one, none: cleared, same sequence ID throughout) and `test/notify-rule.test.ts` (two forwarded merges under one PM: one push, cards keep lanes, panel lists them; PR lookup missed; no PM keeps its own push).

## Docs

`docs/board.md` (forwarded handover, the merges push) and `docs/cli.md` (`braid forward`) updated.

## Open

- Several projects on one board: a board snapshot is one project, so it is one push per project and PM thread; a cross-project group would need one shared snapshot.
- Card-need key: it now uses the need's lane (`In Review` for a review), so a review sharing a card with a PM ask is resent once after an upgrade. Accepted, not kept: the test asserts the key names the lane.

For later items: none.
Needs the user: none.
