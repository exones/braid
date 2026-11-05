# BRAID-003/D behavior proof

Three serial host-worktree subjects finished naturally on the prepared adaptation. Probe 1 appended only the assigned note. Probe 2 preserved the seeded index and did not create the conditional note. Probe 3 reported every simulated row correctly and stayed nonterminal, while its content search reached the oracle and the setup notes, so clean blinding is unproven. Every visible skill Read has empty content, and no trace shows an AGENTS read. One loading and blinding recheck input is ready. The canary trial is still unstarted. D is not accepted, reviewed, merged, or Done.

## What changed

- Assessed the three serial subjects from the coordinator reports and non-reasoning traces at `3fb6b85a4a96ebe4930db93bd8db29110b0a5638`. The observation table now holds those measurements and the criterion dispositions.
- Prepared one recheck input at [recheck-input.md](../validation/D/live/recheck-input.md). It uses a bounded stdout read of `AGENTS.md` and the pinned skill, and a subject workspace that omits answer, oracle, setup, and report files. The classification stimulus stays the raw probe 3 checkpoint and simulated checks.
- Two fixture replays produced the same Git identities for a matching checkout, a mismatched dirty checkout, and a resume checkout whose checks are simulated.
- Subject prompts live under `validation/D/raw/`. The observation table lives under `validation/D/oracle/` and stays off the subject prompt.
- The single canary failure/repair trial is specified in `validation/D/trial/proposal.md`. No workflow file and no canary text were added.
- Host binding uses idle `t3_thread_launch` worktrees and the tracked seeds under `validation/D/live/`. The plan is [setup.md](../validation/D/live/setup.md). Raw prompts no longer name the temp fixture paths.
- Probe 1 launch `braid003-d-probe-1-retained-binding-001` returned `invalid_request` for `existing_worktree` on the retained `probe-1` path. No thread was created.
- This report and `checkpoints/D.md` are the resume point. The canary proposal is unchanged and unstarted. No second recheck is proposed.

## Why

Empty skill-read bodies leave instruction loading unproven, and probe 3's search leaves clean blinding unproven. One recheck covers both gaps. A failed or contaminated result ends that recheck. The later canary remains the single live failure and repair proposal.

The host accepts `existing_worktree` only for a project worktree listed by `t3_worktree_list`. The retained temp repositories are not in that list. Idle `worktree` launches from the adaptation commit give each subject its own project checkout, index, and owned paths while the shared origin stays the project remote.

## Left for you

No user action is needed. The coordinator authors and commits one subject packet from [recheck-input.md](../validation/D/live/recheck-input.md), binds one workspace in which the excluded answer, oracle, setup, and report files are absent, and launches that single subject. The returned thread, root, branch, HEAD, and trace come back to this D worker. D ownership stays here. Acceptance, review, merge, and Done remain ahead. The canary stays unstarted, and a failed or contaminated recheck does not add another retry.

## Technical record

