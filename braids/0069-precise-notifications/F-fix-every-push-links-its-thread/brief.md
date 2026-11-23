---
id: '0069/F'
title: "Fix: every push links its thread"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 60
---
## Goal

Two pushes still end "Open the board" though the thread that needs the user is known. The PM's live check of the final PR (#263 at bf8aa63) found them, against the user's words: "it always should contain a coordinator / PM thread link that needs my attention". Fix both, so a push says "Open the board" only when no thread can be named at all.

Expected size: about 60 lines in 4 files, half of them tests.

## Start here

- `src/commands/requests.ts` `braid ask` (around line 177: a PM request is answered in the PM's thread: `--thread`, else the braid brief's PM-run line; a programme request `pm/<slug>` has no brief, so it stores `"thread": null`).
- `src/board/plans.ts` / `src/board/programme.ts`: the programme's plan file and its front matter `thread` (the PM's thread).
- `src/notify/message.ts`: `forUser`, the programme request's push, and the Done push (built separately, `kind: "done"`, no click).
- `docs/board.md` "Notifications" (what a push contains, "Open the board").

## Change

- A programme request with no `--thread` (`braid ask pm/<slug> … --kind action`): its push opens the PM's thread from the plan file's `thread`. Fall back at ask time (store it) or in the push (read it from the programme), whichever is simpler; say which in the log.
- The Done push (sent only for a braid no programme runs): click the braid's coordinator thread, as the other pushes do, when it is known.
- `docs/board.md`: say when a push can still end "Open the board" (no thread can be named: none recorded and T3 lists none).
- Tests: a programme request without `--thread` opens the plan's PM thread; a Done push opens the coordinator thread; with no thread known, both end "Open the board".

## Already decided

- The PM asked for this round before the user's merge of #263; the other findings of its live check are leftovers 2026-11-23-cbe9, 2026-11-23-cft5 and 2026-11-23-mchu, not this strand.
- No new state file or field beyond what the request record already holds (`thread`).

## Out of scope

- The merge group's re-alert on a shrinking set, the 0072 card lane, the `notify send` sequence ID without `--programme` (the leftovers above).

## Completion

- [ ] A programme request opened without `--thread` pushes with the PM's thread from the plan file as its click link (test)
- [ ] The Done push of a braid no programme runs opens its coordinator thread when known (test)
- [ ] docs/board.md says when a push still ends "Open the board"
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
