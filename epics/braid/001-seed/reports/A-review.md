# Spike A: coordinator review and acceptance

Date: 2026-11-03. Result: accepted after corrections. Reviewer: Sol coordinator.
Scope: environment/contract review only. No product implementation or B dispatch.

## Outcome

The seed has an exact manual epic/story ledger contract, stored kinds for stories/tasks/spikes, explicit CLI errors and transitions, schema/version rules, state/event boundaries, and six acceptance scenarios. Manual completion is clearly separate from independent gate acceptance. B can start without choosing behavior from scratch.

The worker's original report is `A.md`; the corrected `docs/seed-contract.md` is authoritative. A is Done; B is Ready and unassigned. B first obtains an isolated Node 26.x toolchain because the machine's default is Node 24.

## Findings and corrections

1. **State replacement did not meet C's requirement.** The submission renamed the live state away before installing its replacement, creating an avoidable missing-state window. Changed the contract to sync/close a temp file and rename it directly over the live file. No unlink-first fallback or automatic backup promotion. This preserves the existing atomic-replacement goal without claiming power-loss durability.
2. **An event gap could disappear from status.** The submission allowed skipped/repeated revisions and later writes after a lagging event log, while status only compared the maximum revision. Changed to a contiguous event prefix, visible status warnings for a lagging prefix, and refusal of mutations until manual reconciliation. Invalid gaps/duplicates fail explicitly. Added failure expectations to scenario 6. No replay/repair command or extra subsystem was introduced.
3. **Completion wording contradicted post-commit failure.** Clarified that rejection/pre-commit failures preserve state, while a failed event append can return nonzero after state commits. This distinction now appears in the revision and failure rules.

No unresolved blocking contract finding remains. C must implement and test these targets; document edits are not implementation proof.

## Independent evidence

| Check | Method | Result / limitation |
| --- | --- | --- |
| Local versions | `node --version`, `npm --version`, `$PSVersionTable.PSVersion.ToString()`, `git --version`, `gh --version` | Node v24.19.0, npm 11.17.0, pwsh 7.6.9, Git 2.55.0.windows.3, gh 2.103.3; matches worker observations. |
| Node 26 choice | [Official 26.13.0 LTS release](https://nodejs.org/en/blog/release/v26.13.0), [release index](https://nodejs.org/en/about/previous-releases) | Verified 26.13.0 LTS exists and the chosen line is supported. Not installed or executed by this review. |
| PowerShell line | [Microsoft lifecycle](https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle?view=powershell-7.6) | Verified 7.6 LTS; the lifecycle page's patch text differs from the local binary. Minimum line requirement is met; no assertion that local patch is the newest. |
| Replacement primitive | [Node rename API](https://nodejs.org/api/fs.html#fsrenameoldpath-newpath-callback); disposable `node --input-type=module` probe | Sync/close temp, overwrite existing state, and failed-rename preservation passed on installed Node v24.19.0 / win32. Temporary files were removed. Does not prove Node 26/Linux behavior or crash durability. |
| Scope and consistency | Read contract, A report/checkpoint, and B/C/D backlog requirements | Specified scope matches the seed; the corrected replacement procedure now matches C. Product/platform acceptance remains for B/C/D. |
| Runtime handoff | Read completed worker metadata and inspect its three outputs | First real cross-provider handoff completed. The coordinator skill was available/read. This does not prove autonomous recovery, fresh-session resumption, or every later workflow branch. |
| Documentation consistency | Local link check excluding fenced example text | All active Markdown file links resolve after updating epic, checkpoint, and entry points. No product build was run. |

The worker result is available at <t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/thread:delegated-task:command%3Amcp%3Ad516eddd-b5de-42ae-905c-f8e6669b5562%3Adelegate-task%3Aaf60275d-6e64-4688-8d5a-a177911c3b0e>.

## Open points and next action

GitHub target and npm visibility/scope remain unknown; neither blocks local B. There is still no Git repository, build, CI run, or released package. B may initialize local Git and prepare CI as its backlog item specifies. The seed contract's local `private: true` package prevents accidental publication until a release decision.

This initial bounded assignment ends after A's review. Next delivery item: B, TypeScript foundation and early CI. The reusable coordinator can resume from the current checkpoint without repeating the original prompt.