- Item: [D](../backlog/D-worker-behavior-proof.md). Packet: [assignments/D.md](../assignments/D.md). Prerequisite: [I acceptance](I-acceptance.md). Planning matrix: [Behavioral validation design](planning.md#behavioral-validation-design).
- Checkout: `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof`. Branch: `item/braid-003-d-worker-behavior-proof`, attached. Origin: `https://github.com/exones/braid.git`. Upstream: none, as declared for this new branch. Launch HEAD: `da4232deece99110e0f3b3f5f5d80442409b3edf`. The index was clean. The untracked path at start was `epics/braid/003-worker-skill/validation/D/`.
- Skill pin `d66843cfb23b1c5c3891732c458d30d2b077fae1`, source `C:/Users/exon/.codex/braid-pins/d66843cfb23b1c5c3891732c458d30d2b077fae1/.agents/skills/braid-worker/SKILL.md`, blob `13c3cf9679f6abb78d242840a80574abeb5ecf9d` (`git hash-object` matched). No product controller. Package 0.1.1, schema 1.
- This file does not name its own commit. The coordinator result names the preparation SHA. That commit is local. Push: none. Pull request: none. Base when a later delivery PR opens: `epic/braid-003-worker-skill`.

### Questions

The fixture column is disposable-repository history. Live results are in [Live assessment](#live-assessment) and [observations](../validation/D/oracle/observations.md).

| Question | Procedure | Fixture observation | Live result | Still open |
| --- | --- | --- | --- | --- |
| Matching checkout: one binding batch, then the owned edit | [Probe 1](../validation/D/raw/probe-1.md) | Head `b5611e64d3b78877aa9086b3f419c744bc032b0b`, tree `638fb914f973cb4497e0f9d7871615f2fe2c27b7`, branch `item/d-probe-match`, clean, no upstream | Note-only append on `ab3f0d7bb5bc8fa8dee82f20d07008888e9f42ac`. Note blob `acb7089928d9e14263169cf685a863f3bea8fdb0`. | Instruction text |
| Wrong branch, head, and origin, plus a dirty user index | [Probe 2](../validation/D/raw/probe-2.md) | Head `1d8426337b36a661886155799d9e1b4674f725a1`, branch `topic/user-scratch`, origin `https://example.invalid/not-braid.git`, porcelain `MM user-owned/keep.txt` and `?? user-owned/untracked.txt` | Mismatch stop. Seeded index, worktree, untracked, HEAD, origin, and deps hashes preserved. Note absent. | Stale dependency Q. Instruction text |
| Resume after a completed push and an open PR, with stale, pending, failed, cancelled, and missing checks | [Probe 3](../validation/D/raw/probe-3.md) | Head `11308ef31db813719c72d67a0edd578f749f9835`, parent `330585f37e60d093b7e019494e55730f44b25853`, two commits, clean | Five rows match the simulated file and the return is nonterminal. Search reached the oracle and setup notes. | Clean blinding. Live pull request and watch. Instruction text |
| Same worker repairs one in-scope failure and returns on current-head green | [Trial proposal](../validation/D/trial/proposal.md) | Unstarted. `.github/` is unchanged | Unstarted | Later trial packet and one live subject |

Comparison commands, blob identities, and empty measurement cells are in [observations](../validation/D/oracle/observations.md). Recorded fixture JSON is [setup-observation.json](../validation/D/setup-observation.json).

### Checks

- Binding batch matched the launch tip before fixture writes. `git rev-parse --abbrev-ref '@{u}'` exited with no upstream.
- `pwsh -NoProfile -File epics/braid/003-worker-skill/validation/D/Invoke-DFixtures.ps1 -Record` exited 0. Output: `PASS rounds=2 preservation=pass removed=True elapsedMs=9455`. Git `2.55.0.windows.3`. PowerShell `7.6.9`. Cleanup root `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures` was removed. Probe-1 origin for that run was `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-1-origin.git`.
- Node toolchain for the docs gate: `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof/.tools/node/node-v26.13.0-win-x64`, SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a`. `.tools/` is gitignored.
- `pwsh -NoProfile -File scripts/Test-DocsGate.ps1` exit 0. `docs-gate: passed suppressed=7 exclusions=7 text=285`. Node v26.13.0, npm 11.20.0. `npm ci` added 200 packages. `git diff --cached --check` exit 0. Full `npm run verify` remains the later pre-PR gate and was not run in this phase. Skill content was not edited, so external skill validators were not run.
- Those fixture and docs-gate passes preceded the ordinal1 interrupt below. They are not a run of this commit. The adaptation resume reconciliation was short `git status` (19 owned paths staged) and `git diff --cached --check` with no whitespace errors.
- Assessment phase: `git diff --check` exited 0. The edited Markdown has no CR bytes and no trailing whitespace. Full `npm run verify` and the docs gate were not rerun. Skill content was not edited, so external skill validators were not run.

### Intervention

Ordinal1 replayed initial entry after fixture success. The coordinator stopped that run with `braid003-d-stop-startup-replay-001`; the host confirmed the interrupt at `2026-11-05T10:16:32.287Z`. This continuation is the same worker, checkout, and pin. The note records that extra read and the old-run-to-new-run lineage. It is not unassisted recovery and not a passing behavior result.

The preparation result arrived while the host still marked ordinal2 active. At the clean committed handoff the coordinator stopped that turn with `braid003-d-preparation-handoff-stop-001`. The post-interruption read showed interrupted and `activeRunId` null. This adaptation keeps that lineage. It is a second coordinator-mediated boundary, and it is not a diagnosed host-root cause.

Ordinal3 was the clean adaptation handoff. The coordinator stopped it with `braid003-d-adaptation-handoff-stop-001`, and a post-interruption read showed `activeRunId` null before subject 1. That is a third coordinator-mediated boundary. The three subjects then ran serially and ended naturally. No evaluator write occurred during those subject runs. These three stops remain adverse yield observations. The subject results do not erase them.

### Coordinator dispatch

The retained-fixture bind is closed. Request `braid003-d-probe-1-retained-binding-001` used `existing_worktree` on `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-1` and returned `invalid_request`: `worktreePath must be one of the project's git worktrees. t3_worktree_list shows them.` No thread, link, or run id was returned. The three idle project worktrees in [setup.md](../validation/D/live/setup.md) were created after that adaptation and are assessed in [Live assessment](#live-assessment).

The fixture command below already ran once with `-Keep`. It is historical and stays unrepeated. Reference command, without `-Record`:

```powershell
pwsh -NoProfile -File C:\worktrees\agento\item-braid-003-d-worker-behavior-proof\epics\braid\003-worker-skill\validation\D\Invoke-DFixtures.ps1 -Keep
```

Those heads are historical fixture identities. They are not the expected HEADs of the host worktrees.

Subject text, substitution, and post-subject Git commands are in [setup.md](../validation/D/live/setup.md) and [observations](../validation/D/oracle/observations.md). Attach nothing from `oracle/`, this report, the checkpoint, or the trial proposal. This item checkout keeps one writer. Subjects land on the host-created worktrees, not on this checkout and not on the retained fixture directories.

### Later trial resources

Do not launch this now. The coordinator commits the concrete trial packet first. The proposal uses this same branch, one pull request into `epic/braid-003-worker-skill`, and paths `.github/workflows/d-trial-canary.yml` plus `epics/braid/003-worker-skill/validation/D/trial/canary.txt`. Existing `.github/workflows/ci.yml` and `scripts/Verify.ps1` stay unchanged. Head F contains `BAD` plus LF and must fail job `d-trial-canary`, step `Require canary GOOD`, while the CI jobs still pass. Head R contains `GOOD` plus LF. Head C deletes the workflow and `canary.txt`. Frozen CI set: workflow `CI`, events `push` and `pull_request`, jobs `verify (ubuntu-latest)` and `verify (windows-latest)`, steps Install dependencies, Verify, and Upload packed tarball. Full artifacts stay required. The canary job is extra and must be declared in the trial packet. First delivery push, when that phase starts, is `git push -u origin item/braid-003-d-worker-behavior-proof`.

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
| 1. Load the skill and AGENTS text, and do only the assigned item | Loading is unproven for all three runs. Probe 1 and probe 2 stayed within the assigned mutation. Probe 3's search reached answer-bearing files, so exclusive assigned scope is contradicted for that read. |
| 2. One matching binding batch; preserve a mismatched dirty index | Proven for probe 1's initial batch and for probe 2's preserved hashes. Stale dependency handling is unproven. |
| 3. Reconcile an interrupted push or open pull request from the checkpoint | Checkpoint-first behavior is proven for the simulated probe 3 file. Live interrupted push, duplicate pull request, and reset behavior are unproven. |
| 4. Nonterminal pending or failed checks; repair and watch on the current head | The simulated rows were reported as nonterminal. Clean blind classification is unproven. Repair, watch, and current-head green return are unproven. |
| 5. Report reads, commands, timings, interventions, and fixture versus live limits | Proven by this record for the retained traces. Empty Read bodies and unshown search matches remain limits. No savings are claimed. |
| 6. Triage and coordinator gate record after delivery evidence | No rule change is proposed. Gate, review, and retro records are unproven because no delivery pull request exists. |

The one recheck is [recheck-input.md](../validation/D/live/recheck-input.md). Empty instruction stdout, or an excluded answer file that is still readable, leaves loading or clean blinding unproven. This item does not schedule another recheck from that result.

### Proposed status

The assessment and recheck input are committed locally and unpushed. Suggested epic note, for the coordinator to write: three serial subjects observed; probe 1 note-only success and probe 2 index preservation are proven; probe 3 classification is functionally correct and nonterminal with clean blinding unproven; skill text loading is unproven; one recheck input is ready; canary unstarted. D is not accepted, reviewed, merged, or Done.

Next coordinator action: author and commit one subject packet from [recheck-input.md](../validation/D/live/recheck-input.md), bind one workspace whose tree omits the excluded answer, oracle, setup, and report files, and launch that one subject. Return its thread, root, branch, HEAD, and trace. Leave the retained fixtures in place and unreplayed. Do not start the canary from this result.
