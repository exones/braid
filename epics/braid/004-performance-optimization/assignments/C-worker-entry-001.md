# C worker-entry observation 001

## Scope and authority

Perform the remaining bounded fresh-context worker-entry observation for [C](../backlog/C-git-startup-check.md), whose exact candidate `5a25b09985f92b25a8037938ef27dddcde7389c0` is CI green and independently reviewed with no actionable code findings. This is a read-only source-verification task within C, not a new backlog item or an implementation successor. PR24 is unmerged. No candidate skill is adopted and no machine ledger/controller is started.

Execution policy is the unchanged pre-C external worker skill at revision `e9a617fa60630327f161a78918f033e4461eb111`, source `C:/Users/exon/AppData/Local/braid/skill-pins/e9a617fa60630327f161a78918f033e4461eb111/.agents/skills/braid-worker/SKILL.md`. Treat C's checker/entry sequence as the candidate behavior under test, not as a replacement for that policy. Applicable AGENTS obligations remain mandatory. The task has no writes, so the helper's result cannot grant broader mutation authority.

## Entry and binding

New host-bound attached branch `trial/braid-004-c-entry-001` at exact candidate. Initial prompt supplies actual root, full candidate HEAD, packet-context revision and absolute path to a committed filled schema 1 `initial` contract. Clean index/worktree, origin fetch/push `https://github.com/exones/braid.git`, no upstream expected. Host is created idle, then one initial assignment is sent with all actual identities before execution. Do not guess paths, fetch, search assignment inventory, repair upstream or create/switch/clean a worktree.

Read this exact packet from the committed context Git object using the supplied command; it intentionally is not in the candidate checkout. Open the named external skill and applicable AGENTS once. The standalone read-only scope here is the assigned item; do not execute C's full implementation assignment, review template, CI lifecycle or historical discovery.

## Prepared read-now batch

After packet, pinned skill and AGENTS, run this source context in one shell call. These literal paths/ranges are verified at the candidate. Candidate current.md is historical implementation context, not an instruction to launch or resume another owner. No heading search is needed. Emit one raw shell UTC timestamp at the beginning if available in this necessary call; do not introduce extra calls just for timing.

```powershell
Write-Output ('ENTRY_CONTEXT_START ' + [DateTime]::UtcNow.ToString('o'))
Get-Content README.md | Select-Object -Skip 12 -First 4
Get-Content docs/decisions.md | Select-Object -Skip 27 -First 8
Get-Content epics/braid/004-performance-optimization/epic.md | Select-Object -Skip 24 -First 20
Get-Content epics/braid/004-performance-optimization/checkpoints/current.md
Get-Content scripts/workspace-binding.md
Get-Content epics/braid/004-performance-optimization/validation/C/entry-scenario.md -TotalCount 19
```

## Gate and first useful source action

Invoke exactly once with the literal absolute contract/root values supplied in the initial prompt:

```powershell
pwsh -NoProfile -File scripts/Test-WorkspaceBinding.ps1 -ContractPath <filled-contract.json> -RepositoryRoot <actual-root>
```

This is the one local comparison of root, branch, current HEAD, origin, upstream and clean state. Do not hand-build an additional Git batch, wrap it in nested `pwsh -Command`, reread status or repair expected missing upstream. On nonzero exit, report the actual result and stop without retry/repair. The candidate test does not waive a contradiction or missing policy input.

On exit 0, perform the useful task: verify the public parameter block in `scripts/Test-WorkspaceBinding.ps1` matches the documented invocation and report the exact parameter names/defaults. The first source action is `Get-Content scripts/Test-WorkspaceBinding.ps1 -TotalCount 23`; emit `ENTRY_SOURCE_START` with the shell UTC clock immediately before it in that same needed call. Stop after that bounded read and its small source-verification answer. No implementation, other source audit, fixture/full tests, Node/npm setup, PR checks, watch or agents.

## Evidence and limits

Preserve helper stdout/stderr/exit including checkedAt, elapsedMilliseconds, gitReads, outcome/phase, actual root and context; retain phase timestamps emitted by needed calls. Return read/search/tool counts from actual actions, any repeats or failures, and observed packet/contract/head/branch identities. Do not add a check solely to report a clean state again. Coordinator independently inspects recorded tool events and host timestamps.

This worker knows it is a bounded observation and has a small task. It can prove that the prescribed entry path executes in fresh context, not that ordinary startup is faster or representative. Do not compare its total time to the null probe as a speedup; do not claim scheduling gaps are pure reasoning. Passive ordinary-A evidence already supplies the separate ordinary-assignment cross-check. No new baseline or blind trial is requested.

## Output and stop

No checkout/report/index/config/ref writes, commits, pushes or PR. Coordinator preserves the returned result and observable tool evidence under `validation/C/worker-entry-001/` and writes a parent-scoped outcome report. Send one concise result with exact binding, helper exit/result, first source answer, raw timings/counts and limits to coordinator `ae791527-bf56-41da-a7d9-30821a74cfc5` via t3_thread_send, then end. No acknowledgment loop or duplicate send. Transport unavailability is reported in the final answer. The original C worker retains implementation repair, reviewer pass remains separate, and human merge stays required before B.
