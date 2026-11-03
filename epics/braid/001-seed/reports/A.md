# Task A: preflight and seed contract

Status: done. Date: 2026-11-03.
Backlog item: `epics/agento/001-seed/backlog/A-preflight.md`. Checkout/branch/HEAD: `C:\code\agento`; not a Git repository; no branch and no HEAD.

## Outcome

Spike A recorded the environment facts and the schema-1 ledger contract that B and C can implement without choosing command behavior. The contract is `docs/seed-contract.md`. It defines `agento --help`, `--version`, `init`, `new`, `status`, and `story add/start/block/complete`; epic selection; path checks; exits; idempotent init; non-overwriting `new`; the four stored states; manual completion; schema 1; the lock; the replace procedure; and six Given/When/Then scenarios.

Acceptance mapping:

- B and C have an exact command and storage contract, including tasks and spikes as `kind` values on the one `story` command family.
- Completion stores `acceptance: "manual"` and status prints `manual record; not gate acceptance`. An epic `outcome` is stored text. Schema 1 has no execution-run record.
- The product baseline is strict TypeScript on Node.js 26, with `pwsh` 7.6 for verification.
- Missing GitHub and npm identity are recorded below. They leave local B, C, and the contract unblocked.

This worker did not edit `epic.md` or `checkpoints/current.md`. Proposed shared updates are at the end of this report. No product code, Git repository, remote, package, or infrastructure change was made.

## Evidence

| Check | Exact command or method | Result | Revision/log/CI/PR link |
| --- | --- | --- | --- |
| Node | `node --version` | `v24.19.0`, exit 0. This is below the selected pin. | Local only. No commit. |
| npm | `npm --version` | `11.17.0`, exit 0. This npm belongs to the installed Node 24 toolchain. | Local only. |
| PowerShell | `pwsh -NoProfile -Command` printing `PSVersion`, edition, and OS | `7.6.9`, `Core`, `Microsoft Windows 10.0.26200`. The inspecting shell was the same `pwsh` 7.6.9 host. | Local only. |
| Git | `git --version`; `git rev-parse --is-inside-work-tree`; `git status --short --branch`; `git remote -v`; `git rev-parse HEAD` | `git version 2.55.0.windows.3`. Each repository query printed `fatal: not a git repository` and exited 128. No remote. | Local only. |
| GitHub CLI | `gh --version`; `gh auth status` with stdout and stderr discarded | `gh version 2.103.3 (2026-10-26)`. Auth status exited 0. Account, host, and token text were not recorded. | Local only. |
| npm identity | `npm whoami --loglevel silent` with output discarded | Exit 1. The error text was not recorded. Publication identity stays unknown. | Local only. |
| t3 help | `t3 --version` and `t3 --help` | `t3 v0.1.6`, exit 0. Top-level subcommands include `help`, `serve`, `app`, `pair`, `auth`, `environment`, `browser`, `project`, `thread`, `up`, `status`, `service`, `update`, `uninstall`, `theme`, `trace`, `doctor`, `triage`, and `connect`. | Local help only. |
| t3 help topic | `t3 help thread` | Exit 1. `t3 help` rejected the positional `thread`. | Local help only. |
| t3 thread help | `t3 thread --help`; `t3 thread start --help` | Both exited 0. `thread` subcommands are `list`, `start`, `send`, and `show`. `start` usage is `t3 thread start [flags] <project> <message>`, with flags `--base-dir`, `--title`, `--provider`, `--model`, `--worktree`, `--branch`, `--wait`, and `--json`. No thread was started. | Local help only. |
| Workspace | directory listing of `C:\code\agento` | Entries: `.agents`, `docs`, `epics`, `inspiration`, `AGENTS.md`, `README.md`, and `t3_multi-agent_mvp_86005e32.plan.md`. No `package.json`, `.git`, or `.crew`. | Local only. |
| Node schedule | Fetched `https://raw.githubusercontent.com/nodejs/Release/main/schedule.json`, `https://nodejs.org/en/about/previous-releases`, and `https://nodejs.org/dist/latest-v26.x/` | Schedule: Node 26 LTS date 2026-10-28, maintenance 2027-10-20, end 2029-04-30. Node 24 maintenance 2026-10-20, end 2028-04-30. Node 22 end 2027-04-30. Node 27 alpha 2026-10-28. Release index lists 26, 24, and 22 as LTS and 27 as Alpha. `latest-v26.x` lists `node-v26.13.0` dated 2026-10-28. | Public pages. Not a CI run. |
| PowerShell lifecycle | Fetched `https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle?view=powershell-7.6` | 7.6 LTS released 2026-03-18, end of support 2028-11-14, .NET 10. The page text calls 7.6.6 the current LTS patch. 7.4 LTS and 7.5 end support on 2026-11-10. | Public page. |
| PowerShell 7.6.9 page | Fetch of `https://github.com/PowerShell/PowerShell/releases/tag/v7.6.9` | Timed out. The local binary's `7.6.9` report was not confirmed from that release page. | Unverified. |

