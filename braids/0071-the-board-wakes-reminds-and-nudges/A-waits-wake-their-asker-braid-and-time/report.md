# 0071/A report

## What changed

- **One condition check** (`conditionEnding` in `src/braids/requests.ts`) for `pr:<n>` (and a review's PR, as before), `braid:<n>` (that braid `Done` on `origin/<main>`) and `time:<iso>` (now at or after it). `filterLive` and `liveRequests` take it (a bare PR reader still works), so `braid requests` records `braid:` and `time:` endings too and fetches main first when a `braid:` wait is open. The board's in-memory `ended` uses the same check (`pr:` and `time:`).
- **The wake** (`src/board/wake.ts`), run by the steerer's tick for each project after the pause steps (so only on a running board without `--no-pause`, never `--demo`): for each open request whose condition holds, the asking thread gets one `t3 thread send` (`Wake: q-7f3k is met (braid 0064 merged into main): <text>. Go on where you left off.`, shell characters left out of the text), then `endRequest` records `met` by `board`. Withdrawn endings, requests with no thread and requests whose thread T3 shows archived are recorded without a send. A held or paused asking braid (`sig.pauses`, which includes a held plan's braids) is skipped entirely.
- **Replacement (rf9z)**: `openRequest` withdraws only the same asker's open request of the same sort on the item: a question (to the user or the PM) a question, a wait (to a braid) the wait to that braid. `forwardRequest` and `braid forward` never pick a wait.

## Why: the order of send and record

Send first, record after; the `met` event is the memory. No new event kind, no new field, no new state file.
- A failed send records nothing: the request stays open and is sent at the next refresh (warned once on the board's stderr).
- A refused push is redone by 0070/A's retry; a push that fails keeps the commit on the local `braid-requests` branch, which the board reads, so it is never sent again, and the next write pushes it.
- A record write that throws after a delivered send (lock, a worktree on the branch) is retried at each refresh without sending again: the board keeps the codes it sent in memory for its life.
- The one gap: a board killed between the send and its local commit can send that wake again after a restart (milliseconds; the duplicate says "go on where you left off"). Recording first would need a second event (`woken`) to tell a delivered wake from a pending one, with the same gap between send and that event; and older braid CLIs skip a record with an unknown event kind as unreadable. So send-first is the simpler way with the same guarantee.

## Validation

- `test/board-wake.test.ts` (new, 12 tests): `time:`, `pr:` (merged woken; closed withdrawn without a wake; no thread closed without one), `braid:` (not before, woken once Done on origin's main, fetched by the wake), `braid requests` recording a `time:` ending, once across two refreshes and a restart, a failed send (not recorded, sent once later), a failed push (met kept locally, not resent by this or a restarted board, pushed by the next write), a failed record write (retried without a second send), held/paused and archived, a board write racing a CLI write from another clone (both on origin), the steerer running the wake, the message's shell characters.
- `test/requests-record.test.ts`: a wait and a question of one asker don't withdraw each other; a wait replaces only the wait to the same braid.
- Gate `npm run verify`: 625 tests pass.

## Docs

- `docs/board.md`: new "Wakes" section; the request record paragraph (the board's wake writes it), the limits-pause paragraph (the wake is the other exception to the click rule, off with `--no-pause`), the PM-request replacement wording.
- `docs/braids-format.md` and `docs/cli.md`: `braid:` and `time:` are checked; who records them; replacement by sort.
- `src/cli.ts`: the `ask` help line.
- `docs/decisions.md`: not changed: the dated decision "the board acts without a click" is 0071/E's (braid brief); rf9z and the send order were the coordinator's and mine, logged.

## Open

- Two boards serving the same project would each send a wake for the same request (the record's write keeps one `met`). The limits pause has the same shape; not handled here.
- A programme request (`pm/<slug>`) is checked even while its plan is held; only braid ids map to a hold.
- The wake's record write runs Git (fetch, push) synchronously in the board process: a write blocks the server for a moment, only when something ends.

For later items: 0071/E could record the wake's send-then-record order next to D90 in `docs/decisions.md`. 0071/D: a coordinator that both asks the user and waits on a braid now has two open requests on its item, so `braid answer <id>` / `braid withdraw <id>` without a code refuses and asks for the code; the skills may want to say "use the code".
Needs the user: none
