# Epic AGENTO-002: trusted publishing to public npm

Owner: user. Coordinator: resumed delivery, 2026-11-03. Status: in-progress; A/B/C delivered, E's review-record PR open. D's 0.1.1 candidate passed local checks, candidate CI, and no-findings independent preparation review. Final evidence-head CI, human merge, and separately authorized OIDC publication remain. See [current checkpoint](checkpoints/current.md); original planning analysis below is historical.
Release target: none. Controller: bootstrap `agento-coordinate` skill and manual files.

## Problem and beneficiary

The maintainer needs fully automatic publish to public npm without a long-lived token before bypass-2FA granular tokens lose direct `npm publish` around January 2027. npm 12 also stops unapproved dependency lifecycle scripts, git dependencies, and remote URL dependencies. The beneficiary is the maintainer of public `exones/agento`.

## Outcomes and success measures

1. Later evidence shows `release.yml` publishes only through GitHub-hosted OIDC, with `id-token: write` and without `NPM_TOKEN` or `NODE_AUTH_TOKEN`.
2. CI fails when a dependency install script, git dependency, or remote URL dependency is present and unreviewed.
3. The user-owned npm account, package name, and trusted-publisher steps stay an explicit blocked checklist.
4. This planning change contains only the plan.

Merging the plan does not publish a package and does not satisfy outcomes 1–3.

## Scope and non-goals

Delivery was authorized and A/B/C have merged. User reports D's trust/access settings saved and asked the coordinator to continue. Prepare and validate the next patch release candidate, 0.1.1, through one isolated implementation worker. Public 0.1.0 already exists; successful OIDC publish of a new version is the remaining integration proof. Preparation does not authorize publication by the agent. E's review-record merge is separate.

Current D exclusions: agent publication, workflow dispatch, enabling `BRAID_RELEASE`, privacy changes, tags, GitHub Releases, bypass-2FA tokens, paid services, and infrastructure changes. The authorized candidate preparation may update version metadata and directly necessary documentation/tests. Install and OIDC controls from B/C remain as delivered.

This D preflight updates only its checklist and coordinator status/evidence. Product, workflow, package, and release settings are not changed.

## Analysis

Original planning baseline follows. Use the current checkpoint, backlog D, and dated delivery evidence for present package/repository/PR state; the old name, branch, and absent-workflow observations below are not current blockers.

Checked 2026-11-03. Facts below were already verified; this planning pass did not probe a live npm account and did not run `npm approve-scripts`.

Changelog [npm install-time security and GAT bypass2fa deprecation](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/), 8 July 2026:

- npm 12 is generally available. `allowScripts` defaults to off. `--allow-git` and `--allow-remote` default to `none`. npm 11.16 and newer only warn.
- Early August 2026, bypass-2FA granular tokens were expected to lose account, package, and organization management, including trusted-publisher changes.
- Around January 2027 they were expected to lose direct `npm publish` and keep read of private packages plus staged publish with human 2FA.
- The changelog wording is "we expect".

