---
id: '0082/B'
title: "Question gaps after 0072: handles, marks and waits"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 20
---

## Goal

Every place the user reads a request names it and marks it the same way, so the Questions panel (0082/E) shows clean data. Fixes leftover 2026-11-26-03t9 (the PM's live check of 0072 at af35754, PR #349) and 2026-11-25-1onw (spoken handles after 0072/G), and keeps an open question on a Done braid visible (the user's answer 6B, D118).

Expected size: about 250 lines in 8 files, tests included.

## Start here

- Leftover 2026-11-26-03t9 and 2026-11-25-1onw, quoted under Change; the PM's screenshots are in `~/.braid/artifacts/agento/0072/pm-check` if present.
- `src/braids/requests.ts`: `openRequest` (the "replaced by …" withdrawal text, about line 458), `answeredRows` (what `braid decisions` prints, about line 692), and the handle 0072/G made.
- `src/board/model.ts`: `Need`, `needOfRequest`, `actOf`, `requestLane`; how a Done braid's item is built and why its open requests drop out.
- `src/commands/requests.ts` `askCommand`: what `braid ask` prints when it replaces an open request.
- `web/src/App.tsx`: `RequestsTab`, `RequestCard` (around line 1390, the `decided by` label) and the Done card.
- `src/cli.ts` line 85 and `src/commands/board.ts` around lines 583 and 1232: `--no-pause` turns off both the limits pause and the wake.
- `braids/0082-the-questions-panel/A-mockups-the-questions-panel/mockups.html` and D118 in `docs/decisions.md`: the approved design, for the Done card (frame 1's notes).

## Change

From 03t9:
1. The "replaced by …" text on a withdrawn request and `braid decisions` show the request's handle (`yellow-bear-5asx`), not the q-code. Old records whose text already says `replaced by q-…` may stay as written; new ones carry the handle.
2. On the details panel's Requests tab, a request the PM escalated carries the same escalated mark as the card.
3. `actOf`: a wait on another braid doesn't read "· decide", and a timed wait (`--to self --done-when time:`) doesn't show as "question" on the board; pick the words from the wait's own meaning (e.g. `waits for 0077`, `until 21:00`) and use them wherever the act word shows.
4. `braid ask` that replaces an open request says which one: `… opened, replacing <handle>`.
5. An open request on a braid (or strand) that is Done stays on the board: in the model, so 0082/E's panel gets it, and on the Done card as a need line (6B: "I don't want to lose questions").
6. `braid board --help` (and `src/cli.ts`'s board line) says `--no-pause` also turns off the wake.

From 1onw:
7. Tests pin `Need.handle` and a q-code whose four characters are all digits (`q-0123` given with `q-` or its words, since `0123` reads as an item id).

Tests for 1 to 5 on the model and the commands; the web build passes.

## Already decided

- Requests are shown and copied by the one handle 0072/G makes, never split in two (0072, the user).
- The user's answer 6B (shiny-muffin-fqro, D118): an open question on a Done braid shows in the panel and on the Done card.
- The panel itself is 0082/E; this strand only fixes the data and the existing views.
- Leftover 2026-11-26-dxqo (an all-digit suffix read as a braid number) is related: point 7 adds the test of the accepted forms only. If the fix for dxqo falls out naturally (try the request suffix when no braid has that number), it may go here; say so in report.md.

## Out of scope

- The Questions panel, the request fields `context` and `options` (0082/C), answering from the board (0082/D).
- Changing the escalation or its limits.

## Plan

1. `requests.ts`: `openRequest` writes `replaced by <handle>` and returns the handles it replaced; `answeredRows` names the handle.
2. `board/record.ts`: `actWord` (`waits for 0077`, `until 21:00`, else `actOf`) for rows and `braid ask`/`braid requests`; a row carries the escalated or forwarded mark (`routeOf`). The Requests tab shows both.
3. `braid ask`: `opened, replacing <handle>`.
4. `model.ts`: a Done item keeps its open request as `need`/`pmAsk`/`pm`; lanes and pushes stay as they are. Web: need lines on the Done lane's rows (those rows first, a count on the collapsed lane), and on a live braid's card for a Done strand.
5. `braid board --help` (new: today it is refused) prints the board's help line; the line and the start line say the wake goes off too.
6. Tests on model and commands; `Need.handle` and `q-0123`. Docs: `board.md`, `cli.md`, `braids-format.md`.

## Completion

- [x] Withdrawn requests' "replaced by" text and `braid decisions` show handles, with tests
- [x] The Requests tab marks a request the PM escalated
- [x] Waits and timed waits read their own words, not "decide" or "question", with tests
- [x] `braid ask` says which request it replaced
- [x] An open request on a Done braid stays in the board model and shows on the Done card, with a test
- [x] `braid board --help` says `--no-pause` also turns off the wake
- [x] Tests pin `Need.handle` and an all-digit q-code
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
