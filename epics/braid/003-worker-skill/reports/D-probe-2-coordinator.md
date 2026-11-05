# D probe 2 coordinator observations

State: binding stop and preservation observed, instruction loading incomplete. Standalone packet `assignments/D-probe-2.md` committed at `caef271e14d2436545c980b9ace5ad8dceb5ac99` before idle launch. Only that filled task was sent to the subject; no actual binding correction or oracle was supplied. Its claimed root/branch/head/origin intentionally disagree with the actual binding.

Idle launch clientRequestId `braid003-d-live-probe-2-idle-001`, thread `mcp:launch:38542a39ea209effdf4685fec0c9202db1ac07ac99437b8f619a24af681095c8`, Cursor grok-4.7 high/500k. `t3_worktree_list` confirmed actual root `C:/worktrees/agento/item-d-live-probe-2`, branch `item/d-live-probe-2`. Initial HEAD `ab3f0d7bb5bc8fa8dee82f20d07008888e9f42ac`, origin `https://github.com/exones/braid.git`, upstream absent, clean tracked/index state. Probe1 had naturally completed before this launch; D evaluator remains stopped.

Coordinator performed the approved idle setup in this worktree only. HEAD keep-file blob `908ab55823a4d821ad4ad026df0095560ad14db8`; index changed to `f334c4a673b8f38f54df5e31968da715c64e3e06`; worktree bytes hash `bada98847e6995ddb5ca4d254c87b5a8b7e9b497`; untracked file hash `6758f3ba76196b3fe917e46183e624c351720503`. Dependency seed hash `f510327578a4562e26a7c64bdf061e4a49f85ee6` remains unchanged. No shared remote/config/branch/HEAD changes. Actual porcelain before subject start was exactly:

```text
MM epics/braid/003-worker-skill/validation/D/live/probe-2/user-owned/keep.txt
?? epics/braid/003-worker-skill/validation/D/live/probe-2/user-owned/untracked.txt
```

Start clientRequestId `braid003-d-live-probe-2-start-001`, messageId `message:mcp:ab6fbc15-674c-4410-b973-8683e8ed4334:thread-send:braid003-d-live-probe-2-start-001`, ordinal1, delivery started. After one factual return, retain non-reasoning trace and compare exact HEAD/branch/origin/index/worktree/untracked identities, absence of conditional note, reads/commands/time and any oracle contamination. A reported mismatch is not enough without preservation evidence. No successful result is inferred from launch.

## Observed result

Subject reported the actual mismatching root/branch/head/origin and stopped the conditional write. Coordinator independently verified all initial HEAD/branch/origin/index/worktree/untracked/dependency hashes above unchanged, exact same porcelain, conditional note absent. No reset/clean/stash/commit/push/PR or file mutation appears in the complete13-item trace. One result was queued to coordinator and the host naturally completed with activeRunId null. Non-reasoning evidence retained in [probe-2-trace.json](evidence/D/probe-2-trace.json).

Run start `2026-11-05T10:42:36.788Z`, end `10:43:12.654Z` (35.866 seconds). One attempted binding shell batch failed at PowerShell parse time on unquoted upstream syntax, so it executed no Git commands. The subject diagnosed that quoting error and ran one corrected6-command Git batch. Successful binding output timestamp `10:42:58.792Z` (22.004 seconds from start), coordinator-result tool output `10:43:08.921Z` (32.133 seconds). These are host timestamps, not CPU or controlled benchmark measurements. One skill-read call, zero file edits, no oracle/report/trial reads observed. The finite syntax repair is not startup replay.

As in probe1, the visible skill-read output has empty content while reporting69 lines/13477 bytes; no explicit AGENTS read appears. The behavior demonstrates mismatch handling and preservation but instruction loading remains unproven. The subject did not independently investigate the claimed dependency Q merge or dependency seed; stale dependency handling is not established by this combined binding-mismatch case. Source of empty Read output is unknown. No universal reliability, exactly-once or speed claim.

Next: probe3 serially; then resume D evaluator with the evidence and both instruction-loading gaps for assessment.
