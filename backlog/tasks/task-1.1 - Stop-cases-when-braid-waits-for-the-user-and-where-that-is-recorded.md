---
id: TASK-1.1
title: 'Stop cases: when braid waits for the user, and where that is recorded'
status: To Do
assignee: []
created_date: '2026-11-12T17:28:00Z'
labels:
  - kind:task
  - tier:L
dependencies: []
parent_task_id: TASK-1
ordinal: 10
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: one shared list of the cases where `braid` must wait for the user, and a fixed place where each role records them, so the coordinator, worker and reviewer flag the same things in the same words. In normal mode the cases only appear in recaps; auto mode (TASK-1.3) refuses to merge on them.

Expected size: about 120 lines in 6 files.

Start here (read in this order):
- `.agents/skills/braid/SKILL.md`: Plan step 3 and "Talking to the user" (the recap).
- `.agents/skills/braid-worker/SKILL.md`: Deliver step 0 and "Final report".
- `.agents/skills/braid/assets/task.md`: Fields and labels.
- `scripts/Test-DocsGate.ps1`: skill folders must be self-contained; a link can't reach into another skill.

Change:
- New `.agents/skills/braid/references/stop-cases.md`: the 8 cases, each with its key, one line of meaning and examples:
  - `security`: authentication or authorization, permissions, secrets, cryptography, sandboxes or tool restrictions, handling of untrusted input, network exposure, logging of personal data.
  - `dependency`: a new library or tool, a major version bump, a new external service or paid API, a licence change.
  - `architecture`: a new module, service, process or storage; a changed public API, CLI, config or file format; a refactor across many files.
  - `data`: a migration, a changed stored format, deleting or rewriting user data, a backward-incompatible change.
  - `process`: skills, `AGENTS.md`, `CLAUDE.md`, `BRAID.md`, CI workflows or the gate; deleted, skipped or weakened tests.
  - `outward`: publishing, releasing, deploying, sending messages, anything irreversible outside the repository.
  - `scope`: a change to the goal or acceptance criteria, growth beyond the mandate, new tier L work, a deviation from the task.
  - `quality`: still blocking after 2 fix rounds, worker and reviewer disagree, the same check fails twice, a merge conflict outside task files, a worker that fails twice.
  The same file says who records what: the plan (`ask:<key>` labels the coordinator adds where the plan already shows a case); the worker (a `Needs the user:` line in its final summary); the reviewer (a section in its PR comment, TASK-1.2); and the coordinator's diff facts as runnable commands (`git diff --name-status <base>...<head>` and the added lines): changed dependency manifests or lockfiles (the common ones by name), changed `.github/workflows/`, `BRAID.md`, `AGENTS.md`, `CLAUDE.md` or `.agents/skills/`, deleted test files or added skip/only markers in tests, a diff over twice the task's expected size.
- An identical copy in `.agents/skills/braid-worker/references/stop-cases.md`.
- `braid` SKILL.md: planning adds `ask:<key>` labels and the plan shown to the user lists them; the recap gets a `**Needs the user:**` line (`none`, or each case with its source: plan, worker, reviewer or facts); the user's answer goes into the parent's notes.
- `braid-worker` SKILL.md: the final summary and the chat report carry `Needs the user: none` or `<key>: <one sentence>` per case, judged against the list.
- `.agents/skills/braid/assets/task.md`: the `ask:<key>` label.
- A check in the gate (Pester or the docs gate) that fails when the copies of `stop-cases.md` differ.

Already decided (don't re-investigate):
- No project-specific path masks; the diff facts are generic and need only `git` and `gh`.
- No helper script: the facts are commands in the reference file, usable from bash and pwsh.
- Normal mode changes only by the recap line.

Out of scope:
- Auto mode and merging (TASK-1.3).
- The reviewer skill and its copy of the list (TASK-1.2).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 stop-cases.md exists in braid and braid-worker with the 8 keys, and the gate fails if the copies differ
- [ ] #2 The worker final summary and chat report formats include the Needs the user line
- [ ] #3 Planning documents ask:<key> labels and the recap shows Needs the user with its source
- [ ] #4 The diff facts are listed as runnable git/gh commands
- [ ] #5 npm run verify passes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
