# 0078/G report

A merges push whose list only got shorter now replaces the earlier one without a sound, and docs/board.md agrees with the board on the missed-PR case and on the handover push title.

Each leftover was checked against d7f47a8f first:

- **cbe9 (quiet shrink): was open**, now fixed. `mergesPush` was always high priority. `shrankFrom` (src/notify/message.ts) tells a group whose PRs and heads are a strict subset of the one sent; the notifier sends it at ntfy priority low, same sequence ID. A joined merge or a moved head alerts as before. The superseded key stays in `notified.json` until the shrunk push is sent, so a retry after a failed send is quiet too.
- **cft5 (missed PR, review with the PM or forwarded): partly gone**, the rest fixed in the docs. `heldReview` no longer exists (removed by 0075/B). A story or strand reads To Do, as lane rule 1 said. A braid with strands whose strand is Done still read In Progress (Working). The card is right: the braid has started, and docs/board.md "Lanes" already says such a braid reads Working, not To Do. Lane rule 1 now says so; it also no longer says "stays To Review" for a handover the PM is still checking. No lane code changed; a test pins the behaviour.
- **uanu, docs half: was open**, now fixed: docs/board.md names the handover push title `To Review` (`LANE_LABEL`, src/board/marks.ts).

Docs: docs/board.md (lane rule 1; the merges push; "What a push contains"). No other doc from BRAID.md `docs` is affected.

Validation:

- Focused: test/notify.test.ts (new: shrunk group quiet, also across a failed send; grown, moved head and swapped merge alert), test/pm-requests.test.ts (new: the cft5 lanes), test/notify-rule.test.ts, test/lifecycle.test.ts: 70 passed.
- `npm run verify`: passed; node tests 874, 873 passed, 1 skipped, 0 failed (about 8 min). A first run stopped at typecheck on the new test; fixed.
- Not tried on a phone: that low priority replaces without a sound is ntfy's documented behaviour, tested here only up to the published priority.

Decisions: Decided: cft5: the card is right for a braid with strands, so lane rule 1 changed, not the code. Decided: "quiet" is ntfy priority low, not min. Decided: a shrunk group stays quiet on a retry.
For later items: none
Needs the user: none
