# J acceptance

J is Done after the human squash merge of PR20. The coordinator adopts its reviewed workflow and migrates this epic's owned live records before I.

## What changed

Record ownership/timing, table-only item status, short current checkpoint plus append-only log, main sync, skill pinning and copied acceptance facts are now the adopted authorities. This acceptance removes this epic's backlog status narratives and superseded live dashboard prose; historical reports and earlier checkpoint versions remain unchanged in Git history.

## Why

The next worker receives current facts and an immutable operating skill without parsing an accumulated transcript or creating paperwork commits on a green head.

## Left for you

No action now. The coordinator prepares I on the adopted baseline and starts one top-level worker after local verification. I's CI/review/human merge still precede D; no automatic merge or publication is authorized.

## Technical record

- Checked head `d28e052e26ac3a13dc2c34c3fa3cc1838864c8ca`; base `2b823f9fb7918b8db04d8cf985be327cdad28f70`. PR20 squash merge `d30e3a93a2a3690934d059357eb2ed9b1494d6ca`, merged `2026-11-04T23:54:03Z` into `epic/braid-003-worker-skill`, verified via GitHub. The reviewed head is not an ancestor of the squash commit. Identity is established by exact tree equality: both have tree `a5168f1558b4f6e56019a7044d39bac9370eb53a`, and `git diff d28e052 d30e3a9` is empty. No retrospective ancestry claim. Plain `git pull` preserved local coordinator records via merge `d66f7f8a68ca81ce71d433deb4732b5361287783`.
- CI workflow `.github/workflows/ci.yml`, push run `41935489525` attempt1: Ubuntu job `126942775872`, Windows `126942776294`, each SUCCESS. Pull_request run `41935496924` attempt1: Windows `126942803356`, Ubuntu `126942803829`, each SUCCESS. Required Install dependencies, Verify and Upload packed tarball steps SUCCESS on all four. Logs show push source=checked head, clean/candidate True; PR source `7ce99fb66fba668bd1cb4f68b488ba44a4f9fa09`, parents base then checked head, clean/candidate True and `BRAID_PR_HEAD_SHA`=checked head. Source/step facts independently checked by coordinator and review002; artifact download/digest proof explicitly not required or performed for J.
- [Review001](reviews/J/J-record-ownership-and-timing-review-001.md) checked `ed03974840664d8580af2f998c9046d9562a66bd`, found F1-F3 Medium. Repair at checked head fixes finish/blocker timing, legacy relay records and review-file routing. [Review002](reviews/J/J-record-ownership-and-timing-review-002.md) checked the exact repair head, resolved each F1-F3, no new findings. No formal GitHub approval claimed. Local full verify was a dirty pre-commit probe from ed039748 with40 tests/negative fixtures/pack; both skill validators passed. Reviewer did not rerun the full local suite. Final-head hosted proof and exact squash tree mapping preserve those limits.
- Policy word counts12543->13739 (+1196/+9.54%). [Triage](J-coordinator-triage.md) retains original findings, repair and recheck facts. Both source reviewer outputs were copied exactly and hash-verified before retention; the implementation report/checkpoint are candidate-time blobs.
- Adopted execution revision `d30e3a93a2a3690934d059357eb2ed9b1494d6ca`. Immutable workflow installation outside candidate checkouts: `C:/Users/exon/.codex/braid-pins/d30e3a93a2a3690934d059357eb2ed9b1494d6ca`; worker source `.agents/skills/braid-worker/SKILL.md`, verified Git blob `9c744ac8ea0688248cf6ba1f69ee224784af3769`. Installation contains the revision's relative reference graph and no `.git`/agent checkout. Workers do not modify it. Main-ahead check at this item boundary returned0; no main sync needed. No product controller was run (package0.1.1/schema1 unchanged).
- Next: [I packet](../assignments/I.md). Coordinator `npm run verify` exited0 before this records push: docs245 text files/7 narrow exclusions, negative/cross-drive fixtures,40 tests and packed install passed. This is a dirty pre-commit probe from d66f7f8, not a new hosted exact-head claim. Actual dispatch identities go only in current/log. Unrelated untracked maintenance evidence remains untouched. No historical report rewrite or new checkpoint-history snapshot.
