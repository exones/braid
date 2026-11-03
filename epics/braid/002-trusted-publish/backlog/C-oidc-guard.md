# C: guard the OIDC release workflow

Kind: story. Epic: [AGENTO-002](../epic.md). Feature: public npm release.
Status: backlog. Owner: one implementation worker. Depends on: AGENTO-002/A, AGENTO-002/B, and [AGENTO-001/D](../../001-seed/backlog/D-package.md) merged.

## Read first

`AGENTS.md`, `docs/decisions.md`, `docs/roadmap.md`, `docs/npm-distribution.md`, this epic, `checkpoints/current.md`, `reports/A.md`, and the merged `.github/workflows/release.yml`. AGENTO-002/B has already finished when this item starts, because AGENTO-002/B and AGENTO-002/C both touch CI and docs.

## Value or research question

The merged release workflow keeps the trusted-publishing shape from AGENTO-001/D, and a regression check fails if that shape is dropped. The maintainer can see the OIDC choice in the decision log after AGENTO-001/D is on `main`.

## Scope and non-goals

After AGENTO-001/D is merged, add a regression check that `release.yml` still has all of the following:

- job `id-token: write`
- no `NPM_TOKEN` and no `NODE_AUTH_TOKEN`
- Node.js 26
- an npm 11.5.1 or newer gate
- `workflow_dispatch` with `confirm` equal to `publish`
- `npm publish` of that job's tarball only when `private` is not true and `AGENTO_RELEASE` is `enabled`

Do not dispatch the workflow. Do not set `AGENTO_RELEASE`. Do not flip `private`. Do not add a second workflow file. npm matches the filename that contains `npm publish`.

After AGENTO-001/D is on `main`, add one dated `docs/decisions.md` log entry for this epic's OIDC, Node.js 26, and Forgejo choices, and one `docs/roadmap.md` sentence linking `epics/agento/002-trusted-publish/epic.md`. The planning PR does not claim those docs are updated.

Keep `npm publish --ignore-scripts` on the packed tarball as the publish control already prepared by AGENTO-001/D. Do not treat it as the install allowlist from AGENTO-002/B.

## Acceptance criteria

1. Given the merged `release.yml`, when the regression check runs, then it passes only while every condition above is present.
2. Given a copy of that workflow missing `id-token: write` or naming `NPM_TOKEN` or `NODE_AUTH_TOKEN`, when the check runs, then it fails.
3. Given the story diff, when it is read, then no dispatch, repository variable, `private` change, or second workflow file is included.
4. Given AGENTO-001/D on `main`, when the story finishes, then `docs/decisions.md` has the dated log entry and `docs/roadmap.md` links this epic.

## Implementation or research tasks

- [ ] Confirm `release.yml` on `main` is the workflow merged with AGENTO-001/D before editing.
- [ ] Add the regression check without dispatching.
- [ ] Add the decision-log entry and the one roadmap sentence.
- [ ] Write `checkpoints/C.md` and `reports/C.md`. Stop after this item.

## Ownership and verification

Own the regression check, the two documentation sentences, `checkpoints/C.md`, and `reports/C.md`. Meaningful check: the regression check against the real workflow and against a negative fixture. Hosted CI must pass. Do not mark Done because the planning PR merged. AGENTO-002/E reviews the candidate.

## Delivery record

Empty until assigned.

## Report and resume

Write `epics/agento/002-trusted-publish/checkpoints/C.md` and `epics/agento/002-trusted-publish/reports/C.md`. Stop after this item.
