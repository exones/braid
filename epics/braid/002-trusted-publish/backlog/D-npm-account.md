# D: npm account and trusted publisher

Kind: task. Epic: [AGENTO-002](../epic.md). Feature: public npm release.
Status: in-review, release candidate prepared. Owner: user for npm settings; coordinator for candidate review/delivery. User reports publisher/access settings saved. [PR #7](https://github.com/exones/braid/pull/7), head `625d2557`, prepares 0.1.1 with clean local proof; independent review and release gates remain. First OIDC publication remains unverified.

This item is AGENTO-002/D. The seed packaging story is [AGENTO-001/D](../../001-seed/backlog/D-package.md).

## Read first

`AGENTS.md`, `docs/decisions.md`, `docs/npm-distribution.md`, this epic, and `checkpoints/current.md`. After [AGENTO-001/D](../../001-seed/backlog/D-package.md) merges, follow the fuller account list in `docs/npm-distribution.md`.

## Value or research question

The maintainer holds the nonsecret npm steps that an agent cannot perform: account 2FA, package name, first interactive publish, and the trusted-publisher binding. This task does not authorize the agent to publish.

## Scope and non-goals

The package is public `@exones/braid@0.1.0`. `npm view` verifies that identity/version and repository `git+https://github.com/exones/braid.git`. The user subsequently reported saving the GitHub publisher and the restrictive publishing-access setting, and chose the OIDC route without creating a token. These account settings are user-reported, not independently read back. Earlier unauthenticated CLI reads returned `ENEEDAUTH`/401; no new token is needed for GitHub OIDC. `BRAID_RELEASE` remains absent from repository variables.

Exact publisher fields remain in [the distribution guide](../../../../docs/npm-distribution.md#user-actions-before-any-publication). User's latest continuation request authorizes preparing candidate `0.1.1` and its PR/checks; it is not a registry operation. The registry still reports 0.1.0 as latest and no 0.1.1. npm requires a newly saved publisher to complete its first successful publish within two days. Saving settings does not prove OIDC works or authorize dispatch/publication by the agent under this task. Candidate preparation must preserve the merged B/C controls and use no token.

Do not infer the npm user from GitHub `exones`. Do not paste tokens into chat, git, or the report. Do not ask the agent to publish from this task.

## Acceptance criteria

1. Given the public package identity is verified but authenticated setup is incomplete, the agent records completed prerequisites and the exact remaining user action. The task stays blocked until authenticated configuration evidence exists.
2. Given the user records each step without secret values, when the checklist is complete, then the report names the package, the publisher filename `release.yml`, and the registry version that was published by the user.
3. The agent does not run `npm publish`, `npm stage publish`, or `npm trust` under this task.

## Implementation or research tasks

- [x] Package identity selected and initial publication verified: public `@exones/braid@0.1.0`, repository `exones/braid`.
- [x] User reports saving the trusted publisher and restrictive 2FA/token publishing-access setting. Account setup was performed in the user's session; no secret supplied.
- [x] Prepare and verify candidate 0.1.1 in an isolated checkout; PR #7 payload `625d2557` has clean local proof, Windows/Ubuntu CI, and [no-findings preparation review](../reports/reviews/D/D-npm-account-review-001.md). Current evidence-head CI/human merge remain delivery gates.
- [ ] Complete the first successful OIDC publish within the new publisher's two-day window, under explicit release authority; retain registry/provenance evidence.
- [ ] Enable `BRAID_RELEASE` only for an authorized dispatch that may publish. No variable or dispatch was changed during preparation.
- [ ] Record the nonsecret result in `reports/D.md`. Stop.

## Ownership and verification

The user owns the npm session and every registry write. A worker may record the nonsecret result in `checkpoints/D.md` and `reports/D.md` after the user supplies it. Evidence is the package name and version the user reports, checked with `npm view` of that public name. No token is evidence.

## Delivery record

Read-only preflight completed on 2026-11-03, local checkout `C:\code\agento`, branch `main`, HEAD `acd87301c8c267b7b89651c1e2b01913d6c84692`. Node v26.13.0 / npm 11.20.0. Package identity/version/repository verified; user says trust is not configured; no authenticated npm CLI session. No registry/account write, token access, workflow dispatch, publication, or repository-variable change.

## Report and resume

Write `epics/braid/002-trusted-publish/checkpoints/D.md` and `epics/braid/002-trusted-publish/reports/D.md` only after the user completes the steps. Until then the coordinator's shared checkpoint records the blocker. This task does not authorize publication by the agent.
