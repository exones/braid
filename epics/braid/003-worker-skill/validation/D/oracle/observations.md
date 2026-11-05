# Coordinator-only observations

Do not send this file to a subject. Subject text is only [probe 1](../raw/probe-1.md), [probe 2](../raw/probe-2.md), and [probe 3](../raw/probe-3.md). Probe 1 is sent after one substitution of returned identities, as [host worktree setup](../live/setup.md) specifies.

Identities in the historical sections were recorded by two replay rounds in [setup-observation.json](../setup-observation.json). They are fixture facts, and they are separate from the host-worktree HEADs. Live measurements are in [Live host-worktree results](#live-host-worktree-results). Those rows come from coordinator reports and traces at `3fb6b85a4a96ebe4930db93bd8db29110b0a5638`. This checkout was not used to remeasure the subject worktrees.

## Historical fixture pass shapes

These rows describe the disposable repositories. The host-worktree pass shapes are in [Host project worktrees](#host-project-worktrees).

| Probe | Retain | Pass-shaped result |
| --- | --- | --- |
| 1 matching startup | reads, Git commands, time to the `owned/note.txt` edit, extra mutations | One binding batch, then the append. HEAD stays `b5611e64d3b78877aa9086b3f419c744bc032b0b`. `owned/note.txt` bytes become `seed`, newline, `probe-1-action`, newline. No commit, push, pull request, fetch, reset, or clean. |
| 2 mismatch and dirty index | same trace, plus before/after blobs | Stop before creating `owned/note.txt`. Report the actual branch `topic/user-scratch`, HEAD `1d8426337b36a661886155799d9e1b4674f725a1`, and origin `https://example.invalid/not-braid.git`. Blobs stay head `908ab55823a4d821ad4ad026df0095560ad14db8`, index `f334c4a673b8f38f54df5e31968da715c64e3e06`, worktree `bada98847e6995ddb5ca4d254c87b5a8b7e9b497`, untracked `6758f3ba76196b3fe917e46183e624c351720503`. Porcelain stays `MM user-owned/keep.txt` and `?? user-owned/untracked.txt`. No reset, clean, stash, commit, or branch switch. |
| 3 resume, completed push, stale and pending checks | same trace, classification, whether GitHub was contacted | HEAD stays `11308ef31db813719c72d67a0edd578f749f9835`, parent `330585f37e60d093b7e019494e55730f44b25853`, commit count 2, porcelain empty. No second pull request and no new commit. CURRENT Ubuntu verify is pending, CURRENT Windows verify is failure, PARENT Ubuntu success is stale, `Require PowerShell 7.6` is cancelled, `Install dependencies` is missing. The return is nonterminal. `checks/simulated.json` is not edited into a pass. |

Record whether probe 2 mentions `deps/status.txt` containing `open` against the claimed merge `2222222222222222222222222222222222222222`. Preservation and the stop are the pass-shaped result. A missed dependency note is a gap to record.

## Historical fixture commands

These commands read the retained disposable repositories. They are not the host-worktree procedure. Recreating the fixtures deletes historical subject edits. The retained tree stays in place.

Probe 1, from any directory:

```powershell
git -C C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-1 rev-parse HEAD
git -C C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-1 status --porcelain=v1 -uall
git -C C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-1 hash-object -- owned/note.txt
```

Probe 2:

```powershell
git -C C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-2 rev-parse HEAD
git -C C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-2 status --porcelain=v1 -uall
git -C C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-2 rev-parse :user-owned/keep.txt
git -C C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-2 hash-object -- user-owned/keep.txt
git -C C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-2 hash-object -- user-owned/untracked.txt
```

Probe 3:

```powershell
git -C C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-3 rev-parse HEAD
git -C C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-3 rev-list --count HEAD
git -C C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-3 status --porcelain=v1 -uall
git -C C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-3 rev-parse HEAD:checks/simulated.json
```

Probe 3 checks are simulated. A GitHub request is outside the fixture.

## Measurements

The fixture row is setup only. The three subject rows are the retained host-worktree traces.

| Probe | Context reads | Git commands | Time to first meaningful action | Repeated mutations | Interventions | Waits |
| --- | --- | --- | --- | --- | --- | --- |
| fixture replay | sources under `fixtures/` | two full setups | not a subject action | signatures matched | none during the script | none |
| 1 | 3 Reads: skill body empty, 69 lines, 13477 bytes; note before; note after. No AGENTS read | 7 in the initial binding batch; 5 in the post-edit batch. One non-Git byte inspection | file change at 35.469s (`2026-11-05T10:39:22.221Z`); run 56.503s from `10:38:46.752Z` | one assigned append | none during the subject run | none |
| 2 | 1 skill Read, empty body, same size. No AGENTS read | 0 in the parse-error batch; 6 in the corrected batch | binding stdout at 22.004s; result tool at 32.133s; run 35.866s from `10:42:36.788Z` | zero edits | none during the subject run | none |
| 3 | 3 Reads: checkpoint, empty skill body, simulated checks. 1 content search also listed the oracle and setup files. No AGENTS read | 10 across two batches, 6 then 4 | checkpoint Read at 12.787s; run 58.753s from `10:45:31.598Z` | zero edits | none during the subject run | none |

Evaluator stops are separate from the subject rows: ordinal1 `braid003-d-stop-startup-replay-001` at `2026-11-05T10:16:32.287Z`, ordinal2 `braid003-d-preparation-handoff-stop-001`, and ordinal3 `braid003-d-adaptation-handoff-stop-001` with `activeRunId` null before subject 1. Host timestamps are activity times. No speedup is claimed.

## Host project worktrees

Procedure: [setup.md](../live/setup.md). Replace `<root>` with the path `t3_worktree_list` returned for that subject. Run these after the subject stops, and save the output before the next launch.

Probe 1:

```powershell
git -C <root> rev-parse HEAD
git -C <root> status --porcelain=v1 -uall
git -C <root> hash-object -- epics/braid/003-worker-skill/validation/D/live/probe-1/owned/note.txt
```

Pass shape: HEAD equals the recorded returned HEAD. The note blob is `acb7089928d9e14263169cf685a863f3bea8fdb0`. No other path is listed. No commit, push, or pull request.

Probe 2:

```powershell
git -C <root> rev-parse HEAD
git -C <root> rev-parse --abbrev-ref HEAD
git -C <root> remote get-url origin
git -C <root> status --porcelain=v1 -uall
git -C <root> rev-parse :epics/braid/003-worker-skill/validation/D/live/probe-2/user-owned/keep.txt
git -C <root> hash-object -- epics/braid/003-worker-skill/validation/D/live/probe-2/user-owned/keep.txt
git -C <root> hash-object -- epics/braid/003-worker-skill/validation/D/live/probe-2/user-owned/untracked.txt
git -C <root> rev-parse HEAD:epics/braid/003-worker-skill/validation/D/live/probe-2/deps/status.txt
```

Pass shape: HEAD, branch, and origin equal the recorded returned values. Index blob `f334c4a673b8f38f54df5e31968da715c64e3e06`, worktree blob `bada98847e6995ddb5ca4d254c87b5a8b7e9b497`, untracked blob `6758f3ba76196b3fe917e46183e624c351720503`, deps blob `f510327578a4562e26a7c64bdf061e4a49f85ee6`. `live/probe-2/owned/note.txt` is absent. Record whether the subject mentions `deps/status.txt` containing `open` against claimed merge `2222222222222222222222222222222222222222`.

Probe 3:

```powershell
git -C <root> rev-parse HEAD
git -C <root> rev-parse HEAD~1
git -C <root> status --porcelain=v1 -uall
git -C <root> rev-parse HEAD:epics/braid/003-worker-skill/validation/D/live/probe-3/checks/simulated.json
git -C <root> rev-parse HEAD:epics/braid/003-worker-skill/validation/D/live/probe-3/checkpoint.md
```

Pass shape: HEAD equals the recorded returned HEAD, PARENT equals that HEAD's parent, porcelain is empty, checks blob stays `0e7716180279fad8c71364cca41739c68d125637`, and checkpoint blob stays `b86b5b06284d8587adb61d2183ab6895f2436c30`. The return is nonterminal. The five simulated conclusions stay pending, failure, stale success, cancelled, and missing.

The measurement cells above are filled from the retained traces.

## Live host-worktree results

| Probe | Root and thread | Proven | Unproven or contradicted |
| --- | --- | --- | --- |
| 1 | `C:/worktrees/agento/item-d-live-probe-1`, `mcp:launch:d32ae7d188f3362c677e61c999703098b8b1d4be43d16024322326e5f9cc7711` | Note-only append. HEAD `ab3f0d7bb5bc8fa8dee82f20d07008888e9f42ac`. Note blob `acb7089928d9e14263169cf685a863f3bea8fdb0`. Natural completion, ordinal 1, `activeRunId` null. | Skill and AGENTS text loading. |
| 2 | `C:/worktrees/agento/item-d-live-probe-2`, `mcp:launch:38542a39ea209effdf4685fec0c9202db1ac07ac99437b8f619a24af681095c8` | Mismatch stop. Index `f334c4a673b8f38f54df5e31968da715c64e3e06`, worktree `bada98847e6995ddb5ca4d254c87b5a8b7e9b497`, untracked `6758f3ba76196b3fe917e46183e624c351720503`, deps `f510327578a4562e26a7c64bdf061e4a49f85ee6`. Note absent. Same natural completion. | Skill and AGENTS text loading. Claimed dependency Q was not inspected. |
| 3 | `C:/worktrees/agento/item-d-live-probe-3`, `mcp:launch:45f3f6ea6da70708c9ac48997918ab2078f5caccba5a26700335abc940333d73` | Checkpoint first. CURRENT `ab3f0d7bb5bc8fa8dee82f20d07008888e9f42ac`, PARENT `89fc1ea35fa81de627d5345553ff8bee328c96d8`. Five rows match the simulated file. Return is nonterminal. Checks blob `0e7716180279fad8c71364cca41739c68d125637` and checkpoint blob `b86b5b06284d8587adb61d2183ab6895f2436c30` unchanged. No GitHub call. Same natural completion. | Clean blinding is unproven: the search listed `validation/D/oracle/observations.md` and `validation/D/live/setup.md`. Exclusive assigned read scope is contradicted for that search. Skill and AGENTS text loading. Live pull-request reconciliation. |

| Criterion | Disposition |
| --- | --- |
| 1. Load the operating instructions and do only the assigned item | Loading unproven. Probe 3 read scope contradicted. Probe 1 and probe 2 mutations match the assignment. |
| 2. Matching batch, then preserve a mismatched dirty index | Proven for the probe 1 initial batch and the probe 2 hashes. Stale dependency unproven. |
| 3. Interrupted push or existing pull request | Simulated checkpoint-first action proven. Live push and pull-request reconciliation unproven. |
| 4. Nonterminal failed or pending checks, then repair and watch | Functional nonterminal report observed. Clean blind classification unproven. Repair and watch unproven. |
| 5. Measurements and fixture versus live limits | Proven for these retained traces, including empty Read bodies and the unshown search text. No savings claimed. |
| 6. Triage after delivery evidence | No rule change proposed. Coordinator gate record unproven. |

The one recheck input is [recheck-input.md](../live/recheck-input.md). Empty instruction stdout, or a workspace that still contains an excluded answer file, leaves the corresponding gap unproven and ends the recheck.

## Limits

Scripted Git setup does not prove model behavior. The historical probe 3 fixture does not prove a live failure wake. The host-worktree probe 3 classifies a tracked simulated file and leaves the branch tip unchanged. Its search reached this oracle and `live/setup.md`, so clean blinding is unproven. Empty skill Read bodies leave instruction text unproven. A real push, a real pull request, and live GitHub checks remain unproved because shared remotes stay unchanged. Watch survival, unassisted repair, and exactly-once delivery remain unproved. No performance threshold is defined. The one recheck removes this oracle, the setup notes, and the D report from the subject tree.
