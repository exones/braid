# Worker startup efficiency: standalone implementation

The approved reading and handoff changes and stalled-yield escalation rule pass local validation in the prepared checkout; PR delivery is next. Independent review and human merge follow delivery and are not claimed here.

## What changed

Project instructions and the worker entry now distinguish initial execution from checkpoint-first resume. The single packet template is explicitly a coordinator authoring aid; the worker consumes its exact filled path, with a first action, exact outputs, expected upstream state, read-now context, verified dependency facts and on-demand history. Coordinator preparation aligns approval, owner, phase and next action, and bounded spikes record observations before conclusions. A user-approved addition makes naturally observed repeated yields with the same active run and queued continuation a transport blocker: preserve identities, report once and stop ordinary execution. Host mechanics stay in the existing continuation reference. Only conflicting handoff/delegation wording is reconciled; D23 records the approved decision.

For example, a matching new branch with no upstream proceeds to its specified edit after one checkout batch, rather than reconstructing dependency history or repairing an expected upstream absence. A CI continuation opens the worker checkpoint and reconciles the existing PR/head and interrupted action rather than starting implementation again.

## Why

The previous project instructions required every dependency report even where the worker skill encouraged focused entry. The approved change removes that conflict while retaining mandatory target-project instructions, independent checkout/acceptance proof, security and ownership boundaries, current-head green CI/artifacts, worker-owned repair, host continuation/yield rules, reporting and human merge stops. No product, package, CI or provider-profile change is included.

## Left for you

No user action blocks this implementation. This thread owns local checks, PR creation and hosted proof; the coordinator next inspects the returned candidate and arranges independent review and the later human merge decision. No epic003 dependent item is authorized by this standalone request.

## Technical record

