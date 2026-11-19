---
id: '0041'
title: "Board: numbers in full with bold digits, thread buttons with role icons"
status: In Progress
labels: ["kind:story", "tier:S", "ui"]
dependencies: []
related: ['0034']
delivery: epic
---

## Goal

Two small changes to how `braid board` labels things, so they match what the user sees in thread titles:

- A braid number is shown in full, `0034`, with its significant digits (`34`) in bold and the leading zeros in normal weight. That holds everywhere the board shows a number, including strand ids (`0034/A`, today cut to `34/A` in the strand rows).
- The Open thread and Coordinator buttons show the role emojis used in thread titles (`braid title`) instead of today's icons (an arrow-out-of-box and a person): 🧠 for the coordinator, 💻 for a worker's thread. When Open thread opens another role's thread (a reviewer's 👀, a researcher's 🧪), it shows that role's emoji.

Expected size: about 60 lines in 3 files, tests included.

## Start here

- `web/src/App.tsx`: where ids are drawn: `Card` (`braid.id`), the strand rows (`s.id.slice(2)`), the Done lane rows (`b.id`), `Detail`'s header (`item.id`), `Contents` (`braid.id`, strand letters), and the inbox row's `from` chip. The buttons: `OpenIcon`, `CoordinatorIcon` and `Actions` (`name`, `what`, `Icon`).
- `src/braids/title.ts`: the role emojis and how a thread title is read (`<emoji> <repo> <id> <role>: <title>`; older titles have no emoji).
- `src/board/` (the snapshot), for whether the board data already says which role the item's thread has; `docs/board.md`, "Open thread and Merge on request" and "On the phone".

## Change

- One small component in `web/src/App.tsx` that draws an id (`0034`, `0034/A`) as leading zeros plus bold significant digits (`00` + **`34`**, then `/A`); use it at every place listed above. Widen the strand-row id column if `0034/A` doesn't fit.
- `Actions`: the Coordinator button shows 🧠, Open thread shows the emoji of the thread's role (💻 worker, 👀 review, 🧪 research), 💻 when the role isn't known (an old title without an emoji). If the snapshot doesn't carry the role yet, add it from the thread title, taking the role from the title the way `src/braids/title.ts` reads it, not a second parser. Tooltips, `aria-label` and the phone labels stay as they are ("Open thread", "Coordinator").
- `docs/board.md`: say how ids are shown, and replace "a person icon" and any other description of the old icons; new screenshots in `docs/design/board-screenshots/` where the old ones show the changed ids or buttons.
- Tests for the id split (`0034` → `00` + `34`, `0100`, `1000`, `0034/A`) and, if the role is added to the snapshot, for the role taken from a title with and without an emoji.

## Already decided

- Scope is the board only; the CLI's text output (`braid list`, `braid view`) is unchanged.
- The emojis are the ones thread titles use (`braid title`); no icon library, no new images.
- Related to 0034 (Board: item details in a side panel, not a page, PR #161 on `braid/0034-board-item-details-in-a-side-panel-not-a`): both change `web/src/App.tsx`, including `Detail`, `Contents` and the item header. Start this story after 0034 merges into `main`, and merge `main` into this branch first.

## Out of scope

- Other icons (lane, request and alarm icons, Start, Merge).
- What Open thread opens, or when a button shows.

## Completion

- [x] Every braid number on the board (cards, strand rows, Done rows, item details, inbox `from`) reads in full with the significant digits bold; demo screenshot in the report
- [x] Coordinator shows 🧠 and Open thread shows its thread's role emoji (💻 when unknown), desktop and phone; demo screenshot in the report
- [x] Tests for the id split, and for the role from a title if the snapshot gained it
- [x] `docs/board.md` describes both, with updated screenshots
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Mockup on demo-like data (card, strand rows, details header, 🧠/💻 buttons); stop for the user's verdict.
2. `Id` component in `web/src/App.tsx` (zeros + bold significant digits, optional `/X`), used on the card, strand rows, Done rows, details header, `Contents` and the inbox `from` chip; wider strand id column.
3. Role: add `role` to the snapshot's thread (from `T3Thread.role`/title via `parseThreadTitle`), `Actions` shows 🧠 / role emoji / 💻 default.
4. Tests (id split, role from title), `docs/board.md`, new screenshots, gate, report, PR.
