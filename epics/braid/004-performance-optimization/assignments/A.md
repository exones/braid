# Worker assignment: BRAID-004/A

## Task, skill and entry

Initial execution of [A: Reuse a compatible or shared versioned Node toolchain](../backlog/A-shared-node-toolchain.md), authorized by the user's 2026-11-05 request to implement the epic. Implement only A through independently verified current-head green CI. Independent review, human merge, B and final epic integration remain separate.

Exact packet: `epics/braid/004-performance-optimization/assignments/A.md`.
Execution skill: `.agents/skills/braid-worker/SKILL.md` at full revision `7e7ea5a9cb60fa3f56c79bf44ff389e1e7442bf8`. Use the checkout copy: A does not edit skills, and assignment records do not change that skill. This is the adopted execution revision; do not substitute another installation.

After mandatory reading and one binding-verification batch, first inspect the named resolver/installer functions in `scripts/Install-NodeToolchain.ps1`, then implement PATH-first shared resolution and its focused offline fixture. The item contains the approved design; do not repeat architecture discovery without a concrete contradiction.

## Read now

- [AGENTS.md](../../../../AGENTS.md), the named worker skill, and [A](../backlog/A-shared-node-toolchain.md), including every acceptance criterion.
- [Epic](../epic.md): Analysis, Scope and non-goals, Outcomes, Decisions, Ready/Done and Review gates. Read [current checkpoint](../checkpoints/current.md) for dispatch context; later coordinator records do not amend this packet.
- [README](../../../../README.md#build-and-verify): Build and verify and GitHub Actions sections. [Decisions](../../../../docs/decisions.md#confirmed-requirements): D02/D03/D15/D24/D25 retain PowerShell, real gates, epic targeting and record ownership.
- Implementation inputs: `scripts/Install-NodeToolchain.ps1`, `scripts/Verify.ps1`, runtime-selection portions of `scripts/Test-DocsGate.ps1` and `scripts/Test-Package.ps1`, `package.json`, `.npmrc`, `.github/workflows/ci.yml`.
- Relevant sections of [record ownership and commit boundary](../../../../docs/agile-workflow.md#record-ownership), [delivery rules](../../../../.agents/skills/braid-coordinate/references/delivery.md), [report format](../../../report-format.md), and [top-level T3 continuation](../../../../.agents/skills/braid-worker/references/t3-continuation.md#top-level-item-thread) for Git, proof and continuation.

## Approved brief

Follow A's settled design: compatible PATH Node with bundled npm first; otherwise one exact pin/platform installation under `%LOCALAPPDATA%/braid/toolchains` or an absolute `BRAID_TOOLCHAIN_DIR`. Preserve engine range, Windows pin/hashes and Unix PATH support without a Unix downloader. Direct and dot-sourced invocation must agree; consumers use the selected Node's bundled npm.

Warm reuse checks exact pin, usable npm and completion metadata offline. Per-key exclusive OS file lock (120-second bound), unique same-filesystem staging, pinned-plus-official archive checksum checks, runtime validation and atomic publication prevent incomplete installations being selected. Preserve corrupt completed directories, other versions and legacy `.tools`. Regression fixtures cover PATH precedence, fallback, override/errors, same/different-key reuse, corruption, concurrency, timeout and interruption in disposable roots.

Update README and lasting decisions. Retain isolated checkout dependencies and every existing gate. Record one real isolated official cold installation and warm offline reuse separately from deterministic fixtures. Controlled second-pin fixtures must not invent production hashes. No system Node upgrade, shared node_modules, npm-ci shortcut, cache eviction, engine change or gate relaxation.

## Verified facts and dependencies

- Planning/source analysis is committed at `7e7ea5a9cb60fa3f56c79bf44ff389e1e7442bf8`: [epic Analysis](../epic.md#analysis) and [planning account](../reports/planning.md). No dependency merge is required for A.
- User explicitly authorized epic 003 as initial base. This epic includes `4631970cc6e7ac6eec1e2da9dc3b95a8a502b579`; fetch/merge was already up to date. This is not epic 003 completion or release evidence.
- Before this packet commit, local/origin epic tips equal `7e7ea5a9cb60fa3f56c79bf44ff389e1e7442bf8`; origin/main is `1dd5cb735c4614b75d96c0694c8c6d0a939f2605`; main commits missing from epic = 0. Launch supplies the new full committed context SHA as expected initial HEAD, not this file's own embedded SHA.
- The intended item branch has no remote at preparation; no A worker/PR/review exists. B awaits A's reviewed human merge into this epic.
- Capability check confirms Cursor `grok-4.7`, `reasoning_effort=high`, `contextWindow=500k`, matching AGENTS. No provider substitution.

Historical epic 003 reports and original chat are on-demand only for a conflicting dependency fact or continuation anomaly, not routine discovery. Findings needed to execute are carried here and in A.

## Git and workspace contract

Host creates/binds the checkout; use its actual root, never guess or create a worktree. The launch supplies the context SHA and a binding message if needed. Verify once: root, attached branch `item/braid-004-a-shared-node-toolchain`, HEAD equal to supplied context SHA, clean index/worktree, origin `https://github.com/exones/braid.git`. No upstream is normal for this new branch. A missing/detached/mismatched binding stops affected writes; report it without reset/clean/rename/switch repair.

First push: `git push --set-upstream origin item/braid-004-a-shared-node-toolchain`. Later pushes explicitly target that owned branch. Create one PR into `epic/braid-004-performance-optimization`, never main. Conventional Commits; no rebase, force-push, merge, release or publication. If the epic moves under an open PR, merge the new epic tip into the item and refresh proof. Do not merge later coordinator records merely to make initial binding equal a later tip.

## Ownership

Worker owns the installer, necessary runtime-consumer adjustments in `scripts/`, `test/fixtures/node-toolchain/Test-NodeToolchain.ps1`, README, lasting `docs/decisions.md`, and own epic `checkpoints/A.md`, `reports/A.md`, `validation/A/`. No skills or workflow-policy edits. Report a concrete need before changing engines/lockfile/npm policy; normal npm ci is authorized.

Coordinator alone owns epic/backlog/assignment/shared checkpoint/log and later review/acceptance records. Propose shared-status changes in the result; do not edit these files or launch agents. Other checkouts have other owners.

## Frozen proof

Runtime: Node `>=26.13.0 <27`, fallback official Windows `26.13.0`; PowerShell >=7.6. No released controller is invoked by this maintenance item; controller/schema tracking is manual.

Bootstrap may reuse existing Node at `C:/worktrees/agento/epic-braid-003-worker-skill/.tools/node/node-v26.13.0-win-x64` through process PATH, after confirming its runtime/npm pairing. It was checked to exist during planning. Do not copy/delete it or write that checkout. Run `npm ci` in your own checkout. Test new shared fallback separately with isolated roots/controlled PATH so bootstrap reuse cannot hide defects.

Local gates: `pwsh -NoProfile -File test/fixtures/node-toolchain/Test-NodeToolchain.ps1`, then `npm run verify`. Wire the fixture into Verify; preserve docs/negative fixtures, OIDC/install-policy guards, typecheck, build, tests and packed-install proof. Record command exits, versions and dirty-probe versus committed-source distinction. No skill content changes means no external skill validator required.

Hosted frozen set on every candidate head: `.github/workflows/ci.yml`, both `push` and `pull_request`, each with `verify (windows-latest)` and `verify (ubuntu-latest)`. Require successful Install dependencies, Verify and Upload packed tarball. Retain run/attempt/job identities and source mapping; branch protection cannot shrink this set. Pending/missing/skipped/cancelled/neutral/stale/inaccessible results do not count green. Reconfirm current PR head after proof.

Artifact verification is required. For each event/OS artifact `braid-package-<matrix.os>`, inspect the tarball and sibling provenance, recompute SHA-256 and match digest/filename; require clean candidate and `installOutsideCheckout=true`. Push sourceRevision/githubSha must identify candidate head. PR provenance must identify the actual merge-test source, its relationship to candidate head and pullRequestHeadSha; record both source and head. No cross-OS tarball equality claim. Downloads stay ignored/external; do not commit binaries. Green jobs alone are not digest proof.

## Continuation, outputs and stop

Route: one top-level T3 item thread using Grok 4.7 High/500K, not a delegated child. Coordinator thread: `ae791527-bf56-41da-a7d9-30821a74cfc5`; send results with `t3_thread_send`. Record your actual returned thread/run/root/branch identities; no invented launch identities.

After local gates and candidate records, commit/push/create one PR, immediately link_pull_request, then watch_pull_request if waiting. Confirm watching:true, take the one catch-up snapshot, verify/deliver immediately if complete, otherwise end the turn for a watch wake. Follow host rules: no polling, sleeps, timers, schedules or background watchers. Retain failure diagnosis and in-scope repair. Missing transport is a precise blocker, not permission to substitute a child/relay. A watch wake is not interruption recovery.

After every declared current-head check and artifact is independently verified green, unwatch, comment proof on the PR, and send exactly one result for that head to coordinator. Include actual root/branch/full head/PR, local checks, hosted run/job/step/artifact/source evidence, limits and proposed status. Dedupe by head. Report actionable blockers earlier; pending CI remains nonterminal worker ownership.

Owned outputs under this epic: `checkpoints/A.md`, `reports/A.md`, `validation/A/`. Follow report format. Update records before push; later proof stays in PR comment/result unless an implementation repair changes the head anyway. Stop after A. Coordinator inspects green, assigns independent review, and stops for human merge before B.
