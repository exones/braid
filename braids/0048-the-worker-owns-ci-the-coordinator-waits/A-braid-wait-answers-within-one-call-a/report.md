`braid wait` now ends with its own exit code 3 when CI is still running at the `--timeout` limit.

**What changed:** `src/commands/wait.ts` returns 3 (`still running after N minutes at <sha> on <branch>; ...; call braid wait <number> again to continue on <sha>`) at the limit. Exit 2 stays for no run within 5 minutes and errors; 0 and 1 are unchanged. The 5-minute no-run limit no longer shrinks with `--timeout`, so a short call (e.g. `--timeout 1` or `9`) where no run has appeared yet ends as 3, not 2. Help, `docs/cli.md` and `docs/braids-format.md` name every code and that `--timeout` is in minutes (fractions allowed).

**Why:** the coordinator can wait for braid-branch CI in foreground calls under 10 minutes and repeat, with no background command.

**Validation:** `test/wait.test.ts` covers 0, 1, 2 (no run after 5 minutes) and 3 (running at the limit; not started in a short call). `npm run verify` passes.

**Open:** a repeated call restarts the 5-minute no-run clock; fine since a run that never appears is still reported as 2 within one call.

For later items: none
Needs the user: none
