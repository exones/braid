# A current-head green inspection

A has independently corroborated hosted proof at `151497ddd8e139e34655fb493b6edd6f306ec26a` and is ready for independent code review. This is not review acceptance, Done, a human merge or publication.

## What changed

Inspected the worker's clean checkout, report, real-install observation, actual PR and CI/API evidence. Both supplied handoff messages concern the same head; they are one logical delivery, not two assignments. [PR 22](https://github.com/exones/braid/pull/22) remains open into `epic/braid-004-performance-optimization`, with no GitHub review recorded at inspection.

## Why

The source changes implement PATH-first runtime selection and a shared versioned Windows fallback while retaining isolated project dependencies and verification. Hosted evidence is needed because two earlier Ubuntu failures required fixture and override repairs; neither old head counts as current proof. The worker's checked-in report correctly remains a pre-push record, so its pending text is supplemented here rather than rewritten onto the green candidate.

## Left for you

No user action at this boundary. Coordinator assigns the exact-head independent review, triages its findings and then names the human merge when ready. Do not dispatch B or C before their prerequisite reviewed human merge. A is not Done.

## Technical record

- Root `C:/worktrees/agento/item-braid-004-a-shared-node-toolchain`, attached `item/braid-004-a-shared-node-toolchain`, clean, local/origin head `151497ddd8e139e34655fb493b6edd6f306ec26a`, reconfirmed through Git and PR API.
- Inspected base: `8265b4ee6eb4ea6ceed903c84c5a8e23d3e6892a`. Merge base with candidate: `8610548f9792072e2e70bb56f0d12e1783a9015e`. The PR's three-dot source diff has 8 files. A direct base-to-head tree diff also displays coordinator records absent from the older item branch; those are not item deletions. Review the PR diff and preserve later epic records.
- CI push [41950072997](https://github.com/exones/braid/actions/runs/41950072997), attempt 1: Windows job 126991660333 and Ubuntu job 126991660837 successful.
- CI pull_request [41950078760](https://github.com/exones/braid/actions/runs/41950078760), attempt 1: Ubuntu job 126991678159 and Windows job 126991678460 successful. Both events identify the exact candidate head. API independently showed successful Install dependencies, Verify and Upload packed tarball in all four jobs.
- Downloaded all four artifacts anew into ignored `artifacts/A-review-proof/<run>/`. Recomputed each contained tarball SHA-256 as `085f960417343e5bbb3ed95185e5c9e78f18a705f251ee69a33fc296036517ca`, matching its sibling provenance and filename. Each says clean candidate and installOutsideCheckout true. Push sourceRevision/githubSha equal candidate head; PR sourceRevision/githubSha equal `1d1ce5fefb243e96dd9979b4b4b8ca68958780ac`, with pullRequestHeadSha equal candidate head.
- Artifact API ZIP digests match the worker's reported recomputations: Windows push 13381040820 `4f4dc31ff63125731faa4308b9be29ac700bf8d731169d4510a8e3e852bcfc73`; Ubuntu push 13380796449 `9ff2f043684cd4dbb33dd01dcc0f8d60da47237a2617057e75eb45d341dfa272`; Windows PR 13380173812 `f7d8e1d43b6d82b77adfe81255b55d7fb23202464fcd7bb3bc81daad34ea86b6`; Ubuntu PR 13380686578 `7c82da69b834060cfde7c92d01fa2b07dcba52267345b1b54e88f0e3b15d450b`. Coordinator recomputed contained tarballs, not the API ZIP byte streams; that distinction is intentional.
- GitHub Git commit API confirms merge-test source parents in order: base `8265b4ee6eb4ea6ceed903c84c5a8e23d3e6892a`, candidate `151497ddd8e139e34655fb493b6edd6f306ec26a`. The merge-test object was absent locally; local git show failed, so the exact object was inspected through the API instead. This is not fresh proof for later base revisions.
- Limits: local verification in worker report was a dirty pre-push probe; clean hosted proof is separate. Windows arm64 was not executed. Neither matching cross-OS digests nor the proxy-based warm observation establish broader reproducibility/network guarantees. Final review must assess the acceptance evidence and behavior.
