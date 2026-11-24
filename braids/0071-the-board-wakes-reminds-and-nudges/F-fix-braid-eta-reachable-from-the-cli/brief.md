---
id: '0071/F'
title: "Fix: braid eta reachable from the CLI"
status: In Progress
labels: ["kind:task", "tier:S"]
dependencies: []
order: 60
---

## Goal

`braid eta` (0071/B) is in the help text and in `dispatch` in `src/cli.ts`, but not in `BRAID_COMMANDS`, so `braid eta q-… 2h "why"` prints "error: unknown command: eta". The coordinator's try on the built CLI found it; the tests call `etaCommand` directly, so nothing caught it. Make the command reachable, and test it through the CLI.

Expected size: about 20 lines in 2 files.

## Start here

- `src/cli.ts`: `BRAID_COMMANDS`, `dispatch`, `run`.
- `test/cli.test.ts` and a test that runs `dist/cli.js` (for example `test/limits.test.ts`): how commands are tested through the CLI.

## Change

- Add `eta` to `BRAID_COMMANDS`.
- A test that runs the CLI (`run([...])` or `dist/cli.js`) with `eta` on an open request and sees it set, so a command in the help but missing from the dispatch list fails a test. If it is cheap, one test that every command named in `helpText` is accepted by `run`.

## Already decided

- Everything in the braid's "Already decided".

## Out of scope

- Anything else in `src/cli.ts`.

## Completion

- [x] `braid eta <code> 2h "<why>"` works through the CLI; a test runs it through the CLI
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
