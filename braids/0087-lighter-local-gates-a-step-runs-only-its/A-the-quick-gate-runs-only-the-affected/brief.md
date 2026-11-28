---
id: '0087/A'
title: "The quick gate runs only the affected tests"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: []
order: 10
---

## Goal

`npm run verify` (the quick gate a worker runs before every strand PR) runs only the test files affected by the branch's changes, so a one-file strand's gate takes minutes instead of about 20. `npm run verify:full` keeps running everything.

Expected size: about 250 lines in 4 files (a picker script, its Pester suite, `scripts/Verify.ps1`, the test runner's arguments).

## Start here

- `scripts/Verify.ps1`: the gate, quick and `-Full`. Its test step runs `npm run test`, today `node --test --test-reporter spec test` (`package.json`).
- `test/*.test.ts`: how tests reach the code. Most import built modules from `../dist/<path>.js`, with `import … from "../dist/…"` or through a `load("../dist/…")` helper (top of test/board-start.test.ts); a few import `../src/…` or `../web/src/…`. Many also spawn `dist/cli.js`.
- `test/support/*.ts`, `test/fixtures/`: shared by many tests.
- `src/**/*.ts`: modules import each other with relative `./x.js` paths.
- On `braid/0077-the-board-stays-fast-under-load`: `scripts/Test-Node.ps1`, which becomes `npm run test` when 0077 merges.

## Change

- A picker (for example `scripts/Select-Tests.ps1`): from the files changed on the branch, the test files to run, read from import lines.
  - Changed files: committed since the merge-base with the item's base branch (the braid branch `braid/<number>-<slug>` for a strand branch `braid/<number>/<letter>-<slug>`, else `origin/main`), plus staged, unstaged and untracked files. When the base can't be found, run everything and say why.
  - A test is affected when it is itself changed, or when it imports a changed file directly or through the src modules it imports, transitively (`dist/<p>.js` maps to `src/<p>.ts`). Import lines include static `import`/`export … from` and the `load("../dist/…")` and dynamic `import("…")` string forms the tests use.
  - Shared parts run everything: `src/cli.ts`, `package.json`, `package-lock.json`, `tsconfig*.json`, `scripts/**`, `test/support/**`, `test/fixtures/**`, and any changed file the picker can't classify.
  - Docs-only changes (Markdown, `braids/`, `docs/`) run no tests and skip typecheck and build; the docs gate still runs.
  - It prints which tests it picked and why (or why it runs all), so a reviewer sees it in the gate log.
- `scripts/Verify.ps1`: the quick gate runs the picked tests; `-Full` runs every test as today. A switch (for example `-All`) runs every test in the quick gate on request.
- The test runner takes a file list (`node --test … <files>` instead of `test`), through whatever `npm run test` is when you start: if 0077 has merged into main, merge main first and extend `scripts/Test-Node.ps1` to take files, keeping its concurrency cap.
- A Pester suite under `test/pester/` for the picker on a small temp repo: one changed src module picks its direct and transitive importers and nothing else; a changed test picks itself; each shared part picks all; docs-only picks none; no base picks all.

## Already decided

- The mechanism is the user's choice ("I like 3"): import lines, not coverage data or a hand-kept test map. Tests that reach a module only by spawning `dist/cli.js` are not picked for it; CI's full run catches them (D104). If many tests depend only on the spawned CLI, say so in the report with numbers (how many tests a change to a typical command picks) and propose a cheap extra signal under "For later items" (for example a test named after a module, `start.test.ts` for `src/commands/start.ts`); don't build it unasked.
- CI, `npm run verify:full` and releases keep running everything; don't change `.github/`.
- The picker is PowerShell 7.6 and cross-platform (CI runs Windows and Ubuntu): forward-slash paths from git, no Windows-only assumptions.
- Related to 0077 and 0078 (see the braid brief): keep the edits to `package.json`'s `test` line and to `scripts/Verify.ps1` small, so the merges conflict only by line.

## Out of scope

- BRAID.md and the docs strand's work: 0087/D.
- Temp repo cleanup, git settings and fewer git calls: 0087/B and 0087/C.

## Completion

- [ ] On a branch that changed one src module, `npm run verify` runs only the test files that import it, directly or through src modules, and prints which and why
- [ ] A change to a shared part runs every test; a docs-only change runs no tests, no typecheck and no build; a base that can't be found runs every test
- [ ] `npm run verify:full` runs every test as before
- [ ] A Pester suite under `test/pester/` covers the picker's cases above
- [ ] report.md gives the quick gate's time for a one-file src change on this machine against the full gate, and how many test files a few typical one-file changes pick
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
