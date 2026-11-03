# B: fail unreviewed install scripts

Kind: story. Epic: [AGENTO-002](../epic.md). Feature: public npm release.
Status: in-review. Owner: one implementation worker. Depends on: AGENTO-002/A. Not Done.

## Read first

`AGENTS.md`, `docs/decisions.md`, this epic, `checkpoints/current.md`, `reports/A.md`, `docs/npm-distribution.md`, `package.json`, and the lockfile.

## Value or research question

CI install fails when a dependency install script is neither approved nor explicitly denied, and git or remote URL dependencies stay disallowed. The maintainer gets the npm 12 install default without waiting for an unplanned toolchain jump.

## Scope and non-goals

Implement the enforcement choice recorded by AGENTO-002/A. The real lockfile must pass. A fixture dependency with an unreviewed `postinstall` must fail the check. If AGENTO-002/A found a git or remote URL dependency, name it in this story and keep every other one disallowed. If AGENTO-002/A found none, keep both classes disallowed.

Do not set `ignore-scripts=true`. Do not set `dangerously-allow-all-scripts`. Do not change the Node.js engine to 24. Do not publish, dispatch, or set `private` to false. Do not edit `feat/package-bootstrap`.

## Acceptance criteria

1. Given the repository lockfile and the enforcement from AGENTO-002/A, when CI install runs, then the install passes.
2. Given a fixture dependency whose `postinstall` is neither approved nor explicitly denied, when the check runs, then the check fails.
3. Given a git dependency or a remote URL dependency that AGENTO-002/A did not name, when the check runs, then the check fails.
4. Given this story's diff, when it is reviewed, then publish remains unauthorized and `engines.node` is still `>=26.13.0 <27`.

## Implementation or research tasks

- [x] Read the AGENTO-002/A decision and apply that mechanism only.
- [x] Keep the real lockfile green.
- [x] Add the unreviewed-`postinstall` fixture failure.
- [x] Write `checkpoints/B.md` and `reports/B.md`. Stop after this item.

## Ownership and verification

Own the install-policy files AGENTO-002/A named, plus `checkpoints/B.md` and `reports/B.md`. Meaningful check: the real install and the fixture failure. Hosted CI must pass on the PR head. Review is AGENTO-002/E after AGENTO-002/C exists, and this story's own PR still needs review and human merge before Done. Do not mark Done from a local run alone.

## Delivery record

- Branch: `feat/002-b-install-scripts`
- Base: `origin/main` `75e293b8da799e8300c299e07c410a48c43c3d3f`
- Decision: empty `allowScripts` allowlist, enforced with `strict-allow-scripts=true`, `allow-git=none`, and `allow-remote=none` in `.npmrc`. No root `allowScripts` field.
- Pull request: recorded in the delivery commit
- Head SHA: recorded in the delivery commit
- Status: `in-review`. Not Done. Hosted CI, review, and human merge remain.

## Report and resume

Evidence: [checkpoint](../checkpoints/B.md) and [report](../reports/B.md). In coordinated mode the coordinator owns shared status. Stop after this item. AGENTO-002/C is next and starts only after AGENTO-002/B is handed back, because both touch CI and docs.
