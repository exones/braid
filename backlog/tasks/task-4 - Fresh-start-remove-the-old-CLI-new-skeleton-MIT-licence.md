---
id: TASK-4
title: 'Fresh start: remove the old CLI, new skeleton, MIT licence'
status: In Progress
assignee: []
created_date: '2026-11-13T18:28:00Z'
updated_date: '2026-11-13T18:35:00Z'
labels:
  - kind:story
  - tier:M
dependencies: []
ordinal: 40
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: story 1 of the new braid (plan: `backlog/docs/doc-5 - New-braid-implementation-plan-draft.md` on branch `plan/new-braid`; decisions in TASK-2's report doc-4). The old CLI is dismissed; this story clears it and leaves a minimal, working skeleton for story 2 to build on.

Expected size: mostly deletions; about 150 to 300 new lines in 6 to 10 files.

Start here (read in this order):
- `src/`, `test/` and `package.json`: the old CLI, its ledger and its tests.
- `scripts/Verify.ps1`, `.github/workflows/`: the gate and CI that stay.
- `docs/`: `seed-contract.md`, `cli-name.md`, `roadmap.md` (stages and bootstrap rules), `npm-distribution.md`.

Change:
- Remove the old CLI: `src/` (ledger, state, events, status, the rest), `test/cli.test.ts`, `test/ledger*.test.ts`, `test/helpers.ts`, and the docs only it needs (`docs/seed-contract.md`, `docs/cli-name.md`, the roadmap's stages and bootstrap rules). Fix links to anything removed.
- New skeleton: `src/cli.ts` with a small command router; `braid --version` and `braid help`; a test that runs the built CLI.
- `README.md` cut to what exists now.
- MIT: a `LICENSE` file (copyright exones) and `"license": "MIT"` in `package.json`.

Already decided (don't re-investigate):
- Node.js 26, strict TypeScript, ESM, compiled to `dist/`; the package stays `@exones/braid` with bin `braid`.
- Keep the tooling: the gate, CI on Windows and Ubuntu, the npm release setup, `scripts/Install-Skills.ps1`, the Pester suites and the docs gate.
- Licence MIT (TASK-2, doc-4). No MCP server, no JSON output.

Out of scope:
- The `braids/` format and any task commands (story 2).
- Changes to `.agents/skills/`, `AGENTS.md`, `CLAUDE.md` or `BRAID.md`; publishing or a release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The old CLI, its tests and its docs are gone; no links point to them
- [ ] #2 braid --version and braid help work from a clean build, covered by a test
- [ ] #3 LICENSE (MIT) exists and package.json has "license": "MIT"
- [ ] #4 npm run verify passes and CI is green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Delete old CLI (src/*, test/cli+ledger+helpers) and docs seed-contract, cli-name; trim roadmap.
2. New src/cli.ts router (--version, help), test/cli.test.ts running dist/cli.js.
3. Simplify scripts/Test-Package.ps1 to version/help proof.
4. Cut README, add LICENSE MIT, package.json license.
5. Fix links, run npm run verify:full, PR.
<!-- SECTION:PLAN:END -->
