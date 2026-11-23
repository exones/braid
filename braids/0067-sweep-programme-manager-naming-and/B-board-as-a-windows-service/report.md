# 0067/B report: Board as a Windows service

## What changed

- `braid board service install [--port <n>] [--host <address>] | remove | restart [--if-installed] | status` (`src/commands/service.ts`, wired in `src/cli.ts`). Each command builds Task Scheduler XML and runs `schtasks` with an array of arguments. Off Windows every subcommand says it is Windows-only and points to the systemd recipe. `restart --if-installed` is silent off Windows and when no task is installed.
- The task, `braid board`, is the kind the user chose (D93):
  - It runs with your interactive token, as the user who logs on, with `LeastPrivilege`. No password is stored and no administrator is needed.
  - It has two triggers: a logon trigger for that user, and a time trigger from the install time that repeats every 5 minutes with no end. Together with `IgnoreNew`, a board that crashed or was killed comes back within 5 minutes, including in the session it was installed in. Restart-on-failure is not used, so unknown U1 doesn't matter.
  - No time limit and no battery rules.
  - Action: `conhost.exe --headless cmd.exe /d /c braid board --service --no-open --port <n> [--host <h>]`, with the main checkout as working folder.
- `braid board --service` (`src/commands/board.ts`) needs `--port`. It does two things:
  - It also writes its output to `~/.braid/board-<port>.log`. The log is opened first, owner-only, replaced at each start, with `#token=` hidden; a crash stack goes in too.
  - It exits (removing its address file) when its standard input ends or breaks.
- `GET /api/session`'s 204 now carries `x-braid-version`, the version the board started from, so `status` can compare it with its own. The address file is unchanged and there is no new state file.
- `readVersion` moved to `src/version.ts`; `src/cli.ts` re-exports it.
- `scripts/Install-Skills.ps1` ends with `braid board service restart --if-installed`, after the CLI and the skills are installed, and prints its line. A failed restart fails the script, with everything else already installed.
- Docs:
  - `docs/board.md` "Run the board at login": the Windows recipe is now `braid board service`, plus how updating restarts it, automatic sign-in after a reboot, and Tailscale's unattended mode.
  - `docs/getting-started.md` (updating), `docs/cli.md` (the new row and `--service`), the help text, a README line, and `docs/decisions.md` D93 with its dated log entry.

## Why this shape (measured, 2026-11-23, throwaway tasks on this machine)

- **Stopping a task ends only its first process.** Under Volta, `node` on PATH is a shim that runs `cmd` that runs the real `node`. A task whose action is `node` itself therefore still leaves the real `node` behind when stopped. I saw this with `Stop-ScheduledTask` on a probe task, and also with `conhost` as the action. The brief's "the action runs `node` directly" alone would not have avoided the orphan.
- **This machine's default terminal is Windows Terminal** (`HKCU\Console\%%Startup` delegation). A console task such as `node` or `pwsh -WindowStyle Hidden` would show a window.
- **A `node` that reads its stdin from a `conhost --headless` console gets EPIPE as soon as that conhost is stopped.** The whole chain (Volta shim, `cmd`, real `node`) ended at once. So the board's `--service` mode reads stdin and stops when it closes, and the task's first process is the headless conhost: no window, and stopping the task stops the board.
- **Launcher (decided: `braid` on PATH via `cmd /c`).** `cmd` resolves `braid` on PATH at each start: `braid.cmd` in Volta's `bin` or npm's global prefix. Their paths don't change when braid is reinstalled. The arguments hold only flags and a port: no path and no token, so there is nothing to quote. A profile with spaces only reaches the XML's `WorkingDirectory`, which is escaped as XML (tested with `C:\Users\Jane Doe\code\a & b`).
- **Updating (decided: `Install-Skills.ps1` restarts the task itself).** The restart is run by the braid the script just installed, which decides whether there is a task. The script needs no Task Scheduler code, and its Pester test uses the stub braid. `restart` ends the task, waits until the port is free (refusing if something else still holds it), runs the task and waits until the new board answers with its token, then names the version now running.

## Validation

