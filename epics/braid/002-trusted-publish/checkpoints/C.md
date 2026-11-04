# AGENTO-002/C checkpoint

Updated: 2026-11-03. Worker-owned. Coordinator owns `checkpoints/current.md` and `epic.md`; those files were not edited.

## Task and checkout

Story AGENTO-002/C, guard the OIDC release workflow. Checkout: `C:\worktrees\agento\t3-579092d3`. Branch: `feat/002-c-oidc-guard`, created from `origin/main` `acd87301c8c267b7b89651c1e2b01913d6c84692`. Controller: manual epic files. No subagents.

## Completed

- Confirmed `origin/main` and the starting HEAD are `acd87301c8c267b7b89651c1e2b01913d6c84692`, subject `Merge pull request #3 from exones/feat/skill-human-rundown`. `release.yml` on that commit uses `BRAID_RELEASE`.
- Added `test/fixtures/oidc-release/Test-OidcReleaseGuard.ps1` and called it from `scripts/Verify.ps1`. The check reads `release.yml`. It does not dispatch, publish, or add a workflow file.
- Negative copies, written outside the repository and deleted, fail closed. That includes a copy missing `id-token: write` and copies that name `NPM_TOKEN` or `NODE_AUTH_TOKEN`.
- Added one `docs/decisions.md` log entry for OIDC, Node.js 26, and Forgejo not being an npm OIDC provider. Added one `docs/roadmap.md` sentence linking `epics/braid/002-trusted-publish/epic.md`.
- Clean `scripts/Verify.ps1` on implementation commit `9a4617e9f5d2857cbece000c6700d45069ae44f4` exited 0: guard, install-policy, 40 tests, and package proof. Digest `491f2aa7de5c303f302f92e4fa8d5b1c06fb951c8af6f86fb136cdc6f4b9adb0`, candidate true. Node.js `v26.13.0`, npm `11.20.0`.

## In flight

None. No publish, no `BRAID_RELEASE`, no `scripts/Publish-Npm.ps1`, no workflow dispatch.

## Checks

Cited in `reports/C.md`. The clean package proof is the implementation commit. This delivery commit adds epic markdown only. Hosted CI on the pull request head is the clean run of the full candidate. This file does not record that hosted result, because a later commit would change the head.

## Changed files

- `test/fixtures/oidc-release/Test-OidcReleaseGuard.ps1`
- `scripts/Verify.ps1`
- `docs/decisions.md`
- `docs/roadmap.md`
- `epics/braid/002-trusted-publish/reports/C.md`
- `epics/braid/002-trusted-publish/checkpoints/C.md`
- `epics/braid/002-trusted-publish/backlog/C-oidc-guard.md`

## Next concrete action

Pull request: https://github.com/exones/braid/pull/4. Implementation commit `9a4617e9f5d2857cbece000c6700d45069ae44f4` is the parent of the delivery commit that stores this sentence, and that delivery commit is the pull request head. Its object id is in the pull request body. The worker reports whether the required checks on that head passed or failed. Coordinator then reviews. Do not mark Done. Do not start AGENTO-002/E from this worker.

## Blockers

None for this story. Done still needs the pull request, hosted CI on its head, review, and human merge.
