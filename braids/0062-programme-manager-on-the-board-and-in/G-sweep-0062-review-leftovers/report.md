# 0062/G report

## What changed

1. **fbjx, T3 thread ids.** `T3.states` keeps ids exactly as T3 gives them (T3 ids are case-sensitive); the comment in `src/board/t3.ts` now says so. The lookup already matched exactly, so no code change was needed. A test covers a mixed-case PM thread id read as running, and a different case reading as gone.
2. **kt83, clearing a gone need.** `src/notify/notifier.ts` clears a gone need by its own sequence ID unless a current push carries that same sequence ID (the replacement case). A Done push (no sequence ID) or any other push of the item no longer holds the clear back. A test covers a need answered while the item shows a Done push.
3. **lus4, empty quotes.** A hold with no words reads "Held: the plan says held" (`src/board/pause.ts`). Test added.
4. **m3pg, live check.**
   - `braid notify test` now also sends a push with a sequence ID and clears it (`src/commands/notify.ts`; test updated).
   - Demo board: added a question from 0009/A addressed to the PM (`src/board/demo.ts`), so the PM lines can be seen there.

## Validation

- `npm run verify` passed (see PR for CI).
- **Live run:** `braid notify test` was run once against the topic configured on this machine (ntfy.sh). Both the send and the clear calls were answered with success by the server. I did not see the phone, so I can't say the clear removed the push from a device; that is for the user to check.
- **Browser:** the demo board (`braid board --demo`) shows the PM's request on the 0009 card: the "🧭 The PM is handling: …" line and, in the details, the teal "For the PM · 3m ago" box. Screenshot: `pm-lines-demo-board.png` in this folder. The demo had no PM-addressed request before, so one was added.

## Docs

`docs/board.md`: what `braid notify test` does, and the "Held: the plan says held" wording. No other docs are affected.

## Open

For later items: none.
Needs the user: none.
