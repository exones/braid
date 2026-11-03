# VAL-BACKUP: documentation planning research

Date: 2026-11-03. Status: planning complete for review; production work unapproved.
Checkout: `C:\worktrees\agento\t3-64fa5948`; branch `t3/64fa5948`.
Examined HEAD: `2cf2bf25957869dc94fec0718a6dbc67e905f8d7`.

## Outcome and decisions

Produced a reviewable [validation epic](../epic.md), one [proposed story](../backlog/DOC1-manual-ledger-backup.md), and a [resume checkpoint](../checkpoints/current.md). The proposed guide would help operators preserve a quiet manual ledger, including malformed/incomplete diagnostic data, before troubleshooting. The plan specifies whole-directory preservation, a fresh destination outside the root, raw-byte verification, stop conditions, and limits. No guide, CLI behavior, schema, automation, installation, or backup was implemented.

One story with a task checklist is enough; no feature layer or research spike is needed because the repository defines the storage contract. The main implementation uncertainty is the exact future PowerShell copy example, whose behavior must be demonstrated on disposable fixtures. `package.json` does not ship docs, so the proposal uses a repository guide link without changing package contents. No release identity decision is needed.

## Workflow selected and discovery evidence

The assignment was treated as a fresh session: inspected worktree/Git state and explicitly read root `AGENTS.md` and its named context. AGENTS routes goal-level planning to `.agents/skills/agento-coordinate/SKILL.md`; the available skill catalog also lists that exact project skill. Read it directly, then its epic/backlog templates and required Agile/index/roadmap context. Selected **Plan/analyze**, applied analysis/backlog/acceptance/resume steps, and stopped before delivery. No parent conversation supplied facts.

The user explicitly limits this to isolated validation artifacts and prohibits Git writes, external actions and subagents. Those boundaries override the skill's ordinary delivery rules. Existing production statuses and IDs are untouched. The nested validation directory intentionally does not reserve a new production epic number or appear in `epics/README.md`. This is evidence of explicit routing/read and a durable planning output, not proof of invisible automatic host selection, independent acceptance, delegation, or runtime orchestration.

## Exact paths read

All paths below are relative to `C:\worktrees\agento\t3-64fa5948`:

- `AGENTS.md`
- `README.md`
- `docs/decisions.md`
- `docs/agile-workflow.md`
- `docs/roadmap.md`
- `docs/seed-contract.md`
- `docs/cli-name.md`
- `docs/agent-handoff.md`
- `epics/README.md`
- `epics/report-format.md`
- `.agents/skills/agento-coordinate/SKILL.md`
- `.agents/skills/agento-coordinate/assets/epic.md`
- `.agents/skills/agento-coordinate/assets/backlog-item.md`
- `epics/agento/001-seed/epic.md`
- `epics/agento/001-seed/checkpoints/current.md`
- `epics/agento/001-seed/backlog/C-ledger.md`
- `epics/agento/001-seed/backlog/N-storage-name.md`
- `epics/agento/001-seed/backlog/D-package.md`
- `epics/agento/001-seed/reports/A.md`
- `epics/agento/001-seed/reports/A-review.md`
- `epics/agento/001-seed/reports/B.md`
- `epics/agento/001-seed/reports/B-review.md`
- `epics/agento/001-seed/reports/C.md`
- `epics/agento/001-seed/reports/N.md`
- `epics/agento/001-seed/reports/N-review.md`
- `epics/agento/001-seed/reports/N-planning.md`
- `src/ledger-fs.ts`
- `package.json`
- `.github/workflows/ci.yml`

Additional targeted inspection: `rg` searched backup/recovery/ledger references in `docs`, seed backlog, `src`, and `test`; enumerated seed reports/backlog and source/tests with `rg --files`; inspected failure-test case names and matching assertions in `test/ledger-failures.test.ts`. These searches did not read every matched file in full. No assigned production backlog item exists for this exercise; C/N are behavior dependencies and D supplies packaging context, not instructions to execute those completed/running items. Current schema/storage docs supersede the historical A/C report proposals.

## Exact paths written

Only these new validation artifacts, relative to the same root:

- `epics/agento/001-seed/validation/ledger-backup-plan/epic.md`
- `epics/agento/001-seed/validation/ledger-backup-plan/backlog/DOC1-manual-ledger-backup.md`
- `epics/agento/001-seed/validation/ledger-backup-plan/checkpoints/current.md`
- `epics/agento/001-seed/validation/ledger-backup-plan/reports/research.md`

## Checks and limits

Initial `git status --short` was empty; branch/HEAD queries returned the values above. A second `git --no-optional-locks status --porcelain=v1 --untracked-files=all` was empty; `git diff --quiet` and `git diff --cached --quiet` both returned 0 before artifact creation. `Test-Path` confirmed the output directory did not already exist. Reads and searches used local PowerShell and `rg`; no external lookup or service call was needed.

Final checks, all passed locally:

| Check | Actual command/method | Result |
| --- | --- | --- |
| Artifact structure | PowerShell `Get-ChildItem -LiteralPath <artifact-directory> -Recurse -File`, then read each file | Exactly four nonempty files; each has a final newline, no trailing whitespace, and balanced fenced-code markers. |
| Local links | PowerShell regex extraction of Markdown links and `Test-Path` relative to each artifact | All eight local links resolve. |
| Tracked formatting | `git diff --check` | Exit 0. This checks tracked diffs; new untracked artifact whitespace was checked separately above. |
| Preservation | `git diff --quiet`; `git diff --cached --quiet` | Both exit 0; tracked worktree and index unchanged. |
| Output boundary | `git --no-optional-locks status --porcelain=v1 --untracked-files=all` | Exactly the four new paths listed above; no other changes. |
| Revision | `git rev-parse HEAD` | Still `2cf2bf25957869dc94fec0718a6dbc67e905f8d7`. |
| Planning-only boundary | `Test-Path -LiteralPath docs/manual-ledger-backup.md` | False; proposed guide does not exist. |

No dependency installation, product execution, source mutation, Git write/commit/push/PR, external message, merge, publication, or subagent occurred. No backup examples were executed or validated against real data; no new durability or recovery guarantee is claimed. Existing historical test/CI results are context only, not fresh checks. No required production delivery gate is marked passed or Done by this report.

## Next action

Requesting coordinator reviews this plan and its observed workflow evidence. It may record the result in its owned handoff; adoption as real work is a separate decision. No researcher follow-on action is authorized. Stop after returning these paths, checks and HEAD.
