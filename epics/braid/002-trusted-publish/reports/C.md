# Task C: guard the OIDC release workflow

Status: partly proven. Date: 2026-11-03.
Backlog item: `epics/braid/002-trusted-publish/backlog/C-oidc-guard.md`. Checkout/branch/HEAD: `C:\worktrees\agento\t3-579092d3`; `feat/002-c-oidc-guard`. The pull request head is the delivery commit that contains this sentence.

## Outcome

The merged release workflow keeps the trusted-publishing shape, and `scripts/Verify.ps1` now fails if that shape is dropped. The check reads `.github/workflows/release.yml`. It does not dispatch the workflow, set `BRAID_RELEASE`, or publish.

The guarded names are the ones in the workflow on `main`: `BRAID_RELEASE`, not `AGENTO_RELEASE`. A copy that renames the variable back to `AGENTO_RELEASE` fails. The publish command remains `npm publish --ignore-scripts` on that job's tarball. That flag is the publish control already in the workflow. It is not the install allowlist from AGENTO-002/B.

Acceptance criteria: the real workflow passes only while every required condition is present; copies that drop `id-token: write` or name `NPM_TOKEN` or `NODE_AUTH_TOKEN` fail; the diff does not dispatch, set the repository variable, change `private`, or add a workflow file; `docs/decisions.md` has the dated log entry and `docs/roadmap.md` links this epic. Hosted CI, review, and human merge are not done.

## Changes introduced

- `test/fixtures/oidc-release/Test-OidcReleaseGuard.ps1` checks the publish job for `id-token: write`, Node.js 26, `workflow_dispatch` with input `confirm`, and `github.event.inputs.confirm == 'publish'`. The publish step must exit before `npm publish` when npm is older than 11.5.1. `npm publish --ignore-scripts` must receive the single `artifacts/package` tarball, and only when `package.json` `private` is not true and `vars.BRAID_RELEASE` is `enabled`. The file must not name `NPM_TOKEN` or `NODE_AUTH_TOKEN`. A comment or a workflow-level permission does not satisfy job `id-token: write`. `(& npm --version)` is not treated as publish.
- The same script writes negative copies under the temp directory, outside `.github/workflows`, and deletes them. Those copies are not a second workflow file. The only workflow that invokes npm publish remains `release.yml`.
- `scripts/Verify.ps1` runs that script after dependencies are present and before the install-policy fixture. `.github/workflows/release.yml` and `.github/workflows/ci.yml` are unchanged.
- `docs/decisions.md` records the 2026-11-03 OIDC choice, Node.js 26, and that Forgejo is not an npm OIDC provider. `docs/roadmap.md` links `epics/braid/002-trusted-publish/epic.md` in one sentence.

## Evidence

Toolchain: `pwsh -NoProfile -File .\scripts\Install-NodeToolchain.ps1`. It verified Node.js 26.13.0 win-x64 SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a` and used `.tools/node/node-v26.13.0-win-x64`. npm is that directory's `node_modules/npm/bin/npm-cli.js`.

| Check | Exact command or method | Result | Revision |
| --- | --- | --- | --- |
| Base | `git fetch` was already current; `git rev-parse HEAD`; `git rev-parse origin/main`; `git checkout -b feat/002-c-oidc-guard origin/main` | Both revisions were `acd87301c8c267b7b89651c1e2b01913d6c84692`, `Merge pull request #3 from exones/feat/skill-human-rundown`. `release.yml` on that commit uses `BRAID_RELEASE`. Upstream was unset before the first push so the branch could not track `main`. | `origin/main` |
| Guard | `pwsh -NoProfile -File .\test\fixtures\oidc-release\Test-OidcReleaseGuard.ps1` | Exit 0. Real `release.yml` passed. Negatives failed closed: missing `id-token: write`, commented `id-token`, workflow-level `id-token` only, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, Node.js 24, npm gate weakened to 11.5.0, npm gate removed, `confirm` not `publish`, `workflow_call` instead of `workflow_dispatch`, `AGENTO_RELEASE`, `-or` instead of private and `BRAID_RELEASE`, unconditional publish, and publish without the tarball path. Node.js `26.13.0` and unquoted `26` still passed. | Dirty tree before `9a4617e`, same script as the commit |
| npm ci | Pinned `node.exe` running pinned `npm-cli.js` `ci` | Exit 0. `added 4 packages, and audited 5 packages in 2s`. `found 0 vulnerabilities`. | Before the implementation commit |
| Verify, clean | `pwsh -NoProfile -File .\scripts\Verify.ps1` | Exit 0. Node `v26.13.0`, npm `11.20.0`. Guard passed, install-policy passed, typecheck, build, 40 tests in 3 suites, 0 failed. Package proof then ran. | `9a4617e9f5d2857cbece000c6700d45069ae44f4` |
| Package proof inside that verify | Printed by `scripts/Test-Package.ps1` | Clean worktree. Digest `491f2aa7de5c303f302f92e4fa8d5b1c06fb951c8af6f86fb136cdc6f4b9adb0`. Source revision `9a4617e9f5d2857cbece000c6700d45069ae44f4`. `candidate` true. PowerShell `7.6.9`. Lock timeout 5416 ms. | Implementation commit, before this delivery commit |

