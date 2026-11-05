# Epic BRAID-004: Performance optimization

Owner: user. Coordinator: Sol High. Status: in-progress.
Release target: none; development workflow improvements. Controller/schema: manual records; no controller run started.

Integration branch: `epic/braid-004-performance-optimization`. Initial base: `4631970cc6e7ac6eec1e2da9dc3b95a8a502b579` on `origin/epic/braid-003-worker-skill`. The user explicitly authorized branching from epic 003 instead of main and requested its latest committed state be merged on 2026-11-05. Fetch and merge found the current branch already at that tip. Main observed at `1dd5cb735c4614b75d96c0694c8c6d0a939f2605`. Untracked epic 003 maintenance records were left in their checkout.

Item pull requests target this branch. The eventual closing pull request targets main; its diff includes inherited epic 003 changes until those reach main. This plan does not declare epic 003 complete or accepted. Reconcile its actual integration state before the closing PR. Follow [delivery rules](../../../.agents/skills/braid-coordinate/references/delivery.md#epic-and-item-branches).

## Problem and beneficiary

Workers, coordinators, and reviewers repeatedly prepare Node.js and dependencies in fresh worktrees. Checkout-local downloads repeat setup work and consume disk even when the same compatible runtime already exists on the machine. Developers and agents should reuse suitable tools while retaining isolated project dependencies and meaningful verification.

The epic can accept more performance items later. Its initial scope addresses toolchain setup and measures the remaining verification cost; it does not presume that every installation or check is redundant.

## Outcomes and success measures

1. A compatible Node.js and its bundled npm on PATH require no archive download or extraction, including the documented direct installer command.
2. Two checkout roots selecting the same Windows pin and platform resolve to one user-level installation. The second resolution works without network access and creates no checkout-local toolchain.
3. Different selected pins occupy different directories without replacing another branch's runtime. Concurrent or interrupted installs never expose a partial installation as ready.
4. Archive checksum verification, engine requirements, npm install policy, offline verification, packed-install proof, and current-head hosted evidence retain their acceptance intent.
5. A bounded timing report separates cold setup, warm resolution, dependency installation, documentation checks, and full verification. It recommends any further change using observations, with limits, rather than assumed savings.

## Scope and non-goals

Initial scope: a shared versioned Windows Node store, PATH-first resolution, matching setup documentation and regression fixtures, then measurement of verification overhead.

No system-wide Node upgrade, runtime-version change, shared `node_modules`, dependency-install shortcut, cache eviction, existing-worktree cleanup, release, or publication. Keep `npm ci` per checkout. The install-policy fixture and tarball installation are acceptance proof, not disposable setup. CI-first verification and reduced local gates are proposals requiring a later explicit acceptance-policy decision; this epic does not adopt them.

## Analysis

Source inspection at the initial base establishes:

- [package.json](../../../package.json) requires Node `>=26.13.0 <27`. [The installer](../../../scripts/Install-NodeToolchain.ps1) pins Windows Node `26.13.0`, with x64 and arm64 archive hashes; downloads and extracted tools live under each checkout's `.tools/`.
- The direct installer calls `Install-BraidNodeToolchain`, which reuses only its checkout-local pin. `Resolve-BraidNodeToolchain` checks that local pin before a compatible PATH Node. Neither provides a user-level shared store.
- [README setup](../../../README.md#build-and-verify) invokes the direct installer. [Verify.ps1](../../../scripts/Verify.ps1) selects the runtime and bundled npm, requires existing dependencies, then runs docs/negative fixtures, OIDC/install-policy guards, typecheck, build, tests, and packed-install proof.
- [The records gate](../../../scripts/Test-CoordinatorRecordsGate.ps1) already avoids the full suite for coordinator records-only changes, but its [docs gate](../../../scripts/Test-DocsGate.ps1) still needs Node and installed Markdown dependencies. This capability is inherited from epic 003; do not plan it again.
- [CI](../../../.github/workflows/ci.yml) uses setup-node, npm's download cache, `npm ci`, full verification, and a required tarball upload on Windows and Ubuntu for push and pull_request. The shared Windows fallback must not replace CI's compatible PATH runtime.
- On this machine PATH currently selects Node `24.19.0`; a suitable existing Node `26.13.0` is available in the epic 003 checkout. This is an observation, not a requirement for other machines.

Earlier chat estimated checkout sizes and CI/local timings. Those are motivation, not an acceptance baseline: B records fresh measurements with exact revisions. New agents should consume these source findings instead of repeating the original investigation.

## Features and prioritized backlog

| ID | Kind | Outcome | Depends on | Owner | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| A | story | [Reuse a compatible or shared versioned Node toolchain](backlog/A-shared-node-toolchain.md) | None | Grok 4.7 High/500K implementation worker | in-progress | [Assignment](assignments/A.md); implementation proof pending |
| B | spike | [Measure remaining setup and verification overhead](backlog/B-verification-cost.md) | A reviewed and human-merged into this epic | Research worker, not dispatched | backlog | Measurement pending |

One implementation worker at a time. A owns toolchain scripts, related tests and setup docs; B owns its measurement harness/evidence and recommendation. More user items receive the next unused ID, starting with C; later reprioritization preserves IDs. See [ID rules](../../../docs/agile-workflow.md#backlog-item-ids).

## Review gates

No review assigned and no implementation candidate exists. A's first independent pass will be `A-shared-node-toolchain-review-001`; B's will be `B-verification-cost-review-001`. A reviewer checks the exact green candidate, including path resolution, integrity, concurrent/interrupted install behavior, and unchanged gates. B's reviewer checks measurement reproducibility, comparisons, limits, and recommendation.

Use [review conventions](../../../docs/agile-workflow.md#review-gates-and-indexing), parent-scoped reports, the authorized provider profile, and a fresh-context final epic review. A review is not human merge authority.

## Definition of Ready and Definition of Done

Apply the project's [Ready](../../../docs/agile-workflow.md#definition-of-ready) and [Done](../../../docs/agile-workflow.md#definition-of-done) criteria. Before dispatch, pin the accepted epic tip and execution skill, commit a filled assignment packet, freeze local/hosted checks, and obtain the host-bound item checkout. Planning readiness is not a launched assignment.

Each item needs its local proof, PR into the epic, complete current-head Windows/Linux CI including upload, independent review/triage, and human merge before Done. B cannot dispatch until A's actual merge is verified. Before final main integration, sync main, reconcile inherited epic 003 history, run final integration gates/review, and write the final report and retrospective. Registry publication remains separate and unauthorized.

## Decisions and open questions

- 2026-11-05, user: prefers a per-machine toolchain supporting several versions, plus reuse of a suitable PATH Node. A implements these together as one usable outcome.
- 2026-11-05, coordinator: use a per-user store by default, since installation must not require administrator rights. `BRAID_TOOLCHAIN_DIR` overrides its root. Version/platform keys, validation and publication behavior are settled in A.
- 2026-11-05, coordinator: retain existing local/full hosted gates. B measures before proposing a split; any relaxation needs the user's explicit decision. A does not wait for that research.
- 2026-11-05, user: initially requested planning and later additions; the later request to implement the epic authorizes staged delivery. A is assigned first; B retains its reviewed-human-merge dependency. No automatic merge or publication is authorized.
- 2026-11-05, coordinator: A adopts the unchanged checkout worker skill at `7e7ea5a9cb60fa3f56c79bf44ff389e1e7442bf8`, path `.agents/skills/braid-worker/SKILL.md`. A does not edit skills. Capability check confirmed the requested Cursor `grok-4.7`, high reasoning and 500K context route. The filled packet freezes proof and continuation before launch.
- Future additions are open. No input is needed to preserve or review this initial plan.

These decisions live here during planning. A carries lasting toolchain behavior into `docs/decisions.md` through its reviewed item PR, rather than a coordinator editing product documentation.

## Delivery evidence and release checklist

- [Planning account](reports/planning.md) records the base reconciliation and planning checks; [current checkpoint](checkpoints/current.md) is the resume entry.
- [ ] A implementation, exact-head local/hosted proof, independent review, human merge and acceptance record.
- [ ] B observations, recommendation, applicable local/hosted proof, independent review and human merge.
- [ ] Add/refine any further authorized items; reconcile scope before epic closure.
- [ ] Final integration proof, fresh review, final report/retro and human merge into main.
- No package release is required or performed. No implementation savings are claimed yet.
