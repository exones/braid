# AGENTO-002/B checkpoint

Updated: 2026-11-03. Worker-owned. Coordinator owns `checkpoints/current.md` and `epic.md`; those files were not edited.

## Task and checkout

Story AGENTO-002/B, fail unreviewed install scripts. Checkout: `C:\worktrees\agento\t3-4b07542d`. Branch: `feat/002-b-install-scripts`, created from `origin/main` `75e293b8da799e8300c299e07c410a48c43c3d3f` (merge of PR #1). Controller: manual epic files. No subagents.

## Completed

- Confirmed `origin/main` and the starting HEAD are `75e293b8da799e8300c299e07c410a48c43c3d3f`, subject `Merge pull request #1 from exones/feat/002-a-publish-facts`.
- Added `strict-allow-scripts=true`, `allow-git=none`, and `allow-remote=none` to `.npmrc`. Kept `engine-strict=true`. Did not add `allowScripts` to the root `package.json`.
- Called `test/fixtures/install-policy/Test-InstallPolicy.ps1` from `scripts/Verify.ps1`. The fixture is a separate project. `.github/workflows` still runs `npm ci` and then `npm run verify`.
- Local pinned Node.js `v26.13.0` / npm `11.20.0`: root `npm ci` exited 0. The fixture showed the required exits. `scripts/Verify.ps1` exited 0 (40 tests, then a dirty packed-install probe).

## In flight

None. No publish, no `BRAID_RELEASE`, no `scripts/Publish-Npm.ps1`.

## Checks

Cited in `reports/B.md`. The packed-install probe in that verify run was dirty, so its digest is not a committed candidate. Hosted CI on the pull request head is the clean run.

## Changed files

- `.npmrc`
- `scripts/Verify.ps1`
- `test/fixtures/install-policy/Test-InstallPolicy.ps1`
- `test/fixtures/install-policy/scripty/package.json`
- `test/fixtures/install-policy/scripty/postinstall.js`
- `epics/braid/002-trusted-publish/reports/B.md`
- `epics/braid/002-trusted-publish/checkpoints/B.md`
- `epics/braid/002-trusted-publish/backlog/B-install-scripts.md`

## Next concrete action

Pull request: https://github.com/exones/braid/pull/2. Implementation commit `52deda6bb7c811b730cab7a5432c07a9b67e8781` is the parent of the delivery commit that stores this sentence, and that delivery commit is the pull request head. Its object id is in the pull request body. Coordinator takes hosted CI, review, and human merge. Do not mark Done. Do not start AGENTO-002/C from this worker.

## Blockers

None for this story. Done still needs the pull request, hosted CI on its head, review, and human merge.
