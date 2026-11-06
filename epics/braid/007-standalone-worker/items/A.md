# A: Support standalone tasks in the worker skill

- Kind: story.
- Tier: L.
- UI: no.
- Expected size: about 200–350 changed lines in 5–8 files.
- Branch: `item/007-a-standalone-worker` from the current approved epic tip. The launch message supplies its exact SHA; no worker is launched during planning.
- PR into: `epic/007-standalone-worker`.
- Result to: thread `6cf8e720-9c32-4a93-a504-8cf80b49a4c0`.

## Goal

Allow a user to invoke braid-worker with a bounded task and get a verified PR directly, without a coordinator or epic. Keep assigned-item behavior intact and make the choice among direct chat, standalone execution and coordinated work understandable.

## Start here

- `BRAID.md` and `AGENTS.md`: setup, gate, CI and ownership/merge rules. Use the epic's explicit model overrides instead of the repository model defaults for this item.
- `.agents/skills/braid-worker/SKILL.md`: all current assumptions about a brief, coordinator, epic branch, artifacts, checkpoints and final reporting.
- `.agents/skills/braid-coordinate/references/workflow.md`: existing assigned-item tiers, review and merge behavior to preserve.
- `.agents/skills/braid-coordinate/assets/review.md` and `assets/braid-md.md`: review recipient assumptions and reusable project facts.
- `README.md`, especially "Braid skills in other projects": installation and current coordinator-only onboarding.
- `scripts/Install-Skills.ps1` and `test/pester/Install-Skills.Tests.ps1`: whole-folder copying and isolated installation tests; no changes are expected.
- `scripts/Verify.ps1` and `scripts/markdown-link-exclusions.json`: documentation validation and self-contained skill links.

## Change

- `.agents/skills/braid-worker/SKILL.md`: broaden discovery description and define entry selection, then share implementation/verification steps where practical. Adapt startup, scope escalation, PR base, CI failure recipient, artifacts, checkpoints, final report, review fixes and repeated prompts to both paths.
- `AGENTS.md`: route bounded standalone tasks to the worker, retain direct chat for questions/small interactive edits and coordinator for multi-item goals. `CLAUDE.md` already includes this file; change it only if necessary.
- `README.md`: explain all three entry choices with copyable standalone and assigned-item examples, project prerequisites and direct review usage. Keep work status in the epic.
- `.agents/skills/braid-coordinate/references/workflow.md` and relevant templates: clarify the boundary with standalone work without forcing standalone tasks into epic tables. Change only templates whose instructions would otherwise contradict the new path.
- Worker-local references, if useful: keep every skill self-contained; no relative links outside its skill folder. A direct-review example may live in worker documentation without creating another skill.
- `epics/braid/007-standalone-worker/reports/A-validation.md`: concise scenario evidence, results and limits. Add executable regression tests only for actual executable behavior changed.

## Already decided

- The user explicitly authorized necessary instruction changes, including skills, AGENTS.md, CLAUDE.md and BRAID.md. This permission does not require changes to all of them. Leave repository model defaults unchanged.
- This implementation uses Astra medium; its independent review uses Sol medium, both through Codex in separate top-level T3 worktree threads. No implementation starts until plan approval.
- Standalone requests act as the brief. Establish outcome and acceptance in conversation; ask only for material gaps. Do not mandate an epic, item ID, coordinator thread or task document.
- Require an owned task branch/worktree before edits. Reuse an existing suitable owned checkout; never switch or write in someone else's checkout. Host-bound worktrees must use the host's workspace mechanism when applicable. Missing ownership evidence is a blocker to resolve with the user.
- Standalone PRs target `main` from project facts, not a hard-coded branch name. Assigned items still target their specified epic branch. Neither path merges.
- Standalone material scope changes and blockers go to the user; assigned-item ones go to the coordinator. Routine decisions remain autonomous.
- Standalone artifacts and interrupted-work context must not require an epic/ID. Prefer conversation/PR context and an external task-specific artifact location; preserve enough information to resume without silently restarting work.
- Keep setup, focused tests, gate, host PR linking/wait rules, required latest-head CI and `ci: none` semantics. Missing required checks are not success.
- Independent review can be requested directly with the PR, scope, acceptance and project rules. Findings return to the user/worker on the same PR without inventing a coordinator. Respect project requirements and agent-launch authorization.

## Out of scope

- New CLI commands, scheduler, persisted task state, second worker skill, automatic escalation into an epic, mandatory review agent for every standalone edit, or changes to installed skill copies.
- Release, deployment, repository settings, merges into main, or unrelated cleanup.

## Done when

- One discoverable worker skill selects both entry paths unambiguously, with correct ownership, escalation, PR base and final recipient. Standalone completion needs no epic files or coordinator tools.
- Assigned-item behavior remains intact, including setup, scope boundaries, spike delivery, review fixes, resumption and user merge restrictions. Guidance is portable to projects with other main branch names and `ci: none`.
- Routing/docs explain direct chat, standalone worker and coordinator-led work; standalone review and interruption/resumption have usable instructions. Skill links remain self-contained.
- Validation covers the failure modes below; independent review has no unresolved blocking findings. The `gate` command from BRAID.md passes and required PR checks are green on the latest head.

## Check with

After documented Node.js setup, run from the owned worktree:

```powershell
npm @('ci')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm @('run', 'verify')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

Document scenario walkthroughs against the actual edited instructions, with expected route, actions, recipient and evidence. Required regression scenarios:

1. Assigned brief: matching branch/SHA, epic PR base, scope escalation, spike/checkpoint behavior and report to coordinator remain valid.
2. Standalone bounded request: owned branch, project-specific main name, setup/gate, CI, user report; no epic, ID or coordinator dependency.
3. Dirty/unowned checkout or ambiguous assigned versus standalone context: no unsafe writes or branch switching; resolve the material gap with the correct recipient.
4. Material scope growth or blocker: standalone asks the user, assigned item asks the coordinator; no automatic epic creation.
5. CI failure, pending or absent required check, and `ci: none`: correct fix/wait/completion behavior; no premature success.
6. Review requested directly, findings fixed on the same PR, interruption and repeated prompt after merge: no coordinator required, no duplicate implementation or PR, no automatic merge.
7. Reusable installed skill: all required guidance fits within the copied skill folder; no repository-specific branch, model or path dependency.

State clearly which results are instruction walkthroughs versus executed tests. If executable behavior changes become necessary, add focused regressions following existing conventions, including Pester 5 for new PowerShell tests.
