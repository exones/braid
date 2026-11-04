# AGENTO-002 current checkpoint

Updated: 2026-11-03. Coordinator-owned resume point.

## Task and checkout

Current request: finish AGENTO-002/D's 0.1.1 candidate handback. User reports npm trust/access configured and chooses token-free OIDC. Candidate payload `625d2557` passed local Verify/pack proof, Windows/Ubuntu CI, and independent review with no actionable findings. Commit/push final review/status evidence to PR #7, require its current-head CI, then hand back human merge and concrete release decisions. Actual OIDC publication remains unverified; no publication/dispatch authority is inferred from preparation.

Delivery checkout: `C:\worktrees\agento\t3-2bdfdb71`, owned branch `feat/002-d-release-candidate`, reviewed payload `625d2557a322a345eb5580569dd69b79cfd7f408`, base main `0f2dd8637be8f87237c5622c8314aea28b9068ac`. Root `C:\code\agento` is on the unrelated `docs/003-worker-skill-plan` branch with ongoing changes; do not switch/stage/commit that shared branch. Transfer only owned D status and review files into the existing candidate checkout at this safe handoff. Provider/skill preference edits and all 003 work stay untouched. Earlier preflight/planning observations below are historical.

Seed packaging and the braid rename/publication are already delivered. Current package metadata is `@exones/braid@0.1.0`, private false, repository `exones/braid`; `release.yml` exists. Original plan-time absence of that workflow is historical, not a current blocker.

## Completed

- Independent `D-npm-account-review-001` completed with no actionable P1/P2/P3 findings on exact `625d2557`. Coordinator inspected its report/checkpoint and copied both with matching SHA-256 bytes from `C:\worktrees\agento\t3-c0a27294`. Reviewer checked manifest/lock, unchanged controls, actual archive/digests, sidecar source/clean flags, and existing-build version. [Review report](../reports/reviews/D/D-npm-account-review-001.md) records checks, an investigated executable-mode expectation, and limits. No implementation change or new review pass is indicated; no OIDC proof is claimed.
- PR #7 exact `625d2557` now passes Windows/Ubuntu PR run 41733149484 and push run 41733140820; no merge conflict. Independent review is the remaining candidate-inspection gate. No publish or release enablement occurred.
- D candidate returned in [PR #7](https://github.com/exones/braid/pull/7), exact `625d2557a322a345eb5580569dd69b79cfd7f408`, clean worker checkout `C:\worktrees\agento\t3-2bdfdb71`, branch `feat/002-d-release-candidate`, based on merged main `0f2dd86`. Coordinator inspected diff/report/sidecar/hash; source/tests/scripts/workflows/install policy unchanged. Clean head package proof digest `3f35c881253ed9e651bce8c591d61fb11024495ac757d6612682a8d12930fc04`; worker full clean Verify passed implementation `1b93ff8`, 40 tests plus both policy guards and packed install. Evidence head's packed bytes match. Independent review follows on exact 625d2557; no OIDC claim or publishing action.
- User reported the trusted publisher and restrictive access setting saved, then confirmed no separate token is needed. Registry read still shows latest 0.1.0, versions 0.0.0-stage/0.1.0, correct braid repository, no 0.1.1. Repository variables remain empty. [Release assignment](../reports/D-release-assignment.md) defines isolated candidate work. Shared checkout was independently switched to `docs/003-worker-skill-plan` at `acd8730` and contains unrelated planning files; preserve all shared changes and use tool-managed worker isolation. Current remote main is `0f2dd86`, including C.
- D resumption: `npm view @exones/braid name version repository.url dist.attestations --json` returned public `@exones/braid`, version `0.1.0`, repository `git+https://github.com/exones/braid.git`. No attestation value was returned; do not infer authenticated account or OIDC state. Node v26.13.0, npm 11.20.0.
- `npm whoami` failed `ENEEDAUTH`; `npm trust list @exones/braid --json` returned 401. No secret was requested/read. User explicitly confirmed the trusted publisher is not configured; 2FA status remains unverified. `gh variable list --repo exones/braid --json name,value` returned no variables, so `BRAID_RELEASE` is not enabled.
- Verified braid PR #1/A and #2/B merged with Windows/Ubuntu CI passed; PR #4/C merged at `0f2dd86`; review-record PR #5 remains open at `9451cf5` with Windows/Ubuntu CI passed. These are separate from npm-account readiness; no merge performed by this agent.
- Confirmed this checkout is `docs/002-trusted-publish`, merge-base `afc05074a27da2cb1a3c225bc9d42d10f184e504`, and `release.yml` is absent.
- Confirmed `release.yml` exists on AGENTO-001/D `10ff911294a72957fe7fc689757bb33d3c72b38d` and does not exist on `origin/main`.
- Wrote the AGENTO-002 plan: OIDC publish guard and the npm 12 install-script policy. No product, workflow, or package change.

## In flight

Implementation and review are complete; no command or delegate remains in flight. PR #7 is linked/watched. The final documentation/evidence update must use the existing candidate branch and keep source/package/README/test/script/workflow inputs identical to reviewed `625d2557`. Do not restart review for status-only records or create a separate review PR. After push rely on the existing host watch for CI; no polling, dispatch, or registry write.

## Checks and limits

Candidate checks: worker full clean Verify at `1b93ff8` passed both guards, typecheck/build, 40 tests and installed proof; exact payload `625d2557` clean pack has archive SHA-256 `3f35c881253ed9e651bce8c591d61fb11024495ac757d6612682a8d12930fc04`. Candidate CI PR run 41733149484 and push run 41733140820 passed Windows/Ubuntu. Independent review has no actionable findings. This final record-only successor needs documentation checks and current-head CI, with no redundant product test/review cycle. Original 625d2557 sidecar is not relabelled as a new source. User-reported account setup is distinct from successful OIDC proof.

## Changed files

- Final delivery records: D backlog, this checkpoint, epic, planning preflight/report, D-release-assignment inspection/triage report, and the two exact reviewer outputs.
- Stage/commit only these owned paths in the candidate checkout. Existing provider-profile/seed-checkpoint edits and all 003 planning/implementation changes in the shared checkout remain untouched.

## Next concrete action

Validate/copy final records, commit/push on `feat/002-d-release-candidate`, and immediately relink PR #7. On CI wake inspect actual latest head and confirm payload inputs still match reviewed 625d2557. If green, stop the PR watch and hand back PR #7 for human merge plus explicit authority to enable `BRAID_RELEASE` and dispatch `release.yml` for public @exones/braid@0.1.1 from merged main. Existing backlog D explicitly withholds agent publication authority; a later concrete user authorization supersedes that restriction. No token or further account setup is requested. Do not create another evidence commit merely to copy this commit's own CI. Keep D open until the authorized OIDC run/registry/provenance succeeds, within the publisher's two-day validation window.

## Blockers and inputs

No user input blocks candidate preparation. Trust/access settings are user-reported saved. Remaining gates are candidate verification/review/CI, human merge, and explicit authority for the first new-version OIDC publication; its successful registry result proves the binding works. No raw secret or stored publishing token is needed for that flow.
