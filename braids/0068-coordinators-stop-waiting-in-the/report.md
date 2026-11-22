# 0068 report

## What changed

- `.agents/skills/braid/SKILL.md`: "Run an item" step 3 is now **End the turn**: one sentence replaces the `t3_thread_wait` loop; the user or the PM is answered at once; the no-report checks stay. "Fixes" names the two read points in one sentence, "Finish" step 1 runs the read; "Say waiting" lists only the worker's message, a PR watch, a `delegate_task` result or the board.
- `.agents/skills/braid/references/autonomy.md`, "Merging" step 4: after a strand's merge the next item starts at once; the step shrinks to the exit codes of the short read (0/3 go on, 1 "Fixes", 2 `braid ask`). A braid branch still running before the final PR doesn't hold it: the final PR's watched CI catches a red one before any merge into `main`.
- `.agents/skills/braid/references/workflow.md` "Checks and reports": "waits only for a wake".
- `docs/decisions.md`: D91 (with the user's words), dated notes on D77 and D71, and a decision log line.
- `docs/braids-format.md`, `docs/cli.md`, `docs/autonomy.md`, and the top comment of `src/commands/wait.ts`: the coordinator calls `braid wait` as a short read at those two points. The command, its flags and exit codes are unchanged.

## Why

A foreground wait of up to 10 minutes a call held the user's and the PM's messages in the queue (the user, 2026-11-22). Workers' reports wake the coordinator and the board's stall detection covers a worker that never reports, so no other safety net is added.

## Validation

- `rg -n "t3_thread_wait|timeout 9|in parallel with it" .agents/skills/braid` finds only `references/limits.md` (0064's, out of scope).
- Checked in `src/commands/wait.ts` that a `--timeout 0.25` call reads the checks at least once and returns 0, 1 or 3 (the 5-minute no-run exit 2 can't trigger at that length), so the mapping in autonomy.md matches the code.
- `npm run verify` passed.
- Words in `.agents/skills/braid/` (SKILL.md + references/autonomy.md + references/workflow.md, `Measure-Object -Word`): 9424 before (4d07316), 9294 after (SKILL.md 6519 → 6470, autonomy.md 932 → 853, workflow.md 1973 → 1971).

## Docs

Updated: docs/decisions.md, docs/braids-format.md, docs/cli.md, docs/autonomy.md. README and getting-started don't describe the coordinator's waits.

## Open

- `references/limits.md` still has `t3_thread_wait` (pausing at a clean point); 0064 owns it. Whichever of 0064 and 0068 merges into `main` second merges `main` and keeps both.
- The CLI usage line of `braid wait` still gives `e.g. 9` as a fraction example; left as is since the brief keeps the command unchanged.

For later items: a `--once` flag on `braid wait` could replace the fractional `--timeout 0.25`; and a short read whose output already names a failed check could exit 1 instead of 3, so the coordinator needs no rule for it.
Needs the user: none