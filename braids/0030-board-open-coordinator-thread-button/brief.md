---
id: '0030'
title: "Board: Open coordinator thread button"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: []
delivery: epic
---

## Goal

On the board, a braid's coordinator thread can always be opened, on the phone (Tailscale, `t3code://` app link) and on the desktop. Today a braid card has one Open thread button whose link prefers an agent's thread over the coordinator's, so while a strand runs both the strand's button and the braid's button open the running strand, and the coordinator can't be reached from the board. The user wants a separate coordinator button.

Expected size: about 150 lines in 5 files, tests included.

## Start here

- `web/src/App.tsx`: `OpenThread` (app link on the phone and over Tailscale, server `open` action on the desktop), `Actions`, the braid card footer (`thread={braid.thread ?? braid.coordinator?.link ?? null}`) and the Needs You item row (`item.braid.coordinator?.link`).
- `src/board/model.ts`: `openThread`, `threadLink`, `coordinatorOf`, and how `toCard` fills `thread` and `coordinator` for a story and for a braid with strands.
- `src/commands/board.ts`: `openAction`, which picks the link server-side from `{ id }` (`card.thread ?? card.coordinator?.link`), so a client never passes a URL.
- `src/board/t3.ts`: `coordinators` and `idleCoordinators` (placed by title), running agents (placed by worktree) and idle threads (by title).
- `src/board/demo.ts`: the demo data (0010 has an idle coordinator); `test/board-actions.test.ts`, `test/board-tailnet.test.ts`, `test/board.test.ts`.

## Change

- Find first why the braid's own button opens the running strand (the user sees it on a goal with a running strand); fix that cause if it is a bug, and say in the report what it was.
- The braid card gets a distinct coordinator button (for example "Coordinator") that opens `card.coordinator` (running, else the newest idle coordinator thread), shown whenever the braid has one, next to the existing Open thread, which keeps opening the item's agent thread. Same on the Needs You row of a braid. Strand rows are unchanged.
- Both paths: the app link on the phone and over Tailscale, and the server `open` action on the desktop. The `open` action takes a way to ask for the coordinator (for example `{ id, thread: "coordinator" }`) and still picks the link itself.
- Label, icon and placement are the user's choice: converge loop first (mockup on demo data at phone and desktop widths), then build.

## Already decided

- The coordinator thread is the one `coordinatorOf` finds (running first, else idle; none on a Done braid). No new T3 reads.
- The board never takes a URL from the client.
- The worker stops after the mockup; the user approves the design before it is built.

## Out of scope

- Strand row buttons, Start, Merge, and the coordinator model warning.
- Opening reviewer threads separately.

## Completion

- [ ] Mockup on the demo data at phone and desktop widths, approved by the user (log entry)
- [ ] A braid with a coordinator thread shows a coordinator button that opens that thread, on the card and the Needs You row, via the app link (phone, Tailscale) and via `open` (desktop); none when it has no coordinator thread
- [ ] While a strand runs, the braid's coordinator button opens the coordinator and the strand's button opens the strand (test)
- [ ] `open` with the coordinator choice opens the coordinator's link and refuses (400) when there is none (test)
- [ ] The cause of the braid button opening the running strand is named in report.md
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
