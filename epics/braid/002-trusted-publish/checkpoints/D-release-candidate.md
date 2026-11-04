# AGENTO-002/D release-candidate checkpoint

Updated: 2026-11-03. Worker-owned. Coordinator owns `checkpoints/current.md` and `epic.md`; those files were not edited.

## Task and checkout

Task AGENTO-002/D, prepare the `@exones/braid@0.1.1` OIDC release candidate. No publication. Checkout: `C:\worktrees\agento\t3-2bdfdb71`. Branch: `feat/002-d-release-candidate`, created from `origin/main` `0f2dd8637be8f87237c5622c8314aea28b9068ac`. Upstream tracking of `main` was removed before the first push. Controller: manual epic files. No subagents.

## Completed

- Integrated current `main` `0f2dd8637be8f87237c5622c8314aea28b9068ac` (`Merge pull request #4`), which contains the merged B install policy and C OIDC guard. The prepared checkout had started at `acd87301c8c267b7b89651c1e2b01913d6c84692`.
- Set version `0.1.1` in `package.json` and `package-lock.json`. Name `@exones/braid`, `private` false, Node engine, and bin `braid` are unchanged.
- Updated the current version sentences in README, `docs/cli-name.md`, `docs/seed-contract.md`, and `docs/npm-distribution.md`. The pinned `0.1.0` controller example remains. `scripts/Publish-Npm.ps1` remains the `0.1.0` token bootstrap and was not run.
- `npm view @exones/braid versions --json` returned `0.0.0-stage` and `0.1.0` only.
- Dirty `scripts/Verify.ps1` exited 0 and was marked `candidate` false. Source revision on that probe was `0f2dd8637be8f87237c5622c8314aea28b9068ac`.
- Clean `scripts/Verify.ps1` on implementation commit `1b93ff8630a19d4d1ec1826e453faabcd416ebc8` exited 0: OIDC guard, install-policy, 40 tests, and package proof. Digest `3f35c881253ed9e651bce8c591d61fb11024495ac757d6612682a8d12930fc04`, candidate true. Node.js `v26.13.0`, npm `11.20.0`, PowerShell `7.6.9`.

## In flight

None. No publish, no `BRAID_RELEASE`, no `scripts/Publish-Npm.ps1`, no workflow dispatch, no tag, and no GitHub Release.

## Checks

Cited in `reports/D-release-candidate.md`. The clean package proof is the implementation commit. This delivery commit adds epic markdown only. Hosted CI on the pull request head is the clean run of the full candidate. This file does not record that hosted result, because a later commit would change the head.

## Changed files

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/cli-name.md`
- `docs/npm-distribution.md`
- `docs/seed-contract.md`
- `epics/braid/002-trusted-publish/reports/D-release-candidate.md`
- `epics/braid/002-trusted-publish/checkpoints/D-release-candidate.md`

## Next concrete action

Pull request: https://github.com/exones/braid/pull/7. Implementation commit `1b93ff8630a19d4d1ec1826e453faabcd416ebc8` is the parent of the delivery commit that stores this sentence, and that delivery commit is the pull request head. Its object id is in the pull request body after the following push. Leave pending hosted checks for the coordinator. Review the head. Do not mark Done. Do not publish. Do not start another item from this worker.

## Blockers

None for preparing the candidate. Done still needs hosted CI on the pull request head, review, and human merge. OIDC publication needs a separate authorization. The user-reported trusted publisher was not verified from the npm account. `BRAID_RELEASE` is absent, so the existing workflow still skips publish.
