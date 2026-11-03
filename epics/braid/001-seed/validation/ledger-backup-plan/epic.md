# Validation plan VAL-BACKUP: preserve a manual ledger before troubleshooting

Date: 2026-11-03. Status: analysis; planning complete for review only.
Owner: requesting coordinator/user. Researcher: this isolated research assignment.
Release target: none. Controller: bootstrap skill/manual files; schema examined: 1.

**Validation artifact, not approved production work.** This directory exercises AGENTO-001 outcome 7. It neither extends the production backlog nor changes its statuses. No implementation or delegation is authorized by this plan.

## Problem and beneficiary

An operator troubleshooting a manual ledger needs to preserve its original bytes and diagnostic files before retrying commands or cleaning anything up. README explains failure boundaries but has no complete backup procedure. A successful mutation can remove a leftover temp file; an event-append failure can leave committed state despite exit 5. Preserving evidence first reduces accidental loss and mistaken retries.

## Outcomes and success measures

1. A proposed documentation story specifies a repeatable, checked, manual copy before troubleshooting, including unhealthy ledgers.
2. Acceptance covers a quiet source, a fresh external destination, file inventory/hash comparisons, missing files, leftover temp/lock evidence, and failed or unsafe copies.
3. A fresh session can resume from the checkpoint and report without parent chat. No guide, runtime change, backup, or production status update is delivered in this exercise.

## Scope and analysis

Propose `docs/manual-ledger-backup.md` and one discoverability link in README's existing recovery section. One story is sufficient; checklist steps share ownership. No runtime scripts, backup command, schema, package contents, dependencies, repair/replay, restore-over-live procedure, retention service, or later-stage automation.

Repository facts: README and `docs/seed-contract.md` name `.agento/state.json` as authoritative and `events.jsonl` as a non-replay log. `src/ledger-fs.ts` maps temp and lock paths, replaces state before event append, and uses a directory lock with no stale-lock stealing. Even status acquires that lock. Existing failure-test names cover temp preservation, malformed/missing files, event lag, links, lock timeout, and pre/post-commit failures; these tests were inspected, not executed here. Old A/C reports describe superseded `.crew/` paths and A's original replacement proposal; current contract, A review, and N naming evidence take precedence.

Default procedure design: require all users/processes of the selected root to stop issuing commands and let active commands exit. Lock absence alone is insufficient proof. Preserve a stale lock as evidence before discussing its separately authorized cleanup. If quiescence cannot be established, stop; an ordinary copy is not a consistent live snapshot. Copy the whole real `.agento/` directory without parsing/reserializing its files; retain extra regular diagnostics and directory layout, including an existing lock. Reject links/reparse points or special entries rather than following them. Record absent expected files without creating replacements.

Use a new destination outside the selected root and ledger, with no overwrite, merge, or deletion. Record inventory, relative paths, sizes, hashes, timestamp, source root, known controller/provenance, schema/revision when readable, and missing entries in a sidecar outside the copied ledger. Compare source before/after and destination bytes while the source stays quiet. A mismatch or read/copy failure leaves an explicitly incomplete attempt and stops troubleshooting; preserve it and use a fresh destination for any later attempt. This verifies file contents, not ACL fidelity, hardware durability, or application consistency under concurrent writers.

Package `files` currently includes `dist` and README, not `docs`. Keep the full guide source-repository documentation, with a repository URL from README for installed-package readers; do not expand package contents for this slice.

## Prioritized backlog

| ID | Kind | Outcome | Depends on | Owner | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| DOC1 | story | [Manual backup guide](backlog/DOC1-manual-ledger-backup.md) | Existing C/N behavior and current contract | Future assigned documentation worker | backlog, unapproved | [Research report](reports/research.md) |

No active implementation worker; future WIP limit one. README and the new guide belong to the same future worker. Production epic/current checkpoint are read-only to this assignment.

## Ready, Done, and review

Use the project Definition of Ready/Done from `docs/agile-workflow.md`. DOC1 has scope, evidence methods, and repository inputs, but execution ownership/authorization is deliberately unassigned. It is not Ready for dispatch. If adopted later, normal delivery requires local proof, scoped Conventional Commit/PR, applicable Windows/Linux CI on exact head, parent-scoped review `DOC1/review-01`, triage, and human-approved merge. None runs in this exercise; local planning checks do not constitute delivery Done or independent skill acceptance.

## Decisions, limits, and next action

No external research is necessary to specify this repository-specific plan. Precise PowerShell copy semantics remain to be demonstrated on disposable fixtures during an authorized documentation task. Prefer PowerShell 7.6 examples with literal paths and terminating failures. Avoid claiming portable ACL preservation, live consistency, replay, or crash recovery. No user-owned blocker prevents planning.

Next: requesting coordinator reviews these artifacts as workflow evidence and decides whether to adopt the proposed story through normal refinement. Stop here; do not add DOC1 to the real epic automatically. See [checkpoint](checkpoints/current.md) for exact resume paths and boundaries.
