# Workspace binding check

`scripts/Test-WorkspaceBinding.ps1` compares one explicit JSON contract with one local checkout. It uses PowerShell and local Git only. It does not use Node, npm, GitHub, or the network, and it is not a product `braid doctor` command.

## Invocation

Run it as a script with literal arguments. Do not wrap this invocation in `pwsh -Command`, and do not pass an unquoted `@{upstream}` through PowerShell.

```powershell
pwsh -NoProfile -File scripts/Test-WorkspaceBinding.ps1 -ContractPath <contract.json> -RepositoryRoot <absolute-root>
```

`-RepositoryRoot` is the checkout to inspect. `-ContractPath` is a UTF-8 JSON file of at most 1 MiB. The helper writes one JSON result to stdout and a short diagnostic to stderr. It does not fetch, list unrelated branches or history, switch, stage, clean, reset, commit, repair upstream, write `.braid/`, or otherwise mutate the repository.

A result is one time-bounded observation. Branch or HEAD movement during the read sets `drift.recheckRequired` and does not authorize later writes. Recheck after a relevant change.

If this pinned helper is unavailable, one equivalent manual Git batch may record the same facts. Name why. Do not repeat a successful manual check only to obtain helper output.

Fixtures may set `BRAID_WORKSPACE_BINDING_SYNC_DIR` to an existing absolute directory outside the repository. Agents do not set it. It only opens a window so a fixture can move the branch or HEAD between the two identity reads.

## Contract

`schemaVersion` is the JSON integer `1`. `phase` is `initial`, `resume`, `review`, or `coordinator`. Unknown properties are invalid. Duplicate properties are invalid.

| Field | Required | Meaning |
| --- | --- | --- |
| `expected.repositoryRoot` | yes | Absolute host path of the attached checkout. A linked worktree is a different root even when it shares the Git common directory. |
| `expected.branch` | yes | Attached branch name, or JSON `null` for detached HEAD. |
| `expected.head` | yes | Full 40-character HEAD. |
| `expected.origin` | yes | JSON `null` when `origin` is absent, or `{ "fetch", "push" }` exact URL strings. |
| `expected.upstream` | yes | JSON `null` when no upstream is configured, or the exact `refs/...` tracking ref. |
| `expected.worktree.clean` | yes | `true` when the index and worktree have no status rows, including nonignored untracked files. Ignored files are not rows. |
| `expected.worktree.entries` | when dirty | Omit when `clean` is `true`. When `clean` is `false`, a non-empty array of `{ "xy", "path" }` rows. A rename or copy (`xy` starting with `R` or `C`) also includes `originalPath`. |

Paths in `xy` rows are Git's NUL-safe porcelain paths, compared exactly. `xy` is two characters. Windows root comparison uses a canonical full path and ignores case and separator differences. Remote URLs are compared exactly; the helper does not normalize them.

`resume` may include `launchHead`. The checkout is expected at `expected.head`, not back at `launchHead`. `review` requires `candidateHead` and `packetRevision`. `candidateHead` must equal `expected.head`. `packetRevision` is the commit that supplied the review packet and is not the candidate. `coordinator` uses the coordinator's own epic contract and has neither field.

Launch-only root, branch, HEAD, origin, upstream, and dirty rows are filled after the host returns the binding. Do not guess them, and do not embed the packet file's own future commit SHA.

## Result

Stdout is one schema 1 object: `outcome`, `phase`, `checkedAt`, `elapsedMilliseconds`, `gitReads`, `expected`, `actual`, `mismatches`, `failures`, `drift`, and `context`. `checkedAt` is UTC `yyyy-MM-ddTHH:mm:ss.fffZ`. `gitReads` lists the Git argument vectors actually started. Credentials embedded in a remote URL are removed from the result and from diagnostics before either is written. `context` echoes `launchHead`, `candidateHead`, and `packetRevision` when the contract supplied them.

`actual.worktree.entries` is present even when the worktree is clean. The contract omits `entries` in that case. `actual` also reports `invocationRoot`, `repositoryRoot`, `gitDir`, and `gitCommonDir` so a shared common directory cannot be mistaken for the attached root.

`outcome` is `match`, `mismatch`, `drift`, `invalid`, or `inspection-failed`. A mismatch names the field. Drift names the branch or HEAD values seen before and after the read. An input failure carries `kind` `input`. A Git failure carries `kind` `git`, the argument vector, the native exit code when the process started, and sanitized stderr.

## Exit codes

| Code | Outcome | Next action |
| --- | --- | --- |
| 0 | `match` | The packet's named first action. |
| 1 | `mismatch` or `drift` | Reconcile only the reported fields, then recheck. Unexpected dirty state stays in place. |
| 2 | `invalid` or `inspection-failed` | Stop the affected writes. This is not a match. |

## Phases and entry

Open the filled packet, the pinned skill, and applicable project instructions. Run the packet's one read-now batch, then this helper, then the named first action. The batch uses paths and line ranges verified at the pinned revision, or equivalent directly resolvable sections, and it names the packet, the candidate or context revision, and the first source path. Do not search headings first when those references match.

Where the host supports it, create the idle thread bound to the checkout and then send one initial assignment that already contains the returned root, branch, and full HEAD. That sequence is the supported pre-execution route. It is not a durability guarantee, and it is not a reason to restart a live worker.

Initial entry uses the dispatch HEAD and the initial clean or declared dirty contract. Resume uses the checkpoint revision and owned changes. Review uses the candidate SHA. Coordinator entry uses the coordinator contract. A declared dirty contract is evidence of that state, not authorship and not permission to stage someone else's files.
