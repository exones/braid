---
id: '0067/B'
title: "Board as a Windows service"
status: Done
labels: ["kind:story", "tier:L", "ask:security", "ask:architecture"]
dependencies: ['0067/A']
order: 20
---

## Goal

On Windows the board runs in the background without a console, starts by itself, comes back after a crash, and is fully usable (Start, Merge, Open thread from its local page and the phone), through one braid command group: `braid board service install | remove | restart | status`. Status shows whether it runs, its port and its address (0067/A's file). For the user, who today starts the board by hand from a console.

The kind is the user's decision (2026-11-23, through the PM): a logon task built into braid. The user added: "just think how updating would go", so updating braid restarts the board on the new code in one reliable step (see Change, "Updating").

Expected size: about 250 lines in 5 to 8 files (code, tests, docs).

## Research (2026-11-23)

Sources in `sources.md` (this folder).

- Every board action goes through `t3` (Start: `t3 thread start`, Merge: `t3 thread send`, the refresh: `t3 thread list/show`), and the T3 server exists only while the T3 desktop app runs in the logged-in user's session; T3 0.1.6 has no background service on Windows ([S10], [S11]). So no kind of service makes Start or Merge work before the user logs in.
- A real Windows service runs in session 0 and can't open an app on the user's desktop ([S4]), so Open thread fails there.
- `gh` and git keep their tokens in Windows Credential Manager (measured). An S4U task has no access to encrypted files or the network ([S2]) and loses them ([S8]); a password logon keeps them but stores the password ([S2]).
- Tailscale on Windows disconnects until a login unless set unattended ([S5]).
- A real service needs a wrapper such as WinSW (2.x stable, 3.x pre-release), a stored password for the user's account and admin rights to install ([S6], [S7]).
- Task Scheduler likely doesn't restart a task on a non-zero exit ([S9], unknown U1), so the current recipe's `-RestartCount 3` very likely does nothing for a crashed board.

## Start here

- `docs/board.md` "Run the board at login": the current hand-made scheduled task recipe (and its note that `Stop-ScheduledTask` ends only `pwsh`, not `node`), and the Linux systemd recipe, which stays.
- `src/commands/board.ts`: `runBoard`, its flags (`--no-open`, `--port`, `--host tailscale`), and 0067/A's address file and its reader.
- `src/cli.ts`: the usage lines.
- `sources.md` in this folder.

## Change

- `braid board service install [--port <n>] [--host tailscale]`: registers a Task Scheduler task as the current user (InteractiveToken, no stored password, no admin) with a logon trigger plus a repetition every few minutes and `MultipleInstances IgnoreNew`, so a crashed board comes back within minutes; no execution time limit; the action runs `node` with braid's CLI and `board --no-open --port <n>` directly (not wrapped in `pwsh`), so stopping the task stops the board; it starts the task at once. Through `schtasks` or `Register-ScheduledTask` as arrays of arguments; the worker picks one.
- `remove`: stops and unregisters the task. `restart`: stops and starts it. `status`: the task's state and last result, the port, the address from 0067/A's file with a check that the port answers, and the braid version the running board started from next to the installed one, so a stale board after an install is visible.
- **The launcher survives a reinstall.** The task never points into a versioned folder that an install replaces (Volta's `tools/image/packages/...`, an npm cache). It runs a stable launcher (the installed `braid` on PATH, or a path that `npm install -g` keeps), resolved at each start; and stopping the task still ends the board's `node` (no orphan). The worker picks how and says in report.md how both were checked.
- **Updating.** The PM's routine after a merge into `main` is `scripts/Install-Skills.ps1` (new CLI and skills from origin/main), then a fresh board. With an installed board task this is one reliable step: `Install-Skills.ps1` restarts the installed board task itself after a successful CLI install (and says so in one line; nothing when no task is installed), or, if the worker finds that unreliable, `braid board service restart` is the one documented step. The worker picks one; report.md says which and why. After it the board runs the new code on the same port with a fresh address file.
- **A restart keeps a steering pause.** A restart while the board's limits pause (0064) is running loses nothing: the pause record is on disk (`braid pause`'s record), and the new board picks it up. Test it.
- The board's version: the address file (or the running board's API) carries the version the board started from, for `status`; no new state file.
- The board's output goes to a log under `~/.braid` (one per port, kept short: replaced at each start), so a board without a console still says what went wrong. This log never holds the token (0067/A).
- On other platforms the commands say they are Windows-only and point to the systemd recipe in docs/board.md.
- Tests: the command builds the right task definition and arguments (no real task registered in CI), status on a missing task, a stale address file, a non-Windows platform.
- `docs/board.md` "Run the board at login" and `docs/getting-started.md` (updating): the Windows recipe becomes `braid board service install`; how updating restarts it; automatic sign-in as the way to have it after a reboot with no hands on the PC; Tailscale unattended mode for the phone before a login. `docs/cli.md` and the help text. `docs/decisions.md`: a dated decision for the service kind and why (the research above).

