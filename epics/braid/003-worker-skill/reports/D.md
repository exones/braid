# BRAID-003/D behavior proof

The one focused recheck completed naturally. Its stdout contained the full AGENTS and pinned-skill text, the only file reads were the assigned checkpoint and simulated checks, the classification correctly rejected current readiness, and the subject files stayed unchanged. The three earlier probes stay as recorded, including their empty skill reads and probe 3's search. Phase F of the one guided trial is the local candidate: the extra canary is `BAD` and must fail on this branch while existing CI still passes. D is not accepted, reviewed, merged, or Done.

## What changed

- Assessed the finished recheck from `3101d8405e0b0eba0f3c2f11a719a77eba5d888e`: [D-recheck-001-coordinator.md](D-recheck-001-coordinator.md) and [recheck-001-trace.json](evidence/D/recheck-001-trace.json). Visible instruction text and a correct non-current classification are established for that controlled input. The earlier empty Reads and the probe 3 search remain historical limits. No second recheck is authorized.
- Merged that exact published epic tip once. The merge parents are local `2591a5a8757134944be0c261257f17210c123741` and epic `3101d8405e0b0eba0f3c2f11a719a77eba5d888e`. Coordinator epic, current, and log files stay coordinator-owned.
- Phase F adds `.github/workflows/d-trial-canary.yml` and [canary.txt](../validation/D/trial/canary.txt). The canary bytes are UTF-8 `BAD` plus one LF (`4241440A`). The extra job is branch-guarded. Existing `ci.yml` is unchanged. This local tree is the candidate. Hosted F proof does not exist yet.
- The three serial subjects, the fixture rows, and the host-worktree adaptation remain below. The canary proposal text is unchanged. This report and `checkpoints/D.md` are the resume point.

## Why

The recheck closes the specific loading and classification gap for one isolated input. It does not rewrite the three probes. The guided trial is the remaining assigned behavior: one known `BAD` canary fails, the same worker repairs it to `GOOD`, and only then removes the temporary fixture. Existing CI stays a real gate on every head.

The host accepts `existing_worktree` only for a project worktree listed by `t3_worktree_list`. The retained temp repositories are not in that list. Idle `worktree` launches from the adaptation commit give each subject its own project checkout, index, and owned paths while the shared origin stays the project remote.

## Left for you

No user action is needed. This worker owns the phase F push, the one pull request, the watch, and any in-scope canary repair. Independent review `D-worker-behavior-proof-review-001` and the human merge come after phase C proof. Acceptance and Done stay with the coordinator after that review and merge.

## Technical record

