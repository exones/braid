# Working on braid

## Read and resume

Read `README.md`, `docs/decisions.md`, the assigned epic, `checkpoints/current.md`, and the assigned backlog item before acting. Read the backlog item's dependency reports. Treat current files as the handoff; historical chat and `inspiration/` are supporting context.

Current epic: `epics/braid/001-seed/epic.md`.
Current checkpoint: `epics/braid/001-seed/checkpoints/current.md`.

For a goal-level planning or orchestration request, use [.agents/skills/braid-coordinate/SKILL.md](.agents/skills/braid-coordinate/SKILL.md). For execution or resumption of one assigned implementation item, use [.agents/skills/braid-worker/SKILL.md](.agents/skills/braid-worker/SKILL.md) and its [canonical assignment packet](.agents/skills/braid-worker/assets/assignment-packet.md); do not enter the coordinator workflow. Read the selected skill directly if discovery is unavailable. Independent reviewers follow their separately assigned review and the review conventions below. Routine coding questions need neither workflow. An assignment's named epic/checkpoint overrides the global pointers above.

Use the Agile vocabulary in `docs/agile-workflow.md`: epic, optional feature grouping, story, task, spike, backlog, acceptance criteria, Definition of Ready, and Definition of Done. Keep existing backlog IDs stable. The original MVP and inspiration retain historical terminology.

