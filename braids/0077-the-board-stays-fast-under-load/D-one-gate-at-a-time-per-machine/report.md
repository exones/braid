## What changed

- `braid gate [--no-wait]` (src/commands/gate.ts): runs BRAID.md's `gate` in the current checkout, input and output passed through, and exits with its code. At most two run at once on a machine: each holds `~/.braid/gate-1.lock` or `gate-2.lock` (pid, project, worktree, start time). With both held it prints once who holds them and since when, and waits; `--no-wait` exits 75 instead. A slot whose pid is gone is taken over. The slot is released when the command ends, after an error, Ctrl+C or SIGTERM.
- The takeover reuses `takeOverStale` (src/braids/state.ts), which now takes an optional staleness test, so two waiters can't remove each other's new slot.
- `npm run test` runs scripts/Test-Node.ps1: `node --test` with `--test-concurrency` at half the cores. No cap when `CI` is set: a runner has no board, and half of 4 cores would slow the Windows job.
- Docs: docs/cli.md (command, exit code 75), the help text, docs/development.md, docs/decisions.md (D-gate-slots). README.md lists no such command and is not affected.

## Why

Two full gates at once held the CPU at 100% and every board read took over 60 s (idea 2026-11-24-5p1e). Two slots and no setting are the PM's decision.

## Validation

- `node --test test/gate.test.ts test/cli.test.ts` on Windows: 9 pass, 1 skipped (the SIGTERM test, POSIX only; CI's Ubuntu job runs it). The tests use a temporary home, never the real `~/.braid`.
- `npm run verify` on Windows, machine busy: 724 tests, 721 pass, 1 skipped, 2 fail, about 22 minutes. The two failures are the known request-record lock tests in test/requests.test.ts ("overlapping writers in separate processes lose no update" and "... when they start on a stale lock"), which time out under local load on the base too (leftover 2026-11-25-x9jg, now strand 0077/H). Green CI on the PR is the gate evidence.
- Not measured: the board's response time under two gates (the braid's final check).

## Open

- A slot stays held if a crashed holder's pid is reused by another process; the waiting message names the pid, and removing the file frees it (docs/cli.md).
- A `braid gate` process killed outright leaves its gate command running while the slot counts as free.

For later items: F has to tell workers to run the gate through `braid gate` (skills, after the user's go); the installed `braid` needs this change before anyone can use it. A gate command that itself calls `braid gate` takes a second slot and can wait for itself.

Needs the user: none
