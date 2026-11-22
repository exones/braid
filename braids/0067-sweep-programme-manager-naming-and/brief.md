---
id: '0067'
title: "Sweep: programme manager naming and escalation; board token address at login"
status: To Do
labels: ["kind:task", "tier:L", "sweep", "ask:security"]
dependencies: []
related: ['0064', '0062']
delivery: epic
---

## Goal

Clear two leftovers from braid 0062 ("Programme manager on the board", [PR #245](https://github.com/exones/braid/pull/245), report `braids/0062-programme-manager-on-the-board-and-in/report.md` on `main`). First, make the programme manager's name and its escalation path read the same in the braid-pm skill's agent metadata and in `docs/autonomy.md` as everywhere else. Second, let a board started at login (no console) act from its local page: today it prints the address with its session token only to a console nobody sees, so its page stays read-only.

Expected size: about 80 lines in 5 to 7 files (code, tests, docs).

## Leftovers taken

The user chose this sweep on 2026-11-22 ("Sweep: a"), when the coordinator of braid 0064 proposed it: 2026-11-22-7kqa went into 0064/C, and these two into this story, run after 0064.

### 2026-11-22-n60n: braid-pm openai.yaml and docs/autonomy.md still lag the programme manager

From review 0062, ref https://github.com/exones/braid/pull/245#issuecomment-7081454396.

What: .agents/skills/braid-pm/agents/openai.yaml still has display_name "Braid PM" (not programme manager); docs/autonomy.md lists how a request to the PM reaches the user but omits the gone-PM-thread escalation.
Why: names and escalation paths should read the same everywhere.
Where: .agents/skills/braid-pm/agents/openai.yaml (a skill file; the user asked for this change by choosing the sweep), docs/autonomy.md.

### 2026-11-22-uk4f: A board started at login cannot act from its local page

From 0062/F, ref https://github.com/exones/braid/pull/244.

What: braid board prints its address with the session token only to its console; a board started at login (scheduled task or systemd service, docs/board.md "Run the board at login") hides that, so its page cannot Start, Merge or Open thread.
Why: the login recipe gives notifications but a read-only board.
Where: src/commands/board.ts (the token address); the board could write it to a file under ~/.braid.

## Start here

- `src/commands/board.ts`: `runBoard`, where it builds `url` with `#token=` and prints it (around "The token rides in the fragment"), and `startBoardWith` (the token, and the local listener's 403 texts that tell the user to "Open the URL that `braid board` printed").
- `docs/board.md`: "Run the board at login" (the Windows scheduled task and the Linux systemd recipes), the notes on the token (D50) and "Requests" (the escalation text, the line "It reaches your side").
- `docs/autonomy.md`: the `PM-run (thread <id>)` paragraph under "Which preset a braid runs on".
- `docs/getting-started.md` (the braid-pm bullet) and `docs/braids-format.md` (`--to pm`): how the escalation is already worded there, gone thread included.
- `.agents/skills/braid-pm/agents/openai.yaml`, and the other skills' `agents/openai.yaml` for the naming style.
- `docs/decisions.md` D50 (the local token) and D60 (the Tailscale listener).

## Change

- `.agents/skills/braid-pm/agents/openai.yaml`: `display_name` names the programme manager (for example "Braid programme manager"); `short_description` and `default_prompt` stay unless they contradict it.
- `docs/autonomy.md`: the `PM-run` paragraph says a request reaches the user when the PM forwards it, doesn't answer in time (20 minutes, 60 for a handover) or its thread is gone (archived, failed or unknown to T3), worded as `docs/getting-started.md` and `docs/board.md` have it.
- `src/commands/board.ts`: a real board run (not `--demo`) writes its full local address with the token to a file under `~/.braid` when it starts, and deletes it when it stops (Ctrl+C, SIGTERM, a normal exit). Add a way to read it without opening the file by hand: `braid board --url` (or a small subcommand the worker proposes) prints the running board's address, or says plainly that no board is running.
- Tests for the file: written on start with owner-only permissions on POSIX, holds the working address, removed on stop, replaced by a newer run on the same port, and never written by `--demo` or by board tests that don't go through `runBoard` (tests use a temporary home, never the real `~/.braid`).
- `docs/board.md` "Run the board at login": how to get the address of a board started at login; the 403 texts point there too. `docs/cli.md` and the CLI's help text for the new flag or subcommand.
- `docs/decisions.md`: a dated decision for the token file (why a file, where, its permissions, its lifetime), next to D50.

## Already decided

- Taken by the user's choice "Sweep: a" (2026-11-22): both leftovers in this one story. The openai.yaml edit is a skill file change the user asked for by choosing the sweep; the user merges this PR.
- The token address goes to a file under `~/.braid`, the per-user folder the board already reads (`projects.json`, the notify settings). Never into a project's `.braid/`, a log, a push or the board's page.
- The file is owner-only: mode 0600 on POSIX (created with that mode through a temp file and a rename, not chmod after), and under the user's profile on Windows, whose ACL already limits it to the user. One file per board port, so two boards don't overwrite each other's address; the worker names it.
- The token itself doesn't change: still random per run, still in the URL fragment. A stale file left by a killed board holds a dead run's token, which a new run on that port replaces; the reader says no board is running when nothing answers on that port.
- Related to 0064 (The board watches provider limits, on `braid/0064-the-board-watches-provider-limits`): it also changes `src/commands/board.ts` and `docs/autonomy.md`. This story starts only after 0064 has merged into `main`, and its branch merges `main` first.
- Related to 0062 (Programme manager on the board and in the skills): the source of both leftovers; done.

## Out of scope

- The Tailscale listener and its request header (D60): unchanged.
- A headless board as a service with its own installer (idea 2026-11-21-mbb2): this story only adds the address file and its reader to the existing login recipes.
- Renaming "PM" elsewhere: the short name stays where the docs use it after first naming the programme manager.

## Failure modes and regression tests

- The token leaks: the file is readable by other users, or the login recipe redirects the address into a world-readable log. Test the POSIX mode; check the recipes in docs/board.md.
- A stale file after a killed board: the reader must not offer a dead address as live. Test with a file whose port answers nothing.
- Two boards on different ports: each keeps its own file; stopping one removes only its own. Test it.
- Tests touching the real home: every test of the file sets a temporary home; `~/.braid` is untouched after the suite.
- Cleanup on Windows: Ctrl+C and the scheduled task's stop remove the file, or the stale-file case covers it; report.md says which.

## Completion

- [ ] braid-pm's `agents/openai.yaml` names the programme manager, and `docs/autonomy.md` gives the gone-PM-thread escalation as the other docs do
- [ ] A real `braid board` run writes its tokened local address to an owner-only file under `~/.braid`, removes it on stop, and `--demo` writes none
- [ ] `braid board --url` (or the agreed reader) prints the running board's address, or says no board runs when the file is stale or missing
- [ ] Tests cover the failure modes above with a temporary home, on Windows and Ubuntu CI
- [ ] docs/board.md "Run the board at login", docs/cli.md, the help text and the 403 texts say how to get the address; docs/decisions.md has the dated decision
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