The guard establishes that this `release.yml` still has each OIDC condition, and that the listed bad copies fail. It does not establish hosted CI, review, or merge. The clean package proof is the implementation commit. This delivery commit adds only epic markdown. Those files are outside `package.json` `files`. Hosted CI on the pull request head is the clean run of the full candidate.

## Decisions

- Guard `BRAID_RELEASE` as it appears in `release.yml`. Do not rename it to `AGENTO_RELEASE`.
- Require job `id-token: write` on the job that invokes npm publish. Workflow-level `id-token: write` and a comment do not pass.
- Recognize Node.js 26 as `node-version` 26, including `26.x`. Node.js 24 fails.
- Keep the npm 11.5.1 comparison that exits before publish. A gate of 11.5.0 fails.
- Keep negative copies out of `.github/workflows`. npm matches the workflow filename that contains `npm publish`, which stays `release.yml`.
- Do not treat `npm publish --ignore-scripts` as AGENTO-002/B's install allowlist. `.npmrc` is unchanged.

## Open points

- Hosted CI, review, and human merge are still open. This item is not Done.
- This commit does not record a hosted result. The handoff reports the result for the pull request head after the required checks finish. Recording that result in git would change the head.
- `package.json` `private` was already `false` on this `main`. This story does not change it. Publish still requires `BRAID_RELEASE` to be `enabled`. That variable was not set. The workflow was not dispatched. `npm publish` and `scripts/Publish-Npm.ps1` were not run.
- README's numbered verify list still starts at typecheck. It does not name this guard. The script `scripts/Verify.ps1` is what CI runs.
- The Forgejo sentence records the epic's 2026-11-03 finding. This story did not probe Forgejo.

## Resume

Coordinator: use the pull request for review and human merge after the hosted checks on this head are known. Keep this item in review until those gates pass. AGENTO-002/E reviews B and C. Do not mark C Done from this report.

## Proposed shared updates

Do not mark C Done. Epic row C becomes `in-review`. Evidence: this report and the pull request. Local proof is the guard, including the negative copies, and the clean verify of the implementation commit. Hosted CI is not stored in this commit.

- Row C status: `in-review`.
- Rows D and E stay as they are. E remains backlog until B and C are both handed back.
- `epics/braid/002-trusted-publish/checkpoints/current.md` and `epic.md` stay coordinator-owned and were not edited.
- `epics/braid/001-seed/checkpoints/current.md` was not edited.

## Delivery

- Branch: `feat/002-c-oidc-guard`
- Base: `origin/main` `acd87301c8c267b7b89651c1e2b01913d6c84692`
- Implementation commit: `9a4617e9f5d2857cbece000c6700d45069ae44f4`
- Pull request: https://github.com/exones/braid/pull/4
- Head SHA: `9a4617e9f5d2857cbece000c6700d45069ae44f4` is the parent of this delivery commit. The pull request head is this commit. Its object id is in the pull request body.
- Done: no
