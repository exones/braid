# Task planning: trusted npm publishing

Status: partly proven. Date: 2026-11-03.
Backlog item: epic plan, not an implementation item. Checkout/branch/HEAD: `C:\worktrees\agento\docs-002-trusted-publish`, branch `docs/002-trusted-publish`, plan head `ac4e2cf53208d72d8b50a3149e64d85930fb385f`, base `afc05074a27da2cb1a3c225bc9d42d10f184e504`. PR: https://github.com/exones/agento/pull/3.

## Outcome

Reviewable plan for AGENTO-002. Automatic public publish is GitHub-hosted OIDC from `release.yml`. npm 12 install-script policy is spike A and story B. No product code, workflow, CI policy, or `package.json` change is in this delivery. Implementation is not authorized. Status is analysis only: the plan exists, and A, B, C, and E were not executed. AGENTO-002/D stays blocked.

An earlier commit on this branch had edited `docs/decisions.md`, `docs/roadmap.md`, and `docs/npm-distribution.md`. Those three files are restored to `origin/main` so the planning diff does not keep those edits. Story AGENTO-002/C adds the decision-log line and the roadmap sentence after AGENTO-001/D merges.

## Evidence

| Check | Exact command or method | Result | Revision/log/CI/PR link |
| --- | --- | --- | --- |
| Changelog | Fetched on 2026-11-03; not refetched for this rewrite | npm 12 is GA. `allowScripts` defaults off. `--allow-git` and `--allow-remote` default to `none`. npm 11.16+ warns. Bypass-2FA management loss was expected in early August 2026. Direct `npm publish` loss was expected around January 2027. Wording is "we expect". | https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/ |
| Trusted publishers | Fetched on 2026-11-03; not refetched for this rewrite | GitHub-hosted Actions, GitLab.com shared runners, CircleCI cloud. Self-hosted runners unsupported. npm CLI >= 11.5.1, Node >= 22.14.0. Post-2026-09-03 configs default to `npm stage publish`. Unused config expires in two days. Provenance is automatic. | https://docs.npmjs.com/trusted-publishers/ |
| Forgejo OIDC | Recorded issue, not a new probe | Forgejo is not an npm OIDC provider. `ACTIONS_ID_TOKEN_REQUEST_URL` makes npm assume GitHub Actions and skip token fallback. D06 already excludes Forgejo registry deployment. | https://codeberg.org/forgejo/forgejo/issues/12311 |
| `origin/main` | `git rev-parse origin/main` and `git merge-base HEAD origin/main` | Both `afc05074a27da2cb1a3c225bc9d42d10f184e504` | This worktree, 2026-11-03 |
| AGENTO-001/D | `git rev-parse 10ff911294a72957fe7fc689757bb33d3c72b38d`; `git merge-base --is-ancestor` against HEAD | Commit exists. Ancestor check exit 1. Not in this branch. | `10ff911294a72957fe7fc689757bb33d3c72b38d` on `feat/package-bootstrap` |
| `release.yml` | `Test-Path` here; `git cat-file -e` on main and on `10ff911` | Absent on this branch and on main (cat-file exit 128). Present on `10ff911` (cat-file exit 0). | AGENTO-001/D workflow shape recorded in the epic |
| Engines | `package.json` `engines.node` on this branch | `>=26.13.0 <27`. `private` is true. Not modified. | This worktree |
| Install scripts | No `npm approve-scripts` run | Lockfile text search on the AGENTO-001/D branch found no `hasInstallScript`, `postinstall`, or `preinstall`. That is not the inventory. | Deferred to AGENTO-002/A |
| npm account | No live account probe | Unscoped `agento` was a different package at 0.1.2 on 2026-11-03. No token requested. | Blocks AGENTO-002/D only |

## Decisions

