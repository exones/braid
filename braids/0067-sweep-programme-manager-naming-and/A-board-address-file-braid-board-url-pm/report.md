# 0067/A report

## What changed

- `src/board/address.ts` (new): the address file `~/.braid/board-<port>.url`. `writeAddress` creates a temporary file with mode 0600 (`wx`) and renames it over the port's file; `removeAddress` deletes it only while it holds this run's address; `readAddresses` lists the files; `liveAddresses(home, probe)` keeps those whose board answers `GET /api/session` with the file's token. 0067/B's service status reads `liveAddresses`.
- `src/commands/board.ts`: the local listener answers `GET /api/session` (204 for this run's token, 403 otherwise, reads nothing). `runBoard` (not `--demo`) calls `keepAddress` after it listens: it writes the file, removes it on `close()`, a normal exit and SIGINT, SIGTERM, SIGHUP (SIGBREAK on Windows), and raises the signal again so the process ends as before. A file that can't be written is one line on standard error; the board runs on. `boardUrl` is `braid board --url [--port <n>]`. The two 403 texts also name `braid board --url`.
- `src/cli.ts`: `braid board --url` goes to `boardUrl` (exit 0 with the addresses, exit 1 with `no braid board is running for this user; start one with braid board`); the help line.
- `.agents/skills/braid-pm/agents/openai.yaml`: `display_name: "Braid programme manager"`.
- `docs/autonomy.md`: the `PM-run` paragraph gives the 20 minutes (60 for a handover) and the gone PM thread (archived, failed or unknown to T3), as getting-started.md and board.md do.

## Why

A board started at login (or 0067/B's service) has no console, so its printed tokened address was lost and its page couldn't Start, Merge or Open thread (leftover 2026-11-22-uk4f). The naming fix is leftover 2026-11-22-n60n.

## Validation

- `test/board-address.test.ts` (7 tests, scratch `HOME`/`USERPROFILE`): a real `runBoard` writes the working address (mode 0600 on POSIX, no temp file left), `--url` prints it, the session check accepts its token and refuses others, `close()` removes it and `--url` then exits 1; `--demo` and `startBoardWith` write none; a stale file whose port answers nothing, and one with another run's token, read as no board; a newer run on the same port replaces the file and the older run's removal keeps it; two ports keep their own files and stopping one removes only its own; a stop signal removes the file and re-raises the signal; the real `~/.braid` has the same address files after the suite.
- CLI smoke run in a scratch home: `braid board --url` exits 1 with the no-board line; `--url --port x` is a usage error.
- `npm run verify`: passed (552 tests) on Windows; Ubuntu runs in CI.

## Cleanup on Windows

`Ctrl+C` and Ctrl+Break in the console, and closing the console window (SIGHUP), remove the file. `Stop-ScheduledTask` ends only the `pwsh` it started (docs/board.md), and `Stop-Process` / Task Manager kill `node` outright, so no handler runs: the stale-file case covers those (`--url` finds no board answering with that token, and the next run on the port replaces the file).

## Docs updated

- `docs/board.md`: new "The address file" section; the token notes and the 403 texts; "Run the board at login" (Windows: open `braid board --url`'s address, `Stop-Process` leaves a stale file; Linux: `StandardOutput=null` keeps the tokened start lines out of the journal, `braid board --url`, `systemctl --user stop` removes the file).
- `docs/cli.md`: `braid board` and a `braid board --url` row, and the example list.
- `docs/decisions.md`: D94 (dated 2026-11-23), after D93 (the table runs by number; it names D50).
- `docs/autonomy.md`, braid-pm's `openai.yaml`: as above. The CLI's help text.

## Open

None.

For later items: 0067/B can take the address from `liveAddresses()` in `src/board/address.ts` for its status line; a service manager that stops the board with SIGTERM (or a console Ctrl+C) removes the file, one that kills the process leaves the stale case.
Needs the user: security: `braid board --url` must tell a live board from a killed one's stale file, so the local listener gained `GET /api/session` (behind the Host check: 204 for this run's token, 403 otherwise, timing-safe, reads nothing), and the Linux login recipe now sends standard output to `null` so the tokened address stays out of the journal; the PM's confirmation of both is needed (built and tested; reverting is small)
