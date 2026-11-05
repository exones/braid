# I: temporary script for current-head PR proof

Kind: task. Epic: [BRAID-003](../epic.md).
Depends on: F and J human-merged into the epic; F defines the declared check set/continuation, and J supplies the adopted record workflow. The temporary command is superseded by roadmap stage2 gate reports.

## Value

Workers, coordinators and reviewers re-derive the current-head CI proof by hand on every PR (G spent most of its tokens on this). One deterministic command replaces that procedure; agents read a short verdict instead of reasoning through runs, jobs, artifacts and provenance.

## Scope

- Add `scripts/Test-PrProof.ps1` (PowerShell 7, `gh` CLI, structured argument lists, native exit codes propagated). Header comment: temporary, superseded by stage 2 gate reports.
- Input: PR number or URL; optional `-SkipArtifacts` only when the packet declares artifact verification not required.
- Checks, for the PR's current head: push and pull_request runs of the CI workflow exist for that head; the declared jobs (Ubuntu and Windows `verify`) and steps (Install dependencies, Verify, Upload packed tarball) concluded success, using the latest attempt; artifact archive digest matches the downloaded ZIP; the contained tarball digest matches provenance; provenance source/head mapping (push source = head; pull_request source = merge-test commit whose parents are base then head); PR head re-read after checks is unchanged.
- Output: one line `PASS`/`FAIL`/`PENDING` plus compact JSON with run/job/artifact IDs and digests; exit 0 only for PASS. Downloads go to an ignored temp/`.tools` directory.
- Point the worker skill, the assignment-packet asset and the review template at the script as the way to produce current-head proof; keep the prose rule as the definition the script implements.

No product/CLI change; not part of `npm run verify` (needs network and a PR).

## Acceptance criteria

1. Against a merged historical PR with green runs (for example PR 16), the script returns PASS with correct IDs/digests.
2. It returns FAIL for a head with a failed job (for example the historical failed push attempt on PR 13's earlier head, or a fixture), and PENDING while runs are in progress (demonstrated or reasoned with a recorded example).
3. Docs reference it; independent review; human merge into the epic.
