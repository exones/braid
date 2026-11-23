---
id: '0067/A'
title: "Board address file, braid board --url, PM naming"
status: In Progress
labels: ["kind:story", "tier:L", "ask:security"]
dependencies: []
order: 10
---

## Goal

A board with no console (started at login or as a service) can be acted on from its local page: the running board writes its full local address with the session token to an owner-only file under `~/.braid`, and `braid board --url` prints it. Also the two PM-naming fixes from leftover 2026-11-22-n60n. The leftovers' text, source and links are in the braid's brief (`braid view 0067`).

Expected size: about 150 lines in 6 to 8 files (code, tests, docs).

## Start here

- `src/commands/board.ts`: `runBoard`, where it builds `url` with `#token=` and prints it (around "The token rides in the fragment"), its shutdown path, and `startBoardWith` (the token, and the local listener's 403 texts that tell the user to "Open the URL that `braid board` printed").
- `docs/board.md`: "Run the board at login" (the Windows scheduled task and the Linux systemd recipes) and the notes on the token (D50).
- `docs/autonomy.md`: the `PM-run (thread <id>)` paragraph under "Which preset a braid runs on".
- `docs/getting-started.md` (the braid-pm bullet), `docs/board.md` "Requests" (the line "It reaches your side") and `docs/braids-format.md` (`--to pm`): how the escalation is already worded, gone thread included.
- `.agents/skills/braid-pm/agents/openai.yaml`, and the other skills' `agents/openai.yaml` for the naming style.
- `docs/decisions.md` D50 (the local token) and D60 (the Tailscale listener).

## Change

- `.agents/skills/braid-pm/agents/openai.yaml`: `display_name` names the programme manager (for example "Braid programme manager"); `short_description` and `default_prompt` stay unless they contradict it.
- `docs/autonomy.md`: the `PM-run` paragraph says a request reaches the user when the PM forwards it, doesn't answer in time (20 minutes, 60 for a handover) or its thread is gone (archived, failed or unknown to T3), worded as `docs/getting-started.md` and `docs/board.md` have it.
- `src/commands/board.ts`: a real board run (not `--demo`) writes its full local address with the token to a file under `~/.braid` when it starts, and deletes it when it stops (Ctrl+C, SIGTERM, a normal exit). `braid board --url` prints the running board's address, or says plainly that no board is running. 0067/B's service status reads the same file, so keep the reader a small exported function.
- Tests: written on start with owner-only permissions on POSIX, holds the working address, removed on stop, replaced by a newer run on the same port, never written by `--demo` or by board tests that don't go through `runBoard` (tests use a temporary home, never the real `~/.braid`).
- `docs/board.md` "Run the board at login": how to get the address of a board started at login; the 403 texts point there too. `docs/cli.md` and the CLI's help text for `--url`.
- `docs/decisions.md`: a dated decision for the address file (why a file, where, its permissions, its lifetime), next to D50.

## Already decided

- The address goes to a file under `~/.braid`, the per-user folder the board already reads (`projects.json`, the notify settings). Never into a project's `.braid/`, a log, a push or the board's page.
- The file is owner-only: mode 0600 on POSIX (created with that mode through a temp file and a rename, not chmod after), and under the user's profile on Windows, whose ACL already limits it to the user. One file per board port, so two boards don't overwrite each other's address; the worker names it.
- The token itself doesn't change: still random per run, still in the URL fragment. A stale file left by a killed board holds a dead run's token, which a new run on that port replaces; `--url` says no board is running when nothing answers on that port.
- No other new state: the address file is the only file this braid adds (the user's programme rule).

## Out of scope

- The service itself: 0067/B.
- The Tailscale listener and its request header (D60).

## Failure modes and regression tests

- The token leaks: the file is readable by other users, or a login recipe redirects the address into a world-readable log. Test the POSIX mode; check the recipes in docs/board.md.
- A stale file after a killed board: `--url` must not offer a dead address as live. Test with a file whose port answers nothing.
- Two boards on different ports: each keeps its own file; stopping one removes only its own. Test it.
- Tests touching the real home: every test of the file sets a temporary home; `~/.braid` is untouched after the suite.
- Cleanup on Windows: Ctrl+C and a scheduled task's stop remove the file, or the stale-file case covers it; report.md says which.

## Plan

1. `src/board/address.ts`: `addressFile(port, home)` is `~/.braid/board-<port>.url`; `writeAddress` writes a temp file created with mode 0600 and renames it over the port's file; `removeAddress` deletes it only while it still holds this run's address; `readAddresses(home)` lists the files; `liveAddresses(home, probe)` keeps those whose board answers `GET /api/session` with this token (204). 0067/B reads through `liveAddresses`.
2. `src/commands/board.ts`: the local listener answers `GET /api/session` (204 for this run's token, 403 otherwise; nothing else read). `runBoard` (not `--demo`) writes the file after it listens, removes it in `close()`, on `exit` and on SIGINT, SIGTERM, SIGHUP (and SIGBREAK on Windows), then re-raises the signal. `boardUrl(args)` is `braid board --url [--port <n>]`.
3. `src/cli.ts`: `braid board --url` goes to `boardUrl`; the help line. The 403 texts name `braid board --url`.
4. Tests (`test/board-address.test.ts`, temporary home): mode 0600 on POSIX, the working address, removed on close and on a signal, a newer run on the same port replaces it, two ports keep their own, `--demo` and `startBoardWith` write none, a stale file reads as no board.
5. Docs: board.md ("Run the board at login", token notes), cli.md, autonomy.md (the gone PM thread), decisions.md (a dated decision next to D50), braid-pm's openai.yaml.

## Completion

- [x] braid-pm's `agents/openai.yaml` names the programme manager, and `docs/autonomy.md` gives the gone-PM-thread escalation as the other docs do
- [x] A real `braid board` run writes its tokened local address to an owner-only file under `~/.braid`, removes it on stop, and `--demo` writes none
- [x] `braid board --url` prints the running board's address, or says no board runs when the file is stale or missing
- [x] Tests cover the failure modes above with a temporary home, on Windows and Ubuntu CI
- [x] docs/board.md "Run the board at login", docs/cli.md, the help text and the 403 texts say how to get the address; docs/decisions.md has the dated decision
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
