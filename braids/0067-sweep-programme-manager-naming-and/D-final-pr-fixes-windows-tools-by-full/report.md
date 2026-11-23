# 0067/D report

## What changed

- **Windows tools by full path.** New `src/system32.ts`: `system32(exe)` returns `%SystemRoot%\System32\<exe>` (`C:\Windows` when SystemRoot isn't set). `ownerOnlyAcl` (`src/board/address.ts`) runs `whoami.exe` and `icacls.exe` through it, and `runSchtasks` (`src/commands/service.ts`) runs `schtasks.exe` through it. Under Git Bash, a bare `whoami` found GNU coreutils' (`extra operand '/user'`), so a board started from Git Bash wrote no address file. The test helpers in `test/board-address.test.ts` also use System32 now, so the suite runs from Git Bash.
- **The status line while the task runs.** While the task runs, its last result belongs to the previous run, so `status` now prints it as `previous run: …` (`Task: braid board, Running, previous run: ended by a logoff or a stop (0x800710e0)`). A last result of 267009 is the current run, so only the state is shown (`Task: braid board, Running`). A task that isn't running still shows `last result: …`. `resultText` reads a signed HRESULT by its unsigned value and describes 0x800710E0 as "ended by a logoff or a stop". The address line's note "the task's board isn't running" uses the same running test. Before, it fired while the task ran with an older result.
- **Decision numbers.** D92 → D94 and D93 → D95 in 0067's report.md, the A, B and C strand reports and C's brief. The log files are unchanged.

## Why

Both are fixes to the final PR #259 from the user's try on 2026-11-23 and from the merge of `main` (0069), which took D92 and D93.

## Validation

- `test/board-address.test.ts` + `test/board-service.test.ts`: 24/24 pass from pwsh. `test/board-address.test.ts` passes 10/10 from Git Bash with `/usr/bin` first on PATH (`which whoami` → `/usr/bin/whoami`).
- New tests:
  - the System32 paths, including the fallback;
  - the sources never spawn these tools by a bare name;
  - on Windows, the ACL is set with Git's `usr/bin` first on PATH. I checked that this test fails with the old bare `whoami`: `whoami: extra operand '/user'`;
  - status while running with 0x800710E0;
  - `taskStateText` for Ready and for 267009 with a localised status;
  - `resultText` for signed values.
- `npm run verify`: passes, 587 tests.
- No real task was registered and the real `~/.braid` wasn't used: the service tests use a fake schtasks and a scratch home.

## Docs

- `docs/board.md` ("Run the board at login", the `status` paragraph) and `docs/cli.md` (the service row): the `previous run:` wording.
- The docs don't name whoami, icacls or schtasks paths, so nothing else changed.

## Open

- On non-English Windows, the status column isn't "Running". There a running task with an older result still shows `last result:`. It now reads as words (for 0x800710E0) rather than a bare error code.

For later items: none.
Needs the user: none.
