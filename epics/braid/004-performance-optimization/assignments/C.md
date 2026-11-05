# Worker assignment: BRAID-004/C

## Task, entry and execution skill

Initial execution of [C: Make startup checks and context loading repeatable](../backlog/C-git-startup-check.md). Implement the approved item only. It is the next item under the user's epic-delivery request; B follows it by selected priority, not by a new functional dependency. No extra planning deliverable or repeat discovery is needed.

Use the external pre-C worker skill, revision `e9a617fa60630327f161a78918f033e4461eb111`, absolute source `C:/Users/exon/AppData/Local/braid/skill-pins/e9a617fa60630327f161a78918f033e4461eb111/.agents/skills/braid-worker/SKILL.md`. Coordinator archived the complete tracked revision outside the candidate checkout and verified its skill Git blob `9c744ac8ea0688248cf6ba1f69ee224784af3769`. Its relative workflow references resolve in that pinned snapshot. Do not edit that snapshot or adopt your candidate skill for your own execution. Changed skills apply to later assignments only after recorded adoption.

Open this exact filled packet `epics/braid/004-performance-optimization/assignments/C.md`, the pinned worker skill and applicable AGENTS obligations. Initial prompt supplies actual root and full context HEAD after this packet is committed; neither root nor this file's own SHA is guessed here. After one binding batch and mandatory reads, first implement the helper's contract validation/read-only Git observation and a focused disposable-repository fixture. Follow the item's design; reopen it only for a concrete contradiction.

## Read now, in one bounded context batch

AGENTS is mandatory; use already-injected current content if explicitly available, otherwise read it. Read the assigned C item, then the following relevant source sections. These ranges were verified at the accepted pre-C revision; assignment-only records do not move the policy ranges. Do not search headings before reading them. This is source-reading guidance, not a second copy of policy.

```powershell
Get-Content epics/braid/004-performance-optimization/backlog/C-git-startup-check.md
Get-Content epics/braid/004-performance-optimization/checkpoints/current.md
Get-Content epics/braid/004-performance-optimization/epic.md | Select-Object -Skip 15 -First 29
Get-Content epics/braid/004-performance-optimization/epic.md | Select-Object -Skip 55 -First 28
Get-Content README.md | Select-Object -Skip 12 -First 41
Get-Content docs/decisions.md -TotalCount 35
Get-Content docs/agile-workflow.md | Select-Object -Skip 36 -First 25
Get-Content docs/agile-workflow.md | Select-Object -Skip 96 -First 31
Get-Content docs/agent-handoff.md | Select-Object -Skip 28 -First 15
Get-Content epics/braid/004-performance-optimization/reports/C-startup-probe-001.md
```

Also inspect exact implementation inputs, without global discovery: `scripts/Test-CoordinatorRecordsGate.ps1` for native Git invocation patterns, `scripts/Verify.ps1` for fixture integration, `.agents/skills/braid-worker/SKILL.md` and `.agents/skills/braid-coordinate/SKILL.md` as candidate sources, their worker assignment/review assets, and `epics/report-format.md` relevant reporting/ownership sections. Candidate skill files are edit targets, not your active execution skill. Do not load every historical report or blank template at startup; the named assets are implementation inputs when editing them.

## Verified dependencies and accepted decisions

- A exact reviewed head `151497ddd8e139e34655fb493b6edd6f306ec26a`, review A-shared-node-toolchain-review-001 no actionable findings, human merge PR22 `e9a617fa60630327f161a78918f033e4461eb111` by `exones` at `2026-11-05T10:14:37Z`. Exact evidence: [A acceptance](../reports/A-acceptance.md) and [triage](../reports/A-coordinator-triage.md). Merge parents: `84a458ca785caea85ea7a5d5bede713e911832b3`, then reviewed head. Do not re-prove that dependency routinely.
- Fetched local epic fast-forwarded to that merge. Main `1dd5cb735c4614b75d96c0694c8c6d0a939f2605`; commits missing from epic count 0. Launch uses the subsequent committed context containing this packet, supplied explicitly.
- Initial user-authorized epic 003 base remains historical; it is not a new dependency gate. No merge/publication authority is granted by that inheritance.
- The [null probe/passive cross-check](../reports/C-startup-probe-001.md) is the research input. The null worker knew its tiny task and was instrumented/interrupted: do not call it a typical benchmark. Passive real A evidence independently shows nested-command and upstream-literal parsing errors, retries and repeated context discovery. Do not run another baseline or inspect live A unless a concrete conflict requires it.
- Settle only routine details within C. Preserve required checks, manual fallback when the pinned helper is unavailable, source-authoritative context, explicit initial/resume/reviewer revisions and user/index ownership. A successful local snapshot is not durable permission for later mutations. Do not implement product doctor, automatic Git repair or a generic context-indexing system.

## Git, ownership and first push

Host-bound branch `item/braid-004-c-git-startup-check`, initial HEAD equal to supplied committed epic tip, clean index/worktree, origin fetch/push `https://github.com/exones/braid.git`, no upstream expected. Verify root/branch/HEAD/status/origin/upstream once, with direct commands and literal arguments; no nested `pwsh -Command`, unquoted `@{upstream}`, branch inventory, routine fetch/history or upstream repair. `git for-each-ref --format='%(upstream)' refs/heads/item/braid-004-c-git-startup-check` can report an empty expected upstream without an error. Do not verify startup with the unaccepted helper you are about to implement.

