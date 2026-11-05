# C entry scenario

This is the bounded local scenario for one later worker-entry observation. It does not start that observation. The coordinator owns any fresh-context top-level trial and can passively observe an independent review entry.

## Sequence

The supported route, where the host provides it, is idle thread creation bound to the named worktree, then one initial send. The send already contains the returned root, attached branch, and full HEAD. [supported-route-scenario.json](supported-route-scenario.json) records that order. One A reviewer launch followed it before first execution. That is one observation, not a guarantee that a later run keeps its watch, repairs itself, or delivers exactly once.

After the packet, the pinned skill, and applicable project instructions are open:

1. Run the packet's one read-now batch. Paths and line ranges are verified at the pinned revision. Do not search headings first when those references match.
2. Invoke the checker once, with literal arguments:

```powershell
pwsh -NoProfile -File scripts/Test-WorkspaceBinding.ps1 -ContractPath <contract.json> -RepositoryRoot <absolute-root>
```

3. On exit 0, take the named first action. On exit 1, reconcile only the reported fields. On exit 2, stop the affected writes.

Replace `<contract.json>` with one filled contract from `contracts/`. The samples use a Windows absolute path and placeholder SHAs. Substitute the host root, branch, full HEAD, origin, upstream, and clean or declared dirty rows before invocation. Do not leave the sample path in a real packet.

## Contracts

| Phase | File | Revision rule |
| --- | --- | --- |
| initial | [initial.json](contracts/initial.json) | Dispatch HEAD and the initial clean or declared dirty contract. |
| resume | [resume.json](contracts/resume.json) | Checkpoint HEAD. `launchHead` is not a rewind. |
| review | [review.json](contracts/review.json) | `candidateHead` equals `expected.head`. `packetRevision` is the other SHA. |
| coordinator | [coordinator.json](contracts/coordinator.json) | The coordinator's epic contract, not a worker dispatch contract. |

Schema: [workspace binding](../../../../../scripts/workspace-binding.md).

## What this does not measure

The null probe's 222 ms Git batch and 116.014 s to its trivial read are diagnostic. That worker knew the null task and was interrupted. Those figures are not a baseline and not a speedup claim. The passive A startup is the ordinary-assignment evidence: nested `pwsh -Command` expansion and an unquoted `@{upstream}` parse error, plus repeated context discovery. The fixture reproduces those two shell failures and reads that preserved trace. It does not start another baseline.

Helper process time, command-construction failures, context reading, and substantive work stay separate. There is no hard elapsed-time target.
