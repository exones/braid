# Proposed epic delivery, workspaces and independent workers

Date: 2026-11-04. User-approved execution policy: coordinator-plus-active-item worktrees, item PRs into the epic, one final epic PR into main, and G -> F -> D. The user explicitly approved starting G as one independent T3 thread. This approval authorizes scoped implementation/setup and that trial, not automatic human merges, existing-worktree cleanup or publication. Earlier proposal/awaiting-agreement language below records the planning rationale and is superseded by this approval.

## Current result and why the plan changes

PR #11 is MERGED into main at `7707524a0b5a007794f22fab6ae1439d93458bb6`, 2026-11-04T13:29:13Z. Accepted E `f6b136099889205545d3bfde2595f626a264efb2` is an ancestor; B/C integration and E reporting/merge rules are delivered. Before this new request, D was the only remaining implementation item; independent D/milestone review, final report and retrospective also remained. This request adds real delivery-policy/thread work rather than quietly broadening D's evaluation spike.

Earlier coordinator branches were meaningful but represented handoff/context phases, not one persistent epic integration branch. Delegated `isolation:worktree` offers no branch-name parameter, and its approved bootstrap policy kept generated `t3/<id>` names. Current native Git inventory has no detached worktrees; this does not establish what every previous UI/session showed. Writable work should have an attached, named branch. Current root is on `feat/003-e-reporting-gates` at old context `f99de9d9`, with unrelated dirty user files. New main guidance was read through exact Git objects without overwriting that checkout.

## 1. Epic and item branches — user choice confirmed

Use one persistent named integration branch per epic, for example `epic/braid-004-supervised-execution`. All planning and item development for that epic originate from it. Create it from a verified full main revision before the first epic plan commit or assignment, record the base, and never start a new epic by writing on main. Branch/worktree setup is a coordinator responsibility; the host creates and binds workspaces.

Each item uses its own meaningful branch, e.g. `item/braid-004-a-contract`, from the current accepted epic tip. Its PR targets the epic branch, not main or a preceding item's branch. Independent exact-head review and green CI precede human merge into the epic. Stop for that required merge before dependent work. Same-item fixes stay on the same PR. Do not retarget item PRs to main merely because their predecessor merged.

When the epic is complete, create one final epic-branch PR into main. Check the actual current epic/main merge candidate, complete the epic/milestone review and aggregate human report, then stop for human merge. Earlier item checks are evidence for those candidates, not a substitute for final integration proof. Prefer merge commits for traceable reviewed ancestry; any different merge strategy needs explicit identity/revalidation handling.

An item can be Done after its accepted human merge into the declared epic branch. The epic remains unreleased/in progress until its final gates/main merge and any explicitly required release evidence. Main integration and registry publication are separate actions: this policy does not publish a package, tag or deployment automatically. Epic-sized main delivery is this project's chosen default, not a reason to waive item gates.

BRAID-003 already delivered parts to main; do not rewrite or undo that history. If this proposal is approved before D, start `epic/braid-003-worker-skill` from verified current main for the remaining G/F/D work and make one final PR for that remainder. Later epics use this model from their initial plan.

## 2. Worktrees — recommended default for current sequential work

A branch is a line of Git history; a worktree is a physical checkout; a T3 thread is an agent session bound to a checkout. They need not be one-to-one, but writable ownership must be unambiguous.

| Workspace | Branch / owner | Lifetime and rule |
| --- | --- | --- |
| User's project root | User-owned existing branch/dirty state | Agents do not repurpose, clean or switch it to make setup convenient. |
| Epic integration worktree | Named epic branch; coordinator | One per active epic, from planning through final merge. Coordinator owns shared status and accepts item results here. |
| Active item worktree | Named item branch; assigned worker | One implementation worker at a time. T3 creates/binds it from the pinned epic tip; reuse the same checkout/thread for that item's fixes/resumes. CI waiting retains ownership. |
| Independent review workspace | Separately assigned reviewer | Read exact candidate objects; never write the author's source/index. Use a separate host-bound workspace when reviewer outputs need a writable checkout. Detached HEAD is unnecessary for routine writable work. |

Sequential work does not technically require worktrees. This default keeps coordinator writes away from the worker's source/index and preserves the user's dirty root. A single epic worktree with alternating exclusive ownership is possible, but would forbid coordinator Git/file writes during the worker's turn and require binding/branch handoffs; it is not the recommended default.

The coordinator requests creation via T3's workspace strategy/handoff. Workers never create shell worktrees, guess paths, silently rename bound branches or repair a detached/mismatched binding themselves. T3 may still choose an opaque folder name; the branch and thread title must be meaningful and the actual returned path is recorded. A new named branch supplied at creation avoids a later Git/UI metadata mismatch. Do not claim `t3_thread_update` can change a binding; its exposed contract only changes the title.

Record epic/item, actual thread ID, root, attached branch, full head/base, PR target, writer and retained evidence in assignment/checkpoint. This is descriptive coordination, not a new hand-edited `.braid/run.json` or invented ownership service. After review, item merge and durable retention of report/checkpoint/evidence, coordinator may retire a stopped clean owned workspace under the approved cleanup policy. Never force-remove dirty/untracked evidence or a live owner. Keep unresolved workspaces; do not delete the existing inventory in this planning turn. Thread deletion alone does not remove its worktree under the exposed host contract.