First push: `git push --set-upstream origin item/braid-004-c-git-startup-check`. One PR into `epic/braid-004-performance-optimization`; no main PR. Stay on the bound branch; no worktree creation/switch/rename/reset/clean/rebase/force push. A genuine binding or unexpected dirty-state mismatch stops affected writes and is reported. Preserve others' files/index. Follow accepted base-sync rules and refresh affected proof after relevant changes.

Worker owns `scripts/Test-WorkspaceBinding.ps1`, `test/fixtures/workspace-binding/Test-WorkspaceBinding.ps1`, scoped Verify integration, worker/coordinator skill entry/assets, relevant contributor guidance/lasting decisions and own `checkpoints/C.md`, `reports/C.md`, `validation/C/`. No change to package engine/lockfile/npm policy, existing A implementation or unrelated workflow/release code. Coordinator owns epic/backlog/assignments/shared checkpoint/log and later review/acceptance. Do not edit the external pin or launch agents.

## Frozen implementation and verification

Implement the item's small versioned JSON input/result contract with explicit expected root/attached branch/full current HEAD, origin identities, exact upstream expectation and clean/declared dirty-index state. Use PowerShell/local Git only: the helper must run offline without Node/npm setup. Return 0 match, 1 mismatch, 2 invalid input/inspection failure; preserve native failure evidence and sanitize embedded URL credentials. Cover NUL-safe paths/renames, linked-worktree distinction, state drift, initial/resume/reviewer revision semantics and actual read-only preservation. Supply ready-to-run pinned context-read batches in future packets, and invoke the checker as a script with structured literal arguments.

The host's supported idle-create then one initial-send route successfully started the separate A reviewer with its actual binding before first execution; this is one observed launch, not a general durability guarantee. C may document the narrow supported route and test its sequencing as a scenario. Never restart a live worker for this optimization. No polling, new scheduler, transport guarantee or full ownership service.

Local required gates: `pwsh -NoProfile -File test/fixtures/workspace-binding/Test-WorkspaceBinding.ps1`, then `npm run verify` under Node `>=26.13.0 <27`, PowerShell >=7.6. Wire the new fixture into Verify and preserve all existing gates. Use accepted A's documented resolver/shared runtime as needed; reuse a valid installation and keep npm ci per checkout. Do not make running the helper itself install a runtime.

Skill validators are separate: run `python -X utf8 C:/Users/exon/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/braid-worker` and the same command for `.agents/skills/braid-coordinate` when edited. Report exact results or unavailable prerequisites separately; they are not in CI. No released controller/machine-ledger run is started by this maintenance item.

Frozen hosted proof on every candidate head: `.github/workflows/ci.yml`, push and pull_request, Windows and Ubuntu verify jobs in each event, successful Install dependencies, Verify and Upload packed tarball. Verify every configured job/step/upload, not only branch protection. Reconfirm head after proof; pending/failed/missing/skipped/cancelled/neutral/inaccessible/stale is not green.

Artifact checks required for all four event/platform artifacts: recompute tarball SHA-256 against sibling provenance digest and filename; clean candidate and installOutsideCheckout true; push sourceRevision/githubSha equals head; PR source and githubSha identify the actual merge-test SHA, verified parent relationship to base/head and pullRequestHeadSha. Retain run/attempt/job/step/artifact/source identities and API digest evidence; do not claim cross-OS equality/reproducibility or commit tarballs.

Prepare bounded local scenarios and directly usable contracts/examples for one subsequent worker-entry observation; coordinator owns any fresh-context top-level trial and can passively observe independent review entry. Do not launch nested agents or claim that a self-aware null worker proves representative gains. Return implementation green with coordinator-owned live observation limits explicit; these remain acceptance/review work before C Done. No hard elapsed-time target or speedup percentage without comparable evidence.

## Continuation, outputs and stop

Normal top-level T3 item thread, Cursor grok-4.7 high/500K. After local gates, commit/push candidate records, create one PR, immediately link it, watch if waiting and take one catch-up snapshot. If pending, end for the watch wake; no polling/sleep/schedule/background watcher. Worker retains diagnosis/repair/current-head verification. On complete frozen green proof, unwatch, comment facts and send one result per full head via t3_thread_send to coordinator `ae791527-bf56-41da-a7d9-30821a74cfc5`; dedupe and do not resend for acknowledgment. Report precise blockers earlier and continue independent in-scope work. Host rules take precedence.

Owned records: `epics/braid/004-performance-optimization/checkpoints/C.md`, `reports/C.md`, `validation/C/`. Follow the pinned report contract. Write candidate records before push; post-push proof stays in the PR comment/result unless a repair changes HEAD anyway. Include actual root/branch/full HEAD/PR, source pin, checks, observations/limits and proposed shared status. Stop after C. Independent review, coordinator adoption, human merge, B and final epic integration remain separate.
