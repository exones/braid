# braid decisions

Updated: 2026-11-03. User requirements take precedence over implementation proposals. Change this log with a dated reason; do not silently rewrite project direction.

## Confirmed requirements

| ID | Decision | Reason |
| --- | --- | --- |
| D01 | Build a small usable release, then use it to build its successor. | Adopt the intended work method during development; avoid waiting for the entire MVP. |
| D02 | Implement the CLI/core in modern TypeScript on Node.js. | User selected this stack for the CLI. |
| D03 | Use PowerShell as a first-class automation language. | User uses it heavily and wants substantive scripting supported. |
| D04 | Use GitHub for source/PRs and GitHub Actions for build. | User's chosen development platform. |
| D05 | Use Tailscale for private infrastructure binding. | Existing user practice. |
| D06 | Use npm as the package registry. Forgejo/Tailscale registry deployment is superseded and out of scope. | User confirmed the npm decision; account/scope/name and publishing setup remain release prerequisites. |
| D07 | Start with one implementation worker; introduce parallel workers only after supervised execution and routing work. A separate coordinator may supervise the seed. | Keep bootstrap understandable and recoverable; role split clarified by D11. |
| D08 | Preserve context in versioned backlog items, checkpoints, reports, and decisions. | A fresh session must continue without chat history. |
| D09 | Project, package, and repository name are `braid`. Epic files live under `epics/braid/`. The Git repository is `https://github.com/exones/braid`. | User selected `braid` on 2026-11-03 because unscoped npm `agento` belongs to another package. |
| D10 | CLI executable is `braid`, in full. | User selected the full name after considering short alternatives. |
| D11 | Sol High coordinates; Grok 4.7 Extra High implements, with one implementation worker at a time for the seed. | User's stated provider/model preference. Coordinator and worker have separate file ownership. |
| D12 | Use epics, optional features, stories, tasks, spikes, backlog refinement, acceptance criteria, Definition of Ready, and Definition of Done. Active files live under `epics/`. | User requested Agile terminology and work division. |
| D13 | Provide the reusable `braid-coordinate` skill before implementation, with natural-language goal entry, analysis, epic/backlog planning, and scoped delivery/resume. | User does not want to repeat long coordinator prompts. |
| D14 | Routine coordinator progress updates use concise `Done / You / Next`; substantive completion briefings follow D20. | Initial short-report preference retained for progress; user later requested more detail after items. |
| D15 | Passing local gates leads to scoped Conventional Commits and a PR, including spikes. Done requires applicable hosted CI, review, and human-approved merge. | User requested a real commit/PR/CI/review delivery loop instead of accumulating uncommitted work. |
| D16 | README describes supported project state and usage; active work/progress belongs only in epics/checkpoints/reports. | User treats README as the repository frontend. |
| D17 | Reusable handoff documentation contains mechanics and placeholder examples, not live assignments/progress or duplicate status tables. | User identified duplicate progress in `docs/agent-handoff.md`; keep one maintained source in the epic/checkpoints. |
| D18 | Local state lives under `.braid/`. Pre-existing `.agento/` and `.crew/` directories are left untouched. | Storage follows the tool name. `.braid/` supersedes `.agento/`, which superseded `.crew/`. No alias or silent migration. |
| D19 | Follow the authoritative [review conventions](agile-workflow.md#review-gates-and-indexing). | User wants item-bound review names and one maintained definition, discoverable through links from instructions, skills, templates, and README. |
| D20 | Written item reports and user completion briefings explain introduced capabilities, important changes, validation, limits, user involvement, and next action. | User wants release-note detail after items; the three-line/60-word convention applies only to routine progress updates. |

## Adopted working defaults

These defaults implement the agreed staged approach. Adjust through an explicit decision when evidence warrants it.

- One package, strict TypeScript, ESM, compiled JavaScript, npm lockfile. Select and pin a supported Node LTS during task A; document the PowerShell baseline too.
- CLI executable is `braid` and local state lives under `.braid/`; update the package `bin` entry, paths, examples, and checks consistently. See the [naming decision](cli-name.md). Package name/scope remains separate.
- PowerShell scripts own reusable build/verify/package automation. YAML wires jobs; npm scripts provide discoverable entry points. Avoid implementing the same orchestration twice.
- The coordinator skill lives in the shared project location `.agents/skills/braid-coordinate/`; Codex and Cursor can discover the same source. Automatic selection remains enabled; root `AGENTS.md` routes goal-level coordination to it. Assigned workers follow their item without invoking a coordinator loop.
- Follow `docs/agile-workflow.md`; use `braid story ...` for the seed's work ledger. Keep implementation tasks as checklists where separate ownership is unnecessary. Do not add sprint ceremonies or point estimates without a scheduling need.
- GitHub-hosted Windows and Linux jobs run deterministic checks. Live T3 exercises are separate and explicitly recorded.
- Build and verify an installable tarball before npm publication. Keep the local package `private: true` until the publishing identity and release configuration are deliberately set. See `docs/npm-distribution.md`.
- Source and builds remain on GitHub; npm hosts release packages. No Forgejo service, private registry, or tailnet access is needed for package distribution.
- Manual merges remain the initial policy. A prepared workflow does not itself authorize publication or deployment.
- Scoped commit/push/PR creation is part of authorized delivery after local checks, not a separate permission gate. Use [delivery rules](../.agents/skills/braid-coordinate/references/delivery.md) and [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Shared-checkout Git mutations and README cleanup occur only after the active worker returns.
- A released controller is fixed for the lifetime of a development run. New schemas need compatibility handling before promotion.

## Scope changes from the original MVP plan

The root MVP plan remains the long-term requirements reference. These changes supersede its implementation details:

1. Replace the PowerShell module/Pester product implementation with TypeScript/Node.js, while retaining PowerShell automation. Use TypeScript tests for product behavior; use Pester if PowerShell logic warrants it.
2. Bring templates, CI, packaging, and verification forward. Introduce dispatch, messaging, scheduling, and recovery in successive releases.
3. The seed has manual item tracking, not the full later stream state machine. It must distinguish manual completion from verified acceptance.
4. Existing T3 CLI observations from the prior conversation are hypotheses until checked against the current installation. Unknown T3 behavior must not block a seed that does not call T3.
5. Historical instructions in the inspiration material are examples, not current project permissions.
6. Move coordinator skill authoring to stage 0. Later coordination milestones implement deterministic product behavior and improve the skill based on evidence. Replace active `initiatives/.../initiative.md` with `epics/.../epic.md` and `briefs/` with typed items in `backlog/`; leave original plan/inspiration historical. Preserve existing item IDs.

## Setup facts still needed

| Fact | Needed by | Effect if unknown |
| --- | --- | --- |
| GitHub workflow execution | Remote CI evidence | `gh repo view` verified `exones/braid` is public and the current user has ADMIN access. No workflow has been pushed or run yet; no remote creation is needed. |
| Public/private package visibility and npm account/scope/name availability | First publication | A local development name can be chosen and recorded; defer publication. CLI remains `braid` regardless of package scope. |
| Package owner/service identity and credential delivery | Publishing | Prepare references to secrets; never request values in chat. |

No infrastructure credentials or host details have been supplied or verified as part of this documentation task.

## Distribution decision

The user confirmed using npm directly. Public packages can use npm's free tier; private npm packages require paid access. A public scoped package such as `@<account>/braid` can still install the `braid` executable. Do not infer that the unscoped package name is available. References: [npm products](https://www.npmjs.com/products), [public scoped packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/), [private packages](https://docs.npmjs.com/about-private-packages/).

Prepare GitHub Actions publishing through [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) where supported. Complete account/package bootstrap and first-publish setup before claiming the release pipeline works. Until then use the tested tarball; registry selection itself does not authorize a public upload. Raise account/scope/setup decisions when release work needs them and continue unrelated implementation.

## Decision log

- 2026-11-03, user: selected `braid` as the project, CLI, package, and storage name, and asked to publish it publicly and to put the history on `https://github.com/exones/braid`. The former name `agento` stays in historical records and remains the occupied npm package. `.agento/` and `.crew/` are not migrated.
- 2026-11-03, user: requested one maintained source for review naming instead of copies across files. Consolidated the rule in the [review conventions](agile-workflow.md#review-gates-and-indexing); instructions, skills, templates, README, and current handoff now link there. Historical review evidence remains unchanged.
- 2026-11-03, user: refined review-agent naming to follow the item being reviewed. Adopted in D19 and the review conventions; existing records/links/findings remain valid.
- 2026-11-03, user: requested item-bound review indexing and fuller reports after each item. Adopted D19/D20 in root guidance, coordinator skill/templates, workflow, report format, and handoff guide. Preserve historical IDs; let the active legacy R reviewer finish its existing output paths before filing it as the epic's first review pass. Continue D/CI work without restarting review or changing acceptance gates.
- 2026-11-03, user: clarified that `.crew/` also conflicts with the selected tool name. Selected `.agento/` for storage, superseding the earlier retention default. Added task N after the running C assignment and before packaging; preserve historical evidence and avoid editing C's files concurrently.
- 2026-11-03, user: TypeScript/Node.js CLI, GitHub Actions, incremental self-hosting, one-agent bootstrap.
- 2026-11-03, user: PowerShell is a fully supported automation language; Tailscale binds infrastructure; prefer self-hosted Forgejo reached from GitHub Actions.
- 2026-11-03, planning: create a documentation-only handoff and seed work queue before implementation. Next assignment is task A.
- 2026-11-03, user: renamed the project to `agento`. Updated current documents and epic paths; retained existing command/storage names as working defaults.
- 2026-11-03, naming follow-up: user prefers `ag` unless it is commonly used software. Confirmed conflict with The Silver Searcher; proposed `agto` or `agnto`, awaiting selection. This supersedes the retained `crew` command default, but does not yet choose its replacement.
- 2026-11-03, user: selected `agento` as the full CLI name. This resolves naming and supersedes the pending alternatives and former `crew` command default. State-directory naming and npm publication identity are separate.
- 2026-11-03, user: intends Grok 4.7 Extra High for implementation and Sol High for orchestration. Verified the Grok model through Cursor with `reasoning_effort: xhigh`; current Codex session reports `gpt-6.1-sol` with `reasoningEffort: high`. Added explicit role/read-first prompts and single-owner shared checkpoints. No agent task was launched.
- 2026-11-03, user: suggested npm distribution and asked how to begin. Recorded public npm as the proposed simple route, pending visibility/package identity; retained Forgejo as an optional private route. Added an explicit start-A prompt for Sol to delegate to Grok; the documentation change itself launches nothing.
- 2026-11-03, user: requested a reusable coordinator skill and Agile work organization. Created the project skill and epic/backlog templates; renamed active epic files/backlog paths; classified seed work into spikes, enabler/review tasks, and stories. Skill authoring is bootstrap work now, while live discovery/behavior remains to be exercised.
- 2026-11-03, user: initialized Git and requested concise coordinator turn reports, then a report before deciding the next action. Verified `main`, HEAD `dc6e3c47aefa974f48124edeae934e471aa99bbe`, and configured origin `https://github.com/exones/agento.git`. Added the three-line format to the coordinator skill. Planning/contract changes remain uncommitted; no B dispatch or remote write performed this turn.
- 2026-11-03, user: requested continuation and confirmed npm as the registry. Superseded the Forgejo/Tailscale distribution design, cancelled optional spike I, and assigned B for local foundation/CI preparation. Surface user-owned prerequisites promptly; no account setup is needed to begin B. Publication remains a later explicit release action.
- 2026-11-03, user: requested commits after passing gates, PR/CI/review delivery for spikes, semantic commit conventions with a source/gist, and README as project frontend only. Added these to the coordinator skill and Ready/Done workflow. User explicitly asked to keep waiting for C: no delegate polling/interruption, README edit, index/branch mutation, commit, push, or PR creation this turn. Observed user's new local commit `3283807` (`Spikes A, B implemented`); preserve it during transition rather than rewriting its message.
- 2026-11-03, user: identified the same progress duplication in the handoff guide. Replaced its actual A/B/C assignments/status table with generic instructions and placeholder examples; added the boundary to the skill. Inspected the existing Windows/Linux CI workflow: configuration exists locally, while no hosted result is recorded. Continue waiting for C without polling or editing its files.
- 2026-11-03, package proof: keep `private: true` and prove installation from the packed tarball outside the checkout. `.github/workflows/release.yml` is a manual `workflow_dispatch` whose `confirm` input must be `publish`. It still skips `npm publish` unless `BRAID_RELEASE` is `enabled`. No publish, tag, or GitHub Release is authorized by preparing that workflow. User actions are in `docs/npm-distribution.md`.
