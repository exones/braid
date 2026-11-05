# C startup probe 001 and passive cross-check

The dummy worker exposed overhead, but it is not a representative performance test. Its Git batch took 222 ms; the stronger evidence for C is that an ordinary implementation startup independently hit quoting failures, retries and repeated context discovery. C now targets those costs as well as a reusable Git check.

## What changed

Completed the user-requested read-only null worker on the normal Cursor Grok 4.7 high/500K route. It verified the checkout, then read `package.json` engines.node as `>=26.13.0 <27`, with no source edits, installation, tests or PR. Preserved [raw observations](../validation/C/startup-probe-001/observations.json) and the [worker's returned account](../validation/C/startup-probe-001/worker-result.md).

After the user questioned validity, passively inspected the already-recorded startup of the real A implementation. Preserved [that bounded cross-check](../validation/C/startup-probe-001/real-worker-cross-check.json); sent no new message or timing instructions to A. No second probe was launched.

## Why and observations

Null probe timing boundaries, UTC on 2026-11-05:

| Observation | Measured value | Meaning and limit |
| --- | --- | --- |
| Host request to initially observed run start | 1.394 s | Initial start captured before binding steering; not a guarantee about later provider restart accounting |
| Initial run start to Git batch start | 104.008 s | Includes context work, host/tool gaps and an interruption; not pure model reasoning |
| Four Git commands in one batch | 222 ms | Stopwatch around the batch; individual commands 45, 87, 40 and 45 ms |
| Initial run start to first task-read start | 116.014 s | One instrumented null run, not normal-worker latency |
| package.json parse/read | 20 ms | Stopwatch around the deliberately trivial task |
| Task-read end to queued report event | about 43.946 s | Includes construction/delivery of the measurement report; not part of startup |

Before Git, the recorded successful continuation completed 10 context Read calls and 9 searches. Two earlier Read calls were interrupted at `00:57:43.630Z`, immediately after the coordinator's binding message at `00:57:43.614Z`, then retried. The timing association is observed; universal host interruption behavior and the exact interruption cost are not proven. File-tool duration is not independently measured. Shell-wrapper timings of 6.070 s and 5.336 s are worker-reported, distinct from the short in-shell operations. Internal reasoning is not preserved as evidence.

The null worker knew it was a probe, knew its tiny goal, and was told not to install, implement, test or inspect PRs. The measurement packet/timers and long result also added work. It could streamline normal behavior or spend extra effort on instrumentation. Therefore 116.014 s is not a representative average, a hard bound, an uninstrumented baseline, or a before/after speedup. The user's objection is valid.

The ordinary A startup reached its first installer function search at `00:49:12.630Z` and first installer file-read completion at `00:49:15.183Z`, respectively 55.918 s and 58.471 s after its fixed launch request timestamp. These are different task/tool endpoints, not a controlled comparison with the null task. No per-Git Stopwatch timings exist in A. Its early tool trace nevertheless confirms concrete avoidable mechanisms:

- One nested `pwsh -Command` Git batch expanded variables incorrectly and printed assignment errors.
- A second batch used unquoted `@{upstream}` and failed PowerShell parsing. A later batch quoted it, observed the expected absence of upstream, and also repeated status/branch/HEAD and inspected the latest commit. Another batch checked origin and repeated status/diff.
- Skill, packet and backlog were read again around the ordinary binding update. Two file searches failed with an empty-path rg diagnostic; a later assignment inventory search succeeded even though the exact packet path had been supplied.

The second user screenshot's circled PR-base check occurs after source review has started. It is substantive independent evidence work, not demonstrated redundant startup; this null experiment cannot price or remove it.

## Left for you

No action needed. C remains unimplemented backlog work. Its refined scope is prepared, pinned context-read batches; a local read-only Git checker invoked as a script; focused mismatch handling; and verification of a supported binding-before-execution route. Preserve necessary checkout and review evidence checks. A's implementation/review/human merge remain separate.

## Technical record

- Probe context: `a5d194997d24e98b2f8ffd2f340a3b05bf9e1b95`; skill `05af12ea17866d1bdbd4c07e28e6c8beccbe20d5`; packet [C-startup-probe-001](../assignments/C-startup-probe-001.md).
- Probe: <t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:f86bad23ff306a1fad12ce7941935b80d41e5ba427e06b0444abb5694115f9da>, ordinal 1, completed. Root `C:/worktrees/agento/probe-braid-004-c-startup-001`; branch `probe/braid-004-c-startup-001`. Parent independently reconfirmed clean status, unchanged HEAD and attached branch after completion. No workspace retirement or cleanup performed.
- Real worker source: <t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:a8ea3b557d4313ab62e717fee1c4b0b2d6a99bc22281ef29c7499e89c0a9b1f9>, initial events only, through the first source read; context `8610548f9792072e2e70bb56f0d12e1783a9015e`. Current runtime/CI state was not polled for this cross-check.
- Preserved tool metadata/raw shell results exclude internal reasoning and duplicated source-file bodies. No representative speedup, CI, independent implementation review or Done claim follows from this observation.
