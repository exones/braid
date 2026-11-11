# A: Backlog.md setup for agents on Windows and in worktrees

Spike report, 2026-11-11, `backlog.md` 1.55.3. All runs used throwaway repositories under the temp
folder with `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA` and `XDG_*` pointed there, and a
pinned install in a temp prefix (`npm install -g --prefix <tmp> backlog.md@1.55.3`). The test text
had two lines, a blank line, a list, `"double"` and `'single'` quotes, `$HOME %PATH% & | < > ^`,
backticks and a literal `\n`; each run created a task with `--description`, two `--ac` and
`--labels`, then ran `task edit --append-notes` (multi-line), `--check-ac 2` and a multi-line
`--final-summary`, and compared the task file with the input.

## Answers

**Invocation.** Install once per machine with `npm install -g backlog.md@1.55.3` and call plain
`backlog` from `pwsh` 7 or any POSIX shell. Check `backlog --version` prints `1.55.3`. Never call it
through `npx`, `backlog.cmd` or `cmd.exe`, and never from Windows PowerShell 5.1.

| Shell and call | Text, quotes, `--ac`, edit options |
| --- | --- |
| pwsh 7.6: `backlog` (resolves to the global `backlog.ps1` shim) | all kept |
| pwsh 7.6: `node <prefix>/node_modules/backlog.md/cli.js` | all kept |
| pwsh 7.6: the native `backlog.exe` | all kept |
| pwsh 7.6: `backlog.cmd` (also what `npx` uses) | cut at the first newline, quotes dropped, later options lost |
| Git Bash: `backlog` (the sh shim), `node cli.js`, `backlog.exe` | all kept |
| Git Bash: `backlog.cmd` | cut, as above |
| Windows PowerShell 5.1: any of the four | newlines kept, embedded `"` stripped |
| Linux (WSL Ubuntu, Node 22): `backlog` from a global install | all kept |

The `.ps1` shim needs an execution policy that runs local scripts (pwsh's default `RemoteSigned`
does). `cli.js` starts the binary with `spawn(binary, args)` and no shell, so it adds no quoting.

**Text in commands.** Real newlines are required; a literal `\n` is stored as `\n`. Put Markdown
with backticks in single quotes: pwsh single-quoted strings and here-strings (`@'…'@`), bash
`'…'` or `$'…'`. There is no stdin or file input, so long text goes in one argument.

**Configuration.** Commit `backlog/config.yml` from [A-config.yml](A-config.yml); `backlog init` is
not needed. With that file and no `backlog/tasks`, `task create` makes the folders. Running
`init --defaults` on an existing config left it byte-identical and only wrote `AGENTS.md`.

- Statuses: the default `To Do`, `In Progress`, `Done`. `-s "In Review"` fails with "Invalid
  status", which enforces the no-`In Review` decision.
- `task_prefix: "task"`: IDs `TASK-12`, subtasks `TASK-12.1`. No zero padding.
- `labels`: the braid labels, listed for the board and web UI. The list is not enforced:
  `--labels foo` was accepted.
- `definition_of_done`: three defaults, copied into every new task. `--no-dod-defaults` skips them.
- `check_active_branches: true` and `remote_operations: true`: needed to see tasks and reserve IDs
  on branches that exist only on the remote (see Worktrees). Without a remote, every command prints
  a `remoteOperations` warning; harmless.
- `auto_commit: false`: agents commit task files with their own work, one writer per checkout.
- `auto_open_browser: false`: agents must not open browsers.
- `default_editor`: `init` copies `$EDITOR` into the config (`EDITOR=notepad` gave
  `default_editor: "notepad"`; with `EDITOR` unset nothing was written, and `git config
  core.editor` was not used). The committed file leaves the key out; `config get defaultEditor`
  then says "not set" and the platform default applies. Nothing was written under the fake home.

**Agent instructions.** Run `init`, if at all, with `--agent-instructions none`
(`--integration-mode none` cannot be combined with it), and let the `braid` skill carry what agents
need. The `AGENTS.md` block is a `CRITICAL_INSTRUCTION` that tells every agent in the project, braid
or not, to run `backlog instructions overview` each conversation; changing `AGENTS.md` is the
user's call; and its rules conflict with braid's:

| `backlog instructions` says | braid rule the skill should state instead |
| --- | --- |
| Create a task when work needs planning (overview); search, then create (task-creation) | Only the coordinator creates or restructures tasks; a worker proposes them |
| Mark it In Progress and assign yourself (task-execution 3) | The coordinator sets statuses on its branch; the worker's PR into `main` sets Done (epic Design) |
| Plan with a material decision: wait for approval; scope changes and follow-ups: ask the user | Read "user" as the coordinator; routine plans don't wait; growth goes through the mandate |
| No plan at creation, research later | Kept: the brief's "Already decided" and "Start here" are context, not a plan |
| Never edit task files directly | Kept, with one exception: resolving a Git merge conflict in a task file |
| Mark Done after verification | Done is set in the PR into `main` (story) or by the coordinator's final PR (phased) |

The rest (search first, AC are testable, check only proven AC, final summary content, archive and
restore) matches braid and can be referenced as `backlog instructions <guide>`.

**Worktrees and branches.** Repository with `main` and worktree `feat` (committed TASK-2, TASK-1
edited to In Progress and later Done, uncommitted TASK-3), and a branch pushed to `origin` then
deleted locally (TASK-4). From the `main` worktree:

- `task list` and `task view` show only the current branch's tasks: TASK-1 `To Do`.
- `board export` and `backlog browser` (`/api/tasks`) show TASK-1 `To Do`, TASK-2 from `feat`, and
  with `remote_operations: true` also TASK-4 from the remote branch. They do not show TASK-3
  (uncommitted) or `feat`'s newer status of TASK-1, even when `feat`'s `updated_date` is later and
  `main`'s copy has none: a task on the current branch always wins.
- New IDs skip IDs on other local branches and uncommitted files in other worktrees (the remote
  branch's task got TASK-4, skipping uncommitted TASK-3). With `remote_operations: false`, a task
  created on `main` reused TASK-4 from the remote-only branch; with `true` it got TASK-5. With
  `check_active_branches: false` and the remote branch present, a new task again reused TASK-4.

So the board is a view of the current branch plus tasks it lacks; statuses on `main` move only by
merges, as the epic's design assumes.

## Proposed changes to B's brief

- Invocation rule for `assets/braid-md.md` and the skill: "Install `backlog.md@1.55.3` globally;
  call `backlog` from pwsh 7 or bash; never `npx`, `backlog.cmd`, `cmd.exe` or Windows PowerShell
  5.1; quote Markdown with single quotes; one argument per multi-line field."
- Setup: copy `reports/A-config.yml` into the skill's assets as `backlog-config.yml` instead of
  running `init`; if `init` runs, use `--agent-instructions none` and unset `EDITOR` and `VISUAL`.
- The skill states the six overrides in the table above and points to `backlog instructions
  <guide>` for the rest. `AGENTS.md` gets no Backlog.md block (D can add a one-line pointer).
- Add to the failure modes: the board shows `main`'s status, not the newest; and a task file merge
  conflict is resolved by hand, then checked with `backlog doctor`.
