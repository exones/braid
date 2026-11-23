---
id: '0067/C'
title: "Final PR fixes: owner-only ACL on Windows, install on a held port"
status: Done
labels: ["kind:task", "tier:L", "ask:security"]
dependencies: []
order: 30
---

## Goal

Fix what the PM's live check of the final PR (#259 at e0cd47c, 2026-11-23) found, before the user's try: the address file is not owner-only on Windows, and `braid board service install` reports success when the port is held by another board. Two smaller points ride along.

Expected size: about 120 lines in 5 to 7 files (code, tests, docs).

## Start here

- `src/board/address.ts`: how the address file is written (temp file, rename; mode 0600 on POSIX).
- `src/commands/service.ts`: `install` and its success line, `status` and `resultText` (the last result).
- `docs/board.md` "The address file" (line ~309) and `docs/decisions.md` D94: both say the Windows profile ACL "limits it to you".
- `.agents/skills/*/agents/openai.yaml`: the display_name style.

## Change

1. Security (blocking): on Windows the file gets no ACL of its own and inherits its folder's. On this PC `C:\Users\exon\.braid` grants `EXON-PC\CodexSandboxUsers:(OI)(CI)(RX)`, so Codex-sandboxed processes can read the token. Give the file its own ACL on Windows: inheritance off, only the current user (full control). Write it so the token never exists in a file with the inherited ACL, for example create the temp file empty, set its ACL, then write the token and rename (or create it with the ACL at once). Test it: on Windows the ACL lists only the current user, with inheritance off. Correct `docs/board.md` and D94 (a dated note in D94's row, or a new decision that names D94).
2. `braid board service install` while the port is held by another board (a board started by hand) says "installed … running on port <p>" with exit 0, though the task's board failed (`--port … already in use` in its log) and the running board is the hand-started one. Say plainly that the task's board didn't start because another board holds the port, name the way out (stop that board, then `braid board service restart`), and exit non-zero; the task stays installed. Test it. The user's try starts exactly this way (a hand-started board on 7800), so docs/board.md's install steps say to stop a hand-started board first.
3. Low confidence: after the task's `node` was killed, `status` showed "last result: exited 0" (the PM's checker went through a cmd shim). Check whether a killed board really leaves exit 0 as the task's last result (the task's first process is `conhost`, which may exit 0). If it's real and misleading, make `status` not claim a clean exit (for example say the board isn't answering, from the address check, next to the task's result); else say in report.md why it's right.
4. Trivial: braid-pm's `agents/openai.yaml` display_name in title case like the other skills: "Braid Programme Manager".

## Already decided

- "Owner-only" is the user's decision (0067/A, 2026-11-23); this makes it true on Windows.
- No new state, no new command.
- The PM's live check passed everything else (the service, `--url`, the file's lifecycle, /api/session, crash recovery, restart, `--if-installed`, remove, the pause surviving a restart, the naming, the gate).

## Out of scope

- Anything else in the service or the board.

## Failure modes and regression tests

- The token in a readable file for a moment: the ACL is set before the token is written; test the final ACL and that no temp file with the token keeps the inherited ACL.
- `icacls` or the ACL call fails: the board says so on standard error and doesn't write the token to a file it couldn't protect.
- POSIX unchanged: mode 0600 still, tests still pass on Ubuntu.
- Install on a held port: non-zero exit, a plain message, task kept.

## Plan

1. `writeAddress`: create the temp file empty (0600), on Windows `icacls <temp> /inheritance:r /grant:r *<SID>:F` (SID from `whoami /user`), then write the token and rename; an ACL failure removes the empty file and throws (the board's existing stderr line). Seam for tests; a real-board test reads the ACL with `icacls`.
2. `service install`: when the port is still held after the wait, register the task, don't run it, exit 1 with the way out.
3. Measure a killed board's last result with a scratch task of the same shape; reword `resultText(0)` if it never reflects the board.
4. openai.yaml display_name; docs/board.md, docs/cli.md, D94.

## Completion

- [x] On Windows the address file's ACL lists only the current user with inheritance off, set before the token is written; tested
- [x] docs/board.md and D94 say how the file is owner-only on Windows
- [x] `braid board service install` on a port another board holds says so plainly and exits non-zero; tested; docs/board.md says to stop a hand-started board first
- [x] `status` after a killed board doesn't claim a clean exit, or report.md says why it's right
- [x] braid-pm's openai.yaml display_name is "Braid Programme Manager"
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
