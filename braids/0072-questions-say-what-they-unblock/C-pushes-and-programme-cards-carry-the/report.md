# 0072/C report: pushes and programme cards carry the whole question

## What changed

- `src/notify/message.ts`: a request's push reads `<handle> · <title>`, then `blocks <items> · decide|do|merge` (the act word alone when nothing waits on it), then the question. An escalation is titled `<repo> <id>: Escalated to you` (was `Needs You (escalated)` or `To Review (escalated)`) and its line no longer repeats those words. The PM's own requests carry the same line; a programme request has no item, so it reads `<handle> · decide`, then the question.
- The forwarded-merge push, per merge, separated by a blank line: `<handle> · <id> <title>`, `PR #<n> at <short head> · blocks <items>`, `PM: <note>` when the forward had a note. Keys and sequence IDs are unchanged, so nothing already sent goes out again.
- `src/board/programme.ts`: a new `requests` list beside `forwards`: the open requests on its braids' cards that are the user's (escalated, addressed to the user, the PM's own). The programme is in Needs you while one is open. `forwards` now carry what they block and the PM's note. `forwards` alone drive the merge pushes, so nothing is pushed twice. `src/board/model.ts` hands the programmes the same `unblocks` the cards use.
- `web/src/App.tsx`: the programme's need box (panel, rail order, phone strip, details) shows the block line, leads with who asks (`leadOf` in `src/board/marks.ts`), lists the requests oldest first under the programme's own, without a cap.

Built as the mockups the user approved (`mockups.html`, q-u89t).

## Why

From the phone or inside a programme the user couldn't tell what they were answering or merging, and an escalated question didn't show on its programme at all.

## Differences from the mockups

- "blocks" comes from the same derivation as the board (`unblocksOf`), which counts the asking item itself: a story's own request or merge reads e.g. `blocks 0070, 0060`, and a request nothing else waits on `blocks 0064 · do`, not `do` alone as one mockup drew it.

## Validation

- Tests: each push text (strand question, action, escalation, the PM's requests, a forwarded merge with and without a note, unchanged key), the programme's list (PM still handling, escalated, addressed to the user, forwarded, story plus the PM's own, no second push) and the lead words (`test/notify-rule.test.ts`). Older assertions and partial card fixtures were updated for the new texts and field.
- The demo board in headless Edge: the programme cards list their braids' requests (`~/.braid/artifacts/agento/0072/C-board.png`).
- Gate: local `npm run verify` (27 min under load) passed typecheck and build; 739 of 742 tests. The three failures: one old push-body assertion in `test/pm-requests.test.ts`, fixed afterwards (that file then 24 of 24), and the two known multi-process lock tests in `test/requests.test.ts` (leftover 2026-11-25-2hkx). Verify stops at the test step, so the later steps ran only in CI. The gate box is ticked on CI's evidence: the `verify` job (the same `npm run verify`) is green on ubuntu-latest and windows-latest on PR #343 at 72b7b74d, as the coordinator allowed; locally the only failures left are the two lock tests (leftover 2026-11-25-2hkx).

## Docs

`docs/board.md` (Programmes, Notifications, the `/api` fields), `docs/getting-started.md` (the programme card), `docs/decisions.md` (D111; may clash with a number on 0074's branch at that merge).

## Open

- The demo's `api` project has records without a code, so its programme boxes show an empty handle (demo data only; real records always have one).
- A programme whose braid waits on the user's own answer can still read `stalled` beside that question, as before this change.

For later items: 0072/F: docs as a whole. Idea: don't count a programme as stalled while a request addressed to the user is open on one of its braids. Leftover: give the demo `api` requests codes (`src/board/demo.ts` `apiSignals`).

Needs the user: none
