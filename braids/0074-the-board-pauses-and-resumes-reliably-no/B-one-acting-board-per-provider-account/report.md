# 0074/B report: one acting board per provider account and repository

## What changed

- **Leases** (`src/board/acting.ts`, new): one file per key in `~/.braid/acting/`, `provider-<instanceId>.json` and `repo-<hash of the main checkout's path>.json`, holding the board's run id, pid, port, start time and a heartbeat. Taken and renewed at each tick under the file's lock (`locked()` of `src/braids/state.ts`, a create-exclusive lock file), so two boards started together can't both win. Another board takes over when the heartbeat is older than 90 s (three refreshes) or the pid is gone. A stopping board removes its leases (close, normal exit, stop signals).
- **The steerer** (`src/board/steerer.ts`) takes the repository leases of the projects it sees and the provider leases of the providers it sees (limits view and pause records) at the start of each tick. Follow, resume and pause act only for held providers. Wake, reminders, nudges and the pending-push retry act only for held repositories. A board that holds nothing still reads and shows. Without an acting board (the tests' single steerer) it acts for everything, as before.
- **Matching across projects:** a `Steering:` child joins the record of its braid in the project whose T3 list knows the thread (else the first project with that braid paused) and carries that project's folder. The resume re-checks each record against its own project's BRAID.md and limits: a project still over its own threshold keeps its record (one `extended` push), the others resume (one `resumed` push).
- **Pending limit pushes** (`src/notify/notifier.ts`): a failed send is kept under `pending` in the project's `notified.json` (not in memory). `retry()` reads it from the file, so a restarted board sends it. The need notifier's writes keep `pending`.
- **Shown:** the limits view carries `acting` (merged by key on the combined board). The limits panel says "This board acts for the pauses, resumes and wakes." or, per key another board holds, "Watching: the board on port <p> (pid <n>) acts for …". `braid board service status` prints `Acting: for …` / `Watching: …` lines.

## Why

The service and a hand-started board both paused, resumed, woke and pushed; failed pushes were lost on stop; children and BRAID.md were mixed across projects (inbox 2026-11-24-9xc7).

## Validation

- `test/board-acting.test.ts` (new, the brief's tests): two steerers on one repository ticking at the same instant send one resume per thread, one wake, one push and one retry, and the second says who acts; a stale heartbeat and a dead pid are taken over and a live lease is not; a failed limit push survives a new pusher and is sent through the acting steerer's retry; two projects with braid 0070 keep their children apart, and at 60% project A (threshold 50) keeps its record while B (97) resumes only its own threads.
- Existing steerer and notifier tests pass unchanged.
- Gate: `npm run verify`, see below.

## Docs

- docs/board.md: new "One acting board" section; several-projects matching in "The board pauses and resumes"; "Run the board at login" (a second board only shows; `status` lines); "Sending" (pending limit pushes); "Refresh" (the board also writes its leases).
- docs/cli.md (board, board service status) and the CLI help line of `board service`.
- docs/decisions.md: D107 and its log line.

## Open

- The gap that's left: a board killed between a limit push's send and its record of failure loses that one push (in flight only in memory), as before.
- Need pushes (not limit pushes) still go out from every board on a repository; only the limits pause, resume, wake, reminders, nudges and pending limit pushes are gated. The brief scoped the lease to those.

For later items: 0074/C can send the pause through `t3 thread send` only on the provider-lease holder (the steerer already filters); the `acting` lines could appear on the chip strip if the user wants them visible without opening the panel.

Needs the user: none
