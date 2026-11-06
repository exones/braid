# A: Support standalone tasks in the worker skill

- Kind: story.
- Tier: L.
- UI: no.
- Expected size: about 100–200 changed lines in 4–6 files, plus concise validation evidence. Prefer the smallest coherent extension; justify extra files or broader restructuring.
- Branch: `item/007-a-standalone-worker` from the current approved epic tip. The launch message supplies its exact SHA; no worker is launched during planning.
- PR into: `epic/007-standalone-worker`.
- Result to: thread `6cf8e720-9c32-4a93-a504-8cf80b49a4c0`.
- User-authorized model overrides for this item (supersede repository defaults): coordinator `codex / gpt-6-astra / reasoningEffort=medium`; worker `codex / gpt-6-astra / reasoningEffort=medium`; reviewer `codex / gpt-6.1-sol / reasoningEffort=medium`. Verify availability before launch; do not substitute.

## Goal

Allow a user to invoke braid-worker with a bounded task and get a verified PR directly, without a coordinator or epic. Keep assigned-item behavior intact and make the choice among direct chat, standalone execution and coordinated work understandable.

## Start here

- `BRAID.md` and `AGENTS.md`: setup, gate, CI and ownership/merge rules. Use the explicit model overrides at the top of this brief instead of the repository model defaults for this item.
- `.agents/skills/braid-worker/SKILL.md`: all current assumptions about a brief, coordinator, epic branch, artifacts, checkpoints and final reporting.
- `.agents/skills/braid-coordinate/references/workflow.md`: existing assigned-item tiers, review and merge behavior to preserve.
- `.agents/skills/braid-coordinate/assets/review.md` and `assets/braid-md.md`: review recipient assumptions and reusable project facts.
- `README.md`, especially "Braid skills in other projects": installation and current coordinator-only onboarding.
- `scripts/Install-Skills.ps1` and `test/pester/Install-Skills.Tests.ps1`: whole-folder copying and isolated installation tests; no changes are expected.
- `scripts/Verify.ps1` and `scripts/markdown-link-exclusions.json`: documentation validation and self-contained skill links.

## Change

- `.agents/skills/braid-worker/SKILL.md`: minimally extend discovery and entry selection. Add standalone chat planning/confirmation and worker-owned subagent review; reuse existing implementation, CI and fix steps. Adjust only the mode-dependent startup, escalation, PR base, artifacts, checkpoints and report details; avoid a full rewrite or duplicated workflow.
- `AGENTS.md`: route bounded standalone tasks to the worker, retain direct chat for questions/small interactive edits and coordinator for multi-item goals. `CLAUDE.md` already includes this file; change it only if necessary.
- `README.md`: explain all three entry choices with copyable standalone and assigned-item examples, project prerequisites and direct review usage. Keep work status in the epic.
- `.agents/skills/braid-coordinate/references/workflow.md` and relevant templates: clarify the boundary with standalone work without forcing standalone tasks into epic tables. Change only templates whose instructions would otherwise contradict the new path.
- Add worker-local references only if essential to keep the minimal extension readable; keep every skill self-contained with no relative links outside its folder. Prefer a short subagent review instruction in the existing skill over new templates.
- `epics/braid/007-standalone-worker/reports/A-validation.md`: concise scenario evidence, results and limits. Add executable regression tests only for actual executable behavior changed.

## Already decided

- The user explicitly authorized necessary instruction changes, including skills, AGENTS.md, CLAUDE.md and BRAID.md. This permission does not require changes to all of them. Leave repository model defaults unchanged.
- This implementation uses Astra medium; its independent review uses Sol medium, both through Codex in separate top-level T3 worktree threads. No implementation starts until plan approval.
- Standalone requests start the brief: inspect enough to propose scope, approach and validation directly in chat, then wait for the user's confirmation before implementing. The confirmed chat plan is the brief. Do not mandate an epic, item ID, coordinator thread or task document. Assigned items retain their existing approved-brief behavior.
- Preserve the usual owned worktree, item branch and PR. Standalone branches may use `item/<task-slug>` without an epic number. Reuse an existing suitable owned checkout; never switch or write in someone else's checkout. Host-bound worktrees must use the host's workspace mechanism when applicable. Missing ownership evidence is a blocker to resolve with the user.
- Standalone PRs target `main` from project facts, not a hard-coded branch name. Assigned items still target their specified epic branch. Neither path merges.
- Standalone material scope changes and blockers go to the user; assigned-item ones go to the coordinator. Routine decisions remain autonomous.
- Standalone artifacts and interrupted-work context must not require an epic/ID. Prefer conversation/PR context and an external task-specific artifact location; preserve enough information to resume without silently restarting work.
- Keep setup, focused tests, gate, host PR linking/wait rules, required latest-head CI and `ci: none` semantics. Missing required checks are not success.
- The standalone worker is the sole owner of implementation, CI monitoring and all fixes. When independent review is required/requested, the worker runs it as a subagent using the configured reviewer model and appropriate host delegation mechanism, supplies the PR/head, confirmed plan and project rules, and fixes findings itself on the same branch/PR. The review subagent reports findings only: no implementation, CI ownership or merges. Review does not require a coordinator or a top-level review thread. Preserve the existing coordinator-led review arrangement for assigned items, including this epic's implementation.

## Out of scope

- New CLI commands, scheduler, persisted task state, second worker skill, automatic escalation into an epic, mandatory review agent for every standalone edit, or changes to installed skill copies.
- Release, deployment, repository settings, merges into main, or unrelated cleanup.

## Done when

- A minimal extension of one worker skill selects both entry paths unambiguously. Standalone implementation waits for confirmation of its chat plan, preserves worktree/item branch/PR, and needs no epic files or coordinator tools. The worker owns implementation, CI and all fixes, while a review subagent provides findings.
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
2. Standalone bounded request: proposes a plan in chat and waits for confirmation (no implementation while pending); then owned worktree/item branch, project-specific main name, setup/gate, worker-owned CI and user report; no epic, ID or coordinator dependency.
3. Dirty/unowned checkout or ambiguous assigned versus standalone context: no unsafe writes or branch switching; resolve the material gap with the correct recipient.
4. Material scope growth or blocker: standalone asks the user, assigned item asks the coordinator; no automatic epic creation.
5. CI failure, pending or absent required check, and `ci: none`: correct fix/wait/completion behavior; no premature success.
6. Worker runs review as a subagent when required/requested, retains sole implementation/CI/fix ownership, and fixes findings on the same PR; reviewer does not edit or monitor CI. Interruption and repeated prompt after merge cause no duplicate implementation/PR or automatic merge. No coordinator is required.
7. Reusable installed skill: all required guidance fits within the copied skill folder; no repository-specific branch, model or path dependency.

State clearly which results are instruction walkthroughs versus executed tests. If executable behavior changes become necessary, add focused regressions following existing conventions, including Pester 5 for new PowerShell tests.
