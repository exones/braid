No test in `test/cli.test.ts` can write to the braid repository, and the log-name test no longer depends on the UTC date (leftovers 2026-11-24-es8z and 2026-11-20-6ce8).

**Changed**

- `src/cli.ts`: `main` runs only under `if (import.meta.main)`, so a test can import `run`, `helpText` and `boardHelp` without running a command. Before, importing `dist/cli.js` ran `main` with the test process's arguments.
- `test/cli.test.ts`: every braid spawn and `run` call works in a temporary Git repository with a temporary home (`HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, `XDG_*`). The help test has no skip list now: it asks `run` first and spawns the built CLI with `--nope` for each name `run` calls unknown, so a help entry nothing dispatches fails it. Two new tests: a made-up entry is reported, and importing the CLI prints nothing and exits 0.
- `test/done-merge.test.ts`: the log file's name is read from the pushed diff and matched as `log-<any date>-abcdef01.md`; no clock in the test. No other test had the pattern (`rg` for `toISOString().slice(0, 10)` and `new Date()` under `test/`).

**Validation**

- `test/cli.test.ts`, `test/done-merge.test.ts` and `test/request-gaps.test.ts` (which imports `boardHelp`): pass.
- `BRAID_NOW=2001-01-01T23:59:59Z node --test test/done-merge.test.ts` (the command dates the log in the past): 12 pass.
- Gate (`npm run verify`, through `braid gate`, Windows): exit 0; 869 tests, 868 pass, 1 skipped (SIGTERM, not on Windows), 0 fail.

Docs: none affected; no command, output or documented behavior changed.

Decisions: a guard on `import.meta.main` rather than a separate entry module, so `bin` and the paths that run `dist/cli.js` stay as they are.
For later items: none
Needs the user: none
