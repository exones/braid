# worker-startup-efficiency-review-001: independent exact-candidate review

Parent: standalone `worker-startup-efficiency`. Pass: `001`. Reviewer: independent Codex reviewer, `gpt-6.1-sol`, high reasoning, assigned review role only.
Agent/assignment name: `worker-startup-efficiency-review-001`.
Status: **no-findings**. Date: 2026-11-04.

Candidate: `3b52ed06bec26bbcd47a691fe4fdcb391f3551b1` against `c803fb51f6c9a26fe2342f52a650f65e877f39f2`.
PR: <https://github.com/exones/braid/pull/14>.
Report: `epics/reports/reviews/worker-startup-efficiency/worker-startup-efficiency-review-001.md`.
Checkpoint: `epics/checkpoints/reviews/worker-startup-efficiency/worker-startup-efficiency-review-001.md`.

## Scope and evidence

### Review identity and boundaries

- T3 binding verified once: attached output root `C:/worktrees/agento/t3-ed62288c`, generated branch `t3/ed62288c`, output HEAD `9f5bf6608385670f67f9b63d8b5e608fbadb13d7`; initial worktree and index empty. This HEAD is **not** the reviewed candidate.
- Read applicable output-checkout AGENTS, README, decisions, authoritative Agile review conventions, report format, and existing review template. This standalone assignment overrides global epic pointers; no epic/backlog item was invented. Read candidate instructions through exact Git objects. Neither implementation nor coordinator workflow was entered.
- Reviewed the complete ten-path base-to-candidate diff: coordinator skill/delegation; worker skill/packet/T3 continuation; AGENTS; handoff; decisions; standalone parent report/checkpoint. Source, package, CI, scripts, README, historical epic evidence, delivery rules, Agile/report/review authorities are unchanged. The provider-profile paragraph is identical to base.
- Author root `C:/worktrees/agento/docs-worker-startup-efficiency`, branch `docs/worker-startup-efficiency`, remains at the candidate. Read-only status showed exactly the two parent report/checkpoint supplements modified and an empty index. No author/source/shared file or index was changed.
- Only the two assigned reviewer output files were written, uncommitted and unstaged. No delegate, implementation fix, commit, push, PR write, watch/link, platform approval, merge, publication, or shared-status update was performed.

### Pinned inputs

SHA-256 identities were independently checked before inspection:

| Input | Exact identity |
| --- | --- |
| Explicit approved plan `C:/Users/exon/AppData/Local/Temp/braid-worker-startup-improvements-plan.md` | `9b949e121870f43b686ba2a5bf80317394e303a4b5517c21623e1f3dbf4e5970` |
| Pinned report `C:/Users/exon/AppData/Local/Temp/braid-pr14-review-inputs-j9h12wcv/reports/worker-startup-efficiency.md` | `6e93c7ce31158687ed8e117c162bee1de3d4a1d17d6bcb25e92dbe89c44f8f6a` |
| Pinned checkpoint `C:/Users/exon/AppData/Local/Temp/braid-pr14-review-inputs-j9h12wcv/checkpoints/worker-startup-efficiency.md` | `3874b1907d55eb9641bc287109d10f787a15a9b46d17c7f1191d5d89f77fa6cb` |

The report/checkpoint snapshots are post-push supplements, not candidate blobs. Candidate blobs correctly retain pre-commit/pre-hosted status; they do not independently prove later delivery. The supplements explicitly identify this distinction rather than manufacturing a self-SHA evidence commit. Author-local evidence paths were resolved against the actual author root above.

### Independently executed checks

