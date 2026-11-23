# 0069/B report

## What changed

- **One rule.** `forUser` (`src/notify/message.ts`) is the only place that says whether a need pushes and which thread it opens; `pushesOf` relies on it alone. It reads the need a request produced (`verb: asked` with a time, `via`, `by`, and `link`, the thread to open) and returns a push kind (`request`, `forward`, `pm-ask`, `stall`) with the link, or nothing.
- **Pushes:** a request to the user (any kind; a handover too) opens its asking thread, else the braid's coordinator; an escalation (timeout, gone PM thread) the same; a forward is the PM asking (🧭, high, `<repo> <id>: the PM asks`, `The PM asks you: …`) and opens the PM's thread (`pm` of the request); the PM's own request and a programme stall open the PM's thread. **No push** for a request the PM handles, a broke alarm, an agent's pending question, a Done-stamped story with no request, a strand PR with no request, or a Done braid a programme runs.
- **Click links.** A request's `Need` now carries `link`. `linkOfThread` (`src/board/model.ts`) takes T3's link, else builds one from the thread id with the environment of any listed thread; when neither works the body ends with "Open the board" and the push still goes (the Done push too).
- **Under a PM.** `throughPm` (`src/board/pm.ts`): a forwarded non-handover request of a braid a live programme lists is the PM asking. The programmes panel lists it (`Programme.forwards`, `The PM asks you: <text> — <note>`, opening the PM's thread), the programme reads Needs you, and the push comes from the programme with the braid's old key and sequence ID (a restart sends nothing twice). The braid's card keeps its lane with `Waiting on the user, through the PM: <text>`; the PM's "handling" list leaves it out. A forward of a braid no programme lists, an escalation, and a forwarded merge handover stay on the braid's card (the handover joins 0069/C's merge push).
- **0069/A review suggestions.** `test/pm-requests.test.ts`: `pushesOf` on the missed-PR derive; a stored Done, missed PR, review still with the PM now reads **To Do** with the PM line (the review said it already did; it read Done, so `derive` now says To Do) and pushes nothing.
- Web: the panel shows the forwards, the programme mark counts them, the card's PM line says "the PM asked you … it pushes from the PM's thread".

## Why

Under a PM the user got "To Review" and forwarded pushes nobody asked of them, one per strand need, alarms included, some without a thread link.

## Validation

`npm run verify` passes (555 tests). New `test/notify-rule.test.ts` covers every push case and no-push case with the thread each opens, the link fallbacks ("Open the board"), the forward under and outside a programme, and escalations under a PM. `test/notify.test.ts`, `pm-requests` and `programmes` tests updated to the rule.

## Docs

`docs/board.md` (Requests, Notifications), `docs/cli.md` (`forward`), `docs/decisions.md` (D92). CLI help text still true.

## Decisions

- A forwarded **handover** (review) is not moved to the panel: Merge is the user's act on the card, and the merge push is 0069/C's. It does push once as the PM's request (🧭, PM thread), as 0069/A's test expects.
- A forwarded request keeps its old key and sequence ID, so no resend after an upgrade; only the title, tag, body and click change.
- The Done push for a braid a programme runs is removed (not low-priority), per the brief; "a programme runs it" is a live (not done/stopped) programme.
- The "no programme lists it" test for a forward uses the plan rows (`sig.plans`), the same source the panel uses.

## Open

None.

For later items: the demo board (`--demo`) has no forwarded-through-the-PM example; the PM's "nothing can run until you act" push is 0069/D.

Needs the user: none.
