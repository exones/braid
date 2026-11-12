# Staged bootstrap roadmap

These stages are capability boundaries for later releases. Live status is in the Backlog.md tasks under `backlog/`; see the [workflow](../.agents/skills/braid/references/workflow.md).

| Stage | Candidate | Delivered capability | Built using | Promotion proof |
| --- | --- | --- | --- | --- |
| 0 | Workflow bootstrap | Coordinator skill, analysis/refinement workflow, Agile epic/backlog templates, readiness/completion criteria, current checkpoint | Sol coordinator and project files | Structural validation plus fresh short-goal planning via AGENTS routing in Codex/T3 recorded in the seed skill-proof report. Invisible UI selection, every host, and all workflow branches remain unproven. |
| 1 | 0.1 seed | Manual epic/story ledger, CLI, state/events, PowerShell verification, Actions, packaged installation | Bootstrap coordinator skill and one implementation worker | Packed CLI works in a clean directory, local verification passes, Windows/Linux CI evidence recorded when remote exists. |
| 2 | 0.2 supervised | Current T3 contract, doctor, explicitly requested single-worker dispatch, independent gate reports | Pinned 0.1 for tracking; operator launches agents | One real task completed; failed gate prevents acceptance; changed head invalidates old proof. |
| 3 | 0.3 messaging | Typed routing, durable delivery, inbox/outbox, human questions, manual tick | Pinned 0.2, one worker | Real question/answer and fallback delivery; duplicate retries harmless; bounded conversation tests. |
| 4 | 0.4 coordination | Coordinator, DAG readiness, max parallelism, coarse resource exclusion, review | Pinned 0.3, coordinator and one worker | Demo shows two independent streams, dependent stream, failed gate, human question. |
| 5 | 0.5 recovery | Scheduled tick, bounded retry/nudge, pause/resume, thread replacement, export | Pinned 0.4, at most two workers | Interruption/restart exercises preserve work and prevent duplicate actions; fresh context resumes. |
| 6 | Pilot | Real project proof, compatibility fixes, operating guide, revised defaults | Pinned 0.5 | Evidence-backed final report and retro; limitations explicitly handed over. |

Since [D30](decisions.md), the `braid` skill keeps items in Backlog.md while the CLI's ledger stays as it is; stages 1–6 are revisited after the user's trial of `braid`.

The coordinator skill is delivered in stage 0, before the CLI. Stage 4 adds deterministic coordination in the product; it is not the first time a coordinator is used. Later milestones refine the bootstrap skill using delivery evidence. Work division follows the [workflow](../.agents/skills/braid/references/workflow.md); a review is part of its item, not a new item.

## Bootstrap rules

Each run records its released controller version, candidate commit, schema version, and acceptance policy. The controller installation lives outside the candidate checkout. The candidate operates on disposable test runs until promoted. Do not change the running controller's files through development builds or `npm link`.

Promotion means deterministic checks passed, the actual packed artifact was exercised, relevant live proof exists, and evidence is recorded. Publishing and merge authority remain explicit. If a gate cannot run, the stage is partially proven rather than complete.

Before stage 2 work begins, install accepted 0.1 in a separate location and create the stage 2 work ledger with it. Update Markdown checkpoints alongside it. The machine ledger owns execution status; narrative files reference that status rather than becoming a competing database.

Stage 2 doctor should compare the actual checkout, attached branch, initial revision, origin and PR base with the assignment packet. Its independent gate reports should also check the candidate diff against the packet's allowed paths. These checks turn the manual startup and scope checks into recorded evidence. Until stage 2 gate reports exist, `gh pr checks` on the PR's latest commit is the CI evidence.

Stage 4 DAG readiness must verify each required human dependency merge into the declared integration branch before dispatch. Green CI, a review, or a narrative Done label alone cannot satisfy that dependency. This is future automation of the existing human merge stop, not new merge authority.

## Four gates

1. Ready to start: backlog item, scope, dependencies, ownership, and expected proof exist.
2. Ready to merge: checks pass on current code; requested evidence and review triage exist.
3. Ready to release: packed installation and state compatibility are exercised.
4. Ready for greater autonomy: the new automation's success and failure paths are demonstrated.

Milestone review uses a fresh context. Start cross-provider review when configured and available; do not make an unavailable provider a hidden prerequisite for basic local work.

## Infrastructure lane

npm is the confirmed release registry. Settle package account/scope/name and access settings before publication, then prepare GitHub Actions trusted publishing where supported. Install-policy and OIDC work stay independent of registry account setup. Surface user-owned publishing steps when release work needs them. No self-hosted package infrastructure or tailnet CI access is planned. `.github/workflows/release.yml` is the prepared manual dispatch. It uploads the verified tarball and skips `npm publish` until the package is deliberately made publishable and the GitHub variable `BRAID_RELEASE` is `enabled`. Preparing that file does not authorize publication. The trusted-publishing steps and current release status are in [npm distribution](npm-distribution.md). Pinned-controller install steps are in the README.

Until publication proof exists, retain and install exact versioned tarballs. Release assets provide a durable bootstrap fallback once authorized publishing is configured. Ordinary PR CI should not depend on the private registry or tailnet.

## Stage retrospectives

At each boundary record intervention count, gate failures, recovery problems, and coordination overhead when measurable. Turn observed failures into regression tests or a concise rule; route improvements through ordinary PRs. Replan remaining work within the goal, documenting why. Changes to scope or acceptance standards need an explicit decision.
