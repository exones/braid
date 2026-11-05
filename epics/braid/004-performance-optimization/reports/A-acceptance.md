# A acceptance after human merge

A is Done after independent exact-head review and the verified human merge of PR 22 into the declared epic branch. This does not complete the epic or publish a package; C is the next delivery item.

## What changed

Verified the GitHub merge and fetched the actual integration commit. The shared, versioned Node resolver and regression fixture are now in this epic. The reviewed source and prior coordinator records were preserved by the merge.

## Why

Ready-for-review and CI green were not Done. The actual human merge now satisfies A's dependency gate. Its checked facts are copied below so future dispatch does not depend solely on expiring hosted logs or editable comments.

## Left for you

No A action remains. The coordinator prepares C with an externally pinned pre-C execution skill, then B measures remaining costs. No main merge or publication is performed by this acceptance record.

## Technical record

Checked head: `151497ddd8e139e34655fb493b6edd6f306ec26a`.
Base used for hosted proof: `8265b4ee6eb4ea6ceed903c84c5a8e23d3e6892a`.
PR: https://github.com/exones/braid/pull/22, target `epic/braid-004-performance-optimization`.

| Workflow | Event | Run | Attempt | Job | Platform | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| CI | push | 41950072997 | 1 | 126991660333 | Windows | success |
| CI | push | 41950072997 | 1 | 126991660837 | Ubuntu | success |
| CI | pull_request | 41950078760 | 1 | 126991678460 | Windows | success |
| CI | pull_request | 41950078760 | 1 | 126991678159 | Ubuntu | success |

Required steps on every listed job: Install dependencies success; Verify success; Upload packed tarball success. Four tarballs recomputed SHA-256 `085f960417343e5bbb3ed95185e5c9e78f18a705f251ee69a33fc296036517ca`, matching provenance digest/filename; each candidate true, worktreeDirty false, installOutsideCheckout true. Push sourceRevision/githubSha equal checked head. PR sourceRevision/githubSha `1d1ce5fefb243e96dd9979b4b4b8ca68958780ac`, ordered parents proof base then checked head, pullRequestHeadSha checked head. Detailed artifact IDs/API ZIP digest distinction are in [green inspection](A-coordinator-green-inspection.md).

Review: `A-shared-node-toolchain-review-001` reviewed exact checked head; no actionable findings; triage accepted with limits preserved in [disposition](A-coordinator-triage.md). Focused offline fixture exit 0 on Windows x64. Local full verification was dirty pre-push proof, distinct from clean hosted evidence. No formal GitHub approval claimed.

Merge: `e9a617fa60630327f161a78918f033e4461eb111`, user `exones` (not a bot), `2026-11-05T10:14:37Z`. Ordered parents: `84a458ca785caea85ea7a5d5bede713e911832b3`, checked head `151497ddd8e139e34655fb493b6edd6f306ec26a`. The final integration base includes later validated coordinator records; no fresh pre-merge CI against that later base is claimed. Actual merged ancestry and PR state are verified, not inferred from a green job or review.

Release/publication: not performed. Arm64 install remains unexecuted; no broad crash/reproducibility/network guarantee is added. This acceptance is scoped to A.
