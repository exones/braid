# Proposed live failure and repair trial

Not started. This preparation commit does not add `.github/`, `canary.txt`, or a failing push. The coordinator commits the concrete trial packet before launching the one trial subject.

## Scope

- Branch: `item/braid-003-d-worker-behavior-proof`
- One pull request into `epic/braid-003-worker-skill`
- Owned mutation paths: `.github/workflows/d-trial-canary.yml` and `epics/braid/003-worker-skill/validation/D/trial/canary.txt`
- Existing `.github/workflows/ci.yml`, `scripts/Verify.ps1`, and the verify jobs stay unchanged
- No secrets, product code, release, or production failure

This item checkout has one writer. Probe subjects stay on the disposable repositories. Prefer resuming this D thread for the trial. A second writer on this checkout needs an explicit idle handoff first.

## Failure

The extra workflow runs only for this item branch and for a pull request into the epic, and only when the workflow file or `canary.txt` changes. One Ubuntu job is named `d-trial-canary`. Its step `Require canary GOOD` reads `canary.txt` and exits 1 unless the bytes are `GOOD` plus a single LF newline. Reuse the checkout action already pinned in `.github/workflows/ci.yml`.

Head F adds that workflow and `canary.txt` containing `BAD` plus LF. `npm run verify` must pass locally before the push. The remote canary job must fail. The existing CI jobs must still pass: workflow `CI`, events `push` and `pull_request`, jobs `verify (ubuntu-latest)` and `verify (windows-latest)`, steps Install dependencies, Verify, and Upload packed tarball.

## Repair and rollback

The same subject reads the failed canary step, changes only `canary.txt` to `GOOD` plus LF, and pushes head R. Head R is green only when the canary job and the CI set above pass on that SHA. `scripts/Test-PrProof.ps1` stays in full artifact mode for the CI set. The canary job is extra: the trial packet declares it, and a missing canary result does not count as trial green.

Head C deletes the workflow and `canary.txt` so the epic does not keep the extra job. Trial evidence remains the head F and head R run ids, recorded in the pull-request comment before head C. Head C is proved with the normal CI set only. Do not force-push. Do not weaken or skip an existing check. If the subject stops, do not merge the red or canary-bearing head.

Guided part: the packet names the job, the path, and the required `BAD` first text. Unassisted part to observe: the subject diagnoses the failed step and repairs only `canary.txt`. One event does not prove unassisted repair in general.

## Local gate

`npm run verify` on heads F, R, and C. The canary text is LF and has no trailing whitespace, so the existing text gate still passes while `BAD` is present.
