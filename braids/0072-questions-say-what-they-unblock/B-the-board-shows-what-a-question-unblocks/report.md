# 0072/B report

## What changed

- `Need` carries `blocks` (the items answering it unblocks, from `unblocksOf`) and `act` (`decide`, `do`, `merge`), next to `code` and `handle`. `deriveBoard`, `toCard` and `toDetail` build the lookup from the braids' real statuses (`withStatuses`) and the open requests, so a card read alone still gets its own braid's.
- Card need line, details Needs-you box and each open request on the Requests tab: handle chip, `blocks 0072/B, 0072/C · decide` (just the act word when nothing waits). The chip shows and copies the handle.
- Wording: "Escalated to you:" (`ESCALATED_WORDS` in `src/board/pm.ts`, so pushes carry it too); a coordinator's action reads "The coordinator asks you to:".
- Requests tab: a **Decided** group (answered, newest first: answer, "decided by you / the PM", the PM's reason, time); Closed keeps withdrawn and met.
- Mockups (`mockups.html`): approved as first shown (q-zctf); the roomy question card was moved to P25 (q-pwcu), so none is built, and no `context`/`options` fields or flags.

## Why

The user: a question must say what it unblocks and whether to decide or do; "Escalated" read as escalated to the PM.

## Validation

`test/board-unblocks.test.ts` (six tests: blocks and act, braid-level plan, action words, merge, escalation with blocks, Decided vs closed, row data); `test/pm-requests.test.ts` updated for the words. Gate (`npm run verify`): 727 tests pass; one fails locally, `requests.test.ts` "overlapping writers in separate processes lose no update" (and its stale-lock twin), which times out after 106-167 s on this machine and uses the record lock this item does not touch; CI decides.

## Docs

`docs/board.md` (handle, Decided, blocks line, escalation words), `docs/decisions.md` D109.

## Open

- The built board has no dark mode; the new elements use the board's existing light classes. Dark text in the mockups was the mockup page's own and is fixed there.
- Pushes still lead with the code (`coded` in `src/notify/message.ts`), not the handle: 0072/C.
- `src/board/programme.ts` untouched (0074): a programme request's need has `blocks: []`.

For later items: P25 ranks open questions on `Need.blocks`/`Need.act`; the roomy card (context, options, Custom) with `context`/`options` record fields and `braid ask --context/--option` flags comes with it.

Needs the user: none.
