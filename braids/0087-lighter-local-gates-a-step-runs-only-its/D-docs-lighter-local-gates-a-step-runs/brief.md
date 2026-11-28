---
id: '0087/D'
title: "Docs: Lighter local gates: a step runs only its tests"
status: To Do
labels: ["kind:task", "tier:L"]
dependencies: ['0087/A', '0087/B', '0087/C']
order: 40
---

## Goal

The docs and BRAID.md describe the quick and full gates as they now are, and BRAID.md says which gate a worker runs when.

Expected size: about 60 lines in 4 to 6 files.

## Start here

- Everything this braid changed, from its first strand: `git diff main...braid/0087-lighter-local-gates-a-step-runs-only-its` and the strands' report.md files.
- `BRAID.md`: `gate`, `test` and the body.
- The docs listed under `docs` in BRAID.md, especially docs/development.md (setup and the gate) and docs/decisions.md.

## Change

- `BRAID.md`: which gate a worker runs when: a strand's PR `npm run verify` (affected tests), a braid's final PR and a release `npm run verify:full`; how to run every test locally on request. The user asked for this change (the goal), and the user merges it.
- The docs from BRAID.md `docs`, as a whole: docs/development.md (the quick gate, the picker, what counts as shared, the pinned git settings), the decisions record (why the local gate runs only affected tests while CI runs all, citing D104), roadmap status, and any README or help text these changes make untrue.
- In report.md, list each doc checked as updated or unchanged.

## Already decided

- This strand edits BRAID.md, which agents read: tier L, and it is handed over to the PM and the user for the merge, not merged under the preset.
- No change to `.agents/skills/`, AGENTS.md or CLAUDE.md.

## Out of scope

- Any change to the gate's behaviour.

## Completion

- [ ] BRAID.md says which gate a worker runs when
- [ ] The docs from BRAID.md `docs` describe the quick and full gates, the picker and the pinned git settings as they now are; report.md lists each doc checked as updated or unchanged
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
