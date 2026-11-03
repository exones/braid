# Staged bootstrap roadmap

Status: planning baseline, 2026-11-03. Only the seed epic has executable backlog items today. Future stages are capability boundaries, not permission to start them.

| Stage | Candidate | Delivered capability | Built using | Promotion proof |
| --- | --- | --- | --- | --- |
| 0 | Workflow bootstrap | Coordinator skill, analysis/refinement workflow, Agile epic/backlog templates, readiness/completion criteria, current checkpoint | Sol coordinator and project files | Structural validation plus fresh short-goal planning via AGENTS routing in Codex/T3 recorded in the seed skill-proof report. Invisible UI selection, every host, and all workflow branches remain unproven. |
| 1 | 0.1 seed | Manual epic/story ledger, CLI, state/events, PowerShell verification, Actions, packaged installation | Bootstrap coordinator skill and one implementation worker | Packed CLI works in a clean directory, local verification passes, Windows/Linux CI evidence recorded when remote exists. |
| 2 | 0.2 supervised | Current T3 contract, doctor, explicitly requested single-worker dispatch, independent gate reports | Pinned 0.1 for tracking; operator launches agents | One real task completed; failed gate prevents acceptance; changed head invalidates old proof. |
| 3 | 0.3 messaging | Typed routing, durable delivery, inbox/outbox, human questions, manual tick | Pinned 0.2, one worker | Real question/answer and fallback delivery; duplicate retries harmless; bounded conversation tests. |
| 4 | 0.4 coordination | Coordinator, DAG readiness, max parallelism, coarse resource exclusion, review | Pinned 0.3, coordinator and one worker | Demo shows two independent streams, dependent stream, failed gate, human question. |
| 5 | 0.5 recovery | Scheduled tick, bounded retry/nudge, pause/resume, thread replacement, export | Pinned 0.4, at most two workers | Interruption/restart exercises preserve work and prevent duplicate actions; fresh context resumes. |
| 6 | Pilot | Real project proof, compatibility fixes, operating guide, revised defaults | Pinned 0.5 | Evidence-backed final report and retro; limitations explicitly handed over. |

The coordinator skill is delivered in stage 0, before the CLI. Stage 4 adds deterministic coordination in the product; it is not the first time we use a coordinator. Later milestones refine the bootstrap skill using real delivery evidence. Agile work division follows `docs/agile-workflow.md`; the seed backlog contains spikes, an enabler, and stories, with parent-scoped review gates rather than a new work item for each review.

## Bootstrap rules

Each run records its released controller version, candidate commit, schema version, and acceptance policy. The controller installation lives outside the candidate checkout. The candidate operates on disposable test runs until promoted. Do not change the running controller's files through development builds or `npm link`.

Promotion means deterministic checks passed, the actual packed artifact was exercised, relevant live proof exists, and evidence is recorded. Publishing and merge authority remain explicit. If a gate cannot run, the stage is partially proven rather than complete.

Before stage 2 work begins, install accepted 0.1 in a separate location and create the stage 2 work ledger with it. Update Markdown checkpoints alongside it. The machine ledger owns execution status; narrative files reference that status rather than becoming a competing database.

## Four gates

1. Ready to start: backlog item, scope, dependencies, ownership, and expected proof exist.
2. Ready to merge: checks pass on current code; requested evidence and review triage exist.
3. Ready to release: packed installation and state compatibility are exercised.
4. Ready for greater autonomy: the new automation's success and failure paths are demonstrated.

Milestone review uses a fresh context. Start cross-provider review when configured and available; do not make an unavailable provider a hidden prerequisite for basic local work.

## Infrastructure lane

npm is the confirmed release registry. Settle package account/scope/name and access settings before publication, then prepare GitHub Actions trusted publishing where supported. Keep B/C independent of registry setup and surface any user-owned publishing steps during D. The Forgejo discovery spike is cancelled; no self-hosted package infrastructure or tailnet CI access is planned. `.github/workflows/release.yml` is the prepared manual dispatch. It uploads the verified tarball and skips `npm publish` until the package is deliberately made publishable and the GitHub variable `BRAID_RELEASE` is `enabled`. Preparing that file does not authorize publication. Pinned-controller install steps are in the README.

Until publication proof exists, retain and install exact versioned tarballs. Release assets provide a durable bootstrap fallback once authorized publishing is configured. Ordinary PR CI should not depend on the private registry or tailnet.

## Stage retrospectives

At each boundary record intervention count, gate failures, recovery problems, and coordination overhead when measurable. Turn observed failures into regression tests or a concise rule; route improvements through ordinary PRs. Replan remaining work within the goal, documenting why. Changes to scope or acceptance standards need an explicit decision.
