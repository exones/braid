---
id: '0071/G'
title: "Fix: reads never close a request; one eta wording; the missed estimate beside a question"
status: Done
labels: ["kind:task", "tier:M"]
dependencies: []
order: 70
---

## Goal

The PM's live check of the final PR (#290 at 6b64f9f) found a blocking bug. A plain `braid requests` closes a request whose condition holds: `liveRequests` (src/braids/requests.ts, called from the list in src/commands/requests.ts) records `met` "by the board" and sends nothing. It does this for held braids too. The board wakes only requests that are still open, so that wake is lost for good. Any coordinator or the PM that lists requests loses wakes.

Seen twice in the check:
- `braid requests` closed held 0077's wait, which the board had correctly skipped.
- With no board running, a passed `time:` wait was met by a plain list, and a board started afterwards sent nothing.

Report: C:\Users\exon\.braid\artifacts\agento\0071\report-test-0071.md, with the sends in t3-send.log beside it.

Expected size: about 150 lines in 8 files.

## Start here

- The PM's report above, and the braid's log (`braid view 0071`).
- `src/braids/requests.ts`: `liveRequests`, `filterLive`, `conditionEnding`, `voidEnding`. `src/commands/requests.ts`: `requestsCommand` and `history`. `src/board/wake.ts`: the only sender of wakes.
- `src/board/model.ts` and `web/src/App.tsx`: the card's need line when a braid has an open question and a broken wait. `src/board/record.ts`: the details panel history.

## Change

- Reads never close a request. Only the running board's tick records an ending: `met` with its wake, or `withdrawn` (a closed PR, a moved review head), and it skips held or paused braids as it does now. `braid requests` and any other read show a request whose condition holds as still open, marked e.g. "condition holds: the board wakes the asker", and write nothing. Check every caller of `liveRequests`, `filterLive` and their helpers for a write on a read path.
- A test through the CLI (`dist/cli.js requests`) on a request whose condition holds: nothing is written on `braid-requests`, the request stays open, and a board tick afterwards still sends its one wake. A held braid's request also stays open after the list.
- One wording for an `eta` event, the same in the CLI history (today "the coordinator") and the details panel (today "the 0075 coordinator"). Pick the clearer one, which names the braid.
- A card with an open question and a missed estimate shows the question first and keeps the red "past its estimate" line under it, since both need the user. The same holds for a gone addressee.
- Docs that say `braid requests` records `met` without a board (docs/cli.md, docs/board.md, docs/braids-format.md, D100 in docs/decisions.md and the braid's "Already decided") are made true: without a running board nothing closes, and the board closes it and wakes when it next runs.

## Already decided

- Everything in the braid's "Already decided", except one line, which the PM's check overturns: "`braid requests` still records `met` as today" is replaced by "reads never close a request; only the board's tick does, with its wake". Log this as a plan change.
- Two boards started at the same instant can both send one wake. That stays out of this braid: it is a leftover for P21 · 0074 (a per-repository acting-board lock).

## Out of scope

- A board lock. Any other change to the wake, reminder or nudge.

## Completion

- [x] `braid requests` (and every other read) never records an ending; a request whose condition holds stays open until the board's tick wakes it; a test runs the list through the CLI and then a board tick, and sees one wake
- [x] A held braid's request whose condition holds stays open after a list; a test covers it
- [x] The eta event reads the same in the CLI history and the details panel
- [x] A card with an open question and a missed estimate or a gone addressee shows both lines; a test covers it
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

- `liveRequests` (the write on a read path) becomes `holding`: it only reports which open requests' conditions hold. `braid requests` lists them as open with "condition holds: the board wakes the asker". Its only caller was the list.
- The CLI history names the coordinator by braid, as the details panel does.
- A need gets an optional `also`: a broken wait under an open question; the card and details render it.
- Docs and tests follow.
