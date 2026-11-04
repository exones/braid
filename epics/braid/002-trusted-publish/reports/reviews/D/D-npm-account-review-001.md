# D-npm-account-review-001: 0.1.1 preparation review

Parent: AGENTO-002/D. Pass: 001. Reviewer: independent Codex review session, gpt-6.1-sol, high reasoning effort.
Agent/assignment: `D-npm-account-review-001`.
Status: no-findings. Date: 2026-11-03.

Exact reviewed candidate: `625d2557a322a345eb5580569dd69b79cfd7f408`.
Base: `0f2dd8637be8f87237c5622c8314aea28b9068ac`.
PR: https://github.com/exones/braid/pull/7.

Output checkout: `C:\worktrees\agento\t3-c0a27294`, branch `t3/c0a27294`, actual HEAD `6dee471c3c0ac6574e153dcbfb39e428d8e9b9c5`. This unrelated output revision was not evaluated as the candidate and was not switched. Candidate files were read with `git show`/`git diff`. The existing candidate checkout `C:\worktrees\agento\t3-2bdfdb71` was inspected read-only after verifying its exact HEAD and clean status.

Report: `epics/braid/002-trusted-publish/reports/reviews/D/D-npm-account-review-001.md`.
Checkpoint: `epics/braid/002-trusted-publish/checkpoints/reviews/D/D-npm-account-review-001.md`.

## Scope and evidence

Reviewed the eight-file base-to-candidate diff as preparation of unpublished `@exones/braid@0.1.1`, with no publication authority. Read candidate `AGENTS.md`, README, `docs/decisions.md`, the review conventions in `docs/agile-workflow.md`, `epics/report-format.md`, coordinator delivery rules and review template, AGENTO-002 epic/current checkpoint/backlog D, dependency reports A/B/C, and D's release-candidate report/checkpoint. Inspected package/lock, distribution/naming/contract documentation, release and CI workflows, Verify, package-proof and historical publish scripts, and relevant version/guard sources.

Current account input is the user's nonsecret report: publisher GitHub `exones/braid`, filename `release.yml`, blank environment, direct npm publish allowed, restrictive 2FA/access settings saved, and no token chosen. This is not authenticated account readback or evidence that OIDC publishing succeeds. Historical planning status in the epic/backlog/current checkpoint is not a current account observation or a grant of authority.

### Checks actually performed

| Command or method | Result |
| --- | --- |
| `git status --short`; `git rev-parse HEAD`; `git branch --show-current` in output checkout | Initially clean; output HEAD/branch recorded above. No Git writes. |
| `git -C C:/worktrees/agento/t3-2bdfdb71 rev-parse HEAD`; `git -C C:/worktrees/agento/t3-2bdfdb71 status --short` and final `status --porcelain=v1` | Exact candidate HEAD; clean before and after inspection. |
| `git diff --stat 0f2dd863 625d2557`; `git diff 0f2dd863 625d2557 -- README.md docs/cli-name.md docs/npm-distribution.md docs/seed-contract.md package.json package-lock.json`; exact-revision `git show` reads | Eight files: manifest/lock version, four documentation files, and two evidence files. No product or workflow change. |
| `git diff --check 0f2dd863 625d2557` | Passed, exit 0. |
| In-memory Python checks via PowerShell here-string piped to `python -`; JSON parsed from `git show <candidate>:<path>` and base equivalents | Name/version/root lock/bin/engine consistency passed. Manifest differs only in version. Lock differs only in its two root version values. Dependencies unchanged; static resolutions remain registry URLs and no `hasInstallScript` flags appear. This is not a fresh installed-script inventory. |
| Python byte comparisons of candidate/base Git blobs | `.npmrc`, release/CI, Verify, Test-Package, Publish-Npm, and both policy fixture runners are unchanged. `git diff` for `src` and `test` is empty. |
| Python check of `git diff --name-only 1b93ff8630a19d4d1ec1826e453faabcd416ebc8 625d2557` | Delivery adds only D's report/checkpoint, outside the package allowlist. |
| Read existing sidecar and `npm-pack.json`; Python `hashlib` SHA-256/SHA-512 and `tarfile.open(..., 'r:gz')`, without extraction | Archive identity, both digests, sidecar identity, clean/exact-head flags, and pack metadata passed. All 38 archive entries are regular allowlisted files. Packed manifest equals candidate JSON; README equals candidate after line-ending normalization; all 36 dist files equal the existing candidate build byte-for-byte. |
| Python archive shebang/mode inspection; `rg -n 'chmod\|fixBin\|fix-bin'` and reads of installed npm `bin-links/lib/fix-bin.js` and `link-bin.js` | Initial ad hoc expectation that the Windows-produced archive must carry executable bits failed: CLI mode is `0644`. Investigated rather than treating this expectation as an acceptance gate. Shebang is correct; npm's Unix bin-link path calls `fixBin`, which applies executable mode. No actionable issue established. No test or source was changed. |
| `& 'C:/worktrees/agento/t3-2bdfdb71/.tools/node/node-v26.13.0-win-x64/node.exe' 'C:/worktrees/agento/t3-2bdfdb71/dist/cli.js' --version` | Exit 0; `braid 0.1.1`. Read-only existing-build probe, not a new installation. |

