# 0007/E report

## What changed

- `braid edit --dep none` and `--labels none` clear a list (like `--order none`); `''` still works where the shell passes it. `braid help`, `docs/braids-format.md` and a test cover it.
- The brief template and the worker skill pass `braid log` text on standard input (`--file -`) and say why in one line: the Windows `braid.cmd` shim splits an argument that holds a quoted phrase. `docs/braids-format.md` says the same.

## What worked (trial braid 0013, run by the coordinator)

Skills and `braid` 0.1.1 installed from the epic branch on all four hosts; the story was planned with `braid new`, `braid check`, a branch; a worker launched with the three-line first message set In Progress/Done, ticked boxes and wrote `report.md` without Backlog.md; tier S review and merge (PR #76). Exit codes pass through the shim.

## What broke

1. Quoted phrases in text arguments through `braid.cmd` (fixed: `--file -` in examples).
2. Empty `''` dropped by the shim, so lists couldn't be cleared (fixed: `none`).

## Validation

`npm run verify` passes locally (Windows); CI green on Windows and Ubuntu.

## Open

Deviation of the trial: its PR went into the epic branch because `main` has no `braids/` until 0007 merges. Not a skill gap.

For later items: `none` is now the way to clear `--dep` and `--labels`.
Needs the user: none

## Second finding: workers logged under the coordinator's thread id

My own log, and 0007/D's, went to the coordinator's log file: the first message gave only "Send your result to thread <id>", and the worker took it as its own. Fixed: the braid skill's worker first message now ends with `Your thread id: <worker thread id>.` (the coordinator launches the thread with no message, then sends the first message with `t3_thread_send` once the launch has returned the id), and the worker skill says to use that id for `--thread`, never the result thread. The log file moved to `log-2026-11-14-a8c206bd.md`. Simpler alternative to consider later: T3 exposing the thread id to the agent, which would remove the manual step.
