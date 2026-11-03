# DOC1: document a manual ledger backup before troubleshooting

Kind: story. Epic: [VAL-BACKUP validation proposal](../epic.md).
Status: backlog, unapproved validation artifact. Owner: future assigned documentation worker, not dispatched.
Depends on: C/N behavior and current schema 1 contract; no new implementation dependency, credentials, or registry setup.

## Read first

Read root `AGENTS.md`, README, `docs/decisions.md`, `docs/agile-workflow.md`, `docs/seed-contract.md`, `docs/cli-name.md`, this validation epic/checkpoint/report, and production `epics/agento/001-seed/epic.md` plus `checkpoints/current.md`. Dependency evidence: production `reports/C.md`, `reports/N.md`, `reports/N-review.md`, and `reports/A-review.md`. Inspect `src/ledger-fs.ts` and relevant cases in `test/ledger-failures.test.ts`; current contract overrides historical paths/proposals.

## Value and scope

As a manual-ledger operator, I want a verified copy of the original ledger before troubleshooting so I can retain diagnostic evidence even when files are malformed or a failed command already committed state.

Future edits limited to `docs/manual-ledger-backup.md`, a source-repository link in README's recovery section, and the assigned item's checkpoint/report. Document an operator procedure with PowerShell examples; do not introduce a maintained backup script or any product/packaging changes. Repair, replay, restoring over live data, lock deletion recipes, migration of `.crew/`, and cloud backup policy are excluded.

## Proposed guide outline

1. Purpose and limits: a manual evidence copy; state authority; no built-in backup/repair/replay or power-loss guarantee.
2. Identify the exact resolved root and known controller version/provenance. Use existing information where available; do not install/upgrade anything. Schema/revision are optional observations if readable, never prerequisites to preserving invalid bytes.
3. Establish a quiet root with all operators; wait for commands to exit. Preserve lock presence, do not infer inactivity from absence, kill processes automatically, or remove locks to make a copy.
4. Preflight real source/destination paths and entries, choose a fresh external directory, refuse links/reparse points/special files or overlapping destinations, and stop on access errors.
5. Inventory and copy the complete ledger including hidden/extra regular diagnostics, temp files and empty directories. Missing state/events remain missing. No source writes, JSON formatting, event trimming, overwrite, deletion, or backup inside `.agento/`.
6. Verify inventory, sizes and SHA-256 for each regular file against the quiet source before/after; record missing entries and evidence in a sidecar outside the copied `.agento/`. Explain that byte hashes do not verify ACLs or durability.
7. Preserve the verified copy untouched. Any inspection that may write locks uses a separate disposable working copy after backup; copied stale locks require a separate, explicit assessment. Explain exit 5 may mean committed state; status is not repair and acquires a lock. Stop before live repair, replay, blind retry, temp promotion, or restore instructions.

## Acceptance criteria and evidence

| Given / when | Required result and future proof |
| --- | --- |
| Quiet regular `.agento/`, source/destination paths contain spaces; operator follows examples | Fresh external copy has identical relative file/directory inventory, byte sizes and SHA-256 values; source file bytes and directory entries unchanged. Record the disposable fixture transcript. |
| Partial events, missing state or events, unknown schema or invalid JSON, stale temp, extra hidden diagnostic file, or existing empty lock | Preserve all present bytes/layout and record absence/presence; do not require a healthy status, create missing files, reserialize JSON, or clean the lock. Check each fixture. |
| Active/uncertain writers; existing or nested destination; link/junction/special entry; access error; verification mismatch | Document refusal/stop without claiming a verified backup or editing source. Show supported disposable preflight/failure cases and record platform limits rather than silently skipping them. |
| Event append returned exit 5 after replacement | Explain committed state may differ from the log; copy both and temp evidence before later assessment. Never recommend retry/replay as an automatic fix. Check wording against current contract and existing failure cases. |
| Reader starts at README, including installed README | Discoverable repository guide URL resolves once delivered; document that full guide is source documentation and is not bundled in current tarball. No packaging change. |
| Candidate is reviewed | Only authorized docs and handoff files differ; local links, Markdown fences, whitespace, example parsing and fixture proof pass. Required existing CI is reported separately on exact candidate SHA. |

## Tasks, ownership, and checks for later authorized delivery

- [ ] Reconcile latest contract and decide explicit copy commands without broadening runtime scope.
- [ ] Write guide/examples and README link; verify PowerShell syntax without executing against a real ledger.
- [ ] Exercise the copy examples only against disposable synthetic fixtures, using ordinary file operations; record commands, hashes, negative cases, and Windows/Linux differences. No product execution is necessary for copy proof.
- [ ] Check local links, code fences and whitespace, and compare the final documentation claims with current storage/failure behavior. Do not add tests that merely restate prose.
- [ ] Complete normal authorized CI/review delivery; checkpoint and report exact revisions/results and remaining limits.

Future local formatting check: `git diff --check`. Future existing product gate, when authorized and dependencies are already available: `pwsh -NoProfile -File ./scripts/Verify.ps1`; standard hosted CI installs dependencies and runs verify on Windows/Linux. This plan neither runs nor alters those gates. Missing checks stay visible and prevent a false Done claim.

## Review, delivery, and resume

Future review gate is `DOC1/review-01` attached to DOC1, with exact candidate SHA, scope, findings/triage, and report/checkpoint under the adopting epic's `reports/reviews/DOC1/01.md` and `checkpoints/reviews/DOC1/01.md`. No independent review is requested here.

There is no commit, PR, CI, merge, or implementation proof for DOC1. Preserve normal project Done criteria if adopted. A future coordinator must assign the production location and owner explicitly, without silently inserting this validation ID into AGENTO-001. Future worker output paths under that chosen epic: `checkpoints/DOC1.md` and `reports/DOC1.md`, per `epics/report-format.md`. This research ends at [its checkpoint](../checkpoints/current.md).
