## What changed

- **0068's case (cause found):** with the PR lookup finding the story's PR, a story stamped Done with a forwarded review request already reads To Review, forwarded, and pushes once (the new test proves it on the current build). The request was dropped only when the lookup missed the PR: `derive` read "stored Done, PR not open" as Done and discarded the request. Fix (`src/board/model.ts`): a stored Done with no PR found and an open `review` request keeps the request, so the card is To Review and `pushesOf` sends it once. An old board build before 0062 may also have contributed; this can't be told from here.
- **Limit push retry (`src/notify/notifier.ts`):** `retry()` called `pushOne` for a push whose send was in flight, which dropped its waiting entry; if that send then failed, the push was lost. An in-flight push now stays waiting. Retry already runs over every project's pusher, so a later refresh of any project sends it; a two-project test shows this.
- **Limit texts:** the weekly-limit (and failed-pause) Needs You details box says to wait for the reset or move the role in BRAID.md and resume (`web/src/App.tsx`); the still-over push says "stays paused" for one braid, "stay paused" for several (`src/board/steer.ts`).

## Validation

`npm run verify` passes. New tests: `test/pm-requests.test.ts` (0068's case, lookup miss, no request, merged), `test/board-steer.test.ts` (two-project failed-then-retried push; "stays paused").

## Docs

`docs/board.md` rule 1 updated. No other docs affected.

For later items: none.
Needs the user: none.
