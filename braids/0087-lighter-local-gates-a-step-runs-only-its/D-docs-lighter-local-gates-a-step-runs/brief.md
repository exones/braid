---
id: '0087/D'
title: "Docs: Lighter local gates: a step runs only its tests"
status: To Do
labels: ["kind:task", "tier:L"]
dependencies: ['0087/A', '0087/B', '0087/C']
order: 40
---

## Goal

The docs and BRAID.md describe the quick and full gates as they now are, BRAID.md says which gate a worker runs when, and the braid-worker and braid skills say how to wait for a long command.

Expected size: about 80 lines in 6 to 8 files.

## Start here

- Everything this braid changed, from its first strand: `git diff main...braid/0087-lighter-local-gates-a-step-runs-only-its` and the strands' report.md files.
- `BRAID.md`: `gate`, `test` and the body.
- The docs listed under `docs` in BRAID.md, especially docs/development.md (setup and the gate) and docs/decisions.md.

## Change

- `BRAID.md`: which gate a worker runs when: a strand's PR `npm run verify` (affected tests), a braid's final PR and a release `npm run verify:full`; how to run every test locally on request. The user asked for this change (the goal), and the user merges it.
- The docs from BRAID.md `docs`, as a whole: docs/development.md (the quick gate, the picker, what counts as shared, the pinned git settings), the decisions record (why the local gate runs only affected tests while CI runs all, citing D104), roadmap status, and any README or help text these changes make untrue.
- `.agents/skills/braid-worker/` and `.agents/skills/braid/` (the coordinator), one rule on waiting for long commands (the gate, a test run, a build); each turn makes T3 take a git snapshot, so tiny turns cost:
  - Wait once: in the foreground, or with one wait on the command's finish, with a time limit of about twice the command's usual time (for the quick gate, from 0087/A's measured time).
  - Never watch progress in repeated short turns: no progress monitors, no polling.
  - When the limit passes: look once at what is running, stop it, and report "gate hung at …" to the coordinator (the coordinator: to the user or the PM). No retry loop.
  - A hold message may arrive only once the wait ends; that is accepted.
  Put it where each skill already talks about running the gate or waiting, in the skills' own style, without repeating it elsewhere.
- In report.md, list each doc checked as updated or unchanged.

## Already decided

- This strand edits BRAID.md and two skills, which agents read: tier L, and it is handed over to the PM and the user for the merge, not merged under the preset (AGENTS.md).
- The user decided the waiting rule (2026-11-28, through the PM: "I agree with your propositions"); its four points above are settled, only the wording and placement are the worker's.
- No change to other skills, AGENTS.md or CLAUDE.md.

## Out of scope

- Any change to the gate's behaviour.

## Completion

- [ ] BRAID.md says which gate a worker runs when
- [ ] The braid-worker and braid skills each carry the waiting rule: wait once with a limit of about twice the usual time, no progress polling, on timeout look once, stop and report "gate hung at …", a hold may arrive only after the wait
- [ ] The docs from BRAID.md `docs` describe the quick and full gates, the picker and the pinned git settings as they now are; report.md lists each doc checked as updated or unchanged
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
