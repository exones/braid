# D-npm-account-review-001 checkpoint

Updated: 2026-11-03. Reviewer-owned. Parent AGENTO-002/D, pass 001.
Status: complete review, no-findings; parent gate/status remains coordinator-owned.

## Identity and scope

- Exact reviewed candidate: `625d2557a322a345eb5580569dd69b79cfd7f408`.
- Base: `0f2dd8637be8f87237c5622c8314aea28b9068ac`.
- PR: https://github.com/exones/braid/pull/7.
- Output checkout: `C:\worktrees\agento\t3-c0a27294`, branch `t3/c0a27294`, actual output HEAD `6dee471c3c0ac6574e153dcbfb39e428d8e9b9c5`. Not the candidate; no switching or Git writes.
- Read-only candidate checkout: `C:\worktrees\agento\t3-2bdfdb71`; verified exact candidate HEAD and clean status before/after checks.
- Controller: manual review/evidence files; no controller installation or run. No schema change.

## Completed and checks

Read required exact-candidate context, review conventions/template, D and dependency reports, and package/release/CI/Verify/package-proof sources. Reviewed eight-file diff with `git show`/`git diff`; `git diff --check 0f2dd863 625d2557` passed.

Read-only Python checks parsed manifest/lock, compared control blobs with base, checked delivery-only evidence changes, hashed and inspected existing tarball in memory, and compared packed manifest/README/build files. Version/bin/engine/privacy consistency passed. Existing build `node.exe dist/cli.js --version` printed `braid 0.1.1`, exit 0. Candidate status remained clean.

Archive SHA-256: `3f35c881253ed9e651bce8c591d61fb11024495ac757d6612682a8d12930fc04`; existing sidecar records exact reviewed head, clean/candidate true, no publication. SHA-512 integrity also matched. Initial ad hoc executable-bit assertion failed on Windows archive mode `0644`; read installed npm bin-links source and confirmed Unix install applies executable mode. Correct shebang present; no actionable finding. Full details and commands are in the report.

Full Verify on implementation `1b93ff8630a19d4d1ec1826e453faabcd416ebc8` is implementation-reported evidence, not rerun here. Coordinator reports exact-head Windows/Ubuntu success for PR run `41733149484` and push run `41733140820`; reviewer did not query or poll GitHub.

## Findings and limits

No actionable P1/P2/P3 findings; no F labels allocated. Preparation is acceptable at the exact reviewed SHA. User-reported publisher/2FA/access settings are not authenticated readback. No live registry/account/variable check, installation, redundant full gate, dispatch, publish, merge, tag, or release. No formal GitHub approval. D's published-release/account acceptance remains unproven.

## Changed files and in flight

Only these uncommitted reviewer outputs were written in the output checkout:

- `epics/braid/002-trusted-publish/reports/reviews/D/D-npm-account-review-001.md`
- `epics/braid/002-trusted-publish/checkpoints/reviews/D/D-npm-account-review-001.md`

No commands in flight. No reviewer blocker. Candidate artifacts, raw reports, provenance, unrelated 003 work, shared epic and shared checkpoint untouched.

## Next concrete action

Coordinator copies the two outputs into PR #7, records the no-findings preparation review and attributed exact-head CI, reconciles parent status, and hands back for human merge authority. Publication remains separately authorized; this pass does not prove OIDC or request token setup. See the companion report for acceptance assessment, objections, and coverage limits.
