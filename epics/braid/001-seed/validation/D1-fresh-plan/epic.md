# Epic VALIDATION-D1-FRESH: Contributor setup documentation plan

Owner: validation requester. Coordinator: research sub-agent. Status: analysis.
Release target: none. Controller/schema: manual planning files; no controller invoked.
Source HEAD: `da4792a485f45f54b0f0b912d3df62a2a484bdf0`. Date: 2026-11-03.

**Unapproved validation artifacts. Planning only; no production epic or delivery assignment.**
This directory is the assigned plan root. Its A/B/C IDs are local to this exercise and do not allocate production IDs.

## Problem and beneficiary

A new contributor needs a clear path from the repository frontend to prerequisites, a first successful local CLI invocation, and help with setup failures. The README already contains substantial setup and operating information; improve discovery and sequence without expanding supported product behavior.

## Outcomes and success measures

1. From README, find a concise prerequisite checklist and contributor setup guide in one direct link.
2. Follow one Windows PowerShell source-checkout path through dependency installation and build to help/version output, with expected results and side effects stated.
3. Match common setup symptoms to source-backed diagnoses and bounded remedies without disabling checks or deleting ledger data.

These are proposed documentation outcomes, not implemented capabilities. Static research and the [command audit](reports/command-audit.md) support the proposal.

## Scope and non-goals

Propose changes to README.md and one future docs/contributing.md guide. Retain README as the frontend; keep detailed setup instructions in the guide and link existing contracts instead of duplicating them. Preserve the existing handoff guide's role.

No source/script/configuration changes, new commands, dependency upgrades, release/controller installation guide, registry identity work, platform-support expansion, automation, or production backlog edits. Windows is the primary walkthrough because the existing local downloader supports Windows x64/Arm64. Briefly explain that other platforms need a compatible Node on PATH; Linux CI configuration is not proof of every developer setup.

This exercise permits only local static research and plan artifacts in this root. No installs, setup/backup operations, product execution, subagents, Git mutations, PRs, external services, or skill changes.

## Analysis

- [README](../../../../../README.md) already lists Node >=26.13.0 <27, pwsh >=7.6.0, a Windows pin, npm ci, verify, and the compiled CLI. Its agent handoff link is workflow guidance rather than a focused new-contributor path.
- [package.json](../../../../../package.json) supplies build/typecheck/test/verify/package:proof and maps agento to dist/cli.js. There is no start, dev, doctor, setup, or repair script to document.
- [Verifier](../../../../../scripts/Verify.ps1) can select or download the toolchain; it runs typecheck, build, tests, then a packed-install proof. It is an extended check with writes, not a prerequisite probe.
- Help/version return before ledger execution in [main](../../../../../src/main.ts). Use these for the first run. Status preserves ledger contents but acquires/releases a lock directory; it is not filesystem-write-free.
- [CI](../../../../../.github/workflows/ci.yml) configures Windows/Linux npm ci and verify. No hosted run was contacted or verified.
- Detailed findings, source inventory, authority exceptions, and limits: [research report](reports/research.md).

## Features and prioritized backlog

No feature grouping is needed for this small epic.

| ID | Kind | Outcome | Depends on | Owner | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| A | story | [Find prerequisites](backlog/A-find-prerequisites.md) | none | future documentation worker; unassigned | backlog | command audit and research report |
| B | story | [Complete first local run](backlog/B-first-local-run.md) | A | future documentation worker; unassigned | backlog | command audit and research report |
| C | story | [Diagnose setup failures](backlog/C-troubleshoot-setup.md) | A, B | future documentation worker; unassigned | backlog | command audit and research report |

IDs follow [the initial sequence](../../../../../docs/agile-workflow.md#backlog-item-ids).
Order/WIP/resource ownership: A provides the guide and README entry, B adds the walkthrough, C adds symptom-oriented help. All share the guide, so future delivery WIP is one worker and one separately reviewable story/PR at a time. There is no active worker or delivery authority now.

## Review gates

No independent review assigned or passed. A future reviewer must check the exact candidate revision, documentation usability, command/reference accuracy, and side-effect labels. Reviews belong to A, B, or C, with names such as A-find-prerequisites-review-001 and report paths such as reports/reviews/A/A-find-prerequisites-review-001.md relative to this plan root if this validation plan is later used. Consult [review conventions](../../../../../docs/agile-workflow.md#review-gates-and-indexing) before any actual assignment.

## Definition of Ready and Definition of Done

Apply [project Ready/Done](../../../../../docs/agile-workflow.md#definition-of-ready). Ready requires clear scope, met dependencies, assigned ownership, inputs, testable criteria, and known verification. These are reviewable backlog proposals; none is Ready for dispatch because this exercise is unapproved and future ownership is unassigned.

For future delivery, Done requires accepted criteria, meaningful local documentation checks, a scoped commit/PR, required hosted CI on its head, triaged independent review, a human-approved merge, and an updated report/checkpoint. A useful local plan is not delivery Done. No release is proposed.

## Decisions and open questions

2026-11-03: Use three small stories; bounded static research answered command-safety uncertainty in this exercise, so no redundant spike is added. First-run success means help/version after a build; ledger mutation is optional existing usage, outside this small walkthrough. Show setup writes and the extended verify side effects explicitly.

No question blocks plan review. Recheck sources at a future candidate revision before delivery. Actual runtime success, supported environment availability, and fresh-contributor usability remain unproven. If command behavior conflicts with the guide during future validation, report the mismatch; do not change product code within these stories.

## Delivery evidence and release checklist

- [x] Goal, analysis, ordered backlog, criteria, ownership boundaries, and handoff recorded.
- [x] Source-backed command classification recorded; no commands exercised.
- [x] Local validation method and [machine evidence](evidence/checks.json) recorded.
- [ ] Proposal reviewed/approved for any future use.
- [ ] Future A/B/C documentation delivered with the normal PR/CI/review/merge evidence.

No commit, PR, remote CI, review approval, merge, package, or publication evidence exists for these artifacts. [Checkpoint](checkpoints/current.md) records the stop boundary.