## 3. Independent T3 workers and PR waiting

The restriction is host-specific: current instructions say **delegated children never watch PRs**. It is not a GitHub or Git limitation. Such children cannot block in polling loops either, so A established a parent event relay. That relay transports CI events; it does not transfer repair responsibility. It worked, but caused the extra coordinator wake/readiness/forwarding traffic seen here.

The exposed `t3_thread_launch` contract creates an actual top-level thread and accepts `workspaceStrategy` with type, full base ref, explicit branch and origin policy. `existing_worktree` is also supported. This can express meaningful item branches directly, unlike the current delegate API. Creating one is a real independent thread, not renaming a child to evade its restrictions, and requires an explicit user-authorized thread assignment.

Proposed normal worker lifecycle: top-level item thread owns its PR subscription, checkpoints and yields, receives its own host wake, diagnoses/repairs failures, verifies every declared current-head check/artifact, unwatches and sends the coordinator the completed result. The coordinator is not a per-CI-event router. A watch is asynchronous; no busy wait, background watcher or CLI poll loop. Completed-before-registration checks need one finite self-reconciliation, not assumed event replay.

Important additional obligation: top-level threads do not have the delegate tool's guaranteed child-completion wake. The packet must name an explicit supported completion/blocker message back to the existing coordinator, including delivery/result identities. Confirm binding, own-watch readiness/event routing, same-thread resume and that final message in G. Do not promise automatic restart durability or assume subscriptions survive a host restart. Do not silently fall back to parent CI relay if the agreed direct route fails; report the exact host blocker and decision needed.

G is a bounded capability spike, not permission to start new threads now. One ordinary documentation delivery/PR can serve as its positive lifecycle; no extra deliberate failure is needed. D retains the single separately authorized failure/repair behavioral trial. Reuse honest observed evidence rather than repeat A or manufacture endless PR experiments.

## 4. Assignment files

New coordinator-authored task packets go in `epics/braid/<epic>/assignments/<ID>.md`; review packets may use `assignments/reviews/<parent>/<review-name>.md`. Worker results remain `reports/<ID>.md`, resume state in `checkpoints/<ID>.md`, and shared status in epic/current. The reusable blank packet stays in the worker skill's assets and references these locations.

Commit the packet and required context to the epic before creating the item checkout. Supply the actual resulting full context SHA at launch; do not try to embed a file's own commit SHA or unknown future thread/root identity. Record returned binding/launch identities separately and send them explicitly if needed. Changes to a running assignment are versioned and communicated, not hidden dirty-parent edits.

Existing `reports/A-trial-assignment.md` and `reports/E-assignment.md` are historical artifacts referenced by reviewed records. Preserve their bytes/paths, identify them as legacy evidence and use the new folder for new maintained packets. Do not duplicate a live assignment in both folders or break previous evidence links merely for tidiness.

## 5. What braid can do now; which API to use

Verified main source/package is 0.1.1. README, help and `src/main.ts` implement schema-1 manual ledger commands: init/new/status/story add/start/block/complete. Internal TypeScript functions exist, but package metadata does not declare a supported orchestration API, and there is no implemented T3 thread/worktree/CI controller in this source. Manual completion is explicitly not independent gate acceptance.

The T3 tools can create/bind threads/worktrees now, subject to G's live contract proof. That does not require implementing braid's future API first. A pinned, verified released braid controller can be adopted for manual tracking under the roadmap; do not create a second contradictory live status ledger in this plan or treat the candidate checkout as its controller.

Roadmap stage 0.2 is the appropriate next product step for a versioned T3 adapter, doctor/capability checks and explicitly requested single-worker dispatch. Later messaging/recovery stages own durable routing/retries/reattachment. That product work needs its own epic/acceptance and release pin; it is not a hidden expansion of F/G or an API endpoint to invent today. If “Braid API” meant “T3 API,” the current tools are the immediate integration surface; if it meant the braid product, its orchestration layer is still planned.

## Proposed backlog and approval boundary

Keep IDs stable and add G (bounded independent-thread/own-CI capability spike), then F (epic branch/worktree/assignment policy integration), then existing D (behavioral evaluation of the adopted model). G precedes F despite its later letter; F/G are new outcomes, not review IDs. Separate parent-scoped review and human item merges into the epic apply. D then reuses G's positive evidence and performs the one approved controlled failure case, followed by milestone review/final report/retrospective and final epic PR to main.

Only the item-PR-to-epic choice is confirmed so far. Recommended worktree ownership, full-thread rollout/bounded trial and adding G/F before D remain proposed. No worker/new T3 thread, PR, worktree cleanup, source policy rewrite or release starts from this plan alone. User agreement on the proposal and execution scope is the next action.

Evidence basis: main merge `7707524`; current native Git worktree inventory; exact E/main skills, delivery/report/Agile/roadmap/README/package/src objects; exposed T3 `delegate_task`, `t3_thread_launch`, `create_threads`, `watch_pull_request`, `t3_thread_send`, `t3_worktree_handoff/status` and title-only thread-update contracts. Exposed support is distinct from a performed live full-thread trial.
