# 0040 report: Autonomy presets

## What changed

- **0040/A, `braid wait <number>` (D70).** Waits for the braid branch's CI on its newest commit outside `braids/` and `epics/`. It only reads, and the exit code is the answer: 0 green, 1 a `ci` check failed, 2 no answer.
- **0040/B, one answer approves a plan (D71).** The plan's approval also approves merging its planning PR: the coordinator merges it, pinned to the squashed commit, and starts the first strand. The plan opens with the braid's number and title.
- **0040/C, presets as files (D68).**
  - The format: front matter (`name`, `merge`, `continue`), then one table with "Decide yourself when" and "Ask me when" per stop case.
  - braid ships `careful` (the default), `steady` and `free`. A project's `autonomy/<name>.md` adds or replaces one.
  - New `autonomy` field in a brief and key in `BRAID.md`, `braid autonomy <number>` and `--list`, and checks in `braid check`.
- **0040/D, merges follow the preset (D72).**
  - `braid accept --merge --preset` refuses unless the preset's `merge` allows that PR, and refuses when `ci` is `none`.
  - New `braid decisions <number> [--since]` lists the `Decided:` log entries.
  - The recap and handover show them under Decisions.
- **0040/E, the skills run on presets.**
  - `references/auto-mode.md` became `references/autonomy.md`: reading the preset, merging, continuing, deciding, telling, hold, and changing the preset.
  - The stop cases, the worker and the reviewer read the preset. `Decided: <what>, because <why>, instead of <alternative>` is the logging rule.
- **0040/F, project files and docs (D73).**
  - `BRAID.md` says `autonomy: steady`.
  - The `AGENTS.md` merge limit follows the preset, and `main` stays the user's.
  - README, getting-started and decisions: D73 replaces D31's auto mode, and D28 and D31 point to it.
- **Main merged once, before 0040/E.** Main had taken D65, D66, D67 and D69, so this braid's D65, D67 and D69 became D70, D71 and D72; D68 stayed. Main's question-tool option sets (D66) and reviewer subagents (D69) are kept alongside this braid's changes.

## Why

The thread review of 17–19 November found that most of the user's messages were a bare "merge", "go" or "approve". It also found a planning PR that waited 221 minutes after the plan was approved, and six nudges to coordinators that said "waiting" with nothing to wake them. Presets let the user decide per project and per braid what the coordinator merges and decides. What it decides, it logs, and the user reads it at the recap.

## Validation

- The gate (`npm run verify`) passed on every strand and on the main merge, with 364 tests.
- Braid-branch CI was green after every merge. One Windows run failed on a flaky test at midnight UTC and passed when re-run.
- Each strand had an independent review, and none blocked.
- This braid ran itself under its plan's mandate: auto mode to the end, with process and architecture stops kept for the final PR.

## Open

- **Box "A coordinator that merged a strand itself is woken when the braid branch's CI ends" is left open.**
  - `braid wait` works.
  - The wake is the problem: the skill pairs `braid wait`, run in the background, with T3's `t3_background_wait`, and research during this braid showed that T3 closes the Claude session about 20 ms after the last background command ends. Only 1 of 6 such wakes survived.
  - The fixes (wait in the foreground, a bounded `braid wait`, `braid start` safe to re-run, a T3 bug report) are captured as idea 2026-11-20-80k2.
- **Decision rows D47, D57, D66 and D68** still mention auto mode in the present tense (idea 2026-11-20-gj9u).
- **Leftovers and ideas from the strands:**
  - a cancelled check counted as green (2026-11-19-u5b4);
  - two braids able to take the same number (2026-11-19-fi8d);
  - review suggestions from D and E (2026-11-19-diq9, 2026-11-20-w5cd);
  - the midnight test flake (2026-11-20-6ce8).
- The installed `braid` comes from `main`, so it has none of `wait`, `autonomy`, `decisions` or `--preset` until this PR merges and the CLI is installed again.
