# A-shared-node-toolchain-review-001: independent review of BRAID-004/A

Parent: BRAID-004/A. Pass: 001. Reviewer: independent reviewer, Cursor Grok 4.7 high/500K.
Agent/assignment name: A-shared-node-toolchain-review-001.
Report: `epics/braid/004-performance-optimization/reports/reviews/A/A-shared-node-toolchain-review-001.md`.
Checkpoint: `epics/braid/004-performance-optimization/checkpoints/reviews/A/A-shared-node-toolchain-review-001.md`.
Assignment packet: `epics/braid/004-performance-optimization/assignments/reviews/A/A-shared-node-toolchain-review-001.md` at packet context `2ffa39ed1f8b20677bb19ba9a77d5183f1e51b55`. The pass stays under `reports/reviews/`.
Candidate: `151497ddd8e139e34655fb493b6edd6f306ec26a`. PR: https://github.com/exones/braid/pull/22.
Pass state: no-findings. Date: 2026-11-05.
Item status is not copied here. See [One home for status](../../../../../../docs/agile-workflow.md#one-home-for-status).

## Scope and evidence

Reviewed the three-dot diff `8265b4ee6eb4ea6ceed903c84c5a8e23d3e6892a...151497ddd8e139e34655fb493b6edd6f306ec26a`. Merge-base is `8610548f9792072e2e70bb56f0d12e1783a9015e`. Eight files: `scripts/Install-NodeToolchain.ps1`, `scripts/Verify.ps1`, `test/fixtures/node-toolchain/Test-NodeToolchain.ps1`, `README.md`, `docs/decisions.md`, and the worker's `reports/A.md`, `checkpoints/A.md`, and `validation/A/observation.md`. Item commits are `cdcbe24`, `8112c46`, and `151497d`. The two earlier heads are repair history. Current proof is `151497d` only.

Binding once: root `C:/worktrees/agento/review-braid-004-a-001`, branch `review/braid-004-a-001`, HEAD `151497ddd8e139e34655fb493b6edd6f306ec26a`, clean index and worktree, origin `https://github.com/exones/braid.git`, no upstream. Packet context and candidate HEAD differ by design.

Read the candidate installer and resolver, the focused fixture, Verify's gate order, README Build and verify, D26, package engines, and the runtime consumers `scripts/Verify.ps1`, `scripts/Test-Package.ps1`, `scripts/Test-DocsGate.ps1`, and `scripts/Publish-Npm.ps1`. Also read the backlog acceptance criteria, the worker's pre-push report, the real-install observation, and the coordinator green inspection from the packet-context object.

Local check: `pwsh -NoProfile -File test/fixtures/node-toolchain/Test-NodeToolchain.ps1` exited 0 and printed `node-toolchain: ok`. This machine is Windows x64, so that run used the C# stub. It still executed the shared resolver, including `-ForWindows:$false`, relative override, warm reuse, two pins, checksum and metadata failures, concurrency, kill-before-publish, and the 2-second lock timeout. The Unix shell stub ran in the Ubuntu Verify step, which succeeded.

Hosted evidence, read from the GitHub API and from the downloaded artifacts:

- Push run [41950072997](https://github.com/exones/braid/actions/runs/41950072997), attempt 1, success, head `151497ddd8e139e34655fb493b6edd6f306ec26a`. Windows job `126991660333`, Ubuntu job `126991660837`.
- Pull request run [41950078760](https://github.com/exones/braid/actions/runs/41950078760), attempt 1, success, same head. Ubuntu job `126991678159`, Windows job `126991678460`.
- Each job's Install dependencies, Verify, and Upload packed tarball steps succeeded.
- Merge-test commit `1d1ce5fefb243e96dd9979b4b4b8ca68958780ac` has parents `8265b4ee6eb4ea6ceed903c84c5a8e23d3e6892a` then `151497ddd8e139e34655fb493b6edd6f306ec26a`.
- Artifacts: push Windows `13381040820`, push Ubuntu `13380796449`, pull request Windows `13380173812`, pull request Ubuntu `13380686578`. `gh run download` exited 1 with an extract message that `exones-braid-0.1.1.provenance.json` already existed. The four extracted tarballs were present. Each file's SHA-256 is `085f960417343e5bbb3ed95185e5c9e78f18a705f251ee69a33fc296036517ca`, matching its provenance `digest`. Each provenance record has `candidate` true, `worktreeDirty` false, and `installOutsideCheckout` true. Push `sourceRevision` and `githubSha` are the candidate. Pull request `sourceRevision` and `githubSha` are the merge-test commit, `githubRef` is `refs/pull/22/merge`, and `pullRequestHeadSha` is the candidate. Pull request 22 is open. No GitHub review is recorded.

`package.json` engines remain `>=26.13.0 <27`. `.npmrc` and `.github/workflows/ci.yml` are outside the diff. Base `scripts/Install-NodeToolchain.ps1` already pinned Node.js `26.13.0` with `win-x64` `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a` and `win-arm64` `a9427139595156ef484e1fb08957676e09d4232368dd1743a2a9f93f3d241b14`. Those values are unchanged.

Limits. This review did not repeat `npm run verify` or the official network install. The worker's local verify was a dirty pre-push probe; clean Verify is the hosted runs above. `win-arm64` was not installed. The recorded cold install and proxy warm reuse in [observation.md](../../../validation/A/observation.md) were not re-executed; the fixture's disabled-download warm path was. A completed directory whose `.braid-toolchain.json` is the JSON literal `null` throws `PropertyNotFoundException` from `Get-BraidCompletedToolchainFault` (`scripts/Install-NodeToolchain.ps1` lines 181-186) and is left in place. That shape is outside the fixture. It is not returned and not replaced. The checked corrupt shapes, missing npm and a wrong archive hash, use the preserve message. Matching cross-OS tarball digests are an observation of these four packs. The provenance text does not claim cross-OS reproducibility. No fresh merge-test proof is claimed for epic bases later than `8265b4ee6eb4ea6ceed903c84c5a8e23d3e6892a`.

## Findings

No actionable findings.

## Acceptance assessment

1. Proven. Compatible PATH Node.js with a usable bundled npm returns that directory and does not create the store or download (`Resolve-BraidNodeToolchain` lines 418-422, `Get-BraidPathToolchain` lines 100-112). Direct stdout is one directory and the diagnostic is on stderr. An older PATH runtime and an unusable npm pairing fall through to the pin. The Unix `bin`/`lib` npm layout is accepted. Fixture: `Test-PathPrecedence`, `Test-UnixLayoutPath`, `Test-UnusableNpm`, `Test-IncompatibleFallback`.

2. Proven for the shared key. Two roots and one store publish one directory; a second resolve with the fixture download and expand hooks forced to fail returns that directory and records one save. Checkout `.tools` is untouched. Real Windows x64 cold install and warm reuse remain the worker observation: Node.js `v26.13.0`, npm `11.20.0`, archive SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a`, warm stderr without `Downloading`. This review did not repeat that download. The resolver returns a complete directory before `Save-BraidNodeArchive` (lines 444-447).

3. Proven. Fixture pins `0.0.1` and `0.0.2` both remain, and the first directory's marker and metadata stay. Those fixture hashes are not the production table. The production version, both hashes, the official URL, and the 120-second default are unchanged. `win-arm64` is mapped and pinned; that archive was not executed.

4. Proven for the required failures. Wrong official checksum, wrong pinned checksum, missing extracted npm, wrong extracted version, relative `BRAID_TOOLCHAIN_DIR`, unsupported Windows architecture, missing `LOCALAPPDATA`, and non-Windows without a compatible PATH runtime fail with a specific message and do not publish a key. A relative override is rejected before the Unix PATH-only stop (lines 424-431), including direct invocation. Corrupt completed directories with missing npm or a mismatched archive hash are preserved and named. Handled failure before rename removes only that attempt's staging and keeps unrelated files.

5. Proven. Two same-key installers produce one save and one directory. Killing the holder after staging metadata is written leaves the final key absent; a later run publishes it and does not select the abandoned staging directory. The waiter reports `Timed out after 2 seconds` and the lock path, then reuses the holder's published directory. The production bound remains 120 seconds (line 29). The lock file is kept. The exclusive handle is `FileShare.None` (lines 315-319).

6. Proven. README Build and verify and D26 describe PATH precedence, the shared key, the absolute override, offline reuse, corrupt preservation, and the 120-second lock. `scripts/Verify.ps1` runs the fixture after the install-policy guard and before typecheck, build, test, and packed install. OIDC, install-policy, docs, text, typecheck, build, test, and packed-install steps remain. Direct and dot-sourced entry use `Resolve-BraidNodeToolchain`. Consumers keep the selected Node.js and its bundled `npm-cli.js`. Stdout is the directory. Terminating errors and `Invoke-VerifiedNative` propagate the nonzero code.

7. Proven on the hosted clean head. All four required jobs passed Install dependencies, Verify, and Upload packed tarball. The four tarball digests match the provenance records, with a clean candidate and `installOutsideCheckout` true. This review did not re-run the full local suite. The worker's dirty `npm run verify` is pre-push evidence only.

## Triage and gate

No findings to fix, refute, or defer. This pass is not a GitHub approval, not item Done, and not merge authority. The coordinator copies these returned files onto the epic branch and still stops for a human merge into `epic/braid-004-performance-optimization` before B or C.

## Resume

Coordinator owns triage and the human merge gate. Review root `C:/worktrees/agento/review-braid-004-a-001`, branch `review/braid-004-a-001`, candidate `151497ddd8e139e34655fb493b6edd6f306ec26a`. The report and checkpoint are untracked local files. Summary comment: https://github.com/exones/braid/pull/22#issuecomment-6655379479. No product file, index, commit, or push was changed. Proposed epic status: keep A in review, with this pass as the independent-review evidence. Do not mark Done and do not dispatch B or C.
