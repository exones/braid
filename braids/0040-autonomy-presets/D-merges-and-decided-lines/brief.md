---
id: '0040/D'
title: "Merges follow the preset; Decided lines in recaps"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: ['0040/C']
order: 40
---

## Goal

Two things the CLI can hold the coordinator to. A merge the coordinator makes by itself goes through only when the braid's preset allows that merge. And the decisions made under a preset can be listed and land in the recap draft, so the user reads them in one place instead of finding them in logs.

Expected size: about 260 lines in 8 files.

## Start here

- `src/commands/done.ts`, `acceptCommand`: what `braid accept --merge` checks before it merges, and how it tells a strand's PR from a story's or a final PR.
- `src/commands/requests.ts` and `src/commands/facts.ts`: where the `braid recap` and `braid handover` draft is built.
- `src/braids/logs.ts` and `src/commands/logs.ts`: log files, one per thread, and how entries are written.
- `src/commands/autonomy.ts` from 0040/C: reading a braid's preset.
- `docs/autonomy.md` from 0040/C.

## Change

- `src/commands/done.ts`: `braid accept <id> --merge --preset` is a merge the coordinator makes under the braid's preset. It refuses, naming the preset and its `merge` value, unless the preset allows this PR: `strands` allows a strand's PR, `all` also a story's PR and a final PR into `main`, `none` allows nothing. It also refuses when `ci` in `BRAID.md` is `none`. Every other check of `--merge` stays. Without `--preset`, `--merge` is a merge the user asked for, as today.
- `src/commands/decisions.ts` (new), wired in `src/cli.ts`: `braid decisions <number> [--since <date or sha>]` lists every log entry of the braid and its strands that starts with `Decided:`, oldest first: date, item id and the text.
- The `braid recap` and `braid handover` draft: under **Decisions**, the `Decided:` entries of that item; for a braid's final PR, those of the braid and all its strands.
- Tests for the three; `docs/cli.md`, `docs/braids-format.md`, `docs/autonomy.md`.

## Already decided

- A `Decided:` line is an ordinary log entry (`braid log`) that starts with that word; no new file and no new command to write one.
- `--preset` only checks the `merge` value. Whether a stop case needs the user stays the coordinator's judgement against the preset's table.
- `braid accept --merge --preset` is what auto mode uses once 0040/E switches the skills; until then the skills keep calling `--merge` alone, and that must keep working.

## Out of scope

- The skills (0040/E).
- A digest sent on a schedule; the skill decides when to send `braid decisions --since`.
- Enforcing `continue`: starting the next item is the coordinator's step, not a command's.

## Completion

- [ ] `braid accept --merge --preset` merges a strand under `strands` and `all`, a story or final PR only under `all`, nothing under `none`, and nothing when `ci` is `none`; each refusal names the preset (tests)
- [ ] `braid accept --merge` without `--preset` behaves as before (existing tests pass unchanged)
- [ ] `braid decisions <number>` lists the `Decided:` entries of a braid and its strands in order, and `--since` cuts the list (tests)
- [ ] A recap draft carries the item's `Decided:` entries under Decisions, and a final PR's draft those of the whole braid (tests)
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
