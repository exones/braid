---
id: '0012/E'
title: "Leftovers: Host allowlist test, remote detection, --port"
status: In Progress
labels: ["kind:task", "tier:M"]
dependencies: []
order: 50
---

## Goal

Fix the three leftovers 0012/C left in its own code, before the braid's final PR merges (user, 2026-11-18). Each text is copied from its inbox entry.

Expected size: about 150 lines in 5 to 8 files, most of it tests.

## Start here

- `src/board/tailnet.ts` (`tailnetHosts`, `whoisGate`), `src/commands/board.ts` (`startBoard`, `boardCommand`, the two listeners), `web/src/api.ts` (`remoteBoard`).
- `test/board-tailnet.test.ts`, `test/board.test.ts`.
- `docs/board.md` "On Tailscale" and "On the phone", `docs/cli.md` `braid board`, D60 in `docs/decisions.md`.

## Change

1. **Unit test for the Tailscale Host allowlist** (leftover 2026-11-18-ty0o, from review 0012/C, https://github.com/exones/braid/pull/142#issuecomment-6984707358): The HTTP tests of the Tailscale listener (test/board-tailnet.test.ts, around line 204) bind it to 127.0.0.1, so Host 127.0.0.1:<port> is allowed there and a bind to 0.0.0.0 would still be reachable in those tests. Nothing locks the production allowlist built by tailnetHosts() in src/board/tailnet.ts to the Tailscale IP and the MagicDNS name only. Add a unit test of tailnetHosts("100.64.0.7", name, port) so a regression that widens the Host check fails.
2. **Local board opened as localhost hides Open thread** (leftover 2026-11-18-phl4, from review 0012/C, same link): web/src/api.ts decides remoteBoard as location.hostname !== "127.0.0.1", so a local board opened as http://localhost:<port> is treated as remote and hides the open button (the local Host check already refuses that Host for actions, so it is not a hole, only a confusing page). Decide remote from what the server says (for example a field in the board data, set per listener) instead of the page hostname.
3. **braid board --host: the phone URL changes every run** (leftover 2026-11-18-z0ug, from 0012/C, https://github.com/exones/braid/pull/142): The Tailscale listener of braid board --host takes the local port when free there, else a new free port, and the local port is itself random per run, so a bookmark on the phone breaks after every restart. Add `--port <n>` to `braid board`: both listeners use that port; a port in use is refused with a message, before anything listens. Without `--port`, behaviour stays as it is.

Update docs/board.md, docs/cli.md and D60 where they describe these.

## Already decided

- `--port` is opt-in; no port is remembered in `.braid/`.
- The security rules of D60 don't change.

## Out of scope

- Anything else in the board.

## Completion

- [x] A unit test locks the Tailscale Host allowlist to the Tailscale IP and MagicDNS name with the port
- [x] The page knows it is remote from the server, not its hostname; a local board opened as localhost keeps Open thread, with a test
- [x] `braid board --port <n>` serves both listeners on that port and refuses a port in use, with tests; docs updated
- [x] The gate command from BRAID.md passes
- [x] report.md written
