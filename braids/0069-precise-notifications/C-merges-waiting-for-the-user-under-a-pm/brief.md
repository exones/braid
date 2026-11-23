---
id: '0069/C'
title: "Merges waiting for the user under a PM: one push, updated in place"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: ['0069/B']
order: 30
---
## Goal

Under a PM, the merges into `main` that wait for the user (the PM's forwarded handovers of stories and final PRs) are one push per PM, opening the PM's thread, updated in place when another joins or one leaves, and cleared when none is left. The user's words: "if they do, I'm OK if I only get one notif with 2".

Expected size: about 120 lines in 3 files.

## Start here

- `src/notify/message.ts` after 0069/B (the rule and its pushes) and `sequenceOf`; `src/notify/notifier.ts` (keys, and clears by sequence ID).
- `src/braids/requests.ts` `Request` (`kind: review`, `pr`, `head`, `pm`, `forwarded`).

## Change

- Forwarded review requests that share a PM thread make one push: title `<repo>: <n> merges wait for you` (just one: `<repo> <id>: merge PR #<n>`), a body line per PR (`<id> PR #<n>`), high priority, 👀, click the PM's thread, one sequence ID per PM thread. Its key holds the set of PRs and their heads, so a change sends it again under the same sequence ID and replaces the old one; an empty set clears it.
- On a board with several projects: one push per PM thread across them if the snapshot allows it cheaply; otherwise one per project and PM thread, and the report says why.
- Tests: one, two, back to one, none (cleared); a moved head updates it.
- Under a PM, a forwarded merge handover also leaves the braid's card: it shows in the programmes panel with the merge group (`The PM asks you: merge …`, opening the PM's thread), and the card keeps its lane with `Waiting on the user, through the PM: …`, as 0069/B does for other forwards. When the PR lookup misses, it still reaches the user (0069/A's test).
- From the review of 0069/B (https://github.com/exones/braid/pull/256#issuecomment-7089918385): the programme-forward push body uses the braid's title, not its id (`src/notify/message.ts` `pushOf(..., f.id, f.id, ...)`); the card-need key now uses `laneOf(need)`, so a review sharing a card with a PM ask is resent once after an upgrade: keep the old key or test and accept it, and say which in the log; the details panel copy for a forwarded line (`web/src/App.tsx` near 1106) no longer says it comes to you if the PM forwards it.

## Already decided

- A merge waiting for the user without a PM keeps its own push from 0069/B (the coordinator's handover, opening its thread).
- No new state: the group comes from the open requests on the board.

## Out of scope

- The PM's digest push (0069/D).

## Completion

- [ ] Two forwarded merge handovers under one PM give one push listing both, opening the PM's thread, shown in the programmes panel while the braid cards keep their lanes
- [ ] A merge joining or leaving updates that push in place (same sequence ID); none left clears it
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
