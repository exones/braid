**0080 The board talks to T3 directly** (programme pm/autonomous-dev-machine, row P27): the board signs in to T3's MCP and uses that one connection to stop threads on a hold or a limit pause, read T3 lightly and hear its events; stalled cards say why a thread failed.

## What changed

- **0080/A** (spike, PR #329): how the board signs in. Found that T3 refuses an OAuth client acting on a thread above its approved level, so the user chose Full access instead of Supervised (q-b146), with `@napi-rs/keyring`.
- **0080/B** (PR #334): `src/t3mcp/`, a JSON-RPC client for T3's MCP (typed `unauthorized` / `unreachable` / `error`, the token never in an error) and an events reader (cursor, paging, a full re-read on `truncated`), tested on a mock T3.
- **0080/C** (PR #340): stalled cards say why the thread failed (usage limit with its reset, provider or network, run stopped, T3's text), in place of the stall sentence once the card reads stalled, the full error on hover (q-n7xu).
- **0080/D** (PR #380): `braid t3 login|logout|status|set`; OAuth with PKCE, `state` and `iss`; Full access required; the token only in the OS secret store (braid's first runtime dependency, `@napi-rs/keyring` 2.1.2, loaded lazily, no fallback); `~/.braid/t3.json` (`access` auto|cli, `localOnly`); the T3 button top right (q-nxp6: waiting state, sign-out from the phone, sign-in on the PC only, a single-use local callback); pushes 5 days before the 30-day end and on a refused sign-in.
- **0080/E** (PR #383): signed in, a limit pause and a hold stop each working top-level thread with `t3_thread_interrupt` `stop: true` (children with it) before the text; the board sends a hold's text itself; the card shows threads still working and refused stops; a thread whose last run failed on a usage limit counts as paused. Hold records in `.braid/pauses.json` gain `targets`, `replies`, `stop` (additive; the PM's happy-tiger-ef94).
- **0080/F** (PR #386): signed in, the board reads T3 over its one MCP session as 0083 measured (one live-only list per refresh, cached limit-1 thread reads, the full list at start and after missed events), with the same snapshot code as the CLI read; events refresh a project within about 5 s; 0080/C's failure read over MCP, bounded to 4. Signed out, `access: cli`, a 401 or T3 down: the CLI read as before.
- **0080/G** dropped (q-htgo): T3 v0.1.12 offers agents no auto-settle switch; the docs say it is a manual per-thread T3 setting.
- **0080/H** (PR #390): the docs as a whole, including "First sign-in and checking it" and "T3's own settings" in docs/board.md.

## Validation

Every strand passed review (grok-4.6, braid-reviewer) and CI on Ubuntu and Windows; A had two re-check rounds (the level finding), the others none blocking. Everything T3-facing is tested against mock T3 servers (OAuth, MCP tools, events); no real token was used and no real T3 thread was touched. Mock timings: a signed-in refresh 19-33 ms on 450 threads; the CLI's `t3 thread list/show` 1.4-3.8 s per process on this machine. Not yet proven live (the user tests after the merge, by their decision on sticky-ladder-4x27): the real sign-in, T3's real MCP answer shapes (a mismatch falls back to the CLI), a stop reaching a real child, and the board service reading the terminal's sign-in.

## The user's live check after the merge

From docs/board.md, "First sign-in and checking it". T3 must be running.

1. Install the update: `pwsh -NoProfile -File .\scripts\Install-Skills.ps1` (also restarts the board service).
2. `braid t3 login`, and approve "braid board" at **Full access** on T3's page (a code from "Use T3 Code in another app (MCP)" at Full access). The terminal prints `Signed in to T3 at <address> until <date>`. A lower level is refused and revoked: run it again.
3. `braid t3 status`: `signed in at <address> · Full access · until <date> (in 30 d)`. Within a minute the board's T3 button (top right) turns green.
4. The board service: open its page (`braid board --url`); a green T3 button there shows the service reads the sign-in made in the terminal (unproven until now).
5. A hold: on a scratch braid with a scratch thread running a delegated child, `braid pause <number> --hold "live check" --thread <your thread>`. Within about 30 s both threads stop (T3's sidebar), the scratch thread gets the hold text, and the card shows no "still working" after the stop. `braid resume <number>` clears the record and sends nothing. Archive the scratch threads afterwards.
6. Revoke "braid board" in T3's Settings → Sharing & access. At the board's next T3 call (within about 30 s) the button turns red, "Signed out: T3 refused the sign-in (revoked in T3)", and one push arrives if notifications are on. `braid t3 status` still says signed in (it reads the stored entry); trust the button.
7. `braid t3 logout`: the entry is deleted (T3 already revoked it); the button turns dashed grey, and `braid t3 status` says signed out. `braid t3 login` again to stay signed in.

## Open

- The live check above.
- Leftovers: 2026-11-25-kzbl (lock tests flaky under load), 2026-11-28-jyqo (the braid-pm and braid skills' Hold steps could shrink once the board is signed in; a skill change, the user's to ask). Idea 2026-11-28-aof4 (an old-style worker's report reached no one after 0060).
- Known lags (0080/F, judged acceptable): an archived settled thread keeps its idle button until a restart; an unseen archived checker drops at its 24 h cap.

Decisions: the user's: q-b146 (Full access, `@napi-rs/keyring`, the two settings, the board button), q-n7xu (failure reason in place of the stall sentence, once stalled), q-nxp6 (the button and four proposals), q-htgo (drop auto-settle), sticky-ladder-4x27 (live check after the merge). The PM's: q-9pwn (plan), giant-pebble-mku2 (merge D before the live check), happy-tiger-ef94 (merge E's additive record fields). The coordinator's: C's one cached read per new failure; main (0077) merged through D's branch; the gate box ticked on CI when only known flaky tests failed locally.
For later items: the leftovers and the live check above.
Needs the user: security: the live check with the real sign-in, after the merge.
