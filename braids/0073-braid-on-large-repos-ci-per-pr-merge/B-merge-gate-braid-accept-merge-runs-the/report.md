# 0073/B report

## What changed

- `src/commands/mergegate.ts` (new): reads `merge-gate:` and `merge-gate-on:` from BRAID.md and runs the command from the repository root through the shell (`spawnSync`, `shell: true`, so cmd on Windows and sh on Linux) with `<pr>` and `<sha>` filled in and a 9-minute limit.
- `src/commands/done.ts`: `braid accept --merge` calls it after its own checks (and after `waitGreen` for a story) and before each of the three merge calls: a strand into its braid branch (`strand`), a story or final PR into `main` fresh, and the resumed already-Done story (`main`). Exit 0 merges; anything else, a command that can't start, or a timeout throws a `UsageError` with the command, the exit code and the last 40 lines of output (a timeout says to run `braid accept` again). `--preset` or not, nothing skips it.
- `merge-gate-on:` accepts `strand` and `main` (default both); anything else is refused.

## Why

0073's brief: large projects need their own rules (test counts, windows, staging, non-regression) run before braid merges; the exit code is the whole contract.

## Validation

- `test/merge-gate.test.ts` (7 tests): pass and merge, with `<pr>` and `<sha>` filled in; fail refused with output, with and without `--preset`; timeout; no gate; default runs on a strand and a merge into `main`; `[main]` and `[strand]` skip the other; bad scope refused.
- `npm run verify` passes (621 tests).

## Docs updated

`braid-md.md` template (two field lines and one explanatory line), `docs/braids-format.md`, `docs/autonomy.md` ("What the CLI enforces"; there is no "Merging" heading), `docs/cli.md`, the `braid accept` help text, `docs/decisions.md` D100.

## Open

- A fresh story merge stamps Done on its branch before the gate runs (the gate needs the head being merged, which the stamp makes). A refusal leaves that stamp; run `braid accept` again and the resumed path runs the gate.
- `braid facts` line: not done (not cheap: facts has no BRAID.md summary line to extend); proposal below.
- `braid-md.md` is under `.agents/skills/`; the brief names it, so I edited it; the user merges skill changes.

For later items: a `braid facts` line naming the merge gate.

Needs the user: none