1. `git diff --name-status <base> <candidate>`: exactly the ten assigned paths. `git diff --check <base> <candidate>`: exit 0.
2. Both installed `quick_validate.py` validators, invoked with `python -B -X utf8`, exit 0, `Skill is valid!`. Their inputs were the read-only author skill directories, after comparing each SKILL.md's UTF-8/newline-normalized text to `git show <candidate>:<path>` and asserting equality. The older output-checkout skill files were not validated as candidate evidence. One initial reviewer wrapper passed an incorrect directory due to Windows separators and received `SKILL.md not found`; correcting the wrapper's parent-path selection made both checks pass without changing any source.
3. In-memory exact-Git-object link/anchor check: all **70** local Markdown references across the ten affected files resolve, including `#stalled-yield-recovery`. No checker output files were created.
4. Targeted candidate-text consistency inspection across AGENTS, both skills, packet, delegation, handoff, Agile workflow, delivery/report authorities and continuation: initial/resume roles agree; coordinator dependency-evidence reads remain appropriate to its role and do not impose routine worker history reconstruction.
5. Protected-path `git diff --exit-code <base> <candidate> -- ...`: exit 0 for product, tests, scripts, package/lock, workflows, npm policy, historical epic files, README and the unchanged delivery/Agile/report/review authorities. Provider-profile substring equality asserted separately.
6. Independently downloaded all four authoritative GitHub artifact ZIPs into memory, checked their SHA-256 against API digest and upload log, compared every file byte-for-byte with retained downloads, checked actual tarball digest against provenance, and inspected packed package identity. Independently fetched all four hosted logs with `gh run view --job --log`; each matches its retained log after CRLF normalization and records 40 tests, 40 passes, zero failures. No new local artifact files were written.
7. Queried authoritative GitHub run/attempt/job/step/artifact and commit APIs, and reconfirmed PR head/base/check/review state after proof. Retained `head-source.json` and `merge-source.json` agree with the independently queried source identities.

No redundant full local product Verify was run: this docs-only diff has sufficient exact-source hosted proof. The author's dirty local Verify is a pre-commit probe and is not substituted for that proof.

### Hosted current-candidate proof

Both runs are attempt 1, completed/success, with run head `3b52ed06bec26bbcd47a691fe4fdcb391f3551b1`. Each of the four jobs has successful Checkout, PowerShell requirement, Node setup, **Install dependencies**, **Verify**, and **Upload packed tarball**, as well as successful remaining job steps. All artifacts are nonexpired and belong to the expected run/head.

