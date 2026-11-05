# C acceptance after human merge

C is Done after independent exact-head review, the bounded worker-entry observation and the verified human merge of PR 24 into the declared epic branch. Its edited skills are adopted for later items from an external pin at the merge. This does not complete the epic or publish a package.

## What changed

Verified the GitHub merge and fetched the actual integration commit. The offline workspace-binding checker, its fixture, the Verify step and the focused skill/template entry instructions are now in this epic. The merge changed only C's reviewed files on top of the prior coordinator records.

## Why

Green CI, the no-findings review and the entry trial were not Done. The actual human merge satisfies C's gate and allows later items to run the adopted skills. The checked facts are copied below so future dispatch does not depend solely on expiring hosted logs.

## Left for you

No C action remains. B is the only open backlog item. Main integration of this epic waits for B's outcome or an explicit deferral, and for epic 003's own pull request into main. No main merge or publication is performed by this record.

## Technical record

Checked head: `5a25b09985f92b25a8037938ef27dddcde7389c0`. Hosted proof base: `099737095cf4e06114fc3f96a61a879d937e0b96`.
PR: https://github.com/exones/braid/pull/24, target `epic/braid-004-performance-optimization`.

| Workflow | Event | Run | Attempt | Job | Platform | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| CI | push | 42018593378 | 1 | 127215280357 | Ubuntu | success |
| CI | push | 42018593378 | 1 | 127215280658 | Windows | success |
| CI | pull_request | 42018697039 | 1 | 127215626407 | Ubuntu | success |
| CI | pull_request | 42018697039 | 1 | 127215626729 | Windows | success |

Required steps on every listed job: Install dependencies, Verify and Upload packed tarball succeeded. Four tarballs recomputed SHA-256 `d3769f91666ad5a159fc3410ad49cd9965b245648cb83634f926d3d679fcc07d`, matching provenance. Details are in [green inspection](C-coordinator-green-inspection.md).

Review: [C-git-startup-check-review-001](reviews/C/C-git-startup-check-review-001.md) reviewed the exact checked head with no actionable findings; [triage](C-coordinator-triage.md) accepted it with limits. [Worker-entry observation 001](C-worker-entry-001.md) confirmed one context batch, one checker invocation and the prescribed source action. It is procedural evidence, not a representative speedup. No formal GitHub approval is claimed.

Merge: `e456883255a7f44d3cd2c8c2e9ea2caaa0371c7c`, user `exones` (not a bot), `2026-11-05T12:02:49Z`. Ordered parents: `bc4d41b7ae74363e7a34dcb747e249e605af4925`, checked head `5a25b09985f92b25a8037938ef27dddcde7389c0`. Main sync count at acceptance: 0. No fresh pre-merge CI against the later records-only base is claimed.

Skill adoption: external snapshot `C:/Users/exon/AppData/Local/braid/skill-pins/e456883255a7f44d3cd2c8c2e9ea2caaa0371c7c`, extracted by `git archive` at the merge. Blobs independently matched the merge tree: `braid-worker/SKILL.md` `85964c7b3ab9fdf2cc04db710dac17ce5686409d`, `braid-coordinate/SKILL.md` `75f074aad323d72bbdff61b4574a701cc7dbd9a7`, `scripts/Test-WorkspaceBinding.ps1` `3fe177e44a3280ad15ff67be4ffd6aed1f9f6abc`. `scripts/Install-NodeToolchain.ps1` is unchanged from A's reviewed head.

Workspaces: the C item checkout is clean and level with its origin branch; it is retained, not retired, by this record. Release/publication: not performed.
