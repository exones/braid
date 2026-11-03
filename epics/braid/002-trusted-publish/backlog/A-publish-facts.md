# A: publish and install-script facts

Kind: spike. Epic: [AGENTO-002](../epic.md). Feature: public npm release.
Status: backlog. Owner: assigned later. Depends on: [AGENTO-001/D](../../001-seed/backlog/D-package.md) merged and an explicit execute request.

## Read first

`AGENTS.md`, `docs/decisions.md`, this epic, `checkpoints/current.md`, `docs/npm-distribution.md`, `package.json`, and the lockfile. Read the merged [AGENTO-001/D](../../001-seed/backlog/D-package.md) packaging report before treating `release.yml` as present.

## Value or research question

On the tree after AGENTO-001/D merges, which dependency lifecycle scripts, git dependencies, and remote URL dependencies exist, and can Node.js 26 with npm 11.20 express a strict allowlist that matches npm 12 defaults?

Limit: one session. Required decision: an empty or specific `allowScripts` list, and whether AGENTO-002/B uses strict allow-scripts on current npm or a separate npm 12 install.

The [8 July 2026 changelog](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/) says npm 12 defaults `allowScripts` to off and `--allow-git` and `--allow-remote` to `none`. npm 11.16 and newer only warn. `npm approve-scripts --allow-scripts-pending` is the inventory command. A lockfile text search is not that inventory.

## Scope and non-goals

Inspect the merged AGENTO-001/D tree. Record command output. Decide the enforcement mechanism for AGENTO-002/B.

Do not publish. Do not add a workflow feature. Do not change the Node.js engine. Do not set `ignore-scripts=true` or `dangerously-allow-all-scripts`. Do not edit `feat/package-bootstrap`. This spike is not Ready in the planning PR.

## Acceptance criteria

1. Given the merged AGENTO-001/D tree and the pinned toolchain, when the spike runs `npm approve-scripts --allow-scripts-pending` and records `npm --version`, then `reports/A.md` cites that output.
2. Given that output, when the spike finishes, then the report states whether the allowlist is empty or names specific scripts, and whether AGENTO-002/B enforces strict allow-scripts on current npm or runs one separate npm 12 install.
3. The spike does not change product code, `engines.node`, or `.github/workflows`.

## Implementation or research tasks

- [ ] Confirm AGENTO-001/D is on `main` and the assignment says to execute.
- [ ] Run the inventory and version commands. Cite the output.
- [ ] Record the allowlist decision and the AGENTO-002/B enforcement choice.
- [ ] Write `checkpoints/A.md` and `reports/A.md`. Stop after this item.

## Ownership and verification

Own `checkpoints/A.md` and `reports/A.md`. Propose shared-status updates in the report. Meaningful check: the cited command output and the decision. Applicable PR CI is the documentation and existing verify gate. Do not mark Done from the local note alone. Another reviewer is AGENTO-002/E, after AGENTO-002/B and AGENTO-002/C exist; this spike still needs its own PR review before Done.

## Delivery record

Empty until assigned.

## Report and resume

Write `epics/agento/002-trusted-publish/checkpoints/A.md` and `epics/agento/002-trusted-publish/reports/A.md`. In coordinated mode the coordinator owns shared status. Stop after this item.