- Scope/input: supplied temporary plan `C:/Users/exon/AppData/Local/Temp/braid-worker-startup-improvements-plan.md`; verified SHA-256 `9b949e121870f43b686ba2a5bf80317394e303a4b5517c21623e1f3dbf4e5970`. Read once, not searched for. No new epic or lettered backlog item; [scoped checkpoint](../checkpoints/worker-startup-efficiency.md) retains the delivery identity and next action.
- Checkout: `C:/worktrees/agento/docs-worker-startup-efficiency`, branch `docs/worker-startup-efficiency`, initial full HEAD `c803fb51f6c9a26fe2342f52a650f65e877f39f2`, origin `https://github.com/exones/braid.git`, PR base `main`. Initial clean tree/index and expected no-upstream verified once. No branch/worktree changes.
- Implementation: [AGENTS](../../AGENTS.md#read-and-resume), [worker](../../.agents/skills/braid-worker/SKILL.md), [packet](../../.agents/skills/braid-worker/assets/assignment-packet.md), [coordinator](../../.agents/skills/braid-coordinate/SKILL.md#dispatch-and-supervise), delegation/handoff consistency and D23. Agile workflow contains no conflicting mandatory dependency-read rule and needs no edit. Original evidence and active shared epic records remain untouched.
- Local evidence: both installed `quick_validate.py` checks passed with `python -X utf8`; the initial Windows cp1252 invocation failed decoding existing UTF-8 punctuation, without a source change. All 70 affected local links/anchors in ten files, scoped diff/whitespace and eleven manual scenarios passed, including the approved yield-blocker addition. `pwsh -NoProfile -File ./scripts/Verify.ps1` exited 0: OIDC/install-policy guards, typecheck/build, 40 tests and packed install. Log: `artifacts/worker-startup-efficiency/local-verify.log`. Documented installer selected Node v26.13.0/npm 11.20.0; pwsh 7.6.9; no controller run. This was a dirty pre-commit probe at initial HEAD, not clean candidate/hosted proof. Its tarball digest is `b8a96b1baee9bad89259d05087e016f8889c94c8b0a6954d774e8835d4d880ec`; provenance is under `artifacts/package/`.
- Hosted acceptance: both push and pull-request CI events, Windows/Ubuntu Verify jobs and uploads/artifacts, source/digest/provenance mapping, all at the current PR head. Pending until PR delivery. Independent review, merge, release and fresh-agent behavioral evaluation are not performed.

### Manual scenario walkthroughs

These are structural/manual checks of the resulting instructions, not observed fresh-agent behavior or timing proof.

| Scenario | Walkthrough result and controlling wording |
| --- | --- |
| Fresh worker, matching checkout | Worker initial entry opens the exact filled path, reads mandatory/read-now context once, compares checkout in one batch and performs the packet's first action. No assignment search or routine dependency-history reconstruction. |
| New branch, no upstream | Packet explicitly declares expected upstream and first push destination; worker treats declared absence as normal, without repair/fetch. |
| Root/remote/index mismatch | Worker preserves unexpected work/index and reconciles only the mismatch before affected mutations. No reset, clean or silent base switch. |
| CI continuation | Resumed entry opens the named checkpoint, recovers phase/PR/head/generation, reconciles interrupted effects and reuses the PR/proof; no generic startup or duplicate readiness without demonstrated need. |
| Repeated yield versus normal pending CI | Naturally observed repeated final/yield prose with the same active host run and intended continuation queued triggers one recorded blocker and ordinary execution stops. Preserve checkpoint/PR/head/watch/queued identities; no polling, status rewrite loop or extra readiness generation. Pending CI by itself keeps normal ownership/waiting. Coordinator-authorized recovery needs actual recovery facts and explicit run lineage before continuation; full gates remain. |
| Context reset or changed policy | Resumed entry refreshes applicable instructions/changed policy and relevant actual task/process/transport state. It assumes neither process nor subscription survival. |
| Changed dependency or contradiction | Accepted facts are conditional on unchanged inputs and consistent evidence; worker reopens the affected question and reports material changes before dependent work. |
| High-risk ambiguity | Execute-first guidance retains investigation for unfamiliar recovery behavior, missing decisions and concrete risk. No hard call/time budget. |
| Bounded spike | Packet and coordinator begin with question/procedure/observation table/result-and-limits; observations precede conclusions and untested behavior stays a limit. |
| Another target project | Worker/packet distinguish installed workflow references from target source paths and preserve all applicable external AGENTS obligations. No Braid product layout/toolchain assumed. |
| Existing gates/security/ownership | Scoped diff retains delivery rules, frozen current-head job/upload/artifact proof, own repair, reporting and human merge gates. Coordinator's one implementation worker includes CI waiting/repair; reviewer evidence requirements remain separate. |

### G anomaly and behavioral limits

The supplied plan reports G's first message at 19:18:17Z, first edit at 19:21:11Z and 36 pre-edit activity entries (19 document reads, 13 searches), with later repeated startup and unusual host running/queued state. Those are attributed supplied observations, not measurements independently reproduced here; entries need not be serial calls. They do not establish a provider or host bug.

The user's additional supplied observation records ordinal1 repeatedly yielding while the host retained it as running, blocking ordinal2 readiness and ordinal3 success delivery. After explicit user authorization, the coordinator's exact ordinal1 interruption returned `interrupt_requested`; its bounded post-action read confirmed ordinal1 interrupted at `2026-11-04T19:37:58.892Z`, existing ordinal2 running since `19:38:00.559Z`, and only ordinal3 queued. The coordinator created no new run/readiness message or provider change. This supports the escalation/recovery contract and demonstrates an intervention; it establishes neither host root cause nor unassisted recovery.

Further diagnosis remains deferred: G is excluded from this assignment's inspection and mutation. Supplied evidence alone is reused, with no live trial, injected failure, interruption/restart by this thread, polling, provider substitute or F/D implementation. If existing evidence cannot resolve cause, a new experiment needs a separate decision.

The instructions now agree structurally, but startup elapsed time, time to first useful action, unnecessary discovery and resume behavior remain unproven until a separately authorized or already-authorized suitable assignment is observed. Compare like-for-like complexity/latency and record tool failures separately; no percentage improvement or hard budget is promised.
