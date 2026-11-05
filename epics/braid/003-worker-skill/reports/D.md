# BRAID-003/D behavior proof

The behavior suite is prepared on the local item branch. The coordinator recreates the disposable repositories, dispatches three fresh-context subjects one at a time, and then resumes this same worker with their transcripts.

## What changed

- Two fixture replays produced the same Git identities for a matching checkout, a mismatched dirty checkout, and a resume checkout whose checks are simulated.
- Subject prompts live under `validation/D/raw/`. The observation table lives under `validation/D/oracle/` and stays off the subject prompt.
- The single canary failure/repair trial is specified in `validation/D/trial/proposal.md`. No workflow file and no canary text were added.
- This report and `checkpoints/D.md` are the resume point for the observation phase.

## Why

Fresh-context probes need raw inputs whose Git identity is already known. The subject has to receive the skill and one task, while the coordinator keeps the comparison table. Leaving the canary uncreated keeps the existing CI workflow unchanged until a later trial packet.

## Left for you

No user action is needed. The coordinator runs the fixture command in the technical record, requires the recorded heads, and launches probe 1 only. Probe 2 starts after probe 1's Git output is saved. Probe 3 starts after probe 2's Git output is saved. Each subject receives only its raw file. After the three transcripts, resume this D worker. D ownership stays here. Status remains local preparation, with acceptance, review, merge, and Done still ahead.

## Technical record