Before assigning a review, read and follow the authoritative [review conventions](docs/agile-workflow.md#review-gates-and-indexing). Item reports, user briefings, and pull-request accounts follow [report format](epics/report-format.md), including its trigger contract. Short progress updates stay short and do not replace an item briefing.

Do only the assigned role and scope. A coordinator asked to deliver an epic may advance its ready backlog items within that scope. Do not dispatch a dependent item whose required human merge is unverified; the [human merge stop](.agents/skills/braid-coordinate/references/delivery.md#human-merge-stop) applies. A worker stops after its assigned item and does not launch agents. Seed execution has one implementation worker at a time. A reviewer is assigned separately after the candidate exists. A planning-only request stops after the reviewable plan.

## Providers and roles

These instructions are shared project guidance, regardless of model/provider. Start every assignment by explicitly reading them and its named context files; other Markdown files are not assumed to load automatically. Provider/model/reasoning selection is set in T3, not by this file.

This section is the authoritative provider profile. User preference: Sol High for coordination; Grok 4.7 High with 500K context for implementation and for independent reviews (not Opus). The verified T3 implementation route is Cursor model `grok-4.7`, with `target.options` set to `{"reasoning_effort":"high","contextWindow":"500k"}`. The active Codex session reports model `gpt-6.1-sol` and `reasoningEffort: high`. Follow host rules for capability checks; do not substitute a different provider/model/settings without authorization. Historical assignments retain the settings actually used.

When a coordinator is assigned, it owns `epic.md` and `checkpoints/current.md`, assigns the selected backlog item, checks evidence, and records the next action. Workers own `checkpoints/<task>.md` and `reports/<task>.md` plus their assigned implementation files. Interpret backlog items' shared-status update instructions as reporting those updates to the coordinator in this mode. Do not have both roles edit the shared checkpoint. Coordinator findings go back to the worker as scoped fixes; the coordinator does not implement product changes in that role.

Separately assigned reviewers own their parent-scoped review report/checkpoint, with exact reviewed revision and findings; the coordinator owns the parent's gate status and triage. Keep a running review's assigned output paths until it returns, then reconcile legacy filenames without restarting the review.

In standalone mode, the assigned agent maintains the epic and current checkpoint itself as previously described. See `docs/agent-handoff.md` for exact role prompts and provider loading references.

## Decisions and implementation

- Project, CLI, and local state directory names are `braid`, `braid`, and `.braid/`. Use them consistently in commands, package `bin`, storage, and checks. See `docs/cli-name.md`. The superseded pre-release directory `.crew/` is not read, written, migrated, or deleted. Do not infer an npm scope from the project name.
- Product CLI and core: modern TypeScript on Node.js, strict checking, compiled JavaScript, one npm package initially.
- Automation and operational scripts: PowerShell 7 (`pwsh`), including substantive logic where useful. Do not replace it merely because it is a shell language.
- Source, PRs, build: GitHub and GitHub Actions.
- Package registry: npm, confirmed by the user. No Forgejo deployment is planned. Tailscale remains available for future private infrastructure. Registry selection does not authorize publishing; npm owner/scope/name and release setup are handled before release.
- Adopt the backlog item/checkpoint/report workflow immediately. Add automation incrementally through the roadmap.
- Choose routine implementation details and ordinary dependencies within the assigned scope; record material choices. Escalate scope expansion, paid services, missing credentials, or changes to acceptance standards.
- Surface user-owned blockers promptly with the exact nonsecret action needed and its impact; workers report them to the coordinator, which includes them in the `You` turn report. Continue independent in-scope work instead of waiting on unrelated release setup. Never request raw secret values in chat.
- Use `rg` for file/text discovery. Keep external command invocation explicit; propagate native exit codes in PowerShell. Avoid shell-interpolated command strings when structured argument lists suffice.

## State, gates, and release discipline

Keep machine state authoritative and human status derived or clearly descriptive. Agents do not hand-edit future `.braid/run.json` files. State and event records must have documented revision and failure behavior; do not claim crash guarantees that have not been tested.

The first release records manual progress. A human/agent marking an item complete is not independent gate evidence. Later gate evidence must identify the exact revision checked.

Run the meaningful checks required by the backlog item. Report commands and results honestly, including checks that could not run. Never weaken a gate or delete a failing test simply to pass. Fixes to an incorrect test or gate require a documented reason and preserved acceptance intent.

Develop future versions under a pinned, released controller installed outside the candidate checkout. Record controller version and schema version; do not upgrade active runs silently.

## Shared and external actions

Respect user changes. Inspect git status before editing. Work only in the assigned checkout and branch. A scoped delivery request authorizes scoped Conventional Commits, pushes to an owned feature branch, and PR creation after relevant local gates pass; follow `.agents/skills/braid-coordinate/references/delivery.md`. Human merge authority remains unchanged. Green CI and independent review are not a merge. When later work requires one, stop at the [human merge stop](.agents/skills/braid-coordinate/references/delivery.md#human-merge-stop). Do not create a remote repository, merge, publish a release/package, deploy infrastructure, or change tailnet policy unless the task authorizes that action.

Spikes also deliver through PR, applicable CI, and review. Local acceptance is distinct from Done after CI/review/approved merge. Preserve existing user commits/index, and do not stage/commit/switch a shared checkout while a worker is running. Workers follow their assigned Git boundaries; the coordinator handles a Git transition only at a safe handoff boundary.

README is the repository frontend for supported capabilities, setup, usage, architecture, and limits. Keep current backlog/progress and handoff details in the epic/checkpoints/reports. A stable link to contributor documentation is fine; do not use README as a coordinator dashboard.

Do not put secrets in chat, git, reports, fixtures, or logs. Reference secret names and use the environment's secret mechanism when needed. Do not copy permissions or infrastructure identities from `inspiration/`.

## Checkpoint and finish

At a useful boundary, before switching context, and before ending a task:

1. Update the owned checkpoint (`checkpoints/<task>.md` for a coordinated worker, `checkpoints/current.md` for the coordinator or standalone agent): task, checkout/branch/HEAD when available, completed work, in-flight commands, next concrete action, blockers, checks, and changed files.
2. Coordinator/standalone agent: update the assigned row in `epic.md` with status and evidence/report links. Coordinated workers return proposed status updates in their report.
3. Write `reports/<task>.md` using [report format](epics/report-format.md). Review passes use the parent-scoped report convention. Distinguish local proof from remote CI/release proof.
4. At an item outcome, a user-attention blocker, a substantive child return, or a milestone, give the user that same account. Keep routine progress concise. If blocked, name the exact input that unblocks the work and continue independent in-scope work.

The checkpoint should let a fresh agent resume without the conversation.
