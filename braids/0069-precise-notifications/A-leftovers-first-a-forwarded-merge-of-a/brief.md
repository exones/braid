---
id: '0069/A'
title: "Leftovers first: a forwarded merge of a Done story reaches the user; no lost limit push"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: []
order: 10
---
## Goal

Clear the leftovers this braid starts with, before 0069/B changes the rule. First, a coordinator's merge handover of a story stamped Done (`braid accept` runs before the handover) and forwarded by the PM (`braid forward`) reaches the user: it shows in To Review as forwarded and pushes once. Braid 0068 (PR #250) didn't: the user saw nothing on the board and got no push, though the merge into `main` was the one thing they had to do. Second, a one-shot provider-limit push (paused, failed, resumed) whose send fails is retried, also on a board with several projects.

Expected size: about 120 lines in 4 files, most of them tests.

## Start here

- `braid inbox show 2026-11-23-brb2`: what happened to 0068, the suspected cause and the user's words.
- `src/board/model.ts`: `derive` (its first branch makes a merged PR, or a stored Done with no open PR, Done and drops the request; check what happens when the PR lookup misses the story's PR), the story card (`pm`, `pmAsk` and `thread` set to null for Done), `mergeOf`, `requestLane`.
- `src/board/pm.ts` `routeOf`; `src/commands/requests.ts` (`braid forward`).
- `src/notify/message.ts` `pushesOf` and `needPush` (the filter on `need.who` and `need.by`).
- `braid inbox show 2026-11-22-zmry`, its review comment, and `src/notify/notifier.ts` after 0064's merge: the limit pusher's `retry()` drops the waiting entry while a send is in flight.

## Change

- Reproduce brb2 first, on the current build, as a test: a story stamped Done on its branch, its PR open, a review request `--to pm` forwarded with a note. Name the cause in the log (the Done lane, the PR lookup, the push filter, or an old board build), then fix it where it lies.
- The fix: an open request is never dropped by a Done stamp while the item's PR is open; the card is To Review, forwarded, and `pushesOf` sends it once.
- `src/notify/notifier.ts`: a one-shot limit push whose send fails stays waiting and is sent again at the next refresh, whichever project's refresh comes next. A test with two projects and a failing first send.
- Two small fixes in 0064's limit texts, from the PM's live check of PR #251 (`braid inbox show 2026-11-23-xoj1`, `braid inbox show 2026-11-23-wxvh`): the weekly-limit Needs You details box says what the user does for a need the board derives from its own pause record (wait for the reset, or move the role in BRAID.md and resume), not "Answer in the coordinator thread"; the still-over push body says "stays paused" for one braid and "stay paused" for several.

## Already decided

- Code starts only after 0064 is merged into `main` and `main` is merged into the braid branch (the limit pusher is 0064's).
- Keep this strand to the two fixes; which needs push and which thread they open is 0069/B's.
- If the cause is only an old board build, the test still lands and the log says so.

## Out of scope

- The push rule and the click thread (0069/B); grouping merges (0069/C).

## Completion

- [ ] A test reproduces 0068's case (story stamped Done, PR open, review request to the PM, forwarded) and passes: the card is To Review as forwarded, and one push is sent
- [ ] The log names the cause found
- [ ] A test shows a failed one-shot limit push sent again at a later refresh on a two-project board
- [ ] The weekly-limit Needs You details say what to do instead of "Answer in the coordinator thread", and the still-over push agrees in number (one braid: "stays paused"), with tests
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
