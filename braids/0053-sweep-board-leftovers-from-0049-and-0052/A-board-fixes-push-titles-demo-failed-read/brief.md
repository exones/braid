---
id: '0053/A'
title: "Board fixes: push titles, demo failed read, close()"
status: Done
labels: ["kind:task", "tier:M", "sweep"]
dependencies: []
order: 10
---

## Goal

Four small board fixes left over from 0049 and 0052, in one PR into the braid branch: pushes say which project they are about when repository names clash, `braid board --demo` shows a project whose read failed, the board's `close()` waits for the server to close, and every in-process board test stops the board with `close()`.

Expected size: about 80 to 150 lines in 6 to 10 files, plus retaken screenshots.

## Taken leftovers

- `2026-11-20-rxvh`, from 0049/C, ref https://github.com/exones/braid/pull/198. **Push titles clash when two projects share a repository name.** What: when two listed projects have the same repository name, their pushes read the same (`same 0001/B: Needs You`); use the project name in the title when repository names clash. Where: src/notify/message.ts (push title) and the per-project notifiers in src/commands/board.ts. Why: one board now sends pushes for every listed project; the phone can't tell which project a push is about.
- `2026-11-20-7pcs`, from 0049/D, ref https://github.com/exones/braid/pull/199. **Demo board has no project with a failed read.** What: `braid board --demo` has no project whose last read failed, so the dashed card edge, the ⚠ tag and the panel's red note appear only in the mockups (44, 45, 49), not in screenshots of the built page. Add such a project to the demo and retake the screenshots. Where: src/board/demo.ts, docs/design/board-screenshots/. Why: the failed-read state is the one most likely to regress unseen.
- `2026-11-20-e5gb`, from review 0052, ref https://github.com/exones/braid/pull/194#issuecomment-7044215311. **Board close() doesn't wait for the server's close event.** What: `Started.close()` from 0052 waits for the in-flight and queued background reads, but not for the HTTP server's `close` event (interval and watcher teardown). Where: the board's `startBoardWith` / `Started.close()` in src/. Why: a test that deletes the folder right after `close()` could still race the watcher teardown on Windows.
- `2026-11-20-ftvw`, from 0052, ref https://github.com/exones/braid/pull/194. **Other in-process board tests should stop the board with close().** What: switch the remaining in-process board tests to `Started.close()`, so they wait for the board's background read before their temp folders are deleted. Where: test/github.test.ts, test/t3.test.ts, test/board-*.test.ts (each that starts the board in process and closes only its server). Why: they can hit the same Windows EPERM flake as test/board.test.ts did.

## Start here

- `src/commands/board.ts`: `Started` (around line 607), `startBoardWith` (around 673) and its `close()`, the roster's per-project feeds and watchers (around 719), and where the per-project notifiers are made.
- `src/notify/message.ts`: `needPush` and the Done push build `title` from `board.repo`.
- `src/board/demo.ts`: the sample projects (around line 230; docs/board.md, "Several projects"), and how the board marks a project whose last read failed.
- `docs/design/board-screenshots/` (51 to 59 are the all-projects page) and how 0049/D took them (its report under `braids/0049-one-board-for-all-your-projects/D-*`).
- Tests that start the board in process: `rg -l "startBoard" test`.

## Change

- Push titles: when two listed projects share a repository name, the title uses the project name instead; otherwise unchanged, so single-project pushes read as before.
- Demo: one more sample project whose last read failed; retake the screenshots that show it (card edge, ⚠ tag, panel note) and list them where docs/board.md lists the others.
- `close()`: also waits for the HTTP server's `close` event (intervals and watchers torn down), bounded so a stuck close fails clearly.
- Tests: every in-process board test stops the board with `close()` and awaits it.

## Already decided

- Project names are unique in `~/.braid/projects.json` (0049/B), so the project name tells clashing pushes apart.
- A push still carries nothing beyond what the header comment of message.ts lists.

## Out of scope

- Worktrees folders (strand B); other notify or board changes.

## Plan

1. `runBoard` wraps each listed project's notifier: when another listed project has the same repository name, the board handed to the notifier carries the project name as `repo`, so `pushesOf` builds the title from it (no change in message.ts).
2. `demoMembers` gets a fourth project `mail` whose first read works and later ones fail; retake screenshots 81 to 83 with Chrome on the built page.
3. `Started.close()` waits for the server's `close` event (10 s bound).
4. Every in-process board test closes with `await started.close()`; tests for 1 to 3 added.

## Completion

- [x] Two listed projects with the same repository name get push titles that name their projects; a test shows it, and projects with distinct repository names keep today's title
- [x] `braid board --demo` has a project whose last read failed, and new screenshots in docs/design/board-screenshots/ show its dashed edge, ⚠ tag and panel note
- [x] `Started.close()` resolves only after the server's close event; a test shows it
- [x] Every test that starts the board in process stops it with `close()`
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