- `npm run verify` passes: 566 node tests. The Pester suites pass too (25, with `scripts/Test-Pester.ps1`).
- New `test/board-service.test.ts` uses a fake `schtasks`, so no real task is registered in CI. It covers:
  - the definition: triggers, the 5-minute repetition with no end, `IgnoreNew`, no time limit, InteractiveToken, the action without a versioned path or a token, and XML escaping;
  - `install`: the UTF-16 definition file and its removal, and a replace on another port;
  - a held port, a refused registration, a board that never answers, and bad flags;
  - no task installed, `remove`, and `restart`, including onto a held port;
  - `status`: the columns, a stale address file, and a stale version;
  - non-Windows, the log's token redaction and replacement, and the stop on stdin;
  - an end-to-end `node dist/cli.js board --service --demo` that exits 0 when its stdin closes and leaves no address file.
- `test/board-address.test.ts`: the version header is sent with the token and not without it.
- `test/board-steer.test.ts`: a board restarted mid-pause keeps the record as it was. It starts no second steering thread and resumes nothing early.
- `test/pester/Install-Skills.Tests.ps1`: the script calls `braid board service restart --if-installed` last, prints its line, and fails when the restart fails.

## How it was tried on Windows (this PC, 2026-11-23)

Port 7811 was used, so the user's hand-started board on 7800 was never touched. The real `install`, `status`, `restart` and `remove` code ran against Task Scheduler through a harness (`~/.braid/artifacts/agento/0067/live.mjs`) that changed two things:

- The task's `braid` became this worktree's `dist/cli.js`, because the installed braid is the old CLI and I didn't replace the global install.
- `USERPROFILE` pointed at a scratch home, so the board had no project list and sent no pushes. Volta refuses to run with an overridden `USERPROFILE`, so the harness called the real `node.exe`. The Volta chain was checked separately with the probe above.

| Step | Result |
| --- | --- |
| install | Registered and started. The board answered within seconds. |
| status | `Running, last result: running`, the port, the folder, the live tokened address, `running 0.2.0, installed 0.2.0`, the log. |
| log | Holds the start lines with `#token=(hidden)`. |
| crash (`Stop-Process` on the board's `node`) | Killed at 03:10:11. `status` then said no board answers. The repetition brought the board back at 03:15:21 with a new address. |
| restart | The old `node` was gone and a new one answered with a new token. |
| remove | No process left. The address file was removed and the task deleted. `status` then says no task is installed. |

Not tried here, and left to the user (see You):

- A logoff/logon or reboot: it would have ended this session.
- Start from the page: it would launch a real coordinator.
- A real `Install-Skills.ps1` update: it would replace the global CLI that the other agents use.

Clearing the throwaway probe tasks also left the probe's orphaned `node` processes, which I stopped by hand.

## Docs

Updated: `docs/board.md`, `docs/getting-started.md`, `docs/cli.md`, `docs/decisions.md` (D93 and the log entry), `README.md`, and the help text in `src/cli.ts`. Not affected: `docs/autonomy.md`, `docs/braids-format.md`, `docs/development.md`, `docs/roadmap.md`, `docs/npm-distribution.md`.

## Open

**The user's try, for the braid's final PR** (the PM moved it there, 2026-11-23):

1. In the main checkout, stop the board started by hand on port 7800, or pick a free port.
2. Run `braid board service install --port 7800 --host tailscale`.
3. Log off and on, or reboot, then run `braid board service status`. The board should have started at logon.
4. Open the address `braid board --url` prints and Start a strand from the page.
5. After the merge into `main`, run `scripts/Install-Skills.ps1`. It should print "restarted the board on port 7800 (braid <version>)", and `status` should show the new version running.

`conhost --headless` is undocumented, but Windows has shipped it since 1809 and OpenSSH and WSL use it. If a later Windows dropped it, `install` would still register the task, and `status` would show it failing with no board answering.

For later items: the PM's after-merge routine (`braid-pm` skill) could say that, with the task installed, `Install-Skills.ps1` already restarts the board, so its "kill running board, start a new one" step becomes nothing. That is a skill edit, so it is the user's call.

Needs the user: none.