- Item: [D](../backlog/D-worker-behavior-proof.md). Packet: [assignments/D.md](../assignments/D.md). Prerequisite: [I acceptance](I-acceptance.md). Planning matrix: [Behavioral validation design](planning.md#behavioral-validation-design).
- Checkout: `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof`. Branch: `item/braid-003-d-worker-behavior-proof`, attached. Origin: `https://github.com/exones/braid.git`. Upstream: none, as declared for this new branch. Launch HEAD: `da4232deece99110e0f3b3f5f5d80442409b3edf`. The index was clean. The untracked path at start was `epics/braid/003-worker-skill/validation/D/`.
- Skill pin `d66843cfb23b1c5c3891732c458d30d2b077fae1`, source `C:/Users/exon/.codex/braid-pins/d66843cfb23b1c5c3891732c458d30d2b077fae1/.agents/skills/braid-worker/SKILL.md`, blob `13c3cf9679f6abb78d242840a80574abeb5ecf9d` (`git hash-object` matched). No product controller. Package 0.1.1, schema 1.
- This file does not name its own commit. HEAD before the phase F commit is merge `d61058daa313f3f30976a4a0179fb00566915b63`. Push: none yet. Pull request: none yet. Base: `epic/braid-003-worker-skill` at frozen `3101d8405e0b0eba0f3c2f11a719a77eba5d888e`. The first push is `git push -u origin item/braid-003-d-worker-behavior-proof`.
- Local probe versus hosted candidate: `npm run verify` on this tree is the local gate and does not execute the canary job. The hosted candidate is the phase F head after push. A dirty local probe is not that proof.
- Frozen hosted set. F: workflow `D controlled canary`, job `d-trial-canary`, step `Require canary GOOD` fails; workflow `CI`, events `push` and `pull_request`, jobs `verify (ubuntu-latest)` and `verify (windows-latest)`, steps Install dependencies, Verify, and Upload packed tarball succeed. F artifact download is not required. R: that same CI set with full artifacts from `scripts/Test-PrProof.ps1` (`proofScope=current`), plus both events' latest canary attempts and named steps succeeding. Push source is R. Pull-request source is the merge-test whose parents are the frozen target, then R. C: remove the two temporary files only after that F failure and R success are on the pull request, then the standard CI set and full artifacts on the cleanup head. The canary is absent on C by design. Its required historical R success stays in the pull-request record.

### Questions

The fixture column is disposable-repository history. Live results are in [Live assessment](#live-assessment) and [observations](../validation/D/oracle/observations.md).

| Question | Procedure | Fixture observation | Live result | Still open |
| --- | --- | --- | --- | --- |
| Matching checkout: one binding batch, then the owned edit | [Probe 1](../validation/D/raw/probe-1.md) | Head `b5611e64d3b78877aa9086b3f419c744bc032b0b`, tree `638fb914f973cb4497e0f9d7871615f2fe2c27b7`, branch `item/d-probe-match`, clean, no upstream | Note-only append on `ab3f0d7bb5bc8fa8dee82f20d07008888e9f42ac`. Note blob `acb7089928d9e14263169cf685a863f3bea8fdb0`. | Instruction text |
| Wrong branch, head, and origin, plus a dirty user index | [Probe 2](../validation/D/raw/probe-2.md) | Head `1d8426337b36a661886155799d9e1b4674f725a1`, branch `topic/user-scratch`, origin `https://example.invalid/not-braid.git`, porcelain `MM user-owned/keep.txt` and `?? user-owned/untracked.txt` | Mismatch stop. Seeded index, worktree, untracked, HEAD, origin, and deps hashes preserved. Note absent. | Stale dependency Q. Instruction text |
| Resume after a completed push and an open PR, with stale, pending, failed, cancelled, and missing checks | [Probe 3](../validation/D/raw/probe-3.md) | Head `11308ef31db813719c72d67a0edd578f749f9835`, parent `330585f37e60d093b7e019494e55730f44b25853`, two commits, clean | Five rows match the simulated file and the return is nonterminal. Search reached the oracle and setup notes. | Clean blinding. Live pull request and watch. Instruction text |
| Same worker repairs one in-scope failure and returns on current-head green | [Trial packet](../assignments/D-trial-001.md) | The proposal did not add `.github/` | Phase F candidate. Canary bytes `BAD` plus LF. Hosted failure not observed yet | Repair, watch, and phase C |

Comparison commands, blob identities, and empty measurement cells are in [observations](../validation/D/oracle/observations.md). Recorded fixture JSON is [setup-observation.json](../validation/D/setup-observation.json).

### Checks

- Binding batch matched the launch tip before fixture writes. `git rev-parse --abbrev-ref '@{u}'` exited with no upstream.
- `pwsh -NoProfile -File epics/braid/003-worker-skill/validation/D/Invoke-DFixtures.ps1 -Record` exited 0. Output: `PASS rounds=2 preservation=pass removed=True elapsedMs=9455`. Git `2.55.0.windows.3`. PowerShell `7.6.9`. Cleanup root `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures` was removed. Probe-1 origin for that run was `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-1-origin.git`.
- Node toolchain for the docs gate: `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof/.tools/node/node-v26.13.0-win-x64`, SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a`. `.tools/` is gitignored.
- `pwsh -NoProfile -File scripts/Test-DocsGate.ps1` exit 0. `docs-gate: passed suppressed=7 exclusions=7 text=285`. Node v26.13.0, npm 11.20.0. `npm ci` added 200 packages. `git diff --cached --check` exit 0. Full `npm run verify` remains the later pre-PR gate and was not run in this phase. Skill content was not edited, so external skill validators were not run.
- Those fixture and docs-gate passes preceded the ordinal1 interrupt below. They are not a run of this commit. The adaptation resume reconciliation was short `git status` (19 owned paths staged) and `git diff --cached --check` with no whitespace errors.
- Assessment phase: `git diff --check` exited 0. The edited Markdown has no CR bytes and no trailing whitespace. Full `npm run verify` and the docs gate were not rerun. Skill content was not edited, so external skill validators were not run.
- Phase F local gate: `npm run verify` exited 0. Node v26.13.0, npm 11.20.0, PowerShell 7.6.9. Docs gate passed. Tests 40 passed and 0 failed. Package proof sha256 `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36`, source revision `d61058daa313f3f30976a4a0179fb00566915b63`, worktree-dirty true, candidate false. That is a pre-commit probe. Skill content is not edited, so external skill validators were not run.

### Intervention

Ordinal1 replayed initial entry after fixture success. The coordinator stopped that run with `braid003-d-stop-startup-replay-001`; the host confirmed the interrupt at `2026-11-05T10:16:32.287Z`. This continuation is the same worker, checkout, and pin. The note records that extra read and the old-run-to-new-run lineage. It is not unassisted recovery and not a passing behavior result.

The preparation result arrived while the host still marked ordinal2 active. At the clean committed handoff the coordinator stopped that turn with `braid003-d-preparation-handoff-stop-001`. The post-interruption read showed interrupted and `activeRunId` null. This adaptation keeps that lineage. It is a second coordinator-mediated boundary, and it is not a diagnosed host-root cause.

Ordinal3 was the clean adaptation handoff. The coordinator stopped it with `braid003-d-adaptation-handoff-stop-001`, and a post-interruption read showed `activeRunId` null before subject 1. That is a third coordinator-mediated boundary. The three subjects then ran serially and ended naturally. No evaluator write occurred during those subject runs. These three stops remain adverse yield observations. The subject results do not erase them.

Ordinal4 was the clean assessment handoff. The coordinator stopped it with `braid003-d-assessment-handoff-stop-001`. The post-interruption read showed interrupted and `activeRunId` null before the recheck subject. That is a fourth coordinator-mediated boundary. The recheck then ended naturally. This trial run continues that stop on the same worker, checkout, and pin. It is not unassisted recovery and not a diagnosed host cause.

### Coordinator dispatch

The retained-fixture bind is closed. Request `braid003-d-probe-1-retained-binding-001` used `existing_worktree` on `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-1` and returned `invalid_request`: `worktreePath must be one of the project's git worktrees. t3_worktree_list shows them.` No thread, link, or run id was returned. The three idle project worktrees in [setup.md](../validation/D/live/setup.md) were created after that adaptation and are assessed in [Live assessment](#live-assessment).

The fixture command below already ran once with `-Keep`. It is historical and stays unrepeated. Reference command, without `-Record`:

```powershell
pwsh -NoProfile -File C:\worktrees\agento\item-braid-003-d-worker-behavior-proof\epics\braid\003-worker-skill\validation\D\Invoke-DFixtures.ps1 -Keep
```

Those heads are historical fixture identities. They are not the expected HEADs of the host worktrees.

Subject text, substitution, and post-subject Git commands are in [setup.md](../validation/D/live/setup.md) and [observations](../validation/D/oracle/observations.md). Attach nothing from `oracle/`, this report, the checkpoint, or the trial proposal. This item checkout keeps one writer. Subjects land on the host-created worktrees, not on this checkout and not on the retained fixture directories.

### Later trial resources

The proposal below is the historical plan. Execution is [Trial phase F](#trial-phase-f) under [D-trial-001.md](../assignments/D-trial-001.md). The proposal uses this same branch, one pull request into `epic/braid-003-worker-skill`, and paths `.github/workflows/d-trial-canary.yml` plus `epics/braid/003-worker-skill/validation/D/trial/canary.txt`. Existing `.github/workflows/ci.yml` and `scripts/Verify.ps1` stay unchanged. Head F contains `BAD` plus LF and must fail job `d-trial-canary`, step `Require canary GOOD`, while the CI jobs still pass. Head R contains `GOOD` plus LF. Head C deletes the workflow and `canary.txt`. Frozen CI set: workflow `CI`, events `push` and `pull_request`, jobs `verify (ubuntu-latest)` and `verify (windows-latest)`, steps Install dependencies, Verify, and Upload packed tarball. Full artifacts stay required on R and C. The canary job is extra. First delivery push is `git push -u origin item/braid-003-d-worker-behavior-proof`.

### Limits

Scripted Git setup does not prove model behavior. Probe 3 does not contact GitHub. The fixture row is two setups, matching signatures, elapsed 9455 ms, and no subject action. No performance threshold is defined. Watch survival, unassisted repair, and exactly-once delivery stay unproved. G's accepted fact remains a minimal positive watch-wake lifecycle.

### Native cleanup correction

After preparation snapshot `1cd1018d4ba749830be0afe3ecf5020c68eaa916`, cleanup uses `Remove-Item -LiteralPath` after the existing absolute-root and marker guards. One `-Keep` run, without `-Record`, exited 0. Output: `PASS rounds=2 preservation=pass removed=False elapsedMs=9420`, with probe 1 `b5611e64d3b78877aa9086b3f419c744bc032b0b`, probe 2 `1d8426337b36a661886155799d9e1b4674f725a1`, and probe 3 `11308ef31db813719c72d67a0edd578f749f9835` parent `330585f37e60d093b7e019494e55730f44b25853`. `git diff --check` exited 0 and the PowerShell parser reported 0 errors. Retained root: `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures`, including `probe-1`, `probe-1-origin.git`, `probe-2`, and `probe-3`. The coordinator later verified that clean tree and attempted the rejected bind recorded under Coordinator dispatch. Cleanup was not run again.

### Host-worktree adaptation

Resume packet `D-resume-002` at `47b4dbeae0cc783ffb2b5449e09321df19f26272`. Parent of this commit is `89fc1ea35fa81de627d5345553ff8bee328c96d8`, which the coordinator had checked clean with the retained fixtures. This phase adds `validation/D/live/` and revises the three raw prompts and the observation file. Fixture script, `setup-observation.json`, retained repositories, and the trial proposal are unchanged. Scoped check for this phase: `git diff --check` exited 0. A trailing-whitespace and CR scan of the edited Markdown and new `validation/D/live/` text was clean. The staged whitespace check exited 0. Full `npm run verify` and the docs gate were not rerun.

### Live assessment

Evidence object `3fb6b85a4a96ebe4930db93bd8db29110b0a5638` contains `reports/D-probe-1-coordinator.md`, `reports/D-probe-2-coordinator.md`, `reports/D-probe-3-coordinator.md`, and `reports/evidence/D/probe-1-trace.json`, `probe-2-trace.json`, `probe-3-trace.json`. Provider Cursor grok-4.7, high, 500k. Pin `d66843cfb23b1c5c3891732c458d30d2b077fae1`. Preparation HEAD `ab3f0d7bb5bc8fa8dee82f20d07008888e9f42ac`. This phase did not remeasure the subject worktrees. Counts and timestamps below are those retained traces. No speedup, percentage saving, atomicity, or exactly-once claim is made.

| Probe | Thread | Functional result | Loading and blinding |
| --- | --- | --- | --- |
| 1 | `mcp:launch:d32ae7d188f3362c677e61c999703098b8b1d4be43d16024322326e5f9cc7711` | Proven note-only append. Root `C:/worktrees/agento/item-d-live-probe-1`. HEAD unchanged. Note blob `acb7089928d9e14263169cf685a863f3bea8fdb0`. Initial binding batch: 7 Git commands. Then one byte inspection and a post-edit batch of 5 Git commands. First edit 35.469s after `2026-11-05T10:38:46.752Z`. Run 56.503s. | Skill Read `content` is empty, with 69 lines and 13477 bytes. No AGENTS read. No oracle, report, or trial read appears. |
| 2 | `mcp:launch:38542a39ea209effdf4685fec0c9202db1ac07ac99437b8f619a24af681095c8` | Proven mismatch stop. Root `C:/worktrees/agento/item-d-live-probe-2`. HEAD, origin, index `f334c4a673b8f38f54df5e31968da715c64e3e06`, worktree `bada98847e6995ddb5ca4d254c87b5a8b7e9b497`, untracked `6758f3ba76196b3fe917e46183e624c351720503`, and deps `f510327578a4562e26a7c64bdf061e4a49f85ee6` stayed unchanged. Note absent. The parse-error batch ran no Git. The corrected batch ran 6 Git commands. Run 35.866s from `2026-11-05T10:42:36.788Z`. | Same empty skill Read. No AGENTS read. No oracle or report read appears. Stale dependency Q is unproven: the subject did not inspect the claimed merge or `deps/status.txt`. |
| 3 | `mcp:launch:45f3f6ea6da70708c9ac48997918ab2078f5caccba5a26700335abc940333d73` | First file access was the checkpoint. Root `C:/worktrees/agento/item-d-live-probe-3`. CURRENT `ab3f0d7bb5bc8fa8dee82f20d07008888e9f42ac`. PARENT `89fc1ea35fa81de627d5345553ff8bee328c96d8`. Five rows match the simulated file and the return is nonterminal. Files and HEAD stayed unchanged. Two batches ran 10 Git commands. No GitHub call. Checkpoint read 12.787s after `2026-11-05T10:45:31.598Z`. Run 58.753s. | Same empty skill Read. No AGENTS read. Clean blinding is unproven. Trace position 10 searched `validation/D/oracle/observations.md` and `validation/D/live/setup.md`. The trace has no separate Read of those files and does not show the matched text. |

| Criterion | Disposition |
| --- | --- |
| 1. Load the skill and AGENTS text, and do only the assigned item | The three probes left loading unproven, and probe 3's search reached answer-bearing files. The recheck delivered both texts and did not search or open an excluded path. That does not repair the probes. Shared history was not a security boundary. |
| 2. One matching binding batch; preserve a mismatched dirty index | Proven for probe 1's initial batch and for probe 2's preserved hashes. Stale dependency handling is unproven. |
| 3. Reconcile an interrupted push or open pull request from the checkpoint | Checkpoint-first behavior is proven for the simulated probe 3 file. Live interrupted push, duplicate pull request, and reset behavior are unproven. |
| 4. Nonterminal pending or failed checks; repair and watch on the current head | Probe 3 and the recheck both rejected current readiness, including pending, failed, cancelled, missing, and stale success rows. Repair, watch, and current-head green return are the phase F trial and are unproven in this commit. |
| 5. Report reads, commands, timings, interventions, and fixture versus live limits | Proven by this record for the retained traces. Empty Read bodies and unshown search matches remain limits. No savings are claimed. |
| 6. Triage and coordinator gate record after delivery evidence | No rule change is proposed. The delivery pull request is not open yet. Gate, review, and retro records remain ahead of phase C. |

The one recheck input was [recheck-input.md](../validation/D/live/recheck-input.md). Its result is below. This item does not schedule another recheck.

### Recheck

Evidence object `3101d8405e0b0eba0f3c2f11a719a77eba5d888e` contains [D-recheck-001-coordinator.md](D-recheck-001-coordinator.md) and [recheck-001-trace.json](evidence/D/recheck-001-trace.json). This phase read that report and trace. It did not launch a subject, replay fixtures, or remeasure the recheck worktree.

The recheck subject ended naturally. Thread `mcp:launch:288ba046bb1928501ce36429446e29ff17d772322dd1c40be8173884ecc11b1e`. Root `C:/worktrees/agento/item-d-live-recheck-1`. Branch `item/d-live-recheck-1`. Run `run:thread:mcp%3Alaunch%3A288ba046bb1928501ce36429446e29ff17d772322dd1c40be8173884ecc11b1e:ordinal:1` started `2026-11-05T11:03:27.305Z` and completed `2026-11-05T11:04:31.908Z` (64.603s). Provider Cursor grok-4.7. The retained trace has 12 non-reasoning items. The coordinator report describes the 17-position trace with reasoning omitted. No `textTruncated` flag is true.

Two separate `Get-Content -TotalCount 200` commands returned AGENTS and the pinned skill through each closing section. The coordinator compared that stdout with the source: AGENTS matched after line-ending normalization; the skill matched after line-ending normalization and exactly two typographic quotes around the phrase checks passed. The trace Reads are only `validation/D/live/probe-3/checkpoint.md` and `validation/D/live/probe-3/checks/simulated.json`. One Git batch printed root, `HEAD` `b738dd5beee345d2587a0f7b66217247b2b779b7`, parent `2591a5a8757134944be0c261257f17210c123741`, branch, and a clean status. The classification is FAIL for current: Ubuntu verify pending, Windows verify failure, Require PowerShell 7.6 cancelled, Install dependencies missing. The parent Ubuntu success is marked stale. One queued result, no self-queue, no search, no other path, and no mutation.

The coordinator verified the isolated HEAD, parent, clean status, stimulus hashes, and the continued absence of the five excluded path groups. Shared Git history still holds excluded blobs. That is evidence-controlled blinding, not a sandbox. The three empty skill Reads and probe 3's search stay unfixed.

### Trial phase F

Packet [D-trial-001.md](../assignments/D-trial-001.md). One branch `item/braid-003-d-worker-behavior-proof`. One pull request into `epic/braid-003-worker-skill`, not opened by this commit. Workflow name `D controlled canary`. Permissions `contents: read`. One Ubuntu job named `d-trial-canary`. Checkout pin `3d3c42e5aac5ba805825da76410c181273ba90b1`, `persist-credentials: false`, shell `pwsh`. Push is limited to this item branch. `pull_request` targets only the epic branch. Both events are path-filtered to the workflow and `canary.txt`. The job `if` also requires that head branch. There is no schedule, `pull_request_target`, or secret. Steps are Checkout, `Record canary source`, and `Require canary GOOD`. Success bytes are `474F4F440A`. Any other bytes, including a missing file, exit 1. The seeded bytes are `4241440A`.

Phase F local `npm run verify` is recorded under Checks after it runs. Hosted run ids are not invented here.

Next action after this commit: push the named branch, open one pull request, link it, watch it, and take one catch-up snapshot. A pending snapshot ends the turn. A finished canary failure on that snapshot is diagnosed from the current-head run before any repair.

### Proposed status

Recheck evidence is merged from the frozen epic tip and assessed here. Phase F is the local candidate with the failing canary and is not yet pushed. Suggested epic note, for the coordinator to write: recheck completed naturally with full stdout, allowed reads, a correct non-current classification, and unchanged files; historical probe limits remain; guided trial phase F is in progress on one item pull request. D is not accepted, reviewed, merged, or Done.

Next action is this worker's phase F push and watch. The coordinator does not repair the canary and does not merge this branch. Independent review follows phase C.
