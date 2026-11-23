---
id: '0067/D'
title: "Final PR fixes: Windows tools by full path, status last result while running"
status: In Progress
labels: ["kind:task", "tier:L", "ask:security"]
dependencies: []
order: 40
---

## Goal

Two small fixes to the final PR #259 before the user's merge. They come from the merge of `main` (0069) into the braid branch and from the user's try of the installed service (2026-11-23).

Expected size: about 60 lines in 3 to 5 files.

## Start here

- `src/board/address.ts` `ownerOnlyAcl`: `spawnSync("whoami", …)` and `spawnSync("icacls", …)` by bare name.
- `src/commands/service.ts`: `schtasks.exe` by name, and the status line (around line 409) with `resultText`.
- `test/board-address.test.ts`, `test/board-service.test.ts`.

## Change

1. Windows tools by full path. Under Git Bash, `whoami` on PATH is GNU coreutils' (`whoami: extra operand '/user'`), so `ownerOnlyAcl` fails. A board started from Git Bash then gets no address file, and 5 tests of `test/board-address.test.ts` fail when the suite runs from Git Bash; from pwsh and in CI they pass. Run `whoami.exe`, `icacls.exe` and `schtasks.exe` from `%SystemRoot%\System32` (from `process.env.SystemRoot`, falling back to `C:\Windows`), never by bare name. Add a test that the commands are full System32 paths. Check `test/board-address.test.ts` passes when run from Git Bash (`node --test test/board-address.test.ts` with Git's `usr/bin` first on PATH).
2. The status line's last result while the task runs. The user's try showed `Task Running; … last result: exited -2147020576 (0x800710e0)`. That is the previous run's result (0x800710E0: the run was ended by a logoff or a stop), and next to "Running" it reads as a failure. Show the last result only when the task isn't running, or word it as the previous run's ("previous run: ended by a logoff or stop"), and name 0x800710E0 in words in `resultText`. The worker picks one. Test it.
3. 0067's decisions are now D94 (address file) and D95 (service), since 0069 took D92 and D93 on `main` (the merge commit renumbered docs, code and tests). Fix any D92 or D93 meant for 0067 that the merge left in 0067's own `braids/` files: report.md and the strand reports. Leave log files as they are.

## Already decided

- The user's try passed for what it covers: "ok, I see it's working (the panel)", with the board running as the logon task on 7800 (installed from ba55c23).
- No new state, no new command.

## Out of scope

- Leftovers 2026-11-23-th6n and 2026-11-23-14vt.

## Plan

1. `src/system32.ts`: `system32(exe)` gives `%SystemRoot%\System32\<exe>` (`C:\Windows` without SystemRoot). `ownerOnlyAcl` runs `whoami.exe` and `icacls.exe` through it, `runSchtasks` runs `schtasks.exe` through it. Tests: the paths, the sources never spawn by bare name, and on Windows the ACL is set with Git's `usr/bin` first on PATH.
2. Status: while the task runs (status column "Running", or last result 267009), its last result is shown as `previous run: <text>`; with 267009 itself only the status. `resultText` reads signed HRESULTs by their unsigned value and names 0x800710E0 "ended by a logoff or a stop". The address line's "isn't running" note uses the same test.
3. D92 to D94 and D93 to D95 in 0067's reports and strand C's brief; logs untouched.
4. docs/board.md and docs/cli.md: the `previous run:` wording.

## Completion

- [x] whoami, icacls and schtasks run by their full System32 path; tested; `test/board-address.test.ts` passes from Git Bash
- [x] `status` doesn't show a previous run's result as if the running task had failed; 0x800710E0 reads in words; tested
- [x] 0067's `braids/` reports name D94 and D95 where they mean 0067's decisions
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
