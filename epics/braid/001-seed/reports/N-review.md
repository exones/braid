# N: coordinator local acceptance

Date: 2026-11-03. Result: accepted locally; delivery remains In Review.

Read task N, `reports/N.md`, `checkpoints/N.md`, the storage implementation and preservation test, current contract/naming docs, and remaining old-name references. `src/ledger-fs.ts` defines `.agento` once as `STORAGE_DIRECTORY`; all state/event/temp/lock paths use it. Storage errors use the same constant. No runtime `crew` identifier or old storage path remains. Help and the Git ignore rule agree with the contract.

Independently ran `pwsh -NoProfile -File ./scripts/Verify.ps1`: exit 0, Node v26.13.0/npm 11.20.0, typecheck/build and 39 tests in 3 suites passed, no skips. The added test preserves old-directory bytes across status/init/new, while the new ledger starts independently at revision 1. Existing failure, path/link, concurrency, and manual-evidence coverage remains. This is local Windows proof; hosted CI/Linux and kill/power-loss durability remain unverified.

Remaining `.crew` references in active docs describe the superseded name; tests use it only to check absence or preservation. Original B/C assignments and historical reports remain evidence of what was actually requested/run. Added a supersession note to B/C backlog items to avoid reintroducing the old path on resumption.

The coordinator removed live progress and backlog/session instructions from README, retaining capabilities, setup, usage, recovery limits, CI behavior, and stable contributor links. Updated general Git handoff instructions to remove the completed C-specific exception. No product behavior changed during this review.

No blocking naming finding remains. N is In Review, not Done: see `bootstrap-delivery.md` for branch/PR, exact head, hosted CI, fresh review, and human merge evidence as it becomes available. D is not started.
