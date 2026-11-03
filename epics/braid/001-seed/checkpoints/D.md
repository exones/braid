# D checkpoint

Updated: 2026-11-03. Worker-owned. Do not treat this file as the shared handoff; `checkpoints/current.md` stays with the coordinator.

## Task and checkout

Story D, packed artifact and bootstrap proof. Checkout: `C:\code\agento`. Branch: `feat/package-bootstrap`. Parent of this commit: `149545c681021794721fc1ac2cf3950d88a73f88`. The candidate revision is the commit that contains this checkpoint. `git rev-parse HEAD` after that commit is the revision a clean pack must record.

Controller: bootstrap coordinator skill and manual files. No released CLI is installed. Package `agento@0.1.0` stays `private: true`.

## Completed

- `scripts/Test-Package.ps1` packs with `npm pack --ignore-scripts`, installs that tarball outside the checkout, and runs the ledger scenario through the installed `agento` shim. `scripts/Verify.ps1` calls it after the node tests. Neither script calls the other.
- Windows verify passed on the dirty worktree before this commit: 40 tests, exit 0. The pack's `sourceRevision` was `149545c681021794721fc1ac2cf3950d88a73f88`, `worktreeDirty` was true, and `candidate` was false. SHA-256 of `agento-0.1.0.tgz` was `e40abb72422dacfc27a5f2d7a1f46dfda200640bc4f11c2640e936b4f809f3fb`.
- CI uploads `artifacts/package/` on Windows and Linux. `.github/workflows/release.yml` is a manual dispatch and was not run. npm publish was not run.
- `npm view agento` on 2026-11-03 returned a different public package at version 0.1.2. The unscoped name is not available to this project.

## In flight

None in this checkout after the D commit. The post-commit clean pack is intentionally not a second commit: recording its SHA here would move HEAD. The pull request body is the confirmation record.

## Checks

Local Windows gate: `pwsh -NoProfile -File .\scripts\Verify.ps1` exit 0. Node `v26.13.0`, npm `11.20.0`, PowerShell `7.6.9`. Hosted Windows/Linux CI for this commit was not run from this session. Linux was not run locally.

## Changed files

`scripts/Test-Package.ps1`, `scripts/Verify.ps1`, `package.json`, `.gitignore`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `README.md`, `docs/npm-distribution.md`, `docs/decisions.md`, `docs/roadmap.md`, `reports/D.md`, `reports/final.md`, and this checkpoint. `epic.md` and `checkpoints/current.md` were not edited. Tarball and provenance under `artifacts/package/` are gitignored.

## Next concrete action

After this commit, with a clean worktree, run:

```powershell
$env:AGENTO_REQUIRE_CLEAN = '1'
pwsh -NoProfile -File .\scripts\Test-Package.ps1
```

Require exit 0, `worktreeDirty` false, `sourceRevision` equal to `git rev-parse HEAD`, and digest `e40abb72422dacfc27a5f2d7a1f46dfda200640bc4f11c2640e936b4f809f3fb` if the package inputs are unchanged. Then push only `feat/package-bootstrap` and open the PR. Coordinator: do not publish, tag, or start stage 2. Assign R only after inspecting this candidate. The user still has to choose an npm scope and name; unscoped `agento` is already published by someone else.

## Blockers

No blocker for local packaging. Publication is blocked until the user selects an npm account and a package name that is not the existing unscoped `agento`, removes `private: true` in an authorized change, creates the package, configures the `release.yml` trusted publisher, and sets repository variable `AGENTO_RELEASE` to `enabled`. Exact steps are in `docs/npm-distribution.md`.