- OIDC is the automatic path. Staged publish plus human 2FA is the documented fallback.
- Keep Node.js 26. Forgejo stays out.
- AGENTO-002/A chooses strict allow-scripts on npm 11.20 or one npm 12 check. The planning PR does not choose for A.
- Decision-log and roadmap edits wait for AGENTO-002/C, after AGENTO-001/D is on `main`.

## Open points

- User review of https://github.com/exones/agento/pull/3 at `ac4e2cf53208d72d8b50a3149e64d85930fb385f`. Hosted CI, review, and merge are open. `gh pr create` reported that this branch already had that PR, so the title and body were updated on it.
- Package identity blocks AGENTO-002/D and does not block plan review.
- AGENTO-002/A's enforcement choice is open until A runs.

## Resume

Original planning stop: implementation was not authorized at that boundary. Subsequent delivery was authorized; use the dated D resumption below and the shared checkpoint for current state. The original planning PR was https://github.com/exones/agento/pull/3.

## D account setup resumption

2026-11-03, user requested continuation with D. Local checkout `C:\code\agento`, branch `main`, HEAD `acd87301c8c267b7b89651c1e2b01913d6c84692`; preserve existing local preference/checkpoint edits and untracked Git-handoff analysis files. No Git/index/branch changes made in this preflight.

The name/initial-publication blockers are resolved. With pinned Node v26.13.0 and npm 11.20.0, `npm view @exones/braid name version repository.url dist.attestations --json` returned public `@exones/braid@0.1.0` and `git+https://github.com/exones/braid.git`. No attestation value was returned; this is not proof of trusted publishing. `npm whoami` returned `ENEEDAUTH`; `npm trust list @exones/braid --json` returned 401. The user confirmed that the trusted publisher is not configured. Account 2FA is unverified. `gh variable list --repo exones/braid --json name,value` returned an empty list.

The remaining exact setup fields are maintained in [the distribution guide](../../../../docs/npm-distribution.md#user-actions-before-any-publication). The user must configure npm through their authenticated account. D remains blocked until setup/readback and first successful OIDC publication are evidenced; no agent publish or dispatch is authorized by this task. Because 0.1.0 already exists, any later real release needs a separately selected, verified new version. [npm's trusted-publishing documentation](https://docs.npmjs.com/trusted-publishers/) requires a newly created binding to complete its first successful publish within two days. No secret, account write, registry write, `BRAID_RELEASE` change, or workflow dispatch occurred.

Verified existing GitHub delivery: braid PR #1/A merged at `75e293b`, PR #2/B at `1261452`, and PR #4/C at `0f2dd86`. PR #5 is the completed no-findings review record, open at `9451cf5` with Windows/Ubuntu CI passed. Its human merge is separate from D's authenticated npm setup. Updated the epic and shared checkpoint to reflect that current state rather than the original planning baseline. D-specific `reports/D.md` and `checkpoints/D.md` remain unwritten until the user-owned checklist is complete, as the task requires.

Local validation passed: all 15 local links/anchors across the four D status/checklist/report files resolve, and `git diff --check` passed. Product checks were not rerun for account-status notes. The result is an actionable blocked checklist, not D Done. Changes remain local alongside the preserved preference edits; nothing was staged, committed, or pushed during account preflight.

### Subsequent release candidate preparation

User subsequently reported saving npm publisher/access settings and chose token-free OIDC. The isolated 0.1.1 candidate is [PR #7](https://github.com/exones/braid/pull/7), reviewed payload `625d2557a322a345eb5580569dd69b79cfd7f408`, with clean local package proof, passing Windows/Ubuntu CI, and [no-findings independent preparation review](reviews/D/D-npm-account-review-001.md). [Candidate inspection and triage](D-release-assignment.md#preparation-review-and-release-handback) record the artifact/digest, exact evidence, and limits. Initial missing-configuration statements above describe that earlier preflight. D is now In Review for delivery, not blocked on another token or repeated setup. Human merge and explicit authority for the first OIDC publish remain; no registry/variable/dispatch operation has occurred.
