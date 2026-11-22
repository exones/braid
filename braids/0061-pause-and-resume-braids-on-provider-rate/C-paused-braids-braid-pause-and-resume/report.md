# Report: 0061/C Paused braids: braid pause and resume, board and status

## What changed

- **Store** `src/braids/pauses.ts`: `.braid/pauses.json` in the main checkout, one record per braid (provider, window id and label, used percent, `resetsAt`, `resumeAt`, resume task id, pausing thread, `by` coordinator or pm, `at`). It uses the lock and atomic write of `requests.ts`. A missing file means no pauses. A file that isn't JSON or isn't a list reads as no pauses, with a note. A record with a missing or wrong field is left out, with a note. Setting the same pause again (only `at` differs) leaves the file alone.
- **Commands** `src/commands/pauses.ts`:
  - `braid pause <number> --provider <id> --thread <id> [--window <id>] [--until <iso>] [--task <id>] [--by coordinator|pm]`. By default the window, its usage, reset and resume time come from `braid limits` (`readProvider`). It refuses unless the verdict is `pause`. `--window` picks a window, using its reset plus the buffer. `--until` pauses whatever the verdict. It reports `paused`, `pause updated` or `already paused, unchanged`.
  - `braid resume <number>` clears the pause and prints what it cleared, naming the scheduled task to delete. A second resume changes nothing.
  - Both are in `braid help`.
- **Board** (`src/board/pause.ts`, which is pure and shared with the page, plus `model.ts`, `marks.ts`, `signals.ts`, `combined.ts`, `web/src/App.tsx`):
  - A paused braid and its strands that aren't Done carry `pause` (a view with its state, text and note). Both kinds of `stalled` are held back while the pause lasts.
  - From `resumeAt` + 15 min the state is `due` (amber). From `resumeAt` + 25 min an item that meets the stalled condition is Needs You `stalled` at once, timed from that point, with "Stalled: paused for <provider>; resume was due at <time> and nobody resumed it".
  - The page shows a sky pause icon, then an amber one once the resume is due, on the card and on its strand rows (text in the tooltip). Working and To Do cards get a line when Details is on. The details panel gets a box. A damaged file gives one header note.
  - The demo has 0025 (paused), 0026 (resume due) and 0027 (stalled after the pause).
- **`braid status`**: a `(paused)` or `(paused, resume was due)` lane suffix, a pause line under the braid, and a `note:` line for a damaged file.
- **Docs**: `docs/cli.md` (the two commands and a Pauses section), `docs/board.md` (a Paused section, icon rows, the demo, screenshots 91–93), `docs/braids-format.md` (the file) and `docs/decisions.md` (D86 and its log entry). The approved mockups are in `docs/design/board-mockups/paused.html` and `60-paused.png`.

## Why

The board has to show why a braid paused for a rate limit isn't moving, without calling it stalled (0061). The 0061/A spike showed that the coordinator or PM pauses, and that the board only reads the record. The overdue state and the late `stalled` keep a dead schedule from hiding a braid for good. The user approved the mockups as shown.

## Validation

- `npm run verify` passed: 464 of 464 tests, docs gate, typecheck and build. The new tests in `test/pauses.test.ts` cover:
  - the store: record, unchanged, update, clear twice, the `.gitignore`;
  - damaged files: not JSON, not a list, bad records, and that a pause rewrites the file;
  - `braid pause` defaults from the limits fixtures, the `--window`, `--until` and `--by` paths, and every refusal;
  - `braid resume`;
  - the phase boundaries at 15 and 25 min, and the texts;
  - stalled held back while paused and while due, then stalled at +25 min, with `since` and its age;
  - the marks, including Details off;
  - the demo.
- Updated tests: the demo braid count (24 to 27), the demo lanes list (the three new braids), and one strand shape that now has `pause: null`.
- Screenshots come from `braid board --demo` (the live DOM rendered as a static page, because the preview tab couldn't screenshot): `docs/design/board-screenshots/91-paused-board.png`, `92-paused-details.png` and `93-paused-resume-due.png`.

## Open

- The size is about 530 lines of code and 240 of tests against the expected 500 in total. That is within twice the estimate, and nothing outside the brief was added. `docs/design/board-mockups/paused.html` is large (about 42 KB) because it inlines the board's CSS so it renders on its own.
- Times use the local time of the process that formats them: the board server for cards, the browser for the details box. On one machine these are the same.

For later items: 0061/D can call `braid pause <n> --provider <id> --thread <own thread> --task <scheduled task id> [--by pm]` right after `schedule_task`, and `braid resume <n>` when the resume runs. The record holds the task id, so a manual `braid resume` names the task to delete.
Needs the user: none
