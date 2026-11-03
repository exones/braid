# E: review the install policy and OIDC guard

Parent: AGENTO-002. Pass: assigned review E. Reviewer: independent reviewer for AGENTO-002/E. This reviewer did not author AGENTO-002/B or AGENTO-002/C and is not the coordinator.
Agent/assignment name: E.
Report/checkpoint: `epics/braid/002-trusted-publish/reports/E.md` and `epics/braid/002-trusted-publish/checkpoints/E.md`. These are the assigned output paths for this running review.
Status: no-findings. Date: 2026-11-03.

## Reviewed revisions

| Candidate | Pull request | Head | Comparison |
| --- | --- | --- | --- |
| AGENTO-002/B | https://github.com/exones/braid/pull/2 | `ab57b4d668aaf8271fa7d6ac73ef8550e721a173` | Merge `126145278c3d9aae7df82d4f5252d97a39057931` against first parent `75e293b8da799e8300c299e07c410a48c43c3d3f` |
| AGENTO-002/C | https://github.com/exones/braid/pull/4 | `ade7b918247b571cdd441071965cf07a0baf4c0f` | Diff against base `acd87301c8c267b7b89651c1e2b01913d6c84692` |

`git diff ab57b4d668aaf8271fa7d6ac73ef8550e721a173 126145278c3d9aae7df82d4f5252d97a39057931` is empty, so the merged B tree is the reviewed B head. GitHub records PR 2 as merged at 2026-11-03T21:15:44Z. That recorded merge is not an approval by this review. PR 4 was open at review time.

## Scope and evidence

Checked the install policy and the OIDC regression check against the epic and the two stories, and checked that neither story publishes. Read `AGENTS.md`, `docs/decisions.md`, `docs/roadmap.md`, `epics/braid/002-trusted-publish/epic.md`, `reports/A.md`, `reports/B.md`, `reports/C.md` at the C head, backlog items B, C, and E, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, and both diffs.

B's merge diff changes `.npmrc`, `README.md`, `scripts/Verify.ps1`, `test/fixtures/install-policy/`, and the B checkpoint, report, and backlog item. C's diff changes `docs/decisions.md`, `docs/roadmap.md`, `scripts/Verify.ps1`, `test/fixtures/oidc-release/Test-OidcReleaseGuard.ps1`, and the C checkpoint, report, and backlog item. Neither diff changes `package.json`, `.github/workflows/release.yml`, or `.github/workflows/ci.yml`.

This review re-ran the C guard script from `ade7b918247b571cdd441071965cf07a0baf4c0f` against the repository `release.yml`. It did not re-run the install-policy npm installs. It did not publish, dispatch `release.yml`, set `BRAID_RELEASE`, or change `private`.

## Findings

No actionable findings.

## Acceptance assessment

AGENTO-002/B. Proven.

- `.npmrc` at the reviewed merge keeps `engine-strict=true` and adds `strict-allow-scripts=true`, `allow-git=none`, and `allow-remote=none`. `ignore-scripts` and `dangerously-allow-all-scripts` are not set. The root manifest has no `allowScripts` field. `engines.node` remains `>=26.13.0 <27`.
- `test/fixtures/install-policy/Test-InstallPolicy.ps1` copies that `.npmrc` into temporary projects. An unreviewed `file:./scripty` `postinstall` must exit 1 with `ESTRICTALLOWSCRIPTS` and must not write its markers. A `git+https` spec must exit 1 with `EALLOWGIT`. An `https://` tarball spec must exit 1 with `EALLOWREMOTE`. `left-pad@1.3.0` must still install. `scripts/Verify.ps1` runs that fixture.
- The real lockfile still installs under that policy. Every `resolved` value in `package-lock.json` is a `https://registry.npmjs.org/` tarball. The lockfile has no `hasInstallScript`, git spec, or `file:` spec. `.github/workflows/ci.yml` runs `npm ci` before `npm run verify`. Hosted CI on head `ab57b4d668aaf8271fa7d6ac73ef8550e721a173` succeeded for `verify (windows-latest)` and `verify (ubuntu-latest)` in runs `41718749103` and `41718742283`.
- The B diff does not dispatch, set `BRAID_RELEASE`, call `npm publish`, or change `private`.

AGENTO-002/C. Proven.

- `test/fixtures/oidc-release/Test-OidcReleaseGuard.ps1` reads `.github/workflows/release.yml` and checks job `id-token: write`, absence of `NPM_TOKEN` and `NODE_AUTH_TOKEN`, Node.js 26, an npm 11.5.1 gate that exits before publish, `workflow_dispatch` with input `confirm` and `github.event.inputs.confirm == 'publish'`, and `npm publish --ignore-scripts` of that job's single `artifacts/package` tarball only when `private` is not true and `vars.BRAID_RELEASE` is `enabled`. The guard requires the workflow name `BRAID_RELEASE`. The backlog text says `AGENTO_RELEASE`; the workflow and the guard use `BRAID_RELEASE`.
- The same script's negative copies fail closed when `id-token: write` is removed, when `NPM_TOKEN` is named, and when `NODE_AUTH_TOKEN` is named. The local re-run also failed closed for a commented `id-token`, workflow-level `id-token` only, Node.js 24, an npm 11.5.0 comparison, a removed npm gate, `confirm` other than `publish`, `workflow_call` instead of `workflow_dispatch`, `AGENTO_RELEASE`, `-or` instead of private and `BRAID_RELEASE`, an unconditional publish step, and publish without the tarball path. `node-version` `26.13.0` and unquoted `26` still passed. Exit 0.
- C adds one decision-log entry, dated 2026-11-03, for GitHub-hosted Actions OIDC, Node.js 26, and Forgejo. It adds one roadmap sentence linking `epics/braid/002-trusted-publish/epic.md`. It does not add a second workflow file. It does not dispatch, set `BRAID_RELEASE`, or change `private`.
- `package.json` `private` is already `false` on this `main`, from `9e9d086`, before either story. Both stories leave it unchanged. Publish still requires a `workflow_dispatch` whose `confirm` input is `publish` and repository variable `BRAID_RELEASE` equal to `enabled`. Neither story does that. No package publication is claimed.
- Hosted CI on C head `ade7b918247b571cdd441071965cf07a0baf4c0f` succeeded for `verify (windows-latest)` and `verify (ubuntu-latest)` in runs `41724328954` and `41724321087`. That is CI for the C candidate, not for this review.

## Triage and gate

No product correction is returned. The coordinator owns triage and the epic gate. This note is not a GitHub approval of pull request 2 or pull request 4. Human merge of this review remains the user's decision. AGENTO-002/E is not Done.

## Resume

Coordinator: use this review's pull request for hosted CI and human merge. Do not mark E Done from this report. No implementation fix is queued by this pass.

## Delivery

- Branch: `feat/002-e-review`
- Base: `origin/main` `acd87301c8c267b7b89651c1e2b01913d6c84692`
- Pull request: recorded in the delivery commit that contains the pull request URL
- Done: no
