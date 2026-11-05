# A-shared-node-toolchain-review-001: independent review

Parent: BRAID-004/A. Pass: 001. Role: independent reviewer, Cursor Grok 4.7 high/500K.
Candidate: `151497ddd8e139e34655fb493b6edd6f306ec26a`.
PR: https://github.com/exones/braid/pull/22 into `epic/braid-004-performance-optimization`.
Proof base: `8265b4ee6eb4ea6ceed903c84c5a8e23d3e6892a`; source merge-base: `8610548f9792072e2e70bb56f0d12e1783a9015e`.

## Entry and binding

This is an independent review, not braid-worker implementation or a coordinator loop. Do not launch agents. The host creates a separate attached branch `review/braid-004-a-001` at the exact candidate. Your initial prompt supplies the actual host root and the full committed revision containing this packet. Read this packet using `git show <packet-context-sha>:epics/braid/004-performance-optimization/assignments/reviews/A/A-shared-node-toolchain-review-001.md`. Packet context and candidate HEAD differ intentionally; do not treat that as a mismatch or switch source revisions.

One initial local batch confirms the supplied root, attached review branch, HEAD equal to candidate, clean index/worktree, origin `https://github.com/exones/braid.git`, and no upstream (normal). Use direct shell Git arguments, not nested `pwsh -Command`; use a quoted ref or `for-each-ref` for upstream, avoiding PowerShell's `@{...}` parsing. No fetch/history/branch inventory, repair, checkout switch, force operation or worktree creation. A genuine mismatch stops affected actions and is reported. Output reports may later be untracked; that does not change the candidate revision.

## Read now, then first source action

Read candidate `AGENTS.md`; `epics/braid/004-performance-optimization/backlog/A-shared-node-toolchain.md`; candidate `assignments/A.md`; and candidate `reports/A.md`, `checkpoints/A.md`, `validation/A/observation.md` under that epic. The worker's checked-in report is pre-push; supplement its pending statements with the current proof below, not another worker commit.

Read relevant candidate policy once: `docs/agile-workflow.md` sections Record ownership, Commit boundary, Review gates and indexing and Definition of Done; `epics/report-format.md` sections Human account and Review records; `README.md` Build and verify; `docs/decisions.md` D26 and applicable confirmed requirements. Read the coordinator's [green inspection](../../../reports/A-coordinator-green-inspection.md) from the supplied packet-context object (it is not in candidate source). No blank packet/template search or historical A-failure investigation unless a concrete question requires it.

First source action: inspect candidate `scripts/Install-NodeToolchain.ps1`, particularly `Resolve-BraidNodeToolchain`, the direct entry point, runtime/npm validation, per-key lock, staging/metadata checks and publication; then its focused fixture. Read required context in bounded batches with literal paths. No generic policy or assignment discovery is needed.

## Review scope and acceptance

Review `git diff 8265b4ee6eb4ea6ceed903c84c5a8e23d3e6892a...151497ddd8e139e34655fb493b6edd6f306ec26a` (three dots, 8 files), not the direct tree difference that misleadingly displays later coordinator records absent from the item branch. Assess every A acceptance criterion against implementation, fixtures, real-install observations and hosted evidence.

Examine compatible PATH precedence, usable paired npm on Windows/Unix, unchanged range/pin/hashes, override validation, offline warm reuse, metadata trust, corrupt-directory preservation, two-version isolation, per-key concurrency/timeout/interruption and staging publication. Check handled/unhandled failure behavior, actual mutation boundaries and stdout/native exit propagation. Distinguish fixture simulation from real x64 observation; arm64 is unexecuted. Check the Unix stub repair and relative-override repair without reopening old-head CI as current proof. Check README and D26 against actual behavior and Verify fixture integration without weakened gates.

Own source is read-only: do not edit product files, candidate reports, index, branch/config/HEAD or author's worktree. Run targeted checks when they resolve a question. Required focused check: `pwsh -NoProfile -File test/fixtures/node-toolchain/Test-NodeToolchain.ps1` in your own checkout; it is offline and needs no npm installation. Full verification is already hosted; repeat it only for a concrete unresolved issue, never install Node/dependencies reflexively for review. If needed, an existing supported Node can be read via process PATH at `C:/worktrees/agento/epic-braid-003-worker-skill/.tools/node/node-v26.13.0-win-x64`; do not modify that checkout.

## Frozen evidence to corroborate

Both CI events are head `151497ddd8e139e34655fb493b6edd6f306ec26a`, attempt 1, success. Push run 41950072997: Windows job 126991660333, Ubuntu 126991660837. PR run 41950078760: Windows 126991678460, Ubuntu 126991678159. All four have successful Install dependencies, Verify and Upload packed tarball.

Coordinator independently downloaded all four tarballs/provenance and recomputed SHA-256 `085f960417343e5bbb3ed95185e5c9e78f18a705f251ee69a33fc296036517ca`, matching their records; each clean candidate/installOutsideCheckout true. Push source is candidate. PR source is `1d1ce5fefb243e96dd9979b4b4b8ca68958780ac`, with ordered parents proof base then candidate and pullRequestHeadSha candidate. API ZIP digests match the worker's supplied byte recomputation. Detailed identities/limits are in the coordinator inspection report. Worker proof comment: https://github.com/exones/braid/pull/22#issuecomment-6647931229. Independently corroborate raw APIs/current head as needed; a worker claim alone is not independent review. Do not claim new merge-test proof for later epic-base records.

## Outputs and return

Use the existing review-report contract and stable findings `A-shared-node-toolchain-review-001/F1`, etc. Report exact candidate, PR/base/source evidence, paths/line numbers, concrete failure scenarios, acceptance assessment, checks/exit codes and limits. Say no actionable findings only if supported. Do not award GitHub approval, Done or merge authority.

Write only `epics/braid/004-performance-optimization/reports/reviews/A/A-shared-node-toolchain-review-001.md` and optional `checkpoints/reviews/A/A-shared-node-toolchain-review-001.md` in your own review root. Do not commit/push them; coordinator copies returned files into its next epic records commit. Leave one concise review-summary comment on PR 22. No PR creation/link/watch or CI polling. If commenting is inaccessible, return the limitation and files rather than modifying source.

Send one completed review result to coordinator `ae791527-bf56-41da-a7d9-30821a74cfc5` with `t3_thread_send`, actual root/branch/candidate, report paths, findings and check results; then end. Coordinator owns triage and sends fixes to the original implementation worker. B/C stay blocked on reviewed human merge. No implementation or fresh review of another head without a separately assigned pass.
