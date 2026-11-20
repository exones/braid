# The braid CLI

`braid` reads, creates, edits, logs and reports on the braids (work items) and strands (their parts) in a repository's `braids/` folder, and serves the board. The file format is in [the braids/ format](braids-format.md); each command's full behaviour is under [Commands](braids-format.md#commands) there.

braid finds the repository from the current folder: the nearest folder upwards that holds `braids/` or `.git`.

## Commands

These are the commands `braid help` lists, in its order.

| Command | What it does |
| --- | --- |
| `braid list [--open]` | List braids and their strands in run order: id, status, order and title, then `Inbox: <open> leftovers, <ideas> ideas` (counts only, from the local refs). `--open`: every braid that is not Done, on any branch, with the start of its goal (`--no-fetch` skips the fetch). |
| `braid view <id> [--links]` | Show a braid (`0002`) or a strand (`0002/A`): fields, report, logs, strands and its brief. `--links` adds `Linked from:`, the open braids whose `related` names this braid. |
| `braid new <title>` | Create a braid with the next free number (`--related` sets its related braids). |
| `braid strand new <braid> <title>` | Create a strand with the next free letter. |
| `braid title <id> --role <role>` | Print the thread title for an item: `<emoji> <repo> <id> <role>: <title>` (role `coordinator`, `worker`, `review` or `research`). |
| `braid edit <id>` | Change `--status`, `--title`, `--labels`, `--dep`, `--related`, `--order`, `--delivery`, `--autonomy` (`none` clears a list, the order or the preset). |
| `braid autonomy <number>` | Print the [autonomy preset](autonomy.md) a braid runs on: its name, where the name comes from (the brief, `BRAID.md` or the built-in default), where the text comes from (`autonomy/<name>.md` or shipped with braid), the preset's text and then the brief's `## Autonomy` section under `This braid:`. `--list` names the presets available here and marks the project default. |
| `braid brief <id> <section>` | Set a section of `brief.md` from `--file <path>`, `--file -` or `--text`. |
| `braid log <id> <text>` | Append an entry to this thread's log and `git add` it (`--thread`, `--checkpoint`, `--file`). |
| `braid report <id>` | Write `report.md` from `--file <path>`, `--file -` or `--text` (`--append` adds). |
| `braid import-backlog` | Turn Backlog.md `backlog/` tasks into `braids/` (`--dry-run` prints only; `backlog/` is never touched). |
| `braid check` | Check every brief under `braids/` and the autonomy presets; list each error with its file (exit 2 on any). |
| `braid status <number>` | One line per strand: status, lane (as the board shows it), `ask:<key>`, branch, PR, `ci` checks, T3 thread, and the request text of an item on your side. Before the strand lines it prints a `not ready: …` line per problem of the project (no `braids/`, a bad `BRAID.md`, `braid check` errors, GitHub unreadable; see [the board](board.md#not-ready)). Reads GitHub and T3, no fetch. |
| `braid next <number>` | The next strand to run, or why none is ready. |
| `braid start <id> [--force]` | Create the strand branch from its braid branch, push it and add a worktree; a planned story whose branch already exists gets its worktree on it (`--force` skips the ready check). `--review` is gone: it fails with a line naming `braid review`. |
| `braid review <id> --thread <thread id>` | Record a reviewer subagent's T3 thread, run by the coordinator right after launching it, with the folder and branch T3 gives for it: the board and `braid status` show the review while it runs, and `braid clean` removes that checkout after the merge. |
| `braid accept <id> [--head <sha>] [--merge [--preset]] [--review <url>]` | Accept an item and mark it Done after checks (`braid done` is the old name): a strand on the braid branch after its merge (`--merge` merges the reviewed head first; `--merge --preset` is a merge the coordinator makes under the braid's [autonomy preset](autonomy.md), refused unless the preset's `merge` allows this PR and `ci` in `BRAID.md` is not `none`), a story or final PR on its branch (`--log` adds a braid log entry). Checks missing or pending on a head that only adds `braids/` changes on a green commit don't block it. |
| `braid wait <number> [--timeout <minutes>]` | Wait for the braid branch's CI after a merge: on the newest commit of `origin`'s braid branch with changes outside `braids/` and `epics/`, until every `ci` check of BRAID.md has finished. Exit 0 green, 1 a check failed (named), 2 no answer: timeout (default 30 minutes), no run within 5 minutes, or an error. Reads only. |
| `braid facts <pr>` | The stop-case diff facts of a PR (dependency, process, deleted tests, skip markers, size), each with its case. |
| `braid decisions <number> [--since <date or sha>]` | List the `Decided:` log entries of a braid and its strands, oldest first: date, item id and text. `--since` keeps a date's whole day and later, or the entries after a commit. |
| `braid recap <id>` | A draft recap and braid log line from `report.md`, the item's `Decided:` log entries (a braid's final PR: those of all its strands), the PR (head, checks) and the facts, to edit; ends with `Sweep due: <n> open leftovers` at 3 or more open leftovers. |
| `braid handover <id> --head <sha>` | Open a review request after checking the PR is open, at that head and green (a head with only `braids/` changes on a green commit counts as green); prints the recap draft (`--thread`). |
| `braid ask <id> <text>` | Open a request for what the coordinator needs from you (`--kind question\|decision\|plan`, `--key <stop case>`, `--thread`, `--file -`). |
| `braid answer <id>` | Close the item's request (`--log <file>\|-` adds your decision to the braid log; `--thread`). |
| `braid requests` | List the open requests: item, kind, age, text. |
| `braid note <text> --from <source>` | Capture a leftover on the `braid-inbox` branch and push it (source: `0012/A`, `review 0012/A`, `PR #12` or `user`; `--ref <url>` repeats; `--file -`). |
| `braid note --idea <text>` | Capture an idea on the `braid-inbox` branch and push it (`from: user` unless `--from`; `--file -`). |
| `braid inbox` | List the open inbox entries: kind, id, age, source, passed, title (`--leftovers`, `--ideas`, `--all` adds taken and dropped, `--no-fetch`). |
| `braid inbox show <id>` | Print one inbox entry in full, with the item folder its source names. |
| `braid inbox take <entry>... --into <braid id>[,<braid id>...]` | Mark open entries `taken`, with `into` set. |
| `braid inbox pass <leftover>...` | Pass open leftovers over in a sweep: `passed` + 1; at 2 the leftover is dropped (`why: passed over in 2 sweeps`). An idea is refused. |
| `braid inbox drop <entry>... --why "<reason>"` | Mark open entries `dropped`, with `why` set. |
| `braid inbox reopen <entry>` | Bring a dropped or taken entry back to `open`: `why` and `into` removed, `passed` back to 0. |
| `braid clean [<number>\|<id>] [--yes]` | Remove worktrees and local branches of merged items and of merged `plan/<slug>` branches (a dry run without `--yes`; never forces; a dirty or busy worktree is kept). |
| `braid board` | Open the board in the browser (`--no-open` only prints the address; `--demo` uses sample data (`--demo-not-ready`: a project with problems); it prints one `not ready:` line per problem and shows them in a note above the lanes; `--host <address>` also serves it on this machine's Tailscale address, to its Tailscale owner only: `tailscale`, one of its Tailscale IPs or its MagicDNS name; anything else is refused, see [the board](board.md#on-tailscale); `--port <n>` serves both listeners on that port, so a phone bookmark survives restarts, and a port in use is refused with a message: the local listener is closed again if the Tailscale bind fails, so nothing stays listening). |
| `braid notify [setup\|test\|off]` | Phone pushes over [ntfy](https://ntfy.sh) from the running board ([Notifications](board.md#notifications)). `setup [--topic <t>] [--server <url>] [--new-topic]` turns them on once per machine: it makes an unguessable topic (`braid-` and 24 random characters) unless one is given or one is already set (kept, so the phone's subscription still works; `--new-topic` makes another), stores `server`, `topic` and `enabled` in `~/.braid/notify.json` and prints the topic, the server and the subscribe URL for the ntfy app. The server must be `https://` (default `https://ntfy.sh`). `test` sends one test push; `off` stops the pushes and keeps the settings. `braid notify` alone prints the state: on or off, the server, the topic in part and where the token comes from. The access token of a protected server is read only from `BRAID_NTFY_TOKEN` and sent as `Authorization: Bearer`; it is never stored or printed. |
| `braid help` | Show the help. |

Options: `braid --version` prints the version; `braid --help` shows the help.

`braid new` and `braid strand new` also take `--status`, `--labels`, `--dep`, `--related` (braids), `--order`, `--delivery` and `--autonomy` (braids), `--slug`, and `--no-fetch` (skip `git fetch` before choosing the number or letter).

## Examples

```powershell
braid list          # braids and their strands, with status and run order
braid view 0002     # one braid: fields, report, logs, strands and its brief
braid view 0002/A   # one strand
braid view 0002 --links   # also the open braids whose related names 0002
braid list --open   # every unfinished braid on any branch, with its goal
braid new 'Braids folder' --labels 'kind:story,tier:L'   # the next free number
braid strand new 0002 'Read braids' --order 1           # the next free letter
braid edit 0002/A --status 'In Progress'                # status, title, labels, dependencies, order, delivery
braid edit 0002 --autonomy steady                       # the braid runs on the steady preset; none goes back to the project default
braid autonomy 0002                                     # the preset 0002 runs on, where it comes from, and its text
braid brief 0002 Goal --file goal.md                    # set a section; --file - reads standard input
braid log 0002/A --thread mcp:launch:5d80964a 'Parser done'   # a dated entry in that thread's log file, staged with git add
braid log 0002/A --checkpoint 'Paused after the parser'       # a checkpoint entry; no thread: the log-<date>-user.md file
braid report 0002/A --file report.md                    # write report.md; --append adds to it
braid import-backlog --dry-run   # list the braids a Backlog.md backlog/ would become; without --dry-run, write braids/
braid check         # validate every brief under braids/; lists each error with its file, exit 2 on any
braid status 0008   # one braid's strands: status, lane, branch, PR, ci checks, T3 thread
braid next 0008     # the next strand to run, or why none is ready
braid start 0008/B  # its branch from the braid tip, pushed, plus a worktree in $BRAID_WORKTREES_DIR (default ~/braid-worktrees)
braid note 'Retry the fetch in braid start' --from 'review 0008/B' --ref <comment url>   # a leftover on braid-inbox, pushed at once
braid note --idea 'A phone view of the board'   # an idea
braid inbox         # the open leftovers and ideas; braid inbox show <id> prints one
braid clean 0008    # dry run: worktrees and local branches of merged items; --yes removes them
braid board         # open the board in the browser (127.0.0.1, free port)
braid board --demo  # the same board on built-in sample data: no repository, gh or t3 is read
braid board --host tailscale --port 8765   # same, on a fixed port so the phone bookmark keeps working
braid board --host tailscale   # also on http://<MagicDNS name>:<port>/ for your phone, your own Tailscale devices only
```

Briefs and reports are plain Markdown files, so you may edit them directly; run `braid check` afterwards to catch a broken front matter, a wrong id or a bad folder name.

## Exit codes

Errors are printed on stderr. Most start with `error:`; `braid check` lists each problem as `<file>: <message>` and ends with the error count.

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
