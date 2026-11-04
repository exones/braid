# BRAID-003/H checkpoint

Date: 2026-11-04. Task: make `npm run verify` the deterministic offline pre-PR gate for code and docs. Role: worker. No controller. Package 0.1.1, schema 1.

## Checkout

Root `C:\worktrees\agento\t3-b41c4990`. Branch `t3/b41c4990`, attached. Origin `https://github.com/exones/braid.git`. Startup HEAD `27b62e87fa00fa043e358500e47a33b12957371d`. Pull request https://github.com/exones/braid/pull/18 into `epic/braid-003-worker-skill`. First head `c1dd19f456adca948bc93cb41530f800800373fe` failed Windows verify on push `41924394832` and pull_request `41924403250`, both attempt 1. Repair merge head before this evidence update: `3960e66679b8a2ea697a5fe6a40a414d4a3a6f6d` (parents `cc9e78796a5c94742b1f6b0a22e5341607a9724f` and epic tip `02e3a5c208001794a7f37a564ccce8d4d3be1e71`). The commit that contains this update is the candidate to push. This file does not name that SHA.

## Read index

AGENTS.md, README, docs/decisions.md, epic, current checkpoint, H backlog, H assignment, F report, F acceptance, F checkpoint, report format, worker skill, T3 continuation (legacy parent relay), package.json, package-lock.json, scripts/Verify.ps1, .github/workflows/ci.yml.

## Completed

Docs gate and the four negative cases are in the verify script. The Windows cross-drive fixture failure is fixed by scanning links from the repository root. Epic tip `02e3a5c` is merged without taking local coordinator commit `73845a0`. Details are in [reports/H.md](../reports/H.md).

## Checks

Clean `npm run verify` exit 0 on `3960e66679b8a2ea697a5fe6a40a414d4a3a6f6d`: Node v26.13.0, npm 11.20.0, pwsh 7.6.9, 40 tests, docs gate `suppressed=7 exclusions=7 text=225`, cross-drive baseline passed, candidate true. Both skill validators exit 0. Hosted proof of the pushed head is not claimed here. Artifact download is not required. Failed attempt 1 runs stay recorded.

## Changed paths

Repair adds `scripts/check-markdown-links.mjs` and updates the docs gate, its negative fixture, and README. The merge brings the epic startup files. This update is `reports/H.md` and `checkpoints/H.md`.

## Next action

Push this branch to the existing pull request and link it. Take one current-head snapshot. If every declared job and step is already successful, verify the runs, including merge-test parents, and return green once. If any check is pending, return a nonterminal waiting account and keep repair ownership. Do not watch or poll.

## Blockers

None at authoring. Review and the human merge into the epic are coordinator actions after green hosted proof.
