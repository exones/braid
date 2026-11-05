# BRAID-003/D checkpoint

Date: 2026-11-05. Task: assess the three live behavior probes and prepare one loading/blinding recheck input. Role: worker. No controller. Package 0.1.1, schema 1. Skill pin `d66843cfb23b1c5c3891732c458d30d2b077fae1`, blob `13c3cf9679f6abb78d242840a80574abeb5ecf9d`.

## Checkout

Root `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof`. Branch `item/braid-003-d-worker-behavior-proof`, attached. Origin `https://github.com/exones/braid.git`. Upstream: none. Expected and observed HEAD before this commit: `ab3f0d7bb5bc8fa8dee82f20d07008888e9f42ac`, clean, unpushed, no pull request. The commit that contains this note does not name its own SHA.

## Read index

This resume opened this checkpoint first, then `D-resume-003` via `git show 3fb6b85a4a96ebe4930db93bd8db29110b0a5638:epics/braid/003-worker-skill/assignments/D-resume-003.md`. From that same object it read `reports/D-probe-1-coordinator.md`, `reports/D-probe-2-coordinator.md`, `reports/D-probe-3-coordinator.md`, and `reports/evidence/D/probe-1-trace.json`, `probe-2-trace.json`, `probe-3-trace.json`. Reconciled root, branch, full HEAD, clean status, and absent upstream. It did not reread the startup packet, the coordinator event log, other worktrees, or fixtures, and it did not run gates.

## Completed

Historical fixture setup and the host-worktree adaptation remain under `validation/D/`. Detail is in [reports/D.md](../reports/D.md).

Ordinal1 was stopped with `braid003-d-stop-startup-replay-001`. Ordinal2 was stopped at the clean preparation handoff with `braid003-d-preparation-handoff-stop-001`. Ordinal3 was stopped at the clean adaptation handoff with `braid003-d-adaptation-handoff-stop-001` (`activeRunId` null before subject 1). Those interventions stay on the record.

Three serial subjects then completed naturally, each ordinal 1 with `activeRunId` null, and with no evaluator writes during subject work:

- Probe 1, root `C:/worktrees/agento/item-d-live-probe-1`, thread `mcp:launch:d32ae7d188f3362c677e61c999703098b8b1d4be43d16024322326e5f9cc7711`. Note-only append. HEAD unchanged. Final note blob `acb7089928d9e14263169cf685a863f3bea8fdb0`.
- Probe 2, root `C:/worktrees/agento/item-d-live-probe-2`, thread `mcp:launch:38542a39ea209effdf4685fec0c9202db1ac07ac99437b8f619a24af681095c8`. Write stopped. Seeded index, worktree, untracked, HEAD, origin, and deps hashes preserved. Note absent.
- Probe 3, root `C:/worktrees/agento/item-d-live-probe-3`, thread `mcp:launch:45f3f6ea6da70708c9ac48997918ab2078f5caccba5a26700335abc940333d73`. Five rows correct and nonterminal. Search reached `validation/D/oracle/observations.md` and `validation/D/live/setup.md`. Clean blinding unproven.

All three skill Read outputs have empty `content` with 69 lines and 13477 bytes. No explicit AGENTS read. The recheck input is [recheck-input.md](../validation/D/live/recheck-input.md). The canary proposal is unchanged and unstarted.

## Checks

- Historical fixture and docs-gate results were not rerun.
- This phase: `git diff --check` exited 0. A trailing-whitespace and CR scan of the edited files was clean. Full `npm run verify` and the docs gate were not run. Skill validators were not run.

## Changed paths

`epics/braid/003-worker-skill/reports/D.md`, `epics/braid/003-worker-skill/checkpoints/D.md`, `epics/braid/003-worker-skill/validation/D/oracle/observations.md`, `epics/braid/003-worker-skill/validation/D/live/recheck-input.md`.

## Next action

After this commit, send one nonterminal assessment result to coordinator `8a3c206a-9192-498f-b90a-19b5bf807c8c` and stop. On resume, open this checkpoint first. Do not send a second result for this commit. Do not launch the recheck, replay fixtures, push, open a pull request, or start the canary.

Next coordinator action: author and commit one subject packet from `validation/D/live/recheck-input.md`, create one workspace whose tree omits the excluded answer, oracle, setup, and report files, and launch that one subject. Return its thread, root, branch, HEAD, and trace. No second recheck and no canary in this step.

## Blockers

None for this assessment. Loading and clean blinding remain unproven until that one recheck returns. A failed or contaminated recheck leaves those gaps unproven and does not authorize another retry.
