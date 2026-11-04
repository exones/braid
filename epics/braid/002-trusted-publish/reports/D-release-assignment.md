# D release candidate preparation assignment

Date: 2026-11-03. Status: implementation assignment, no publication authority.
User has reported saving the npm GitHub publisher and restrictive publishing-access setting. Public `@exones/braid@0.1.0` already exists, and latest registry metadata does not include 0.1.1. GitHub's `BRAID_RELEASE` variable is absent. First OIDC publish is the remaining integration proof.

Prepare a reviewable 0.1.1 patch candidate using one isolated implementation worker, Cursor `grok-4.7`, `reasoning_effort: high`, `contextWindow: 500k`, as the user explicitly requested. Current shared checkout is on another planning branch with unrelated uncommitted work; do not switch, stage, or commit it. The tool creates the worker checkout. Required delivery candidate includes merged B/C controls; current main is `0f2dd8637be8f87237c5622c8314aea28b9068ac`. Preserve user/newer commits and avoid history rewriting.

## Read and scope

Read AGENTS, README, decisions, distribution guide, assigned epic/checkpoint, backlog D, A/B/C reports where present, package/lock metadata, release/CI workflows, and Verify/package proof. A tool-prepared older parent commit may not yet contain C; consult Git history/current main and integrate the already-merged controls before final candidate verification. Do not recreate the checkout or edit the other planning work.

Only prepare release files: version 0.1.1 in manifest/lockfile, any directly necessary current-version documentation or test corrections, and `reports/D-release-candidate.md` / `checkpoints/D-release-candidate.md`. Preserve historical version-pinned controller examples and artifact identities; do not globally replace 0.1.0. `Publish-Npm.ps1` is the token-based first-publish bootstrap and must not be invoked for this OIDC route. No feature or workflow-authentication redesign is requested. Preserve strict dependency-install and OIDC guard acceptance.

Run the applicable full local Verify gate and a clean exact-candidate package proof; report any dirty probe separately. Deliver scoped Conventional Commits, push an owned feature branch, open a PR against main, and immediately link it. Follow host rules: delegated children do not watch or poll CI. The coordinator owns host watches and final gates if checks are still pending. No subagents, tokens, Infisical access, npm trust mutation, repository variable changes, workflow dispatch, registry writes, publication, merge, tag, or GitHub Release.

Worker owns its candidate files and two outputs. Coordinator owns epic/current checkpoint and account-status reconciliation. Report changed behavior/version, exact source/artifact/digest, commands/results and limits, PR/head, and remaining CI/review/merge/release authority. Keep D open. Final line: PR <URL>, head <SHA>, checks and reviews <actual state>.

## Candidate handoff and coordinator inspection

Worker returned [PR #7](https://github.com/exones/braid/pull/7), exact head `625d2557a322a345eb5580569dd69b79cfd7f408`, clean checkout `C:\worktrees\agento\t3-2bdfdb71`, branch `feat/002-d-release-candidate`. It includes current main `0f2dd86`. Full local Verify passed clean implementation `1b93ff8`; exact delivery head has a clean package proof with the same archive digest. Coordinator inspected the actual diff, report, provenance, and archive hash; `git diff --check` passed. Runtime/test/script/workflow/install-policy contents match the base; only version metadata, current-version docs, and worker evidence changed.

Retained archive: `artifacts/package/exones-braid-0.1.1.tgz` in the worker checkout, SHA-256 `3f35c881253ed9e651bce8c591d61fb11024495ac757d6612682a8d12930fc04`. Sidecar records exact source `625d2557`, candidate true, dirty false, Node v26.13.0/npm11.20.0/pwsh7.6.9. No source-revision relabelling or cross-OS reproducibility claim.

Next: independent `D-npm-account-review-001`, parent D, on exact candidate. The reviewer will inspect Git-object candidate contents / the existing clean candidate checkout read-only, and write only its own report/checkpoint in its tool-managed isolated output checkout. Shared parent is an unrelated planning branch and must not be switched/staged/committed. OIDC publication remains unverified and unauthorized by this preparation assignment.

Hosted CI confirmed on exact `625d2557`: [PR run 41733149484](https://github.com/exones/braid/actions/runs/41733149484) and push run 41733140820 both passed Windows/Ubuntu verification. GitHub reports no merge conflict. This supplies hosted gate evidence in addition to the worker's clean local proof; review and human merge/publication remain separate.

## Preparation review and release handback

[D-npm-account-review-001](reviews/D/D-npm-account-review-001.md) completed with no actionable P1/P2/P3 findings on exact `625d2557a322a345eb5580569dd69b79cfd7f408`. Coordinator inspected both reviewer outputs and copied them with matching SHA-256 bytes. Reviewer verified manifest/lock consistency, unchanged controls, the existing archive contents/digests and exact-head sidecar, and `braid 0.1.1` from the existing build. No redundant full gate or source/artifact mutation occurred. Output-checkout revision differs from the reviewed candidate and is recorded honestly in the report.

No fix or further review pass is indicated. This final delivery update adds review/status evidence only; package, README, code, tests, scripts, workflows, and artifact inputs remain identical to the reviewed candidate. Preserve the original 625d2557 sidecar/source rather than relabelling it as the evidence commit. Normal CI must pass on the updated PR head; do not create another commit just to copy that commit's own CI result into these files.

Final local documentation checks passed in the candidate checkout: 22 local links, including 3 anchors across seven owned files, and whitespace checks. Comparing package/lock/README, code/tests/scripts/workflows and changed product docs to 625d2557 produces no diff. Exact reviewer output hashes match their source copies. The shared planning checkout was not staged, committed, switched, or reset.

Ready next action after current-head CI: human merge decision on PR #7 and explicit authority for publishing public `@exones/braid@0.1.1` through `release.yml` from the merged main revision. Existing D scope reserves registry writes to the user and says this task does not authorize agent publication; if the user authorizes the concrete release, that later instruction takes precedence. No additional npm token or setup is requested. An authorized workflow run would enable `BRAID_RELEASE`, dispatch with `confirm=publish`, rerun verification, publish its own verified tarball through OIDC, and then require registry/provenance inspection. No version 0.1.0 reuse, Infisical/token script, tag, or GitHub Release is included. D is not Done until actual OIDC evidence exists.