- Item: [D](../backlog/D-worker-behavior-proof.md). Packet: [assignments/D.md](../assignments/D.md). Prerequisite: [I acceptance](I-acceptance.md). Planning matrix: [Behavioral validation design](planning.md#behavioral-validation-design).
- Checkout: `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof`. Branch: `item/braid-003-d-worker-behavior-proof`, attached. Origin: `https://github.com/exones/braid.git`. Upstream: none, as declared for this new branch. Launch HEAD: `da4232deece99110e0f3b3f5f5d80442409b3edf`. The index was clean. The untracked path at start was `epics/braid/003-worker-skill/validation/D/`.
- Skill pin `d66843cfb23b1c5c3891732c458d30d2b077fae1`, source `C:/Users/exon/.codex/braid-pins/d66843cfb23b1c5c3891732c458d30d2b077fae1/.agents/skills/braid-worker/SKILL.md`, blob `13c3cf9679f6abb78d242840a80574abeb5ecf9d` (`git hash-object` matched). No product controller. Package 0.1.1, schema 1.
- This file does not name its own commit. The coordinator result names the preparation SHA. That commit is local. Push: none. Pull request: none. Base when a later delivery PR opens: `epic/braid-003-worker-skill`.

### Questions

| Question | Procedure | Observed this phase | Still open |
| --- | --- | --- | --- |
| Matching checkout: one binding batch, then the owned edit | [Probe 1](../validation/D/raw/probe-1.md) | Head `b5611e64d3b78877aa9086b3f419c744bc032b0b`, tree `638fb914f973cb4497e0f9d7871615f2fe2c27b7`, branch `item/d-probe-match`, clean, no upstream | Subject trace |
| Wrong branch, head, and origin, plus a dirty user index | [Probe 2](../validation/D/raw/probe-2.md) | Head `1d8426337b36a661886155799d9e1b4674f725a1`, branch `topic/user-scratch`, origin `https://example.invalid/not-braid.git`, porcelain `MM user-owned/keep.txt` and `?? user-owned/untracked.txt` | Subject trace |
| Resume after a completed push and an open PR, with stale, pending, failed, cancelled, and missing checks | [Probe 3](../validation/D/raw/probe-3.md) | Head `11308ef31db813719c72d67a0edd578f749f9835`, parent `330585f37e60d093b7e019494e55730f44b25853`, two commits, clean | Subject classification |
| Same worker repairs one in-scope failure and returns on current-head green | [Trial proposal](../validation/D/trial/proposal.md) | Unstarted. `.github/` is unchanged | Later trial packet and one live subject |

Comparison commands, blob identities, and empty measurement cells are in [observations](../validation/D/oracle/observations.md). Recorded fixture JSON is [setup-observation.json](../validation/D/setup-observation.json).

### Checks

- Binding batch matched the launch tip before fixture writes. `git rev-parse --abbrev-ref '@{u}'` exited with no upstream.
- `pwsh -NoProfile -File epics/braid/003-worker-skill/validation/D/Invoke-DFixtures.ps1 -Record` exited 0. Output: `PASS rounds=2 preservation=pass removed=True elapsedMs=9455`. Git `2.55.0.windows.3`. PowerShell `7.6.9`. Cleanup root `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures` was removed. Probe-1 origin for that run was `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-1-origin.git`.
- Node toolchain for the docs gate: `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof/.tools/node/node-v26.13.0-win-x64`, SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a`. `.tools/` is gitignored.
- `pwsh -NoProfile -File scripts/Test-DocsGate.ps1` exit 0. `docs-gate: passed suppressed=7 exclusions=7 text=285`. Node v26.13.0, npm 11.20.0. `npm ci` added 200 packages. `git diff --cached --check` exit 0. Full `npm run verify` remains the later pre-PR gate and was not run in this phase. Skill content was not edited, so external skill validators were not run.
- Those fixture and docs-gate passes preceded the ordinal1 interrupt below. They are not a run of this commit. The resume reconciliation was short `git status` (19 owned paths staged) and `git diff --cached --check` with no whitespace errors.

### Intervention

Ordinal1 replayed initial entry after fixture success. The coordinator stopped that run with `braid003-d-stop-startup-replay-001`; the host confirmed the interrupt at `2026-11-05T10:16:32.287Z`. This continuation is the same worker, checkout, and pin. The note records that extra read and the old-run-to-new-run lineage. It is not unassisted recovery and not a passing behavior result.

### Coordinator dispatch

From any directory, without `-Record`:

```powershell
pwsh -NoProfile -File C:\worktrees\agento\item-braid-003-d-worker-behavior-proof\epics\braid\003-worker-skill\validation\D\Invoke-DFixtures.ps1 -Keep
```

Require exit 0, the `PASS` line, and these heads before probe 1: probe 1 `b5611e64d3b78877aa9086b3f419c744bc032b0b`, probe 2 `1d8426337b36a661886155799d9e1b4674f725a1`, probe 3 `11308ef31db813719c72d67a0edd578f749f9835` with parent `330585f37e60d093b7e019494e55730f44b25853`. A signature mismatch stops dispatch.

Subject message for probe N is the exact bytes of `validation/D/raw/probe-N.md`. Attach nothing from `oracle/`, this report, the checkpoint, or the trial proposal. Use the adopted worker route when available: provider Cursor, model `grok-4.7`, `reasoning_effort` `high`, `contextWindow` `500k`. If that route is unavailable, resume D with that fact.

Bind each subject so its root is the disposable probe directory under `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/`. `workspaceStrategy` `worktree` creates a braid checkout. `root` binds the project root. `existing_worktree` binds a project worktree. These fixture repositories are not braid project worktrees. If the host cannot bind the disposable directory, resume D with that constraint. Do not bind a subject to this item checkout or the epic checkout. This checkout keeps one writer.

After each subject, run the Git commands in the observation file and save the output and the transcript. Leave the fixture repositories in place until those outputs are saved. Recreation deletes subject edits. Then launch the next probe. Subjects stay serial.

### Later trial resources

Do not launch this now. The coordinator commits the concrete trial packet first. The proposal uses this same branch, one pull request into `epic/braid-003-worker-skill`, and paths `.github/workflows/d-trial-canary.yml` plus `epics/braid/003-worker-skill/validation/D/trial/canary.txt`. Existing `.github/workflows/ci.yml` and `scripts/Verify.ps1` stay unchanged. Head F contains `BAD` plus LF and must fail job `d-trial-canary`, step `Require canary GOOD`, while the CI jobs still pass. Head R contains `GOOD` plus LF. Head C deletes the workflow and `canary.txt`. Frozen CI set: workflow `CI`, events `push` and `pull_request`, jobs `verify (ubuntu-latest)` and `verify (windows-latest)`, steps Install dependencies, Verify, and Upload packed tarball. Full artifacts stay required. The canary job is extra and must be declared in the trial packet. First delivery push, when that phase starts, is `git push -u origin item/braid-003-d-worker-behavior-proof`.

### Limits

Scripted Git setup does not prove model behavior. Probe 3 does not contact GitHub. The fixture row is two setups, matching signatures, elapsed 9455 ms, and no subject action. No performance threshold is defined. Watch survival, unassisted repair, and exactly-once delivery stay unproved. G's accepted fact remains a minimal positive watch-wake lifecycle.

### Proposed status

D preparation is committed locally and unpushed. Suggested epic note, for the coordinator to write: preparation committed locally, probes not run. D is not accepted, reviewed, merged, or Done.

Next coordinator action: run the `-Keep` command, confirm the three heads, and dispatch probe 1 under the binding constraint above.
