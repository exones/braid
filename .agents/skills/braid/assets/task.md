# A braid task

A task is the brief. The coordinator creates it; its worker owns it from then on. Commands run from
pwsh 7 (Windows) or bash, in the checkout that holds the branch. Markdown goes in single quotes; each
multi-line field is one argument with real newlines.

## Call `backlog`

Install once (`npm install -g backlog.md@1.55.3`). On **Linux and macOS** call plain `backlog`. On
**Windows** the `.ps1`/`.cmd` shims can silently cut a multi-line `--description` and drop `--ac` (seen
under Volta), so call the native `backlog.exe` that the package ships. Agent shells keep no variables
between commands, so resolve the path once, with this lookup, which prints it:

```powershell
$p = (Get-Command volta -ErrorAction SilentlyContinue) ? (volta which backlog 2>$null) : $null
if (-not $p) { $p = (Get-Command backlog).Source }
$backlog = node -p "require(process.argv[1]).resolveBinaryPath()" (Join-Path (Split-Path $p) 'node_modules/backlog.md/resolveBinary.cjs')
$backlog
```

then use the printed absolute path literally in every command: `& '<printed path>' task …`. Below,
`& $backlog` stands for that call (or repeat these lines in the same command); plain `backlog` on Linux/macOS. Never `npx`, `backlog.cmd`,
`cmd.exe` or Windows PowerShell 5.1. One-time check, in a throwaway Git repo under the temp folder with
`backlog-config.yml` copied to its `backlog/config.yml`: create a task with a two-line `--description`
and one `--ac`, then `task view --plain`; `--version` must print `1.55.3` (the lookup finds whichever version is installed). Both lines and the criterion must be there; if not, stop and
tell the user.

## Fields

- Description: the template below (goal, size, start here, change, already decided, out of scope).
- Acceptance criteria: "done when", a few testable points, one `--ac` each.
- Definition of done: the project defaults from `backlog/config.yml`; the worker checks the boxes it proved (`--check-dod`).
- Labels, always quoted: `'kind:story|task|spike,tier:S|M|L'` plus `ui` for new or noticeably changed user-facing UI.
- Dependencies: real prerequisites only. Ordinal: run order, 10, 20, 30, so one can slot in between.

## Create (coordinator, on a branch it holds)

```powershell
& $backlog task create 'Title' --labels 'kind:story,tier:M' --ordinal 10 --dep task-3 --description @'
Goal: <one to three sentences: the outcome and who it is for; for a spike the question, the time box and the decision it feeds>

Expected size: about <N> lines in <K> files.

Start here (read in this order):
- `<path>`: <what to look at and why>

Change:
- `<path>`: <what to add or change>

Already decided (don't re-investigate):
- <a fact or choice>

Out of scope:
- <what not to touch or build>
'@ --ac 'First testable outcome' --ac 'Second testable outcome'
```

A subtask adds `--parent task-12` and gets `TASK-12.1`. A spike's answer, evidence and proposed
follow-ups are its final summary; the worker proposes follow-ups, the coordinator creates them. Create
tasks, never drafts. `create` prints the ID; use it in the branch and PR names.

## Edit

`--dep` on `edit` replaces the dependency list: repeat the existing ones. It only accepts IDs that
exist on the current branch.

```powershell
# worker, on its item branch
& $backlog task edit task-12 -s 'In Progress'                     # first commit
& $backlog task edit task-12 --plan @'
1. ...
'@                                                                # before coding
& $backlog task edit task-12 --append-notes 'Found X; decided Y.' # as it goes
& $backlog task edit task-12 --check-ac 1 --check-ac 2 --check-dod 1   # only what is proven
& $backlog task edit task-12 --final-summary @'
What changed, why, validation, anything open.
'@                                                                # the item's report
& $backlog task edit task-12 -s Done                              # last commit, before reporting green

# coordinator, on plan/ or the epic branch, for tasks that haven't started
& $backlog task edit task-13 --dep task-11,task-12 --ordinal 20
& $backlog task edit task-14 --append-notes 'Dropped: why.'; & $backlog task archive task-14
```

## Read

```powershell
& $backlog task view task-12 --plain
& $backlog task list --plain --ready -s 'To Do' -p task-12   # next subtask of a parent, in run order
& $backlog task list --plain -p task-12                      # all its subtasks
& $backlog doctor                                            # duplicate IDs, cycles; after a merge conflict
```

`--ready` only means "dependencies done": always add `-s 'To Do'` and `-p <parent>`.
