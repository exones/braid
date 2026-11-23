# 0067/C report

## What changed

- **Address file owner-only on Windows** (`src/board/address.ts`). The temporary file is created empty (mode 0600), then on Windows given its own ACL: `icacls <temp> /inheritance:r /grant:r *<SID>:F`, the SID from `whoami /user`. Only then is the token written and the file renamed over `board-<port>.url` (a rename keeps the ACL). If the SID or `icacls` fails, the empty file is removed and `writeAddress` throws; `keepAddress` already reports that on standard error and the board runs on without a file, so the token never lands in a file it couldn't protect. POSIX is unchanged (0600).
- **`service install` on a held port** (`src/commands/service.ts`). When the port is still held after the wait, the task is registered but not run, and install exits 1: "installed the braid board task, but its board didn't start: port <p> is held by another process (a board started by hand?). Stop that board, then run braid board service restart; the task also tries again every 5 minutes". Before, it ran the task, found the hand-started board answering on the port and said "running" with exit 0.
- **`status` after a killed board.** Real and misleading. Measured with a scratch task of the same shape (`conhost.exe --headless cmd.exe /d /c node <script>`, named `braid-0067C-probe`, deleted after): a `node` killed with `Stop-Process -Force` left last result 0, and a `node` that exited 3 also left 0. `conhost --headless` exits 0 whatever its child does, so the task's last result never carries the board's exit. `resultText("0")` now reads "ended (the board's own exit code isn't kept; see the log)"; the Address line already says when no board answers.
- **braid-pm's `agents/openai.yaml`**: display_name "Braid Programme Manager".

## Why

The PM's live check of the final PR (#259 at e0cd47c) found the address file inheriting `~/.braid`'s ACL, which grants `EXON-PC\CodexSandboxUsers` access, and the install success line on a port a hand-started board held. Owner-only was the user's decision (0067/A).

## Validation

- `test/board-address.test.ts`: on Windows the real board's file lists only the current user, `(F)`, no inherited entry; the ACL seam sees the file empty; a failing ACL leaves no file and no temporary file. On POSIX the 0600 check is unchanged.
- `test/board-service.test.ts`: install on a held port exits 1, prints no success line, names the way out, and `schtasks` saw only `/query` and `/create` (never `/run`); `resultText("0")` no longer says a clean exit.
- Live, with a scratch `HOME`/`USERPROFILE`/`APPDATA`/`LOCALAPPDATA` and port 7861 (the user's board on 7800 and the real `~/.braid` untouched): a hand-started board's file had `EXON-PC\exon:(F)` only, while its folder carried `CodexSandboxUsers:(I)(OI)(CI)(M)` and other inherited entries; `braid board service install --port 7861` printed the held-port message and exited 1; `remove` removed the task (no `braid board` task existed before or after).
- Gate `npm run verify`: passed (567 tests).

## Docs

`docs/board.md` (the address file's Windows ACL; stop a hand-started board before `install`; install on a held port; what last result 0 means), `docs/cli.md` (install on a held port), `docs/decisions.md` D92 (dated correction, and why).

## Open

Nothing for this item.

For later items: (1) `braid board service status` and `remove` don't tell the task's board from a hand-started one on the same port: in the live try, status showed the hand-started board's address and "running 0.2.0" for a task that had not run, and `remove` said "stopped the board on port 7861" though the hand-started board kept running. (2) The service log `~/.braid/board-<port>.log` is opened with mode 0600, so on Windows it also inherits the folder's ACL; it holds no token (redacted), but it could get the same owner-only ACL.
Needs the user: none
