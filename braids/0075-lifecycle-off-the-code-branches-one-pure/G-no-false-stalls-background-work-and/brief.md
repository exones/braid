---
id: '0075/G'
title: "No false stalls: background work and timed waits"
status: In Progress
labels: ["kind:story", "tier:L", "ask:process"]
dependencies: []
order: 28
---

## Goal

The board stops reading "Stalled after a nudge" on braids that are working or deliberately waiting. False stalls train the user to ignore real ones. This is a hotfix into `main` on its own PR, ahead of the rest of 0075 (inbox 2026-11-24-5gqa and 2026-11-24-9fex; the user chose "a").

Two real cases from everix4 on 2026-11-24:
1. 0010/B's worker was rerunning its gate as a background command. T3 shows such a thread `completed`, so the board read "no running agent", nudged it, and then showed it stalled.
2. 0012/B's worker was idle on purpose until its own wake-up at 04:15Z. Its coordinator could only say so as a question to the PM (q-csru, later withdrawn).

Expected size: about 150 lines in 6 to 8 files, half of them tests, plus one skill line.

## Start here

- T3's `thread list --json` now carries, per thread, `pendingBackgroundTasks` (an array) and `blockedOnThreadWait` (a bool). Check them on any thread of yours with `t3 thread list --project <project> --json` (`~/.t3/bin/t3.cmd` on Windows).
- `src/board/t3.ts` `readFresh`: how running threads are found, for workers, coordinators, the PM thread (`states`) and recorded reviewers.
- The stall and nudge rules: `src/board/model.ts` (an item's and a braid's stall clock), `src/board/programme.ts` (the PM's stall), `src/board/nudge.ts`.
- Requests and waits: `src/braids/requests.ts` (`openRequest`; `--done-when time:<iso>` waits), `src/commands/requests.ts` (`braid ask` and its addressees), and the board's time wake for waits (`src/board/waits.ts`, `src/board/wake.ts`).
- `docs/board.md` (Nudges, broke alarms, waits) and `docs/cli.md` (`braid ask`).

## Change

1. **Background work counts as working.** A thread with a non-empty `pendingBackgroundTasks` or with `blockedOnThreadWait: true` counts as running, for workers, coordinators and the PM alike, wherever the board decides that something is running.
2. **A timed wait that isn't a question.** Use the smallest form that reuses the request record, for example `braid ask <id> "<why>" --done-when time:<iso>` with no addressee, or with `--to self`.
   - On the card it shows quietly, as "waiting until 04:15". It is never pushed to the user.
   - It keeps the item and braid from reading stalled until that time.
   - The board's existing time wake ends it.
   - A time that passes with nothing happening reads as stalled, as today.
3. **One line in the braid skill** (`.agents/skills/braid/SKILL.md`) on when and how to use the timed wait, offset by one line removed. The skills must not grow.
4. Tests from both real cases:
   - a worker thread `completed` with `pendingBackgroundTasks: [ … ]` is running, and its item isn't nudged or stalled;
   - a coordinator thread with `blockedOnThreadWait: true` likewise;
   - a timed wait until a future time means no stall, no push, and the card shows "waiting until";
   - after the time passes, the stall comes back as today.
5. Docs: `docs/board.md`, `docs/cli.md`, and the help text for `braid ask`.

## Already decided

- Decided by the PM: this hotfix goes into `main` on its own PR, "because false stalls on working or deliberately waiting braids train the user to ignore real ones, instead of waiting for 0074; the user chose a". Its branch is cut from `main`, and its PR goes into `main`. The braid branch merges `main` afterwards.
- The braid branch has restructured the same stall code (0075/C: one pure lane derivation, alarms as a separate step). Keep this change small and local: one predicate for "running" and one for "deliberately waiting", called where the stall decides, so that merging it into 0075/C's structure stays simple.
- No new storage. The timed wait is a request record, like the other waits.

## Out of scope

- Board pauses and resumes (0074); the PM's own requests beyond what the timed wait needs; anything else of 0075.

## Plan

1. One predicate for "running", `working` in `src/board/t3.ts`: T3 says `running`, or `pendingBackgroundTasks` is non-empty, or `blockedOnThreadWait` is true. `readFresh` uses it for listed threads (workers, coordinators, idea threads), and `statusOf` uses it for the `states` map (the PM) and for `thread show` (recorded reviewers, PM checkers, `braid clean`). So a working thread reads `running` everywhere.
2. A timed wait is a request with `to: self` (`SELF`, `isTimedWait` in `src/braids/requests.ts`), and `isWait` includes it. It goes in the board's waits: no lane change, no push. `remindable` excludes it. `waitStall` ignores it, since it has no addressee to be gone or late. One predicate for "deliberately waiting" (`waits` in `src/board/model.ts`) keeps a timed wait only while its time is still ahead.
3. `braid ask --to self` requires `--done-when time:`. `braid requests` and the history show it as a timed wait. The card's `WaitLine` reads "Waiting until <time>", and the Requests tab adds a badge.
4. Tests in `test/board-no-false-stalls.test.ts` for both real cases. Docs updated: board.md, cli.md, braids-format.md and the `braid ask` help. The skill gains one line and loses one.

## Completion

- [ ] A thread with pending background tasks or blocked on a thread wait counts as running for workers, coordinators and the PM (tests from the 0010/B case)
- [ ] A timed wait (`--done-when time:<iso>`, no question to anyone) shows quietly as "waiting until <time>", is never pushed, keeps the item from reading stalled until then, and ends with the time wake (tests from the 0012/B case)
- [ ] After the time passes, the stall reads as today (test)
- [ ] The braid skill gains one line on the timed wait and loses one; `.agents/skills/` is no longer than before (report.md gives both counts)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated (at least `docs/board.md`, `docs/cli.md` and the help text), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
