# 0077/F report: Docs for "The board stays fast under load"

## What changed

Strands A to H had already documented most of the braid in their own PRs. This one adds what was missing or no longer true.

| Doc | Result |
| --- | --- |
| README.md | updated: a `braid gate` bullet under "What braid does" |
| docs/getting-started.md | updated: `braid gate` beside the `gate` command, that the skills don't call it, and that the gate command must not be `braid gate` |
| docs/cli.md | updated: `braid gate` (SIGTERM, a killed gate, no `braid gate` inside the gate command), `service status` on a busy board, two examples. `--url` and exit code 75 were already right |
| docs/board.md | updated: "Refresh" no longer says nothing blocks (project setup runs two blocking `git` calls). The probe, the busy status and "N running" were already right; the seven `git` processes of a quiet read still hold (measured again on a clone, fake `gh` and `t3`) |
| docs/decisions.md | updated: new D-board-async and D-running-count, a decision log line, and in D-gate-slots that no skill calls `braid gate` yet |
| docs/development.md | updated: the gate no longer reads as "about 20 seconds" (stale; it takes many minutes) |
| docs/roadmap.md | updated: braid 0077's line, with what is not built |
| docs/braids-format.md | unchanged: 0077/H updated the data-branch writer |
| docs/autonomy.md | unchanged: nothing there is about the board's reads or the gate's limit |
| docs/npm-distribution.md | unchanged: packaging is untouched |
| help text (src/cli.ts) | unchanged: `gate`, `board --url` and `board service` already describe the behaviour |

No skill, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` change.

## Why

The braid's docs should be true as a whole once it merges into `main`.

## Validation

`node dist/cli.js gate` (BRAID.md's `npm run verify`) passed on the docs commit: 795 tests, 794 pass, 1 skipped, 0 failed; node tests 24 min on a busy machine.

`braid check` passes (its one warning, about the `free` preset, is expected).

## Anything open

The braid's Completion box "With two gates running at once … `/api/session` and page answer within a second, measured" is not measured by this strand; it stays for the braid's final check.

For later items:
- Tell workers to run the gate through `braid gate` (a braid-worker line); the user said "not yet" and the PM noted it as an idea. The installed `braid` also needs this braid's code first.

Needs the user: none
