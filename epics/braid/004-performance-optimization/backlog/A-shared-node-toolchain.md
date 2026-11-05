# A: Reuse a compatible or shared versioned Node toolchain

Kind: story. Epic: [BRAID-004](../epic.md). Owner: implementation worker. Depends on: none.
Item status lives only in the epic backlog table.

## Read first

Read [AGENTS.md](../../../../AGENTS.md), the filled assignment packet supplied at dispatch, the epic's analysis/decisions, and [current checkpoint](../checkpoints/current.md). Relevant implementation context is [Install-NodeToolchain.ps1](../../../../scripts/Install-NodeToolchain.ps1), [Verify.ps1](../../../../scripts/Verify.ps1), [Test-DocsGate.ps1](../../../../scripts/Test-DocsGate.ps1), [README setup](../../../../README.md#build-and-verify), [package engines](../../../../package.json), `.npmrc`, and [decisions D02/D03/D15/D24/D25](../../../../docs/decisions.md#confirmed-requirements). These findings are already summarized in the epic; inspect consumers to implement, not to repeat discovery.

## Value

A developer or agent opening another worktree can use an existing compatible runtime immediately or reuse one verified installation for its requested pin. Separate branches can select different pins without overwriting each other.

## Scope and settled design

- Keep the current pin, official archive URLs, x64/arm64 hashes, supported engine range and PowerShell baseline. No Unix archive downloader: on non-Windows require a compatible PATH toolchain, as today.
- Make the direct script entry point and dot-sourced resolver follow the same order: compatible PATH Node with usable bundled npm; otherwise the selected pin in the shared store; otherwise install that pin on Windows. Resolve the absolute runtime directory, return only it on stdout, and keep diagnostics on stderr. Runtime consumers must use that Node's bundled `npm-cli.js`, preserving current verification behavior.
- Default shared root: `%LOCALAPPDATA%/braid/toolchains`; fail with an actionable error if this Windows location is unavailable and no override exists. `BRAID_TOOLCHAIN_DIR` names an absolute alternate root and does not change the selected version or hashes. Reject a relative override rather than interpreting it differently per checkout.
- Key extracted installations as `<root>/node-v<version>-<platform>`. Keep downloaded archive/checksum data under version/platform-specific cache paths under the same root. A different branch pin selects a different key. Do not infer an unpinned latest version from the engine range or add a general version manager.
- Warm shared reuse is offline. Validate the exact reported Node version, bundled npm presence/usability, and completion metadata identifying the pin, platform and verified archive hash. A missing, inconsistent or unusable completed directory fails with its concrete path and repair guidance; do not overwrite it silently.
- Serialize installation per key with an OS-held exclusive file lock, bounded to 120 seconds with a clear timeout. Recheck for a completed installation after acquiring the lock. Keep the lock file; OS handle release permits recovery after process exit without deleting another process's lock.
- Download/extract into a unique staging directory on the same filesystem. Require the archive hash to match both the source pin and official checksum, then validate the extracted runtime/npm before writing completion metadata and atomically renaming into the final key. A failed/interrupted operation cannot make its final key appear complete. Clean only this invocation's staging data on handled failure; abandoned staging is never selected. Preserve existing completed versions and unrelated files.
- Do not read, migrate, delete or rewrite existing checkout-local `.tools` installations. Compatible tools there can still be explicitly put on PATH. Update README selection/output expectations and the lasting decision log to match the new behavior.

No shared `node_modules`, dependency-cache wrapper, automatic eviction, system installation, engine upgrade, CI-first mode, or weaker gate. Reuse npm's existing download cache and retain per-checkout `npm ci`.

## Acceptance criteria

1. Given compatible PATH Node/npm and an empty store, direct invocation and resolver return its directory without downloading, extracting, or creating the store. An incompatible PATH runtime selects the pin fallback. An unusable npm pairing must not be returned as a usable toolchain.
2. Given two repository roots and the same pin/platform/store, one cold installation produces one final directory and both roots resolve it. A warm second call with networking disabled succeeds with zero downloads/extractions and no new checkout-local `.tools` content.
3. Given two selected pins using controlled test fixtures, both final keys coexist and resolving either leaves the other untouched. The production pin remains unchanged; no future official hash is invented for the test.
4. Wrong pinned or official checksum, missing npm, wrong runtime version, invalid override, unsupported Windows architecture, and non-Windows without compatible PATH tools fail clearly. Corrupt completed directories remain available for inspection.
5. Two concurrent same-key installers publish one usable result; the waiter reuses it. Forced interruption before publication leaves no usable partial final directory, and a subsequent run can complete after the OS releases the lock. Lock timeout is bounded and reported. Tests use disposable roots and controlled download/extraction fixtures rather than the real user cache.
6. Documentation and consumers agree on PATH precedence, shared layout, override, per-version reuse and failure recovery. stdout remains one directory suitable for the README assignment command; native errors propagate.
7. Local full verification passes. Hosted CI passes on the exact candidate on Windows and Ubuntu with successful dependency install, Verify and packed-tarball upload. No install-policy or packed-install step is removed or treated as redundant.

## Implementation tasks

- [ ] Implement shared resolution/publication and integrate consumers without broad refactoring.
- [ ] Add a focused offline PowerShell fixture at `test/fixtures/node-toolchain/Test-NodeToolchain.ps1`; wire it into `scripts/Verify.ps1` so future CI runs exercise failures, isolation, reuse, concurrency and interruption.
- [ ] Update README and `docs/decisions.md`; keep workflow mechanics unchanged unless a concrete consumer requires alignment within this scope.
- [ ] Record one real official cold install in an isolated override root and a warm offline reuse observation; retain deterministic fixtures as repeatable CI proof. Record any untested architecture explicitly.

## Ownership and verification

Own `scripts/Install-NodeToolchain.ps1`, necessary runtime-consumer adjustments in `scripts/`, the new fixture, README, lasting decisions, and own report/checkpoint/evidence. Do not edit skills or workflow policy to lower acceptance. Coordinator owns epic/shared checkpoint.

Exact local gates: `pwsh -NoProfile -File test/fixtures/node-toolchain/Test-NodeToolchain.ps1`, then `npm run verify` under the selected supported toolchain after `npm ci`. The fixtures must be offline; the explicitly recorded real cold bootstrap is separate. Preserve native exit codes. Record commands, platform, pin, full candidate/base revisions and observations.

## Review and delivery

Use `item/braid-004-a-shared-node-toolchain` from the accepted epic tip and one PR into `epic/braid-004-performance-optimization`. Freeze workflow/event/job/step/artifact requirements in the filled packet before launch. Worker owns repair and current-head proof; independent review checks the green candidate and acceptance criteria. Follow [review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing). Done requires the human merge into the epic and recorded acceptance; do not dispatch B before it.

## Report and resume

Worker owns `checkpoints/A.md`, `reports/A.md`, and `validation/A/` under this epic. Follow [report format](../../../report-format.md). Commit candidate records before push; later hosted proof belongs in the PR comment and result. Return proposed epic status to the coordinator and stop after A.