Observed archive: `artifacts/package/exones-braid-0.1.1.tgz`, 29,814 bytes.

- SHA-256: `3f35c881253ed9e651bce8c591d61fb11024495ac757d6612682a8d12930fc04`.
- SHA-512 integrity: `sha512-uH1r1kvI+zLMhbzCu4XVdr413m7TemhWYcx9GeugzBXLxocVrBmsrXEBk2wNVidTt+LargxhvyxsPf7vem+gJQ==`.
- Existing sidecar records exact candidate source revision, `worktreeDirty: false`, `candidate: true`, `released: false`, and `registryPublication: "not performed"`; pack time `2026-11-03T22:42:23.107Z`.

The committed report's full clean Verify applies to implementation `1b93ff8630a19d4d1ec1826e453faabcd416ebc8`: guards, typecheck/build, 40 tests, installed package proof. It explicitly distinguishes that proof from the delivery revision. The existing later delivery-head pack has the same recorded archive digest. Neither the sidecar nor this comparison is an npm provenance attestation or a claim of cross-platform byte reproducibility.

Remote evidence is attributed to the coordinator, not independently queried here: Windows/Ubuntu PR run https://github.com/exones/braid/actions/runs/41733149484 and push run https://github.com/exones/braid/actions/runs/41733140820 passed on exact head `625d2557a322a345eb5580569dd69b79cfd7f408`.

## Findings

No actionable P1, P2, or P3 findings in the assigned preparation diff. No F labels allocated.

## Acceptance assessment

| Outcome | Assessment |
| --- | --- |
| Version and lock consistency | Proven statically: manifest, lock top level, and root package entry are `0.1.1`. |
| Package identity and execution contract | Proven statically: `@exones/braid`, explicit `private: false`, ESM, `braid -> dist/cli.js`, engine `>=26.13.0 <27`, matching repository URL. Existing-build version probe passed. |
| Source versus controller documentation | Preparation criterion met: current source/version/privacy wording is corrected; `0.1.0` controller examples remain explicitly pinned and distinct. Historical evidence and token bootstrap were not retargeted. |
| Strict install and OIDC controls retained | Proven unchanged by blob comparison. Strict npm settings, hosted runner, Node 26, manual confirm, job OIDC permission, npm minimum, private/variable condition, and single verified tarball path remain. CI has no OIDC grant. Release path has no token binding. |
| Artifact/report identity | Static and existing-artifact checks passed. Dirty probe, clean implementation proof, and exact delivery-head sidecar remain distinguishable; no archive/provenance files were edited. |
| Hosted candidate checks | Passed according to coordinator's exact-head evidence above. No redundant full product gate was run by this reviewer. |
| Account task / successful OIDC release | Unproven beyond user-reported settings. Preparation review does not satisfy the original D acceptance for completed account/publish evidence, nor establish live registry state or OIDC operation. |
| Release authority / Done | No publication authority. Reviewable preparation is acceptable; merge remains human-controlled, and published-release acceptance remains unmet. |

## Objections and coverage limits

- No objection to the scoped preparation candidate. Object to treating this report as authenticated account verification, formal GitHub approval, permission to publish, or evidence that the epic/account task is Done.
- The historical epic/backlog account checklist names former identities and status. The worker report and explicit assignment provide current scope; the coordinator must reconcile shared status without erasing historical evidence. These inherited planning statements are not new defects introduced by this diff.
- Registry `latest`/version availability and absence of `BRAID_RELEASE` are recorded implementation/coordinator claims, not fresh observations by this review. No registry/account query, repository-variable read/write, workflow dispatch, tag, merge, or release occurred.
- Full Verify and install-policy/OIDC fixture runners were not rerun: they would create artifacts/temp outputs and repeat unchanged gates. No installation, archive extraction, build, or package execution scenario was performed. Existing Windows build comparison is not independent compilation; Linux artifact bytes were not inspected.
- npm account trust expiry and actual publisher matching must be considered at any separately authorized release. Saved settings alone do not prove a successful exchange or registry attestation. No token action is requested.

## Triage and gate

Proposed parent gate result: no findings for preparation at exact reviewed candidate; coordinator owns triage and parent status. Keep D distinct from completed OIDC publication. This local review is not a platform approval or automatic merge decision. No shared epic/checkpoint was changed.

## Resume

Coordinator copies these two review outputs into the candidate PR, records the exact reviewed SHA and attributed CI, and reconciles shared status. Human merge and any later publication require their respective authority. If candidate content changes materially, obtain the next independent parent-scoped pass. No reviewer commands remain in flight and no blocker prevents handoff.
