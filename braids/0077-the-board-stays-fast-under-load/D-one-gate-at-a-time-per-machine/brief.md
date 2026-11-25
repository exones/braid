---
id: '0077/D'
title: "At most two gates at once per machine"
status: To Do
labels: ["kind:story", "tier:M", "ask:architecture"]
dependencies: []
order: 40
---

## Goal

Two braids' gates no longer run at the same time on one machine and starve the board and each other (idea 2026-11-24-5p1e: about 40 `node --test` processes from two full gates, CPU at 100%, every board read over 60 s; 0010/B's timing test failed in such a run). A new `braid gate` runs the project's `gate` from BRAID.md under a machine-wide lock with two slots, so a third gate waits for one of the first two to finish.

Expected size: about 250 lines in 6 files.

## Start here

- `BRAID.md` `gate:` and how braid reads BRAID.md keys (search for an existing reader, e.g. of `ci:` or `limits:`).
- `braidHome()` and how other files in `~/.braid` are written (src/board/address.ts).
- `scripts/Verify.ps1`, `npm run test` in package.json: braid's own gate.
- src/cli.ts: how a command is registered.

## Change

- `braid gate [--no-wait]`: takes one of two slots of the gate lock in the braid home (holder pid, project, worktree, start time), runs the `gate` command in the current checkout with its output passed through and its exit code returned, and releases the lock on exit, error or Ctrl+C. While both slots are held, it prints once who holds them and since when, and waits; a lock whose pid is gone is taken over. `--no-wait` exits with a distinct code instead of waiting.
- braid's own `npm run test` runs `node --test` with a `--test-concurrency` cap (for example half the cores), so one gate leaves room for the board.
- Tests: three `braid gate` runs on a fake gate command: two run at once, the third waits; a stale lock is taken over; the exit code passes through. Tests use a temporary braid home.

## Already decided

- Two slots per machine, no setting (the PM, q-f2ad: two slots keep parallel workers moving, while one slot would queue them, and a node-only cap helps only braid's repo). The lock is one file (or one file per slot) in the braid home, nothing else; the user: lean, no spaghetti states.
- The skills' line that workers run the gate through `braid gate` is changed by the docs strand (F), which is the one to edit agent instructions.
- CI doesn't use `braid gate`; it runs `npm run verify` as today.

## Out of scope

- A memory or process watchdog (P26). Process priority changes.

## Completion

- [ ] `braid gate` runs BRAID.md's `gate` and passes its exit code through; a third run waits while two run, and says who holds the slots; a stale lock is taken over
- [ ] braid's own `node --test` runs with a concurrency cap
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated (docs/cli.md, the help text), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
