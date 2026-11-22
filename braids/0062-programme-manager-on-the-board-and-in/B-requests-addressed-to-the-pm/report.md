# Report: 0062/B Requests addressed to the PM

**What changed**

- **Requests:** a request record has `to: user | pm` (a record without it is the user's), `pm` (the PM's thread, read from the braid brief's `PM-run (thread <id>)` line) and, after a forward, `forwarded` and `note`. `braid ask` and `braid handover` take `--to pm`; with no PM-run line they fail and open nothing. `braid forward <id> [--note]` hands a request to the user. `braid requests` and `braid status` show the addressee.
- **Board:** new pure `src/board/pm.ts` (`routeOf`). A request to the PM keeps the lane the item's other state gives, with a `pm` line ("The PM is handling: …", a handover "The PM is checking: …"), the 🧭 mark, a teal card line and a "For the PM" box in the details. It escalates to Needs You (a handover: To Review) after 20 min (60), when the PM thread is archived, failed or unknown to T3, or when forwarded ("Escalated: …", "Forwarded by the PM: …"). A pause or hold stops every escalation (timeout, gone thread and forward) until `braid resume`. All derived at each read; the board writes nothing. T3's read gained `states` (every listed thread's status) for the gone check.
- **Pushes:** a request the PM handles is never pushed; an escalation or forward is pushed once (the key holds its time) at high priority, also for a review, titled "(escalated)" or "(forwarded by the PM)", opening the item's thread. `low` is a push priority (ntfy 2). Each need push carries ntfy `sequence_id` (`braid-<repo>-<item>`); when a need goes and the item has no push now, the notifier sends `PUT <server>/<topic>/<sequence>/clear` once, best effort.
- **Hold:** a pause record has `reason: limit | hold` (missing reads as `limit`) and `words`; `provider`, `resumeAt`, `window` and `task` are null for a hold. `braid pause <n> --hold "<words>" --thread <id> [--by pm]` records it. It shows paused with "Held: “words”", never goes amber or stalled, and `braid resume` clears it. The status line, card line, mark and details box say "Held".

**Why:** the design the user approved in 0062/A (questions 2, 4 and 6; screens 60 and 65).

**Validation**

- `npm run verify` passes (the gate). New `test/pm-requests.test.ts` (19 tests): each lane rule, the timeouts (19/21 min, 59/61 min), gone thread (archived, failed, unknown; running and idle don't; unreadable T3 can't tell), forward, pause and hold suppression, old records without `to`, pushes and priorities, sequence ID and clear (fake and real clearer), the commands, the hold store, a 0061 limit record without `reason` still going overdue, and a malformed hold left out. Existing notify and branches tests updated for the new fields.
- Not checked live: the clear against a real ntfy topic (`braid notify test` needs the user's topic; there was none here). The clear request is the documented `PUT /<topic>/<sequence_id>/clear` and the JSON field is `sequence_id` [ntfy publish docs, read 2026-11-22]; the unit test checks the URL, method and token.
- Not drawn in a browser: the page changes (teal line, 🧭, details box) are typechecked and built only.

**Docs:** updated `docs/cli.md` (commands, Pauses), `docs/board.md` (Requests, Paused, icons, Notifications) and `docs/braids-format.md` (requests and pauses records). No README change. `docs/decisions.md` is not touched; the design record belongs to 0062/F.

Decisions: Decided: a request to the PM counts as "asked" for the stalled alarm, so the item doesn't read stalled while the PM has it. Decided: the push key of a timeout or gone escalation is the request's `at`, so one push per request; a forward has its own key (its time), so it pushes again. Decided: a missing PM thread id on a `to: pm` record counts as gone. Decided: only need pushes carry a sequence ID, not Done; the clear is best effort, not retried.
For later items: 0062/C/D can read `Need.via` (`timeout | gone | forwarded`) and `PmLine` (`src/board/pm.ts`) and `BraidCard.pm`; `Marks.pm` is the compass tooltip. `Pause.provider` and `resumeAt` are now nullable: anything that reads a pause must handle a hold (`reasonOf(pause)`). Strand E: coordinators under a PM must call `braid ask|handover --to pm`, and the PM `braid forward` and `braid pause --hold`. Idea: `braid notify test` could also send and clear a push with a sequence ID, to check the clear live.
Needs the user: none
