---
id: '0074/B'
title: "One acting board per provider account and repository"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: []
order: 20
---

## Goal

Two boards can act at once today: the board service and a hand-started board on the same repository, or two boards started in the same instant, both pause, resume, wake and push. They share no lock, so resumes and wakes double and pushes repeat; a failed limit push waits only in memory and is lost when that board stops; and the steerer matches paused children by braid number without the project and re-checks every project against the first project's BRAID.md. One **acting board** per provider account (for the pause and the resume) and per repository (for wakes, reminders, nudges and the request record) fixes all of that (inbox idea 2026-11-24-9xc7, from Fable's review). Every other board still reads and shows, and says which board acts.

Expected size: about 350 lines in 6 files.

## Start here

- `src/board/steerer.ts`: the tick (follow, resume, pause, wake), `boardRecords`, the child matching in `follow` (about lines 165-171) and `readingOf(host.project.root, …)` in `resume` (about lines 193-197).
- `src/commands/board.ts` around line 1176: where the steerer and its pushes (`notified.json`, `retry`) are wired, and `--no-pause`.
- `src/board/wake.ts`, `src/board/remind.ts`, `src/board/nudge.ts`: the other acting steps.
- `src/braids/pauses.ts` `claimPauses`: the claim under a lock that exists today, per project.
- docs/board.md "Provider limits" and "Notifications"; D-entries on the board service in docs/decisions.md (`rg -n "service" docs/decisions.md`).

## Change

- A lease file per key in the machine's braid home (`~/.braid/acting/`; `BRAID_HOME` or the existing override in tests): `provider-<instanceId>.json` for the pause and resume of that provider account, `repo-<hash of the main checkout path>.json` for that repository's wakes, reminders, nudges and record writes. Taken atomically (create-exclusive, so two boards started together can't both win), it holds the board's pid, port, start time and a heartbeat renewed every tick. Another board takes it over only when the heartbeat is older than three refresh intervals or the pid is gone. A board that stops releases its leases.
- The steerer and the wake act only for keys whose lease the board holds; a board that holds none still refreshes and shows everything.
- The board page and `braid board service status` show "acting" or "watching: the board on port <p> (pid <n>) acts", per key that differs.
- Failed limit pushes are kept in the project's `notified.json` as pending and retried by whichever board acts, not held in memory.
- `follow` matches children by project and braid; `resume` reads each record's own project's BRAID.md and limits.
- Tests: two steerers on one repository started at the same instant send one resume and one push; a stale lease is taken over; a pending push survives a board restart; children of two projects with the same braid number stay apart.

## Already decided

- One acting board per provider account and per repository; a lease with a heartbeat, not a long-held OS lock (decided under the `free` preset; log it with D-number in docs/decisions.md).
- The pause itself stays as it is here; 0074/C replaces the steering thread on top of this lock.
- Related to P24 "The board stays fast under load" (a later braid, not open yet): it touches the board's request path and the git runner. Leave both alone here.

## Out of scope

- Boards on different machines sharing one provider account (one machine's T3 owns the cache).
- The pause and resume messages themselves (0074/C, 0074/D).

## Completion

- [ ] Two boards on one repository, started at the same instant, send one resume, one wake and one push each, with a test
- [ ] A board whose lease went stale (heartbeat or pid gone) is taken over, with a test
- [ ] A failed limit push survives a board restart and is sent by the acting board, with a test
- [ ] Children are matched by project and braid, and resume reads each project's own BRAID.md, with tests
- [ ] The board page and `braid board service status` say which board acts
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
