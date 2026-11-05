# E technical acceptance and required human main merge

E is delivered: the user merged [PR #11](https://github.com/exones/braid/pull/11) into main as `7707524a0b5a007794f22fab6ae1439d93458bb6` on 2026-11-04T13:29:13Z. Exact accepted E head `f6b136099889205545d3bfde2595f626a264efb2` is an ancestor; accepted B/C integration is now on main. No actionable independent review findings; D remains unexecuted while the user discusses the next workflow policy.

## What changed

- Shared reporting guidance now owns the human-first form and explicit triggers: item outcomes, user-attention blockers, substantive child returns and milestones. Coordinators inspect and translate child evidence; overlapping triggers combine and routine CI waiting stays short.
- PRs use the same human account followed by useful technical continuation evidence, supported by a template and consistent skill/handbook references. Existing #9/#10 descriptions were updated without source changes.
- A required human merge blocks dependent dispatch. Green CI and review do not count as merge, and real failures remain worker-owned.
- Accepted B/C changes and preserved coordinator evidence are integrated with current main through non-rewriting merges. The PR does not change main's product/test/CI/package/README/seed/epic002 bytes.

## Why

The maintainer needs the practical result, current blocker and exact next decision before reading revisions and CI mechanics. One authority prevents reporting drift; explicit triggers prevent milestone reports from being deferred indefinitely. The merge stop prevents more unmerged dependent work. Integrating the already-reviewed feature-branch results is necessary because #9/#10's actual human merges did not put B/C on main.

## Left for you

No E merge action remains: the actual human merge and accepted-head ancestry have been verified. The new epic/worktree/thread policy proposal is a separate planning decision, not a missing E gate.

No further worker or successor has been started. Coordinator records E/B/C main delivery; D remains a separate next item, unexecuted. Main merge is not a package release: no registry publication or deployment is claimed from this work.

## Technical record

Coordinator premerge disposition, 2026-11-04: inspected actual [E review pass 001](reviews/E/E-reporting-and-merge-gates-review-001.md) and matching checkpoint; accepted all five E criteria at documentation/integration scope, no actionable findings. At that boundary PR was OPEN/MERGEABLE at reviewed head/main base `a2120bfa084a32212a780a0fdc095c38d8869ef5`, all four checks SUCCESS, no formal GitHub reviews. Subsequent authoritative merge verification: MERGED at `7707524a0b5a007794f22fab6ae1439d93458bb6`, accepted E ancestor check exit 0; mark E Done. Source author/reviewer observations remain historical and unchanged.

Independent proof covers both skill validators, 107 relevant links/anchors, exact 16-path E diff against integration `087dff46001b5353700dcf282e5e459b9f1f9530`, broader 47-file main-relative grouping, five protected provider/user-edit regions, 117 protected main files, 25 retained historic epic003 report/checkpoint files and exact C supplement/review hashes. Protected files match main; package 0.1.1 is preserved main content, not an E version change.

Actual integration ancestry: context `f99de9d9b9e7d27d8907315dc7a10b2bce5d7608` + main -> `b83ef41a0c68115604a93d52e67155cd438f0aff`; B human merge `71071ef4bbf380213a5f5cd1b74eb458016b14e3` -> `7783cdacf90510589b940f9ce2705250c4044486`; C human merge `4e7e976a4030f23d63b846f156a307a7b70fc870` -> `087dff46001b5353700dcf282e5e459b9f1f9530`; then sole-parent E candidate. No rebase/history rewrite or lost main changes. Prior B/C proofs remain old-base evidence; new integrated E proof was obtained.

Attempt-1 [push CI 41833239781](https://github.com/exones/braid/actions/runs/41833239781) and [PR CI 41833245907](https://github.com/exones/braid/actions/runs/41833245907): all four Windows/Ubuntu Verify and Upload steps, actual logs, authoritative artifact ZIP/tarball digests, clean external-install provenance/source mapping independently checked by worker and reviewer. PR merge-test `de5d836637d60f3b53128ad6b55a2e6dece620bf` has ordered main/E parents. Final actual head/base reconfirmed unchanged. Worker local dirty Verify/40 tests/packed-install passed; that probe is distinct from clean hosted evidence.

Portable exact retained outputs, all post-candidate evidence distinct from checked Git blobs:

| Output | SHA-256 |
| --- | --- |
| [E author report](E.md) | `b1ffc71f156ae62126e85c6402ecd84a42621fb68e3d50370141311d22abccc8` |
| [E author checkpoint](../checkpoints/E.md) | `3bb0efea0fab0397bb1a36e4faa6a60bcf66d19c39621604fefd958956deeb51` |
| Review report | `b8628db0b53f25fff4b68836152a3f7b721daa04f91c2e6002e437407849286b` |
| Review checkpoint | `6aa2ac51f2a99a299e1be84a5b93a44196c2f242c0ee2bc449e3ec0fb6fd009e` |

Parent retained exact copies from author `C:\worktrees\agento\t3-61a93ffc` and reviewer `C:\worktrees\agento\t3-4face2c2`, leaving both checkouts/index untouched. These latest copies/acceptance/triage are currently uncommitted parent handoff evidence, not a claim that the candidate contains its own future review. Do not push an evidence-only commit or create a review-report PR. Preserve them in the next committed handoff after the merge.

Parent PR11-ARM-001 registration/one readiness snapshot/ordinal2 continuation, distinct watched success/dedup and post-GREEN teardown were independently inspected. Actual unwatch returned `wasWatching:true`, `watching:false`; no active watch/process/delegate remains. [Triage](E-coordinator-triage.md) and [relay archive](../checkpoints/history/E-relay-2026-11-04.md) retain actual lineage. Original source supplements correctly say teardown was unobserved at their earlier handback.

PR #11 description now records accepted review and the exact human merge gate, retaining the worker technical proof as an earlier record. `gh pr edit --body-file` succeeded; immediate next link call returned `alreadyLinked:true`. Metadata edit changed no head/base or check proof. No merge was performed.

Limits: structural and authored scenario consistency plus hosted CI do not establish fresh-agent adherence, measured time savings, arbitrary restart/watch durability, exactly-once delivery or universal cross-provider reliability. D remains the bounded later evaluation. Artifacts can expire; preserve these portable identities. Any changed head/base requires relevant revalidation; this acceptance must not be reused for a future candidate automatically.
