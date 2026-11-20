---
id: '0047/A'
title: "braid wait answers within one call: a still-running exit code"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 10
---

## Goal

`braid wait` gets a bounded mode for a foreground call: it waits at most the given time, then exits with its own "still running, call again" code instead of folding that case into exit 2 (no answer). The coordinator can then wait for braid-branch CI in calls under 10 minutes and repeat, without a background command.

Expected size: about 120 lines in 5 files.

## Start here

- `src/commands/wait.ts`: exit codes today are 0 green, 1 failed, 2 no answer (timeout, no run, error). `--timeout` is in minutes, default 30. It polls every 15 s and gives a commit 5 minutes to show a run.
- `src/cli.ts` (the `wait` help line), `docs/cli.md`, `docs/braids-format.md`: where `braid wait` is described.
- The tests that cover `waitCommand`.
- Inbox idea `2026-11-20-80k2`, "Fixes", the `braid wait` bullet.

## Change

- `src/commands/wait.ts`: a distinct exit code for "CI is still running when the time is up" (for example 3), kept apart from 2, which stays for no run, no commit and errors. The output names the commit it waits on and says that a later call continues. A run that hasn't appeared yet but still may (inside the 5-minute start limit) counts as still running.
- `--timeout`: name the unit in the help and the output; keep minutes unless the plan finds a reason to change, and accept a value small enough for a call under 10 minutes (for example `--timeout 9`).
- Help and docs for the new code.

## Already decided

- Exit 0, 1 and 2 keep their meaning, so a caller that knows only those still works.
- The command stays read-only and runs as one foreground process: no background mode, daemon or notification.

## Out of scope

- The skill text that uses the new code (0047/C).

## Completion

- [ ] `braid wait <number> --timeout <minutes>` returns the new "still running" code when CI is still pending at the limit, and 2 only for no run, no commit or an error; tests cover each code.
- [ ] `braid help`, `docs/cli.md` and `docs/braids-format.md` name every exit code and the unit of `--timeout`.
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