## Already decided

- One command group, no new state file: the task lives in Task Scheduler, the address in 0067/A's file, the log is output only (the user's programme rule).
- Linux keeps the systemd recipe in docs/board.md; no Linux command.
- The kind of service: a logon task built into braid (Task Scheduler as the current user, InteractiveToken, no admin, no stored password). The user, through the PM, 2026-11-23: "A ok just think how updating would go".
- Not a WinSW service, not a task that runs logged off with a stored password, not S4U (research above).

## Out of scope

- Changing T3 or how the board calls it.

## Failure modes and regression tests

- A crashed board isn't restarted: the repetition trigger restarts it; test that the definition has it and `IgnoreNew`.
- Two boards: `install` on a port a task already has replaces it; a hand-started board on the same port makes the task's board fail to listen, which the log and `status` say.
- Stop leaves `node` running: the action is `node` itself; report.md says how it was checked on Windows.
- Paths with spaces in the user's profile or the node path: test the quoting.
- The token in the log or the task definition: neither holds it; test it.
- A reinstall breaks the task: after `Install-Skills.ps1` the task still starts the board, on the new version. Test the action's path is not versioned; report.md says how it was tried.
- A restart drops a running limits pause: test that the pause record survives and the new board keeps it.
- A stale board after an install: `status` shows the running version differs from the installed one. Test it.

## Plan

Measured first (2026-11-23, a throwaway task on this machine): Stop-ScheduledTask ends only the task's first process. Under Volta the chain is `node` shim → `cmd` → real `node`, so stopping a task that runs `node` directly still orphans the real one; and this machine's default terminal is Windows Terminal, so a console task opens a visible window. But a `node` that reads its standard input from a `conhost --headless` console gets EPIPE the moment that conhost is stopped, and the whole chain ends.

1. The task (Task Scheduler XML through `schtasks /create /xml`, as arrays of arguments): InteractiveToken as the current user, a logon trigger for that user, a time trigger from the install time repeating every 5 minutes with no end (so a crashed board comes back within minutes, also in the session it was installed in), `IgnoreNew`, no time limit, no battery stops. Action: `conhost.exe --headless cmd.exe /d /c braid board --service --no-open --port <n> [--host <h>]`, working folder the main checkout. `braid` is resolved on PATH at each start, so a reinstall's new launcher is what runs; no path into a versioned folder, no paths in the arguments at all.
2. `braid board --service` (new, used by the task): needs `--port`; the board's output also goes to `~/.braid/board-<port>.log` (replaced at each start, `#token=` redacted); it reads standard input and stops cleanly (address file removed) when it closes, which is how stopping the task ends the board's `node`.
3. `/api/session` answers its 204 with `x-braid-version`, the version the board started from; `status` shows it next to its own (the installed) version. No file format change.
4. `src/commands/service.ts`: `install [--port <n>] [--host <h>]` (ends a running task first and waits for the port, replaces the definition, runs it, waits for the board to answer), `remove`, `restart [--if-installed]` (end, wait for the port to be free, run, wait for a live address), `status` (state and last result from `schtasks /query /v /fo csv` by column position, port, host and folder from the task XML, the live address, the versions, the log). Other platforms: Windows-only, pointing to the systemd recipe; `restart --if-installed` is silent there.
5. Updating: `Install-Skills.ps1` calls `braid board service restart --if-installed` after it installed the CLI and skills, and prints its one line; braid itself decides whether a task exists, so the script needs no Task Scheduler code and its Pester test uses the stub braid.
6. Tests: the XML (triggers, IgnoreNew, no limit, InteractiveToken, the action without a versioned path or token, XML escaping of a folder with spaces and `&`), the schtasks arguments with a fake runner, status on a missing task / stale address file / stale version, non-Windows, the service log redaction, the stdin stop, a steering pause kept across a board restart (board-steer), Install-Skills calling restart.
7. Docs: board.md "Run the board at login", getting-started (updating), cli.md, help text, decisions.md (dated decision), and a live try on this machine reported in report.md.

## Completion

- [x] `braid board service install | remove | restart | status` on Windows, of the kind the user chose
- [x] Install starts the board at once, it comes back after a crash, and status shows its state, port, live address and running version against the installed one
- [x] `Install-Skills.ps1` ends with `braid board service restart --if-installed`, which restarts an installed task and is silent otherwise, and a running limits pause survives a restart
- [x] On another platform the commands say they are Windows-only and point to the systemd recipe
- [x] Tests cover the failure modes above without registering a real task in CI, on Windows and Ubuntu
- [x] report.md says how it was tried on Windows (install, status, crash, restart, remove) and lists the user's try for the final PR (logon, Start a strand from the page, a real update)
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected; docs/decisions.md has the dated decision
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