No product test, package build, Actions run, or release exists. The historical MVP plan's `crew` command and per-run `.crew/` layout were not used as requirements.

## Decisions

- Pin Node.js Active LTS 26 with `engines.node` `>=26.13.0 <27` and Actions `node-version: "26"`. Node 24 is a supported Maintenance LTS line, and this machine has `v24.19.0`, but a new seed tracks the Active LTS line that began on 2026-10-28. B keeps this pin if a runner image is older and reports that fact instead of downgrading.
- Pin `pwsh` 7.6 LTS, minimum 7.6.0. The 7.4 and 7.5 lines end support on 2026-11-10. The local shell already satisfies the pin at 7.6.9. The contract does not require that exact patch, because the lifecycle page still names 7.6.6 in its "current LTS" sentence.
- Provisional package: name `agento`, version `0.1.0`, `private: true`, ESM, bin name `agento`. No scope and no repository URL. `0.1.0` is the local candidate version, not a registry release. Product tests use `node:test`.
- Schema 1 uses one state file, `.crew/state.json`, plus `.crew/events.jsonl`. Item ids are JSON fields. The event file is an append-only record of accepted mutations. State is authoritative. There is no replay command.
- Epic selection is the explicit epic id on `new`, `status`, and `story`. There is no current-epic pointer. Ledger commands do not read or write `epics/`.
- `story` is the only item command. `--kind story|task|spike` distinguishes a story, a task, and a spike. Resume is `story start` from `blocked`. `ready`, `in-review`, and `cancelled` have no schema 1 state.
- Optional `--note` is stored separately from `--next` and from completion `--evidence`, so C's resumption check can preserve a note and a next action on an in-progress item.
- `init` on a valid schema-1 ledger exits 0 and rewrites nothing. A repeated `new` or a repeated item id exits 2 and rewrites nothing.
- Writers take `.crew/lock` by creating that directory, wait up to 5000 ms, and do not steal a stale lock. The replace procedure flushes a temp file, renames the current file aside, renames the temp into place, then appends the event. Leftover temp or backup files are not promoted. A kill during that replace is untested, and the contract claims no power-loss guarantee beyond the planted layouts C can check.
- B implements help, version, and unknown-command failure only. C implements the ledger. D runs the C scenario from the packed executable.

## Open points

- GitHub owner, repository, and visibility are unknown. `gh auth status` exited 0, and this folder has no repository or remote. Remote CI and pull requests stay blocked. B can initialize local Git and prepare the workflow. Who unblocks it: the user, by naming the GitHub target. A does not create that target.
- npm account and scope are unknown. `npm whoami` exited 1. The private package name `agento` is local only. Who unblocks publication: the user, with a visibility and scope decision. Publication remains unauthorized.
- This machine does not have Node 26. B's verify gate needs `>=26.13.0 <27`. Who supplies it: the B worker's environment. The pin stays 26 if installation is unavailable.
- GitHub-hosted runner images were not executed, so their Node 26 and `pwsh` 7.6 availability is unverified. B records the versions the jobs actually print.
- The lifecycle page's current 7.6 patch number, 7.6.6, and this machine's 7.6.9 were not reconciled. The 7.6.9 tag page timed out. The pin is the 7.6 line.
- No license was selected. B does not need one for local verification.
- Installed `t3` v0.1.6 exposes `thread start` with provider, model, worktree, and branch flags. Runtime thread behavior was not run. The original MVP's dispatch flow remains historical. Stage 2 rechecks the live CLI before using it. The seed calls no T3 command.
- The coordinated assignment told this worker to leave shared status to the coordinator. `A-preflight.md` still says to update `checkpoints/current.md` and the epic row. That file instruction is the generic ending; the role split wins. No contract change is required.

B/C/D check: B's help/version scope, C's persistence, transition, path, lock, and manual-evidence requirements, and D's packed-executable scenario are all specified. The bak/rename replace procedure is the one place C's word "atomic" is narrower than a crash-atomic filesystem replace. The contract states the tested layouts and leaves a kill during rename untested. That is a recorded limit, not a second command surface.

## Resume

Coordinator: accept this contract or send scoped corrections to the three A-owned files. On acceptance, assign B. B's first implementation step is a Node.js 26.13.0 or newer 26.x toolchain, then the package and `scripts/Verify.ps1`. B is ready for that assignment.

## Proposed shared status

Set backlog A to `done`. Evidence: `reports/A.md` and `docs/seed-contract.md`. Leave B at `backlog` until it is assigned. Replace the A row in `epics/agento/001-seed/epic.md` with:

```text
| A | spike | F1 | [Preflight and contract](backlog/A-preflight.md) | None | done | [reports/A.md](reports/A.md); contract [docs/seed-contract.md](../../../docs/seed-contract.md) |
```

In `checkpoints/current.md`, set the active result to A complete pending coordinator acceptance, record HEAD as unavailable because the directory is not a Git repository, and set the next action to review `docs/seed-contract.md` and this report before assigning B.
