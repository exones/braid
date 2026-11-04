# Task D: 0.1.1 OIDC release candidate

Status: partly proven. Date: 2026-11-03.
Backlog item: `epics/braid/002-trusted-publish/backlog/D-npm-account.md`. Checkout/branch/HEAD: `C:\worktrees\agento\t3-2bdfdb71`; `feat/002-d-release-candidate`. The pull request head is the delivery commit that contains this sentence.

## Outcome

`@exones/braid@0.1.1` is prepared as the first OIDC release candidate. The public name, `"private": false`, Node.js engine `>=26.13.0 <27`, and `braid` executable stay as they are on current `main`. The strict install policy and the merged `release.yml` guard stay in place. This change does not publish.

Registry `latest` is still `0.1.0`. `npm view @exones/braid versions --json` returned `0.0.0-stage` and `0.1.0` only, so `0.1.1` is unused. The user reports that the npm trusted publisher is saved for GitHub `exones/braid`, workflow filename `release.yml`, environment blank, direct `npm publish` allowed, and restrictive publishing-access/2FA, with no stored token. That account configuration is user-reported. This checkout did not read the npm account, and no OIDC publication is proven.

Acceptance for a published release is not met. The candidate is ready for review. Proposed status: In Review. Not Done.

## Changes introduced

- `package.json` and `package-lock.json` set version `0.1.1`. Name `@exones/braid`, `private` false, `engines.node`, and bin `braid` are unchanged.
- README, `docs/cli-name.md`, `docs/seed-contract.md`, and `docs/npm-distribution.md` describe this source as unpublished `0.1.1` and the registry `latest` as `0.1.0`. `--version` from this source prints `braid 0.1.1`.
- The README install block still pins the published `@exones/braid@0.1.0` controller, including `braid-0.1.0.provenance.json` and the `0.1.0` example paths. Historical reports, sealed validation, and `scripts/Publish-Npm.ps1` still name `0.1.0`. That script is the token bootstrap for the version already published. It was not retargeted and was not run.
- `.npmrc`, `.github/workflows/release.yml`, and `.github/workflows/ci.yml` are unchanged. Publish still requires `private` not true and repository variable `BRAID_RELEASE` exactly `enabled`. `BRAID_RELEASE` was not created. The workflow was not dispatched.

## Evidence

Toolchain: `pwsh -NoProfile -File .\scripts\Install-NodeToolchain.ps1`. It verified Node.js 26.13.0 win-x64 SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a` and used `.tools/node/node-v26.13.0-win-x64`. npm is that directory's `node_modules/npm/bin/npm-cli.js`.

| Check | Exact command or method | Result | Revision |
| --- | --- | --- | --- |
| Base | `git fetch origin main`; `git rev-parse origin/main`; `git checkout -b feat/002-d-release-candidate origin/main`; `git branch --unset-upstream` | `origin/main` is `0f2dd8637be8f87237c5622c8314aea28b9068ac`, `Merge pull request #4 from exones/feat/002-c-oidc-guard`. That commit is an ancestor. The prepared checkout had been `acd87301c8c267b7b89651c1e2b01913d6c84692`. | `origin/main` |
| Registry read | Pinned `npm view @exones/braid versions --json` | `["0.0.0-stage","0.1.0"]`, exit 0. `0.1.1` is absent. | Before the version commit |
| npm ci | Pinned `npm ci` | Exit 0. `added 4 packages, and audited 5 packages in 2s`. `found 0 vulnerabilities`. | Dirty tree, version already `0.1.1` |
| Verify, dirty | `pwsh -NoProfile -File .\scripts\Verify.ps1` | Exit 0. OIDC guard passed, install-policy passed, 40 tests, 0 failed. Package proof ran. | Dirty pre-commit probe |
| Dirty pack | Printed by `scripts/Test-Package.ps1` | Digest `3f35c881253ed9e651bce8c591d61fb11024495ac757d6612682a8d12930fc04`. Source revision `0f2dd8637be8f87237c5622c8314aea28b9068ac`. `worktreeDirty` true. `candidate` false. The packed bytes matched the later commit because those edits were already in the worktree. This row is not the committed candidate. | Before `1b93ff8` |
| Verify, clean | `pwsh -NoProfile -File .\scripts\Verify.ps1` | Exit 0. Node `v26.13.0`, npm `11.20.0`, PowerShell `7.6.9`. Guard passed, install-policy passed, typecheck, build, 40 tests in 3 suites, 0 failed. Package proof then ran. | `1b93ff8630a19d4d1ec1826e453faabcd416ebc8` |
| Clean pack | Printed by `scripts/Test-Package.ps1` | `exones-braid-0.1.1.tgz`. SHA-256 `3f35c881253ed9e651bce8c591d61fb11024495ac757d6612682a8d12930fc04`. npm integrity `sha512-uH1r1kvI+zLMhbzCu4XVdr413m7TemhWYcx9GeugzBXLxocVrBmsrXEBk2wNVidTt+LargxhvyxsPf7vem+gJQ==`. Source revision `1b93ff8630a19d4d1ec1826e453faabcd416ebc8`. `worktreeDirty` false. `candidate` true. `version` `0.1.1`, `private` false, executable `braid`. Lock timeout 5395 ms. Provenance `artifacts/package/exones-braid-0.1.1.provenance.json`, gitignored. | Implementation commit |