[Trusted publishing](https://docs.npmjs.com/trusted-publishers/):

- Providers are GitHub Actions on GitHub-hosted runners, GitLab.com shared runners, and CircleCI cloud. Self-hosted runners are unsupported.
- npm CLI 11.5.1 or later and Node.js 22.14.0 or later.
- The workflow filename includes `.yml`. Configurations created after 2026-09-03 default to `npm stage publish`. Direct `npm publish` must be explicitly allowed.
- An unused new configuration expires in two days.
- `repository.url` must match the GitHub repository. Public-repository provenance is automatic. Do not pass `--provenance`.

Forgejo is not an npm OIDC provider. [forgejo/forgejo#12311](https://codeberg.org/forgejo/forgejo/issues/12311): if `ACTIONS_ID_TOKEN_REQUEST_URL` is set, npm assumes GitHub Actions and will not fall back to a token. D06 already excludes Forgejo registry deployment. This epic adds no Forgejo work.

Repository:

- `origin/main` is `afc05074a27da2cb1a3c225bc9d42d10f184e504`. It has `docs/npm-distribution.md` and `docs/decisions.md` selecting npm trusted publishing. `release.yml` is absent on that commit and on this branch.
- This branch's merge-base with `origin/main` is that same commit. AGENTO-001/D commit `10ff911294a72957fe7fc689757bb33d3c72b38d` is not an ancestor. It lives on `feat/package-bootstrap` in `C:\code\agento` and is not edited here.
- That AGENTO-001/D commit adds `release.yml`: `workflow_dispatch`, `confirm` must be `publish`, permissions `contents: read`, `actions: write`, and `id-token: write`, Node.js 26, no `NPM_TOKEN` or `NODE_AUTH_TOKEN`. It runs `npm publish` on the verified tarball with `--ignore-scripts` only when `private` is not true and `AGENTO_RELEASE` is `enabled`, and it gates on npm 11.5.1 or newer. CI on that branch does not grant `id-token`. The package stays private. The AGENTO-001/D report recorded local toolchain Node.js v26.13.0 and npm 11.20.0.
- `package.json` on this branch sets `engines.node` to `>=26.13.0 <27` and `private` to true. Node.js 24 appears only as the generic example in the npm docs. This plan does not downgrade the engine.
- Direct dependencies on the AGENTO-001/D branch are `typescript` and `@types/node`. A search found no `hasInstallScript`, `postinstall`, or `preinstall` in `package-lock.json`. That search is not an `npm approve-scripts` inventory.
- The unscoped npm name `agento` is a different package, version 0.1.2 on 2026-11-03.

Defaults:

- Keep the AGENTO-001/D workflow shape and guard it in AGENTO-002/C. Do not add a second workflow file. npm matches the filename that contains `npm publish`.
- AGENTO-002/A chooses strict allow-scripts on npm 11.20 or one npm 12 check, without changing the Node.js engine.
- Decision-log and roadmap edits wait for AGENTO-002/C.
- The package name blocks AGENTO-002/D only. It does not block review of this plan. AGENTO-002/D is the npm-account task. AGENTO-001/D is the seed packaging story.

## Features and prioritized backlog

IDs in this table run A, B, C, D, E. [AGENTO-001/D](../001-seed/backlog/D-package.md) is the seed packaging story and is not a row here. AGENTO-002/D is the npm-account task. AGENTO-001/R is the seed review. AGENTO-002/E is the review in this table.

| ID | Kind | Outcome | Depends on | Owner | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| A | spike | [Publish and install-script facts](backlog/A-publish-facts.md) | seed D merged and execution authorized | implementation worker | done | [PR #1](https://github.com/exones/braid/pull/1), merge `75e293b`, Windows/Ubuntu CI passed |
| B | story | [Fail unreviewed install scripts](backlog/B-install-scripts.md) | AGENTO-002/A | implementation worker | done | [PR #2](https://github.com/exones/braid/pull/2), merge `1261452`, Windows/Ubuntu CI passed; review record in PR #5 |
| C | story | [Guard the OIDC release workflow](backlog/C-oidc-guard.md) | A/B and seed D merged | implementation worker | done | [PR #4](https://github.com/exones/braid/pull/4), merge `0f2dd86`; no-findings review record in PR #5 |
| D | task | [npm account and trusted publisher](backlog/D-npm-account.md) | user settings and verified release candidate | user/coordinator | in-review | [PR #7](https://github.com/exones/braid/pull/7), reviewed payload `625d2557`; [inspection/artifact/CI](reports/D-release-assignment.md), [no-findings review](reports/reviews/D/D-npm-account-review-001.md). Final delivery CI/merge and OIDC publication pending |
| E | review task | [Review B and C](backlog/E-review.md) | B/C candidate exists | separate reviewer | in-review | [PR #5](https://github.com/exones/braid/pull/5), no findings, head `9451cf5`, Windows/Ubuntu CI passed; human merge pending |

Order and WIP: one implementation worker. A/B/C have delivered; E's review is complete and its record awaits human merge. D remains user-owned and does not require an implementation worker. Continue D only after authenticated account setup evidence arrives.

## Definition of Ready and Definition of Done

Use [the project workflow](../../../docs/agile-workflow.md). D's public package prerequisites are met; authenticated trust setup and first successful OIDC publishing evidence are still missing. Keep it blocked until those user-owned steps are complete.

Item Done needs the acceptance criteria, a PR, hosted CI on that head, review, and human merge. Local notes are not Done. Epic Done is not a published package. Publication remains a separate authorization outside this plan.

## Decisions and open questions

Dated 2026-11-03, planning:

- OIDC from GitHub-hosted Actions is the automatic publish path.
- Staged publish plus human 2FA is the documented fallback, not the primary path.
- Keep Node.js 26. Do not adopt the documentation example Node.js 24.
- Forgejo stays out.

Open:

- User must configure the trusted publisher in their npm session and confirm account 2FA. Package identity and initial publication are already complete. D remains blocked on that setup and the separately authorized first OIDC publication.
- A selected strict allow-scripts on current npm; B delivered it. No npm 12 migration is pending here.

## Delivery evidence and release checklist

- [x] Analysis: inspected `docs/npm-distribution.md` and `docs/decisions.md` on `main` `afc05074a27da2cb1a3c225bc9d42d10f184e504`, confirmed `release.yml` is absent there and on this branch, and confirmed AGENTO-001/D `10ff911294a72957fe7fc689757bb33d3c72b38d` contains `release.yml` and is not in this branch. See [the planning report](reports/planning.md).
- [ ] Planning PR linked: https://github.com/exones/agento/pull/3 at plan head `ac4e2cf53208d72d8b50a3149e64d85930fb385f`. Review and human merge are still open. Hosted CI is not recorded in this report.
- [x] No publish is claimed. This change does not dispatch, set `AGENTO_RELEASE`, or set `private` to false.
- [x] A/B/C implementation merged; current evidence is in the backlog table above.
- [ ] E review-record PR #5 human merge recorded.
- [ ] D authenticated setup, first OIDC publication, and remaining user-owned security settings verified.

No `reports/final.md` and no `retro.md` are part of this change.
