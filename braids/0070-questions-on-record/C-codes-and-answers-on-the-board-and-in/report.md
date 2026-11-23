The board now shows each open request with its code and a link to the asking thread, lists closed requests with who answered, shows a request to another braid on the asking braid's card, and puts the code in pushes. Built as the user approved the mockups (verdict via the PM: "A / A / A / Overall: A").

What changed:

- `src/board/record.ts` (new): `RequestRow` (code, item, state, asker, `to`, done-when, age, asking-thread link, forward note, and how it ended: when, who, text, the PM's reason) and `requestsOf`, which gives an item's open, waiting-on-others and closed requests, closed newest first.
- `src/board/model.ts`: `Need.code` and `Need.asking` (the thread that asked, also for a forwarded request, whose `link` stays the PM's for the push). `Signals.waits` and `Signals.closed`. `BraidCard.waits` (requests of the braid or its strands to another braid) and `ItemDetail.requests`.
- `src/board/signals.ts`: splits the record into open, waits (to another braid) and closed. A request whose PR merged or closed is shown closed at once (met, or withdrawn), as the board's `ended`; nothing is written, `braid requests` still records it.
- `src/notify/message.ts`: the body of a request push starts `q-7f3k · <title>`, also the PM's and a forwarded one. A withdrawn or met request leaves the open list, so the notifier's existing rule clears its push; no new state.
- Page (`web/src/App.tsx`): the code chip and "Open asking thread" on the need line and the details box ("Say q-… in any thread"), the grey "Waiting on braid 0002: …" line on the asking card, and the Requests tab (open, waiting on others, closed with state, who answered, answer, reason, time; 10 at first and "Show more"). The demo (`--demo`) has codes, a wait and four closed requests.

Validation:

- New `test/board-requests.test.ts` (7 tests, on a real record in a temporary repository): code and asking thread on the need and in the push; a forwarded and a PM request carry the code; an answered request (user, and the PM with its reason) and a withdrawn one listed newest first, per item and per braid and in `toDetail`; a request to another braid on the asking card and nowhere as the user's; a PR that merged or closed closes its waits for the board (met, withdrawn) without writing; a withdrawn and a met request each clear their push through the notifier.
- 0070/B's review: `filterLive` now asserts which request stays, and a `pr:` wait whose PR closes unmerged is tested as withdrawn (`voidEnding`, and recorded through `liveRequests`).
- Gate: `npm run verify` passed (611 tests).
- Screenshots of the demo board and a Requests tab are in `~/.braid/artifacts/agento/0070/` (`c-board.png`, `c-requests.png`).

Docs: `docs/board.md` (Requests: codes, links, the tab, the waiting line, pushes) and `docs/decisions.md` (D98 and the log line). `docs/cli.md` and the CLI help are not affected: no command changed.

Open: nothing. A strand's detail shows only its own requests; the braid's shows its strands' too.

For later items:

- The PM plan: a board-wide Questions list (mockup screen 3, not built, the user said later).
- 0070/D and 0070/E: nothing new from this item.

Needs the user: none

CI fix: the refusal naming two open requests listed their codes in random file order; a test of 0070/B failed on Ubuntu half the time. The coordinator's code now comes first.
