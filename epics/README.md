# Epics

Each epic records what was asked, decided and delivered, so work can resume without chat history. How epics and items work is in the [workflow](../.agents/skills/braid-coordinate/references/workflow.md). New epics live in `braid/<NNN>-<slug>/`, starting at 006.

Epics 001–005 (seed CLI and ledger, trusted npm publishing, worker skill, performance, coordinator records) used an earlier, heavier process. Their delivered code, scripts and documentation remain in the repository. Their records were removed on 2026-11-05 and are kept in the Git tag `archive/process-v1`, for example `git show archive/process-v1:epics/braid/001-seed/epic.md`.

`reports/` holds the [diagnosis](reports/braid-overhead-diagnosis.md) and [plan](reports/simplify-rules-plan.md) behind that change.
