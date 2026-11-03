# A: Find contributor prerequisites from README

Kind: story. Epic: [VALIDATION-D1-FRESH](../epic.md). Feature: none.
Status: backlog. Owner: future documentation worker; unassigned. Depends on: none.
**Unapproved validation proposal; no execution assigned.**

## Read first

Read [AGENTS.md](../../../../../../AGENTS.md), [decisions](../../../../../../docs/decisions.md), [Agile workflow](../../../../../../docs/agile-workflow.md), this validation [epic](../epic.md), [checkpoint](../checkpoints/current.md), [research report](../reports/research.md), [command audit](../reports/command-audit.md), and [README](../../../../../../README.md).
Use only this validation plan's context; production epic/backlog/checkpoint/reports and the separate trusted-publish tree remain excluded during this exercise.

## Value or research question

A new contributor can discover one setup guide and check requirements before changing their machine or checkout.

## Scope and non-goals

Future files: README.md and new docs/contributing.md. Add a direct Start here link and a prerequisite section, retaining short supported setup facts in README and avoiding competing copies of the walkthrough. Include Git checkout/root context, pwsh >=7.6.0, Node >=26.13.0 <27, npm bundled with the selected Node, and network/write requirements for installation. Do not invent a separate npm version pin.

No product changes, toolchain upgrade, account registration, new installer, or controller installation instructions.

## Acceptance criteria

1. Given the repository README, a reader finds the contributor guide through one direct descriptive link and can distinguish it from agent assignment instructions.
2. Given a fresh checkout, the guide states the repository-root context, exact Node engine range, PowerShell minimum, and that Windows PowerShell 5.1 is not pwsh.
3. The guide identifies Windows x64/Arm64 download support, the non-Windows compatible-PATH route, and the installer/dependency network and write effects. It makes no new platform-support guarantee.
4. Every version/script/path statement has a source in the command audit. Publishing credentials, T3, and a global agento install are not listed as prerequisites for this local path.

## Implementation or research tasks

- [ ] Add the guide and README discovery link within the scope above.
- [ ] Keep runtime requirements and setup references aligned with package.json, .npmrc, and toolchain scripts.
- [ ] Check links, headings, wording, and command classification; record evidence.

## Ownership and verification

Future worker owns only the README entry/short setup pointer and prerequisite portion of docs/contributing.md, plus its report/checkpoint. Re-read [package](../../../../../../package.json), [installer](../../../../../../scripts/Install-NodeToolchain.ps1), and [verifier](../../../../../../scripts/Verify.ps1).
Required local evidence: relative link/anchor checks, whitespace/fence checks, and a source-to-requirement comparison. Use a fresh reader review of discoverability; do not add product tests for these reversible text changes. Any later runtime checks require delivery authorization and disposable environments.

## Review gates

No review is assigned. On future authorized delivery, use A-find-prerequisites-review-001 for the first parent-scoped review, record the exact candidate SHA and artifact/PR identity, findings, acceptance assessment, and triage in reports/reviews/A/A-find-prerequisites-review-001.md. Follow [review conventions](../../../../../../docs/agile-workflow.md#review-gates-and-indexing); review is not another backlog item.

## Delivery record

No implementation, commit, PR, CI result, independent review, or merge exists. Status remains backlog, not Done. Future scoped delivery follows [delivery rules](../../../../../../.agents/skills/agento-coordinate/references/delivery.md) and the epic's Ready/Done criteria. This planning request authorizes none of those Git or external actions.

## Report and resume

Future worker outputs would be checkpoints/A.md and reports/A.md under this assigned validation root; they are not created for unstarted work. Follow [report format](../../../../../../epics/report-format.md). No dependency reports exist or are required for A. The coordinator owns shared epic/checkpoint status. Stop after the assigned item; do not launch another agent. Current next action is plan review only.
