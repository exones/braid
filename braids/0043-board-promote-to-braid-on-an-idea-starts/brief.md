---
id: '0043'
title: "Board: Promote to Braid on an idea starts a planning coordinator"
status: In Progress
labels: ["kind:story", "tier:M", "ui"]
dependencies: []
related: ['0038', '0041', '0042']
delivery: epic
---

## Goal

Today an idea in the board's inbox becomes braids only when the user goes to a coordinator chat and asks for it. After this story each idea on the Inbox page has a **Promote to Braid** button: after a confirmation, the board launches a new coordinator thread in T3 whose first message asks it to plan a braid from that idea with the braid skill. The coordinator plans as usual (plan request, the user's approval) and, once the plan is approved, takes the idea out of the inbox with `braid inbox take <idea> --into <ids>`.

Expected size: about 250 lines in 5 files, tests included.

## Start here

- `src/commands/board.ts`: `startAction` and `coordinatorMessage` (Start launches a coordinator with `t3 thread start`, a fetch, a free branch name and a model warning), `mergeAction`, and how actions are registered and refused (`UsageError`, `Start: <reason>`).
- `web/src/App.tsx`: `InboxPage`, `InboxColumn`, `InboxRow`, and the Start button and its confirmation dialog (what launches, the model, the base branch) for the pattern to copy.
- `src/board/inbox.ts` and `src/inbox/branch.ts`: how the board reads open inbox entries (`braid-inbox`), and `braid inbox take` in `src/commands/inbox.ts`.
- `src/board/t3.ts`: what the board reads of T3 threads (title, worktree, branch, running), for the "already being planned" check.
- `docs/board.md`, "The inbox", "Start", "Actions and the session token", "On the phone" and "On Tailscale".
- The braid skill, "Plan" step 1: planning from an idea is already how the coordinator works; this story only lets the board ask for it.

## Change

- **Show first** (stop for the user's verdict): screenshots on the demo data (`braid board --demo`) of the Inbox page with Promote to Braid on the idea rows, the confirmation dialog, and a row whose idea is already being planned, on desktop (1440 px) and on the phone (390 px), in the item folder. Propose where the button sits (on the collapsed row, or only when it is open) and the dialog's wording; say which you recommend.
- After approval:
  - `src/commands/board.ts`: a `promote` action with `{ id }` (an idea id). The server reads the inbox again (with a fetch of `braid-inbox`) and refuses with `Promote: <reason>` when the entry isn't an open idea, T3 isn't reachable, or a coordinator for this idea is already running. Then, like Start: `git fetch origin`, a free branch `coordinator/idea-<idea id>` (`-2`, `-3` when taken) from `origin/<main>`, `t3 thread start <main checkout> - --title <title> --worktree origin/<main> --branch <name> --json` with no model flags, the first message on standard input, and the same model warning as Start.
  - The first message: `Use the braid skill and plan a braid from the idea <idea id>: <title>.`, the idea's full text quoted, and that this came from the board's Promote to Braid, which is the user's request to plan this idea (not to start it); after approval `braid inbox take <idea id> --into <braid ids>`.
  - Thread title before a number exists: `🧠 <repo> idea coordinator: <idea title>`, sanitised for cmd.exe as Start does; the coordinator renames its thread with `braid title` once the braid has a number (the skill already says so).
  - "Already being planned": a running T3 thread on a branch `coordinator/idea-<idea id>` (or its `-2`, `-3`). The idea row then shows that instead of the button, with an Open thread button for that thread.
  - `web/src/App.tsx`: the button, the confirmation dialog (what launches, the model, the base branch), the result or refusal shown in the dialog, and the planning state on the row; 44 px buttons with a label on the phone.
  - Tests for the action (refusals, branch name, title, first message, the planning check) with fake `t3` and `git` runners, as Start's tests do.
  - `docs/board.md`: "The inbox" says ideas carry Promote to Braid and what it launches; the Inbox page is no longer described as read only; a screenshot.

## Already decided

- Promote launches a coordinator and plans; it never starts work. The plan still needs the user's approval in the coordinator's thread.
- The idea stays open in the inbox until the coordinator runs `braid inbox take` after approval; the board writes nothing to `braid-inbox` itself.
- Leftovers get no button: they go through sweeps.
- Works over Tailscale like Start (the session token rules of "Actions and the session token" apply).
- No change to the braid skills: the first message carries the request, and "Plan" step 1 already covers planning from an idea.
- Related to 0041 (Board: numbers in full with bold digits, thread buttons with role icons, on `braid/0041-board-braid-numbers-in-full-significant`): it changes the Open thread button's icon; this story's Open thread on an idea row uses whatever `main` has then. Whichever merges second merges `main` first and keeps both.
- Related to 0042 (Board: strand list as a left rail in the details panel, on `braid/0042-board-strand-list-as-a-left-rail-in-the`) and 0038 (Sweep: leftovers from 0029, on `braid/0038-sweep-leftovers-from-0029`): both change `web/src/App.tsx` away from the Inbox page; whichever merges second merges `main` first.

## Out of scope

- Editing, dropping or drafting ideas from the board (idea 2026-11-18-vumx).
- Promoting several ideas into one braid from the board; the coordinator can still fold related ideas in during planning if the user asks.
- Choosing the coordinator's model from the board (T3's project default, as Start).

## Plan

Verdict (mockups 5121127): the button on the collapsed row, dialog wording as mocked. Built as the brief says:

- `src/board/t3.ts`: `thread show`'s `branch` of running threads gives `ideaThreads`; `ideaPlanning` matches `coordinator/idea-<id>` and its `-2`, `-3`.
- `src/commands/board.ts`: `promoteAction`, `promoteMessage`, `open` with `{ idea }`.
- `src/board/{inbox,model,demo}.ts`: `planning` on ideas, `expected` on the inbox, a demo idea being planned.
- `web/src/App.tsx`: the button, dialog, planning state.
- `test/board-promote.test.ts`; `docs/board.md`, D67.

## Completion

- [x] Screenshots of the Inbox page with Promote to Braid, the dialog and the planning state (desktop and phone) in the item folder, and the user's verdict in the item's log
- [x] Promote on an open idea launches a coordinator thread with the title, branch and first message above (test with fake runners)
- [x] Promote is refused with `Promote: <reason>` for an unknown or taken entry, a leftover, T3 down, and an idea already being planned (tests)
- [x] An idea being planned shows that state and an Open thread button instead of Promote (demo screenshot in the report)
- [x] `docs/board.md` describes Promote to Braid, with a screenshot
- [x] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
