# BRAID-004 planning account

The performance optimization epic now has a concrete first story and a bounded measurement spike. This is a planning result; implementation has not started.

## What changed

- Created the [epic](../epic.md), [A shared Node toolchain story](../backlog/A-shared-node-toolchain.md), and [B verification-cost spike](../backlog/B-verification-cost.md), with acceptance criteria, verification, ownership and dependency order.
- Reconciled the explicit epic 003 base request: fetch found `origin/epic/braid-003-worker-skill` and this branch both at `4631970cc6e7ac6eec1e2da9dc3b95a8a502b579`; `git merge --no-ff origin/epic/braid-003-worker-skill` returned already up to date. No synthetic merge commit was needed.
- Added the epic index entry and resumable checkpoint. Other worktree changes were left untouched.

## Why

The direct installer and resolver currently favor checkout-local tools, so fresh worktrees can repeat the same Node download/extraction. A combines PATH reuse with a versioned per-user store while preserving checksum and package-install proof. B measures the remaining cost before recommending changes to local versus hosted checks. The inherited records-only coordinator gate already handles that separate optimization.

## Left for you

No action is needed to preserve this plan. More performance items can be added starting at C. The coordinator stops at this planning boundary; a later delivery request can dispatch A after committing its filled packet. B waits for A's actual reviewed human merge. No gate relaxation, release or publication is requested.

## Technical record

- Checkout: `C:/worktrees/agento/epic-braid-004-performance-optimization`; branch `epic/braid-004-performance-optimization`.
- Initial planning HEAD/base: `4631970cc6e7ac6eec1e2da9dc3b95a8a502b579`. The planning commit containing this report is the candidate record; no self-SHA follow-up commit is required.
- Observed main: `1dd5cb735c4614b75d96c0694c8c6d0a939f2605`. The user authorized inherited epic 003 history; its own completion/integration remains separate.
- First remote destination: `origin/epic/braid-004-performance-optimization`, absent at entry. Item PR target is that branch; final epic PR target is main. No PR created for this records-only planning boundary.
- Required local check: `pwsh -NoProfile -File scripts/Test-CoordinatorRecordsGate.ps1 -Base 4631970cc6e7ac6eec1e2da9dc3b95a8a502b579`. Scope is records only. Full implementation verification is not required for this coordinator commit; no skills were changed.
- Validation result: passed (exit 0): records-only scope, Markdown relative links/anchors, and tracked-text LF/trailing whitespace; 7 changed paths, 253 tracked text files, 7 existing exclusions matched. `git diff --check` and `npm ci` also passed. Runtime preparation reuses existing Node `26.13.0` from the epic 003 checkout through PATH rather than downloading another archive. Project dependencies remain local to this checkout.
- Hosted CI and independent implementation review: not claimed. No implementation candidate, worker/review thread or watch exists. Push results belong in the user briefing, not a commit merely to record its own SHA.
- Resume at [current checkpoint](../checkpoints/current.md); item status lives only in the epic table.
