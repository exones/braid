---
id: '0012/B'
title: "Lane order, Done collapsed, phone layout"
status: In Progress
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0012/A']
order: 20
---

## Goal

Build what the user approved in 0012/A: the new lane order, Done collapsed with its 10 newest and Show more, and the phone layout.

Expected size: about 350 lines in 5 to 8 files.

## Start here

- The braid's log entry for 0012/A and its mockups in `docs/design/board-mockups/`: the approved variant and the user's verdicts.
- `src/board/model.ts`: `LANES`, `URGENCY`, how a card's lane is picked; `toCard` and which dates a card has.
- `web/src/App.tsx`, `web/src/index.css`: the lanes, cards, item page and actions.
- `docs/board.md`: lanes, actions, the demo; "Changing the board".

## Change

- `src/board/model.ts` and `web/src`: lane order Needs You, To Review, Working, To Do, Done; Done collapsed by default, opened showing the 10 newest first and Show more; add the date Done is sorted by if the model lacks it.
- `web/src`: the phone layout of the approved variant (CSS breakpoints, tap targets at least 44 px); on small screens each button shows its icon with a short label (Start, Merge, Open thread), and Open thread is a link to the thread's `t3code://threads/<env>/<thread>` app link, opened by the phone itself instead of the `open` action.
- `src/board/demo.ts`: enough Done items to show Show more.
- `docs/board.md` and the screenshots in `docs/design/board-screenshots/`.
- `docs/design/board-mockups/phone-lanes.html`: remove the stale copy the review of 0012/A found ("No Open thread on the phone" near line 92, "Please confirm" the Done date near line 107); the logged verdicts win over the A screens, which do not draw the swipe.
- Tests for the order and the Done list (10 newest, newest first, the rest behind Show more).

## Already decided

- The decisions in the braid brief, and the user's verdicts logged for 0012/A.
- Desktop and phone share one page; the phone layout is CSS and small UI changes, not a second app.

## Out of scope

- Serving the board beyond `127.0.0.1` (0012/C).

## Completion

- [ ] Lanes in the new order on desktop and phone
- [ ] Done collapsed by default; opened, its 10 newest items newest first and Show more; tests cover both
- [ ] The phone layout matches the approved mockup at about 390 px wide; screenshots of `braid board --demo` in docs
- [ ] docs/board.md updated
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Plan

- Model: `LANES` order Needs You, To Review, Working, To Do, Done (internal names unchanged); `PullRequest.mergedAt` from the `gh` field already read; cards get `doneAt` (merged PR's date, newest strand's for a braid); `doneList(cards, shown)` sorts newest first (no date last, then id descending) and returns the first `shown`; `DONE_PAGE = 10`.
- Web: `t3codeUrl` moves to `src/board/marks.ts` (pure) so the page can build the app link. Board: five lanes on desktop with Done a collapsed fold (rows: id, title, date; 10 shown, Show more adds 10); below `md` a tab bar with counts, one lane shown, swipe left/right switches, Needs You first. Buttons get a visible label and 44 px tap size below `md`; Open thread is an `<a href="t3code://…">` there.
- Demo: more Done braids. Docs: board.md, decisions.md, screenshots. Mockup: remove the two stale lines.
- Tests: lane order, Done list (10 newest, order, rest behind Show more), t3codeUrl.