| Event / run | Job | Artifact | Downloaded ZIP SHA-256 |
| --- | --- | --- | --- |
| [push 41899704414](https://github.com/exones/braid/actions/runs/41899704414) | Windows `126818535113` | `13357880338` | `b019a03036dde92efa705232f44355c263ea477f82a93b13302f0887ec7ff020` |
| Same push | Ubuntu `126818532926` | `13357816327` | `a1a807d1dfb3a4fc9fae13cf58d30948969ff576fc0b958dcebdba236569a598` |
| [pull_request 41899716054](https://github.com/exones/braid/actions/runs/41899716054) | Windows `126818574907` | `13357468498` | `ff31d333fe0ce41be430a6822b98aa9265b7083d8091f32147fb0f0bd5ec12ce` |
| Same pull_request | Ubuntu `126818575507` | `13357830778` | `b4d72f65bcafaad8da65dc23838d903ee5a74841199f85136ef5625c984ef868` |

Retained evidence root: `C:/worktrees/agento/docs-worker-startup-efficiency/artifacts/worker-startup-efficiency/`. Reviewed `push-windows.log`, `push-ubuntu.log`, `pr-windows.log`, `pr-ubuntu.log`, downloaded contents under `hosted/{push,pull_request}/braid-package-{windows,ubuntu}-latest/`, and source/proof records. Author aggregate `hosted-proof.json` was supporting evidence, not the authority for these checks.

For both events, actual Windows tarball SHA-256 is `8c434113e62663591c23faebcf35aeb13162a130446fa8423de514d92538f92d`; actual Ubuntu tarball SHA-256 is `b8a96b1baee9bad89259d05087e016f8889c94c8b0a6954d774e8835d4d880ec`. Each equals its provenance digest. All four packed/provenance records identify `@exones/braid@0.1.1`, clean source (`candidate:true`, `worktreeDirty:false`), installation outside checkout, `released:false`, and registry publication `not performed`. Toolchain: Node `v26.13.0`, npm `11.20.0`, PowerShell `7.6.9`. This is candidate installation proof, not a pinned released-controller upgrade or npm publication.

- Push source/GITHUB_SHA: candidate; ref `refs/heads/docs/worker-startup-efficiency`; no PR-head field.
- PR source/GITHUB_SHA: merge-test `e76cb2691564865e00307f8b60eadabca35b1e6d`; ref `refs/pull/14/merge`; PR-head field is the exact candidate.
- Commit API verifies merge-test ordered parents `[c803fb51f6c9a26fe2342f52a650f65e877f39f2, 3b52ed06bec26bbcd47a691fe4fdcb391f3551b1]`. Candidate's sole parent is the assigned base. Both source trees are `96c1d6d53bb43869f5a25c312aff7de8fd296d25`.

### Continuation and delivery record

The pinned supplements record author watch registration `watching:true, wasWatching:false`, one queued readiness turn (ordinal 2), a real success wake (ordinal 3), completed ordinals 1/2, and zero pending requests at the bounded final lineage read. They record teardown `wasWatching:true, watching:false`; no watch survival is assumed.

The checkpoint records explicit return via `t3_thread_send(mode:auto)`, response `delivery:started, status:starting`, destination run `run:thread:8a3c206a-9192-498f-b90a-19b5bf807c8c:ordinal:69`, and message `message:mcp:b7ba970e-6114-4abd-a020-21df417d12d6:thread-send:19534ca3-2699-470c-9b21-bd14842e3ff1`. This is a documented transport delivery, not coordinator acceptance. Watch/return lineage was assessed from the pinned snapshots as requested; no live host thread, queue, or watch was inspected or disturbed. G/PR13 and the Windows investigation were excluded.

## Findings

**No actionable findings.** No F1 label is assigned when there is no finding. No cosmetic concern was promoted to a blocker.

## Acceptance assessment

All cited line numbers below refer to the exact candidate, not output HEAD. “Proven” in the table means the written contract and structural walkthrough support the outcome; it does not mean a fresh worker exhibited the behavior.

| Outcome / scenario | Assessment and candidate evidence |
| --- | --- |
| Fresh matching worker uses completed packet and first action | Structurally proven. Worker lines 14–22; packet lines 3–11; coordinator line 33. Blank packet is an authoring aid; exact filled path, required context, one verification batch, first useful action and exact outputs are supplied. |
| New branch with expected no upstream | Structurally proven. Worker line 22 and packet line 11 explicitly accept declared no-upstream and require first push destination. No routine repair/fetch/history inventory on a match. |
| Root/remote/index mismatch | Structurally proven. Worker line 22 preserves unexpected work/index, reconciles affected mismatch, forbids cleanup/silent base change/force-push and invalidates affected proof after authorized base changes. |
| CI continuation | Structurally proven. Worker lines 24–30, packet lines 6/17 and handoff line 34 begin with the named checkpoint, retain PR/branch/proof, recover phase/head/generation/interrupted effects and avoid generic startup replay or duplicate registration. |
| Repeated yield versus ordinary pending CI | Structurally proven. Worker line 32 and T3 continuation lines 31–35 require naturally observed repeated apparent yields, the same active run and intended queued continuation. Ordinary pending CI is expressly excluded. Preserve exact identities; report once through the supported channel, record delivery, stop ordinary execution. No timers, run/queue polling, repeated unchanged status writes or added self-queue generations. |
| Authorized stalled-yield recovery | Structurally proven, no live recovery trial. T3 continuation line 35 confines supported intervention to coordinator authority, requires actual recovery facts and old-to-new lineage before continuation, reconciles effects and keeps every gate. It grants no self-restart, provider replacement, queue deletion or repair takeover, and claims neither root cause nor unassisted recovery. |
| Context reset / changed policy | Structurally proven. Worker lines 26–30 refresh instructions and relevant actual state before side effects, including interrupted mutations. No assumption that subscriptions or processes survived. |
| Changed dependency / conflicting evidence | Structurally proven. Worker lines 16/30/34, packet lines 9–10 and AGENTS lines 5–7 distinguish accepted facts from mandatory reading and reopen affected questions on change/contradiction. Own checkout and acceptance proof remain independent. |
| Genuine high-risk ambiguity | Structurally proven. Worker lines 30/34–40 preserve investigation for concrete risk, missing decisions and recovery ambiguity. No hard time/call cap displaces necessary work. |
| Bounded spike observations before conclusions | Structurally proven. Coordinator line 25 and packet line 15 require a small question/procedure/observation-table/result-and-limits outline and observations before conclusions, without demanding a premature operating manual. |
| Other target project / portability | Structurally proven. Worker lines 12–14, packet lines 3/8, coordinator line 33 and handoff line 32 distinguish installed workflow from target source paths. Mandatory external AGENTS obligations are retained and must be reconciled before affected actions. |
| Coordinator approval / owner / phase consistency | Structurally proven. Coordinator line 34 requires active epic/item/packet/checkpoint agreement, separates obsolete directions from active status while preserving original evidence, and includes CI waiting/repair in single-worker ownership. |
| Existing security, gates and reporting | Preserved. Worker lines 44–68 retain secret/resource boundaries, all declared current-head checks/uploads/artifacts, changed-head invalidation, same-worker repair, report contract and stop boundary. Delivery/report/Agile authorities and provider profile are unchanged; independent reviewer reading and human merge authority are expressly preserved. |
| Eleven author scenarios and measured efficiency | The eleven manual scenarios are structural proof only; independently assessed above, with recovery detailed separately. Actual startup elapsed time, first useful action, discovery/read counts, resumed behavior and improvement magnitude remain **unproven**. No fresh-agent trial or timing measurement was run or claimed. |
| Temporary-plan host diagnosis | Deferred with an explicit scope limit, not claimed complete. Plan/supplements attribute supplied G observations and intervention without root-cause attribution; assignment prohibits inspecting G. No new lifecycle, fault injection, interruption, provider change or host experiment occurred. |

No contradictory mandatory worker dependency-history reconstruction was found in the changed instructions or linked active authorities. Coordinator preparation and independent reviewer evidence requirements remain distinct from worker startup.

## Triage and gate

Independent result: **no findings on the assigned exact candidate/base**. Coordinator owns acceptance, triage, parent indexing and user briefing. This file is not a formal GitHub approval or automatic merge decision.

**Observed state differs from the historical supplements:** GitHub now reports PR #14 **MERGED**, merged at `2026-11-04T19:53:11Z`, merge/squash commit `1dd5cb735c4614b75d96c0694c8c6d0a939f2605`. The PR still identifies the exact assigned candidate head and base; all four listed checks are SUCCESS; formal `reviews` is empty and `reviewDecision` is empty.

Current remote `main` points to `1dd5cb735c4614b75d96c0694c8c6d0a939f2605`, not assigned base `c803fb51f6c9a26fe2342f52a650f65e877f39f2`. Its tree equals the candidate tree and its sole parent is that assigned base. The exact candidate/base and merge-test evidence remain correctly mapped. Any claim that these runs executed output HEAD or the later main commit is invalid and excluded from this review. No pre-merge review timing, human approval identity, or CI execution on the later main SHA is inferred. The coordinator must record this pass at its actual post-merge point rather than retroactively claim it was a pre-merge gate.

## Resume

Review complete; no live commands, sessions, watches, queues or findings owned by this reviewer remain. Next action: coordinator reads these two uncommitted outputs, records the exact-candidate result and actual merged state, and provides the user account. No product repair, new item, successor dispatch or release is proposed by this review. Behavioral efficiency and host root cause retain the limits above.