The clean proof shows this committed tree packs, installs outside the checkout, and runs the ledger scenario as `braid 0.1.1`. It does not show hosted CI, review, merge, or an npm publish. The dirty probe is a separate row even though its tarball digest matched.

## Decisions

- Use `0.1.1` because `0.1.0` is already public and `0.1.1` is unused. Do not republish `0.1.0`.
- Leave `scripts/Publish-Npm.ps1` pinned to `@exones/braid@0.1.0`. The OIDC path is `release.yml`. The token script is not part of this candidate.
- Correct the current README and distribution sentences that still said this package was `private: true` or unpublished. Keep the `0.1.0` controller example and earlier evidence.
- Do not change workflow permissions, the publish condition, or `.npmrc`.

## Open points

- Hosted CI, review, and human merge are still open. This item is not Done. OIDC publication is not proven.
- `BRAID_RELEASE` is absent. A dispatch would still skip `npm publish`. This task did not create the variable, dispatch `release.yml`, tag, or create a GitHub Release.
- The user-reported trusted publisher is not independently verified here. Saving it does not prove a publish. npm expires an unused new trusted-publisher configuration after two days. This candidate does not consume that window.
- This delivery commit adds epic markdown only. Those files are outside `package.json` `files`. The recorded clean digest is the implementation commit. Hosted CI on the pull request head is the clean run of the full candidate.
- Nothing was published. `npm publish`, `npm stage publish`, `npm trust`, and `scripts/Publish-Npm.ps1` were not run.

## Resume

Coordinator: review this pull request after the hosted checks on its head are known. Keep AGENTO-002/D In Review. Do not mark it Done and do not treat OIDC as proven. Publication remains a separate authorization: set `BRAID_RELEASE` to `enabled` only for a dispatch that may publish, then dispatch `release.yml` with `confirm` set to `publish`. Do not start another item from this worker.

## Proposed shared updates

Do not mark D Done. Epic row D becomes `in-review`. Evidence: this report and the pull request. Local proof is the clean pack of `1b93ff8630a19d4d1ec1826e453faabcd416ebc8`. Hosted CI is not stored in this commit.

- Row D status: `in-review`.
- `epics/braid/002-trusted-publish/checkpoints/current.md` and `epic.md` stay coordinator-owned and were not edited.

## Delivery

- Branch: `feat/002-d-release-candidate`
- Base: `origin/main` `0f2dd8637be8f87237c5622c8314aea28b9068ac`
- Implementation commit: `1b93ff8630a19d4d1ec1826e453faabcd416ebc8`
- Pull request: https://github.com/exones/braid/pull/7
- Head SHA: `1b93ff8630a19d4d1ec1826e453faabcd416ebc8` is the parent of this delivery commit. The pull request head is this commit. Its object id is in the pull request body after the following push.
- Done: no
