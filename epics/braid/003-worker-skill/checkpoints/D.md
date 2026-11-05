# BRAID-003/D checkpoint

Date: 2026-11-05. Task: preparation phase for startup, recovery, and green-handoff evaluation. Role: worker. No controller. Package 0.1.1, schema 1. Skill pin `d66843cfb23b1c5c3891732c458d30d2b077fae1`, blob `13c3cf9679f6abb78d242840a80574abeb5ecf9d`.

## Checkout

Root `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof`. Branch `item/braid-003-d-worker-behavior-proof`, attached. Origin `https://github.com/exones/braid.git`. Upstream: none. Launch HEAD `da4232deece99110e0f3b3f5f5d80442409b3edf` matched the packet before preparation writes. Preparation snapshot `1cd1018d4ba749830be0afe3ecf5020c68eaa916` was clean before this correction. The commit that contains this correction does not name its own SHA. Not pushed. No pull request.

## Read index

Packet `assignments/D.md`, pinned worker skill, target AGENTS, backlog D, epic scope/order/adoption/table, `checkpoints/current.md`, planning report Behavioral validation design, README Build and verify, decisions D22-D25 and adopted defaults, `reports/I-acceptance.md`, report format, pinned delivery Conventional Commits, pinned T3 continuation top-level route. `checkpoints/log.md`, inspiration, the blank packet, and historical item reports were not used as evidence. Format samples: `checkpoints/I.md` and the opening of `reports/H.md`. This correction resume opened this checkpoint first, then `D-fix-001` at `50677cc861e4ec79d277dbf2e0443d7e49db4e3a`. It did not reread the startup packet.

## Completed

Fixture setup and preservation ran twice and matched. Identities are in [setup-observation.json](../validation/D/setup-observation.json). Raw prompts, the observation table, and the unstarted trial proposal are under `validation/D/`. The setup command is [Invoke-DFixtures.ps1](../validation/D/Invoke-DFixtures.ps1). Detail is in [reports/D.md](../reports/D.md).

After that snapshot, `Remove-CleanupRoot` no longer calls `cmd.exe`. One later `-Keep` run matched the same identities and left the disposable repositories in place for probe 1.

## Checks

- `Invoke-DFixtures.ps1 -Record` exit 0. `PASS rounds=2 preservation=pass removed=True elapsedMs=9455`. Git `2.55.0.windows.3`. PowerShell `7.6.9`.
- `pwsh -NoProfile -File scripts/Test-DocsGate.ps1` exit 0. `docs-gate: passed suppressed=7 exclusions=7 text=285`. Node v26.13.0, npm 11.20.0 after `npm ci` (200 packages). `git diff --cached --check` exit 0. Full `npm run verify` was not run. Skill validators were not run.
- Correction: `pwsh -NoProfile -File epics/braid/003-worker-skill/validation/D/Invoke-DFixtures.ps1 -Keep` exit 0. `PASS rounds=2 preservation=pass removed=False elapsedMs=9420`. Same three heads as `setup-observation.json`. `git diff --check` exit 0. PowerShell `ParseFile` errors 0. Full `npm run verify` and the docs gate were not rerun. Retained root `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures`.

## Changed paths

`epics/braid/003-worker-skill/validation/D/`, `epics/braid/003-worker-skill/reports/D.md`, `epics/braid/003-worker-skill/checkpoints/D.md`.

## Intervention

Ordinal1 replayed initial entry after the fixture pass. Coordinator request `braid003-d-stop-startup-replay-001` stopped that run; the host confirmed the interrupt at `2026-11-05T10:16:32.287Z` with no active run. This continuation keeps the same checkout and pin and preserves that lineage. Fixture preservation and the docs gate passed before the interrupt, so they are not a committed-head run. This resume checked short status and staged whitespace only. Another lost resumed-entry boundary is a blocker. The native-cleanup resume did not replay startup, launch subjects, or start the canary.

## Next action

After this commit, send one nonterminal correction result to coordinator `8a3c206a-9192-498f-b90a-19b5bf807c8c` and stop. On resume, open this checkpoint first. Do not send a second result for this commit. Do not run the fixture again, push, open a pull request, launch subjects, or start the canary. Next coordinator action: bind probe 1 to retained `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-1` and return any host constraint. No binding outcome is claimed.

## Blockers

None for preparation. Subject dispatch has a binding constraint recorded in the report: the disposable repositories are not braid project worktrees. If the host cannot bind those directories, the coordinator resumes D with that constraint.
