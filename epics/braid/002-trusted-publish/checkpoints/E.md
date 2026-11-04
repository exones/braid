# AGENTO-002/E checkpoint

Updated: 2026-11-03. Reviewer-owned. Coordinator owns `epics/braid/002-trusted-publish/checkpoints/current.md` and `epic.md`. Those files were not edited. `epics/braid/001-seed/checkpoints/current.md` was not edited.

## Task and checkout

Review AGENTO-002/E, install policy and OIDC guard. Checkout: `C:\worktrees\agento\t3-bd29b5ae`. Branch: `feat/002-e-review`, created from `origin/main` `acd87301c8c267b7b89651c1e2b01913d6c84692`. Upstream was unset so this branch does not track `main`. Controller: manual epic files. No subagents. No product code changes.

## Reviewed revisions

- AGENTO-002/B head `ab57b4d668aaf8271fa7d6ac73ef8550e721a173`. Merge `126145278c3d9aae7df82d4f5252d97a39057931` against first parent `75e293b8da799e8300c299e07c410a48c43c3d3f`. Pull request https://github.com/exones/braid/pull/2. The merge tree matches that head.
- AGENTO-002/C head `ade7b918247b571cdd441071965cf07a0baf4c0f`. Base `acd87301c8c267b7b89651c1e2b01913d6c84692`. Pull request https://github.com/exones/braid/pull/4.

## Completed

- Read the epic, reports A and B, report C at the C head, and both candidate diffs.
- Confirmed B keeps `engine-strict=true` and adds `strict-allow-scripts=true`, `allow-git=none`, and `allow-remote=none`, with a fixture for an unreviewed postinstall, a git spec, and a remote URL spec. Hosted CI on the B head shows the real lockfile still installs.
- Confirmed C guards `release.yml` for job `id-token: write`, no `NPM_TOKEN` or `NODE_AUTH_TOKEN`, Node.js 26, an npm 11.5.1 gate, `workflow_dispatch` with `confirm` equal to `publish`, and tarball `npm publish` only when `private` is not true and `BRAID_RELEASE` is `enabled`. Re-ran `Test-OidcReleaseGuard.ps1` from the C head. Exit 0. The required negative copies failed closed.
- Confirmed one new `docs/decisions.md` log entry and one new `docs/roadmap.md` sentence. Neither story publishes.
- Findings: none. Report: `epics/braid/002-trusted-publish/reports/E.md`.

## In flight

None in this checkout. This review's hosted CI is not recorded in git. Recording it would change the pull request head.

## Checks

Local OIDC guard re-run: exit 0, cited in `reports/E.md`. Install-policy npm installs were not re-run here. Candidate hosted CI is cited there and is not CI for this review branch. No publish, no dispatch, no `private` edit.

## Changed files

- `epics/braid/002-trusted-publish/reports/E.md`
- `epics/braid/002-trusted-publish/checkpoints/E.md`
- `epics/braid/002-trusted-publish/backlog/E-review.md`

## Next concrete action

Pull request: https://github.com/exones/braid/pull/5. Review commit `57a8c6f076b3b54e7603be029788dcf5ca1e35ca` is the parent of the commit that stores this sentence, and that commit is the pull request head. Wait for hosted CI on that head. Do not mark E Done. No product fix is assigned by this pass.

## Blockers

None. Human merge of this review remains the user's decision. This checkpoint does not claim a GitHub approval or a published package.
