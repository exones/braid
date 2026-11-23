---
id: '0067/B'
title: "Board as a Windows service"
status: Outline
labels: ["kind:story", "tier:L", "ask:security", "ask:architecture"]
dependencies: ['0067/A']
order: 20
---

## Goal

On Windows the board runs in the background without a console, starts by itself, comes back after a crash, and is fully usable (Start, Merge, Open thread from its local page and the phone), through one braid command group: `braid board service install | remove | restart | status`. Status shows whether it runs, its port and its address (0067/A's file). For the user, who today starts the board by hand from a console.

The kind of service is the user's decision, asked through the PM (2026-11-23). This brief is written for the recommended kind, a logon task; it stays `Outline` until the answer, and is rewritten if the user picks another kind.

Expected size: about 200 lines in 4 to 6 files (code, tests, docs), for the logon task.

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

## Change (for the logon task)

- `braid board service install [--port <n>] [--host tailscale]`: registers a Task Scheduler task as the current user (InteractiveToken, no stored password, no admin) with a logon trigger plus a repetition every few minutes and `MultipleInstances IgnoreNew`, so a crashed board comes back within minutes; no execution time limit; the action runs `node` with braid's CLI and `board --no-open --port <n>` directly (not wrapped in `pwsh`), so stopping the task stops the board; it starts the task at once. Through `schtasks` or `Register-ScheduledTask` as arrays of arguments; the worker picks one.
- `remove`: stops and unregisters the task. `restart`: stops and starts it. `status`: the task's state and last result, the port, and the address from 0067/A's file with a check that the port answers.
- The board's output goes to a log under `~/.braid` (one per port, kept short: replaced at each start), so a board without a console still says what went wrong. This log never holds the token (0067/A).
- On other platforms the commands say they are Windows-only and point to the systemd recipe in docs/board.md.
- Tests: the command builds the right task definition and arguments (no real task registered in CI), status on a missing task, a stale address file, a non-Windows platform.
- `docs/board.md` "Run the board at login": the Windows recipe becomes `braid board service install`; automatic sign-in as the way to have it after a reboot with no hands on the PC; Tailscale unattended mode for the phone before a login. `docs/cli.md` and the help text. `docs/decisions.md`: a dated decision for the service kind and why (the research above).

## Already decided

- One command group, no new state file: the task lives in Task Scheduler, the address in 0067/A's file, the log is output only (the user's programme rule).
- Linux keeps the systemd recipe in docs/board.md; no Linux command.
- The kind of service: pending the user's decision (asked through the PM, 2026-11-23).

## Out of scope

- A real Windows service through WinSW, or a task that runs whether the user is logged on or not, unless the user picks it.
- Changing T3 or how the board calls it.

## Failure modes and regression tests

- A crashed board isn't restarted: the repetition trigger restarts it; test that the definition has it and `IgnoreNew`.
- Two boards: `install` on a port a task already has replaces it; a hand-started board on the same port makes the task's board fail to listen, which the log and `status` say.
- Stop leaves `node` running: the action is `node` itself; report.md says how it was checked on Windows.
- Paths with spaces in the user's profile or the node path: test the quoting.
- The token in the log or the task definition: neither holds it; test it.

## Completion

- [ ] `braid board service install | remove | restart | status` on Windows, of the kind the user chose
- [ ] The installed board starts at logon, comes back after a crash, and status shows its state, port and live address
- [ ] On another platform the commands say they are Windows-only and point to the systemd recipe
- [ ] Tests cover the failure modes above without registering a real task in CI, on Windows and Ubuntu
- [ ] report.md says how it was tried on Windows: install, reboot or log off and on, Start a strand from the page, restart
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected; docs/decisions.md has the dated decision
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
