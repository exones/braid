---
id: '0078/E'
title: "Tests that touch neither the repository nor the clock"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 50
---

## Goal

No test can write to the braid repository or fail because the UTC date changed while it ran. Leftovers 2026-11-24-es8z (the help-command test) and 2026-11-20-6ce8 (the midnight flake) (full text in the braid brief).

Expected size: about 150 lines in 3 to 6 files.

## Start here

- `test/cli.test.ts:45`: "every command named in the help is known to run": `load("../../dist/cli.js")` runs `main` on load, `run([name, "--nope"], root)` runs in the repository, and the `skip` set lists the commands `main` handles before `run`.
- `src/cli.ts`: `main`, `run` and how the module starts; what a test can import without the side effect.
- `test/done-merge.test.ts:21` and `:23`: the expected `log-<date>-abcdef01.md` built from `new Date()` after the command.
- `rg "new Date\(\)\.toISOString\(\)\.slice\(0, 10\)" test`: other tests with the same pattern.

## Change

- The help-command test runs in a temporary repository and imports `run` without running `main` (for example a separate entry module, or a guard on `import.meta`); it also covers the commands `main` handles before `run`, at CLI level (spawn the built CLI with `--nope` in the temp repository), so a command in the help that nothing dispatches fails the test.
- The log-name tests take the date once before the command, or match `log-*-abcdef01.md`; the same for every other test found with the pattern.

## Already decided

- Start after 0060 (Workers as T3 subagents) has merged into main and main was merged into the braid branch: 0060 changes test/cli.test.ts and test/done-merge.test.ts.

## Out of scope

- Other flaky tests (the request-record lock tests under load are P24's gate cap).

## Completion

- [ ] The help-command test runs in a temporary repository and doesn't run `main` on import, and covers the commands `main` dispatches (a test that a help entry nothing runs fails it)
- [ ] No test builds an expected date after the command it checks (a fake clock or a date taken before shows it)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
