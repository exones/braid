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
| `braid limits [<instanceId>] [--role <role> [--tier <T>] [--kind <kind>]] [--json]` | May an agent be launched on a provider? Reads T3's provider caches (`$T3CODE_HOME/caches/<instanceId>.json`, default `~/.t3/caches`) and never writes them or calls T3, Anthropic or OpenAI. Lists every provider named in `BRAID.md` `models` with its roles, each window's usage against its threshold, and a verdict: `pause` (a window is at or over its threshold; says which and the resume time, the window's reset plus the buffer), `unknown` (the cache is stale, missing, has no `usageLimits` or is `unsupported`; launch as usual) or `ok`. A provider or `--role` (resolved as the braid skill resolves models: tier, then kind, then the role) narrows it. Times are local; `--json` gives ISO UTC and the same data. Exit 0 for `ok` and `unknown`, 3 for `pause`. |
| `braid pause <number> --provider <instanceId> --thread <id> [--window <id>] [--until <iso>] [--task <id>] [--by coordinator|pm|board]` | Record that a braid waits for a provider's usage window, in `.braid/pauses.json` of the main checkout ([Pauses](#pauses)). Without `--window` and `--until` the window, its usage and reset and the resume time (reset plus the buffer) come from `braid limits` for that provider, and it is refused unless the verdict is `pause`. `--window` picks a window (its reset plus the buffer); `--until` sets the resume time and pauses whatever the verdict. `--task` is the scheduled resume task's id, `--thread` the pausing thread (the one the task wakes), `--by` who paused (default `coordinator`). Pausing again with the same values changes nothing; other values replace the record. A held braid is refused: a hold outlives a limit pause. Prints the pause line. |
| `braid pause <number> --hold "<words>" --thread <id> [--by coordinator\|pm]` | Record a **hold**: a deliberate pause by you or the PM, with no provider and no resume time ([Pauses](#pauses)). It takes none of `--provider`, `--window`, `--until`, `--task`. Same words again change nothing. |
| `braid resume <number> [--limit]` | Clear a braid's pause and print what was cleared, with the resume task to delete if it is still set; a braid that isn't paused is left as it is. `--limit` clears a limit pause only and leaves a hold (it says so). |
| `braid brief <id> <section>` | Set a section of `brief.md` from `--file <path>`, `--file -` or `--text`. |
| `braid log <id> <text>` | Append an entry to this thread's log and `git add` it (`--thread`, `--checkpoint`, `--file`). |
| `braid report <id>` | Write `report.md` from `--file <path>`, `--file -` or `--text` (`--append` adds). |
| `braid import-backlog` | Turn Backlog.md `backlog/` tasks into `braids/` (`--dry-run` prints only; `backlog/` is never touched). |
| `braid check` | Check every brief under `braids/` the autonomy presets and the `docs` key of `BRAID.md`; list each error with its file (exit 2 on any). |
| `braid check --plan <file>` | Check a programme's plan file (`pm/<slug>.md`, [the format](braids-format.md#plan-files)) instead: prints `plan OK: pm/<slug>, <state>, <n> rows`, or the first error with its line (exit 2). The PM runs it before it pushes the plan. |
| `braid status <number>` | One line per strand: status, lane (as the board shows it), `ask:<key>`, branch, PR, `ci` checks, T3 thread, and the request text of an item on your side. Before the strand lines it prints a `not ready: …` line per problem of the project (no `braids/`, a bad `BRAID.md`, `braid check` errors, GitHub unreadable, said once, with what it hides; see [the board](board.md#not-ready)). Reads GitHub and T3, no fetch. |
| `braid next <number>` | The next strand to run, or why none is ready. |
| `braid start <id> [--force]` | Create the strand branch from its braid branch, push it and add a worktree; a planned story whose branch already exists gets its worktree on it (`--force` skips the ready check); run again, it is safe: when the branch is already checked out in that worktree folder (for a strand, at or after its braid's tip), it creates nothing, prints the same three lines with `(already started)` and exits 0, and anything else in the way still fails with what it found. `--review` is gone: it fails with a line naming `braid review`. |
| `braid review <id> --thread <thread id>` | Record a reviewer subagent's T3 thread, run by the coordinator right after launching it, with the folder and branch T3 gives for it: the board and `braid status` show the review while it runs, and `braid clean` removes that checkout after the merge. |
| `braid accept <id> [--head <sha>] [--merge [--preset]] [--review <url>]` | Accept an item and mark it Done after checks (`braid done` is the old name): a strand on the braid branch after its merge (`--merge` merges the reviewed head first; `--merge --preset` is a merge the coordinator makes under the braid's [autonomy preset](autonomy.md), refused unless the preset's `merge` allows this PR and `ci` in `BRAID.md` is not `none`), a story or final PR on its branch (`--log` adds a braid log entry). Checks missing or pending on a head that only adds `braids/` changes on a green commit don't block it. |
| `braid wait <number> [--timeout <minutes>]` | Wait for the braid branch's CI after a merge: from the tip of `origin`'s braid branch down to its newest commit with changes outside `braids/` and `epics/`, until every `ci` check of BRAID.md has finished. Each check is answered by the newest commit in that range that has a run for it (the commits above the CI commit change only `braids/` or `epics/`, so they test the same code). A `CANCELLED` run on a commit with a newer commit above it (a newer push cancelled it) stays pending for up to 5 minutes from the start of the call, waiting for the newer run; after that, or with nothing newer, it counts as a failure. Exit 0 green, 1 a check failed (named), 2 no answer: no run within 5 minutes, or an error, 3 still running when `--timeout` is up (minutes, default 30; the output names the commit). Reads only. The coordinator calls it as one short read, `--timeout 0.25`, at the next strand's checks and before the final PR, and doesn't wait on it (D91). |
| `braid facts <pr>` | The stop-case diff facts of a PR (dependency, process, deleted tests, skip markers, size), each with its case. |
| `braid decisions <number> [--since <date or sha>]` | List the `Decided:` log entries of a braid and its strands, oldest first: date, item id and text. `--since` keeps a date's whole day and later, or the entries after a commit. |
| `braid recap <id>` | A draft recap and braid log line from `report.md`, the item's `Decided:` log entries (a braid's final PR: those of all its strands), the PR (head, checks) and the facts, to edit; ends with `Sweep due: <n> open leftovers` at 3 or more open leftovers. |
| `braid handover <id> --head <sha>` | Open a review request after checking the PR is open, at that head and green (a head with only `braids/` changes on a green commit counts as green); prints the recap draft (`--thread`; `--to pm` addresses it to the braid's PM, see `braid ask`). |
| `braid ask <id> <text>` | Open a request for what the coordinator needs from you (`--kind question\|decision\|plan`, `--key <stop case>`, `--thread`, `--file -`, `--to user\|pm`, `--by coordinator\|pm`). `--to pm` is for a braid a PM runs: the PM answers first. It reads the PM's thread from the braid brief's `PM-run (thread <id>)` line and fails, opening nothing, without one. Without `--to` the request is yours, as before. The PM asks you itself with `--by pm` (about one braid; `--thread` is the PM's thread, else the brief's `PM-run` line) or `braid ask pm/<slug> <text>` (about the whole programme; `pm/<slug>` must be a `pm/*` branch of the project, local or on `origin`, else nothing opens). `--kind action` is something only you can do ("The PM asks you to: …"), allowed only for the PM. A PM request shows in Needs You, is pushed at high priority and opens the PM thread; it never replaces the coordinator's request on the same braid. |
| `braid forward <id> [--note <text>]` | The PM hands a request addressed to it on to you; it reaches you at once with "Forwarded by the PM:" and the note: for a braid no programme lists, on its card (Needs You; a handover: To Review); for a braid a programme runs, as the PM asking you in the programme's Needs you while the card keeps its lane, and is pushed as the PM's request, opening the PM's thread (merges forwarded by one PM are one push listing them; during a pause or hold, only after `braid resume`). For a braid a programme runs it shows in the programme's Needs you as "The PM asks you:", and the braid's card stays in its lane. A request that is already yours is left alone. |
| `braid answer <id>` | Close the item's request (`--by pm` closes the PM's, also `pm/<slug>`; without it the coordinator's, naming the PM's when only that is open; `--log <file>\|-` adds your decision to the braid log; `--thread`). |
| `braid requests` | List the open requests: item, kind, age, text; `from the PM` for the PM's own, `to the PM` or `forwarded by the PM` before the text of a request addressed to the PM. |
| `braid note <text> --from <source>` | Capture a leftover on the `braid-inbox` branch and push it (source: `0012/A`, `review 0012/A`, `PR #12` or `user`; `--ref <url>` repeats; `--file -`). |
| `braid note --idea <text>` | Capture an idea on the `braid-inbox` branch and push it (`from: user` unless `--from`; `--file -`). |
| `braid inbox` | List the open inbox entries: kind, id, age, source, passed, title (`--leftovers`, `--ideas`, `--all` adds taken and dropped, `--no-fetch`). |
| `braid inbox show <id>` | Print one inbox entry in full, with the item folder its source names. |
| `braid inbox take <entry>... --into <braid id>[,<braid id>...]` | Mark open entries `taken`, with `into` set. |
| `braid inbox pass <leftover>...` | Pass open leftovers over in a sweep: `passed` + 1; at 2 the leftover is dropped (`why: passed over in 2 sweeps`). An idea is refused. |
| `braid inbox drop <entry>... --why "<reason>"` | Mark open entries `dropped`, with `why` set. |
| `braid inbox reopen <entry>` | Bring a dropped or taken entry back to `open`: `why` and `into` removed, `passed` back to 0. |
| `braid clean [<number>\|<id>] [--yes]` | Remove worktrees and local branches of merged items and of merged `plan/<slug>` branches (a dry run without `--yes`; a dirty or busy worktree is kept, a branch goes with `git branch -d`; the one forced delete is a recorded reviewer's `t3/…` branch whose tip is the merged PR's head or is on `origin`, where no commit is lost). |
| `braid board` | Open the board in the browser. With projects in this machine's list (`braid projects add`) it serves all of them, or the one `--project <name>` names: one combined board (`/api/all`), each project's own board, actions by project name and pushes for every listed project ([several projects](board.md#several-projects)); in a folder with no list it serves that folder alone. (`--no-open` only prints the address; `--no-pause` turns off the board's limits pause for this run, so the limits only show ([the board](board.md#the-board-pauses-and-resumes)); `--demo` uses sample data and never pauses (`--demo-not-ready`: a project with problems); it prints one `not ready:` line per problem and shows them in a note above the lanes; `--host <address>` also serves it on this machine's Tailscale address, to its Tailscale owner only: `tailscale`, one of its Tailscale IPs or its MagicDNS name; anything else is refused, see [the board](board.md#on-tailscale); `--port <n>` serves both listeners on that port, so a phone bookmark survives restarts, and a port in use is refused with a message: the local listener is closed again if the Tailscale bind fails, so nothing stays listening). A real run (not `--demo`) also writes its tokened address to `~/.braid/board-<port>.url`, owner-only, and removes it when it stops. `--service` (needs `--port`) is the run of `braid board service`'s task: its output also goes to `~/.braid/board-<port>.log` (replaced at each start, token hidden) and it stops when its standard input closes. |
| `braid board --url [--port <n>]` | Print the address with the session token of each board running for you (only the one on `--port <n>`), from its address file, for a board started at login or as a service; exits 1 with `no braid board is running for this user` when no file's board answers with its token (a board killed outright leaves a stale file). See [the address file](board.md#the-address-file). |
| `braid board service install [--port <n>] [--host <address>] \| remove \| restart [--if-installed] \| status` | Windows: the board as a Task Scheduler task of yours, without a window ([run the board at login](board.md#run-the-board-at-login), D95). `install` (from a checkout; default port 8765) registers the `braid board` task, started at logon and again every 5 minutes if its board stopped, replaces an installed one and starts it (on a port another process holds, such as a board started by hand, it keeps the task, doesn't start it and exits 1); `remove` stops it and removes the task; `restart` stops and starts it on the same port (`--if-installed`: nothing when no task is installed, as `Install-Skills.ps1` runs it); `status` prints the task's state and last result (the previous run's while it runs), the port, the folder, the live address, the running board's braid version against this one and the log (`~/.braid/board-<port>.log`), and exits 1 when no board answers. The task runs `braid board --service`, which logs to that file and stops when the task stops. On other platforms it says it is Windows-only and points to the systemd recipe. |
| `braid notify [setup\|test\|off]` | Phone pushes over [ntfy](https://ntfy.sh) from the running board ([Notifications](board.md#notifications)). `setup [--topic <t>] [--server <url>] [--new-topic]` turns them on once per machine: it makes an unguessable topic (`braid-` and 24 random characters) unless one is given or one is already set (kept, so the phone's subscription still works; `--new-topic` makes another), stores `server`, `topic` and `enabled` in `~/.braid/notify.json` and prints the topic, the server and the subscribe URL for the ntfy app. The server must be `https://` (default `https://ntfy.sh`). `test` sends a test push, then a second one with a sequence ID that it clears at once; `off` stops the pushes and keeps the settings. `braid notify` alone prints the state: on or off, the server, the topic in part and where the token comes from. The access token of a protected server is read only from `BRAID_NTFY_TOKEN` and sent as `Authorization: Bearer`; it is never stored or printed. |
| `braid notify send "<line>" --thread <id> [--programme <slug>]` | The PM's own push with no board item ([Notifications](board.md#notifications)): sent at once, without the board, titled `<repo> pm/<slug>: the PM` (or `<repo>: the PM`), the line cut at 200 characters, high priority, opening the thread in T3; a newer line of the same programme replaces the older on the phone. With notifications off or not set up, or a failed send, it prints why (`Not sent: …`) and exits 0. It prints the server's host, never the topic or the token. |
| `braid projects add [<path>] [--name <n>] [--port <n>]` | Add the repository holding `<path>` (default: the current folder; its main checkout, also from a worktree) to this machine's list in `~/.braid/projects.json` ([the project list](braids-format.md#the-project-list)) and print its readiness ([Not ready](board.md#not-ready); GitHub is not checked). The name defaults to the main checkout's folder name. Refuses a folder outside Git, a name or path already listed and a bad port; notes when another listed project has the same folder name; item worktrees go to `~/braid-worktrees/<project name>/`, so the two stay apart. |
| `braid projects remove <name>` | Remove a project from the list. |
| `braid projects list` | Each listed project: name, path, port, and its readiness lines (`ready`, `not ready: …`, or a problem when the folder no longer exists). A list braid can't read (corrupt, another version) is reported with exit code 2 by every `projects` command and never rewritten. |
| `braid help` | Show the help. |

Options: `braid --version` prints the version; `braid --help` shows the help.

`braid new` and `braid strand new` also take `--status`, `--labels`, `--dep`, `--related` (braids), `--order`, `--delivery` and `--autonomy` (braids), `--slug`, and `--no-fetch` (skip `git fetch` before choosing the number or letter).

## Provider limits

`braid limits` applies these rules to the numbers T3 caches: a cache checked more than `stale` minutes ago, a missing one, one without `usageLimits` and an `unsupported` provider are `unknown`, which never pauses; a window whose reset time is past counts as 0%; a model-scoped window (for example Claude's weekly Fable window) counts only for a `models` line whose model it belongs to. Defaults can be changed with an optional `limits:` key in `BRAID.md`; absent keys keep the default and an invalid value is an error naming the key:

```yaml
limits:
  session: 97   # pause at this percent of a session (5 h) window
  weekly: 95    # pause at this percent of a weekly window
  buffer: 5     # minutes after the reset until work resumes
  stale: 10     # minutes after which a cache reading is unknown
```

## Pauses

A pause holds a whole braid, never one strand. It has one of two reasons: a provider's usage **limit** (below), or a **hold**, your or the PM's deliberate pause with `braid pause <number> --hold "<words>" --thread <id>`: no provider, no resume time, so it never turns amber or `stalled` and lasts until `braid resume`. A hold outlives a limit pause: `braid pause --provider` refuses a held braid, `braid resume --limit` leaves a hold, and the board neither pauses a held braid nor clears a hold. `braid status` prints a hold as `Held: “<words>” (by PM 3194eef8 at 16:31)` and `held` in the lane. The rest of this section is about limits; the running board pauses and resumes them, for a PM's braids too. One record per braid: number, provider, window id and label, used percent, the window's `resetsAt`, `resumeAt`, the resume task's id, the pausing thread, who paused (`coordinator`, `pm` or `board`) and when ([the format](braids-format.md#commands)). `braid pause` and `braid resume` write it, and so does a running board for its own limits pause (`by: board`, with the threads it paused and its steering thread: [the board](board.md#the-board-pauses-and-resumes)), which also resumes those braids itself. `braid status` only shows it. The board resumes its own pauses; an older `coordinator` or `pm` record is cleared by `braid resume --limit` (agents no longer write them). `braid status` adds `(paused)` or `(paused, resume was due)` to the lane and prints the pause under the braid:

```text
0009  In Progress  Working (paused)  branch local+pushed  PR -  ci -  thread -  Sample reports
    Paused: Claude_Everix Session 97%, resumes 21:05 (by coordinator 3194eef8 at 20:29, task 9c1e42)
```

A damaged `pauses.json` reads as no pauses, and `braid status` says so in a `note:` line.

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
braid limits --role worker --kind story                    # may a story worker be launched now? exit 3 means pause
braid pause 0061 --provider Claude_Everix --thread 3194eef8-be42 --task 9c1e42   # values from braid limits; refused unless it says pause
braid resume 0061                                       # clear the pause; prints what was cleared
braid brief 0002 Goal --file goal.md                    # set a section; --file - reads standard input
braid log 0002/A --thread mcp:launch:5d80964a 'Parser done'   # a dated entry in that thread's log file, staged with git add
braid log 0002/A --checkpoint 'Paused after the parser'       # a checkpoint entry; no thread: the log-<date>-user.md file
braid report 0002/A --file report.md                    # write report.md; --append adds to it
braid import-backlog --dry-run   # list the braids a Backlog.md backlog/ would become; without --dry-run, write braids/
braid check         # validate every brief under braids/; lists each error with its file, exit 2 on any
braid status 0008   # one braid's strands: status, lane, branch, PR, ci checks, T3 thread
braid next 0008     # the next strand to run, or why none is ready
braid start 0008/B  # its branch from the braid tip, pushed, plus a worktree in $BRAID_WORKTREES_DIR/<project name> (default ~/braid-worktrees)
braid note 'Retry the fetch in braid start' --from 'review 0008/B' --ref <comment url>   # a leftover on braid-inbox, pushed at once
braid note --idea 'A phone view of the board'   # an idea
braid inbox         # the open leftovers and ideas; braid inbox show <id> prints one
braid clean 0008    # dry run: worktrees and local branches of merged items; --yes removes them
braid board         # open the board in the browser (127.0.0.1, free port)
braid board --url   # the running board's address with its token (a board started at login)
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
| 3 | `braid limits` only: a provider is at or over its usage threshold (`pause`). Some other commands use 3 for their own answer (`braid wait`). |
| 5 | An unexpected failure. |

```text
error: braids/0002-braids-folder/brief.md: line 4: status must be one of Outline, To Do, In Progress, Done; got: Doing
```

## Running from a checkout

After `npm run build` (see [development](development.md)), run `node dist/cli.js <command>`, for example `node dist/cli.js help`. The braid skills' installer puts a `braid` command on `PATH`; see [getting started](getting-started.md).
