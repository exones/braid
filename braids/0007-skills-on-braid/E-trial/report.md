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

`npm run verify` passes locally (Windows); CI is pending.

## Open

Deviation of the trial: its PR went into the epic branch because `main` has no `braids/` until 0007 merges. Not a skill gap.

For later items: `none` is now the way to clear `--dep` and `--labels`.
Needs the user: none
