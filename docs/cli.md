# The braid CLI

`braid` reads, creates, edits, logs and reports on the braids (work items) and strands (their parts) in a repository's `braids/` folder, and serves the read-only board. The file format is in [the braids/ format](braids-format.md); each command's full behaviour is under [Commands](braids-format.md#commands) there.

braid finds the repository from the current folder: the nearest folder upwards that holds `braids/` or `.git`.

## Commands

These are the commands `braid help` lists, in its order.

| Command | What it does |
| --- | --- |
| `braid list` | List braids and their strands in run order: id, status, order and title. |
| `braid view <id>` | Show a braid (`0002`) or a strand (`0002/A`): fields, report, logs, strands and its brief. |
| `braid new <title>` | Create a braid with the next free number. |
| `braid strand new <braid> <title>` | Create a strand with the next free letter. |
| `braid edit <id>` | Change `--status`, `--title`, `--labels`, `--dep`, `--order`, `--delivery` (`none` clears a list or the order). |
| `braid brief <id> <section>` | Set a section of `brief.md` from `--file <path>`, `--file -` or `--text`. |
| `braid log <id> <text>` | Append an entry to this thread's log and `git add` it (`--thread`, `--checkpoint`, `--file`). |
| `braid report <id>` | Write `report.md` from `--file <path>`, `--file -` or `--text` (`--append` adds). |
| `braid import-backlog` | Turn Backlog.md `backlog/` tasks into `braids/` (`--dry-run` prints only; `backlog/` is never touched). |
| `braid check` | Check every brief under `braids/`; list each error with its file (exit 2 on any). |
| `braid status <number>` | One line per strand: status, lane (as the board shows it), `ask:<key>`, branch, PR, `ci` checks, T3 thread, and the request text of an item on your side. Reads GitHub and T3, no fetch. |
| `braid next <number>` | The next strand to run, or why none is ready. |
| `braid start <id> [--force\|--review]` | Create the strand branch from its braid branch, push it and add a worktree (`--force` skips the ready check); `--review` makes a detached checkout of the open PR head for the reviewer. |
| `braid done <id> [--head <sha>] [--merge]` | Mark an item Done after checks: a strand on the braid branch after its merge (`--merge` merges the reviewed head first), a story or final PR on its branch (`--log` adds a braid log entry). |
| `braid facts <pr>` | The stop-case diff facts of a PR (dependency, process, deleted tests, skip markers, size), each with its case. |
| `braid recap <id>` | A draft recap and braid log line from `report.md`, the PR (head, checks) and the facts, to edit. |
| `braid handover <id> --head <sha>` | Open a review request after checking the PR is open, at that head and green; prints the recap draft (`--thread`). |
| `braid ask <id> <text>` | Open a request for what the coordinator needs from you (`--kind question\|decision\|plan`, `--key <stop case>`, `--thread`, `--file -`). |
| `braid answer <id>` | Close the item's request (`--log <file>\|-` adds your decision to the braid log; `--thread`). |
| `braid requests` | List the open requests: item, kind, age, text. |
| `braid clean [<number>\|<id>] [--yes]` | Remove worktrees and local branches of merged items (a dry run without `--yes`; never forces). |
| `braid board` | Open the read-only board in the browser (`--no-open` only prints the address; `--demo` uses sample data). |
| `braid help` | Show the help. |

Options: `braid --version` prints the version; `braid --help` shows the help.

`braid new` and `braid strand new` also take `--status`, `--labels`, `--dep`, `--order`, `--delivery` (braids), `--slug`, and `--no-fetch` (skip `git fetch` before choosing the number or letter).

## Examples

```powershell
braid list          # braids and their strands, with status and run order
braid view 0002     # one braid: fields, report, logs, strands and its brief
braid view 0002/A   # one strand
braid new 'Braids folder' --labels 'kind:story,tier:L'   # the next free number
braid strand new 0002 'Read braids' --order 1           # the next free letter
braid edit 0002/A --status 'In Progress'                # status, title, labels, dependencies, order, delivery
braid brief 0002 Goal --file goal.md                    # set a section; --file - reads standard input
braid log 0002/A --thread mcp:launch:5d80964a 'Parser done'   # a dated entry in that thread's log file, staged with git add
braid log 0002/A --checkpoint 'Paused after the parser'       # a checkpoint entry; no thread: the log-<date>-user.md file
braid report 0002/A --file report.md                    # write report.md; --append adds to it
braid import-backlog --dry-run   # list the braids a Backlog.md backlog/ would become; without --dry-run, write braids/
braid check         # validate every brief under braids/; lists each error with its file, exit 2 on any
braid status 0008   # one braid's strands: status, lane, branch, PR, ci checks, T3 thread
braid next 0008     # the next strand to run, or why none is ready
braid start 0008/B  # its branch from the braid tip, pushed, plus a worktree in $BRAID_WORKTREES_DIR (default ~/braid-worktrees)
braid clean 0008    # dry run: worktrees and local branches of merged items; --yes removes them
braid board         # open the read-only board in the browser (127.0.0.1, free port)
braid board --demo  # the same board on built-in sample data: no repository, gh or t3 is read
```

Briefs and reports are plain Markdown files, so you may edit them directly; run `braid check` afterwards to catch a broken front matter, a wrong id or a bad folder name.

## Exit codes

Errors are printed on stderr, starting with `error:`.

| Code | Means |
| --- | --- |
| 0 | Success. |
| 1 | A usage error: an unknown command or id, a wrong option, a refused action, or a failed Git command. `braid import-backlog` also exits 1 when a braid number it would write already exists. |
| 2 | Broken braid files: a malformed brief or folder name (the error names the file and line), any error `braid check` finds, or a Backlog.md input that doesn't parse. |
| 5 | An unexpected failure. |

```text
error: braids/0002-braids-folder/brief.md: line 4: status must be one of Outline, To Do, In Progress, Done; got: Doing
```

## Running from a checkout

After `npm run build` (see [development](development.md)), run `node dist/cli.js <command>`, for example `node dist/cli.js help`. The braid skills' installer puts a `braid` command on `PATH`; see [getting started](getting-started.md).
