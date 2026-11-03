# C: Diagnose common setup failures safely

Kind: story. Epic: [VALIDATION-D1-FRESH](../epic.md). Feature: none.
Status: backlog. Owner: future documentation worker; unassigned. Depends on: A, B.
**Unapproved validation proposal; no execution assigned.**

## Read first

Read [AGENTS.md](../../../../../../AGENTS.md), [decisions](../../../../../../docs/decisions.md), [Agile workflow](../../../../../../docs/agile-workflow.md), this validation [epic](../epic.md), [checkpoint](../checkpoints/current.md), [research report](../reports/research.md), [command audit](../reports/command-audit.md), and [README](../../../../../../README.md).
Use only this validation plan's context; production epic/backlog/checkpoint/reports and the separate trusted-publish tree remain excluded during this exercise.

Dependency inputs: [A](A-find-prerequisites.md) and [B](B-first-local-run.md). Their future reports/A.md and reports/B.md are required before dispatch; no dependency delivery reports exist now.

## Value or research question

A contributor who cannot finish setup can identify the failing layer and choose a bounded next step instead of reinstalling indiscriminately or modifying project state.

## Scope and non-goals

Future file: a compact troubleshooting table in docs/contributing.md, linked from its first-run section. Cover six source-backed cases: missing/old pwsh; wrong Node on PATH or engine rejection; missing dependencies; missing dist/cli.js or bare agento command not found; installer download/checksum failure; and a preserved but incomplete .tools/node pinned directory.

No new diagnostics command, undocumented npm error text, shell-policy weakening, automated repair, blanket deletion, checksum/engine bypass, or ledger recovery runbook. Cross-link the existing storage contract for ledger concerns rather than supplying setup cleanup commands.

## Acceptance criteria

1. Each of the six cases has an observable symptom, likely cause, non-destructive diagnostic/reference, remedy boundary, and source citation. Generic shell/npm symptoms are identified as platform-dependent rather than guaranteed exact error strings.
2. Wrong-engine guidance checks the active Node/session PATH and uses the supported toolchain; missing-dependency guidance points to npm ci from the root after toolchain selection. It never suggests --force or engine-strict=false.
3. Missing compiled output points to the existing build step; bare command failures point to the compiled local invocation. No global install is required.
4. Download or integrity failures stop setup and retain checksum verification. An incomplete pinned directory is described as preserved for inspection; the table does not prescribe deleting or overwriting it blindly.
5. The guide names what observations to include in a help request (shell/Node versions, failing step, exit/error, OS) while excluding credentials, secrets, and unrelated ledger contents.
6. A reader can return from each entry to the relevant setup step through a valid local anchor/link; documentation makes no claim that these failures were reproduced by this exercise.

## Implementation or research tasks

- [ ] Add the six-case symptom table and contextual navigation.
- [ ] Check each diagnosis and remedy against the existing sources and command audit.
- [ ] Review safety and wording, and record static validation and any authorized runtime evidence separately.

## Ownership and verification

Future worker owns the troubleshooting section and links in docs/contributing.md plus its report/checkpoint. Sequential delivery avoids conflicts with A/B.
Required evidence: source-to-row matrix, link/anchor and Markdown checks, review of stop/retry boundaries and redacted help-request guidance. No deliberately broken installation, deletion, backup, product run, or network test is required by this planning exercise. A product mismatch becomes a separately scoped follow-up, not a source change in C.

## Review gates

No review is assigned. On future authorized delivery, use C-troubleshoot-setup-review-001 for the first parent-scoped review, record the exact candidate SHA and artifact/PR identity, findings, acceptance assessment, and triage in reports/reviews/C/C-troubleshoot-setup-review-001.md. Follow [review conventions](../../../../../../docs/agile-workflow.md#review-gates-and-indexing); review is not another backlog item.

## Delivery record

No implementation, commit, PR, CI result, independent review, or merge exists. Status remains backlog, not Done. Future scoped delivery follows [delivery rules](../../../../../../.agents/skills/agento-coordinate/references/delivery.md) and the epic's Ready/Done criteria. This planning request authorizes none of those Git or external actions.

## Report and resume

Future worker outputs would be checkpoints/C.md and reports/C.md under this assigned validation root; they are not created for unstarted work. Follow [report format](../../../../../../epics/report-format.md). Before future dispatch, read reports/A.md and reports/B.md within this root and verify dependency evidence. The coordinator owns shared epic/checkpoint status. Stop after the assigned item; do not launch another agent. Current next action is plan review only.
