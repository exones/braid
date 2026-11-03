# D: npm account and trusted publisher

Kind: task. Epic: [AGENTO-002](../epic.md). Feature: public npm release.
Status: blocked. Owner: user. Depends on: the user's npm session.

This item is AGENTO-002/D. The seed packaging story is [AGENTO-001/D](../../001-seed/backlog/D-package.md).

## Read first

`AGENTS.md`, `docs/decisions.md`, `docs/npm-distribution.md`, this epic, and `checkpoints/current.md`. After [AGENTO-001/D](../../001-seed/backlog/D-package.md) merges, follow the fuller account list in `docs/npm-distribution.md`.

## Value or research question

The maintainer holds the nonsecret npm steps that an agent cannot perform: account 2FA, package name, first interactive publish, and the trusted-publisher binding. This task does not authorize the agent to publish.

## Scope and non-goals

Blocked until the user completes the steps below. The blocker is the npm account and a package name other than unscoped `agento`. That blocker does not stop review of the planning PR.

Nonsecret steps, to follow the fuller list in `docs/npm-distribution.md` once AGENTO-001/D merges:

1. Enable 2FA on the npm account.
2. Choose a name other than unscoped `agento`, likely `@scope/agento`. The package is public. A paid private package is not the choice unless the user accepts that cost separately.
3. In a later authorized change, set that name, set `private` to false, and keep `repository.url` as `git+https://github.com/exones/agento.git`.
4. Create the package once from an interactive 2FA session before saving a trusted publisher. Do not use `npm stage publish` to create a placeholder.
5. Add one GitHub Actions publisher: GitHub owner `exones`, repository `agento`, workflow filename `release.yml`, environment blank, and direct `npm publish` allowed in addition to the post-2026-09-03 stage default.
6. Complete a successful publish within two days of saving the publisher, or npm expires it.
7. Set repository variable `AGENTO_RELEASE` to `enabled` only when a dispatch may publish.
8. After OIDC publish works, require 2FA and disallow tokens.

Do not infer the npm user from GitHub `exones`. Do not paste tokens into chat, git, or the report. Do not ask the agent to publish from this task.

## Acceptance criteria

1. Given no npm account or package name from the user, when a worker opens this task, then the worker stops. The task stays blocked.
2. Given the user records each step without secret values, when the checklist is complete, then the report names the package, the publisher filename `release.yml`, and the registry version that was published by the user.
3. The agent does not run `npm publish`, `npm stage publish`, or `npm trust` under this task.

## Implementation or research tasks

- [ ] User enables npm 2FA and chooses the package name.
- [ ] User creates the package from an interactive 2FA session.
- [ ] User saves the single GitHub Actions publisher and finishes one successful publish within two days.
- [ ] User sets `AGENTO_RELEASE` only for a dispatch that may publish, then disallows token publishing after OIDC works.
- [ ] Record the nonsecret result in `reports/D.md`. Stop.

## Ownership and verification

The user owns the npm session and every registry write. A worker may record the nonsecret result in `checkpoints/D.md` and `reports/D.md` after the user supplies it. Evidence is the package name and version the user reports, checked with `npm view` of that public name. No token is evidence.

## Delivery record

Empty. Blocked on the user's npm account and package name.

## Report and resume

Write `epics/agento/002-trusted-publish/checkpoints/D.md` and `epics/agento/002-trusted-publish/reports/D.md` only after the user completes the steps. This task does not authorize publication by the agent.
