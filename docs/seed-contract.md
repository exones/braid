# Seed CLI contract

Updated: 2026-11-03. Schema: 1. Executable: `braid`. State directory: `.braid/`.

This is the behavior backlog B, C, and D implement for the 0.1 seed. Schema 1 is a manual epic ledger. It records an epic's intended outcome and the manual progress of its stories, tasks, and spikes. A later execution run is an attempt to deliver work; schema 1 has no run, attempt, agent, or dispatch record.

The machine ledger and the Markdown epic files are separate. Ledger commands read and write only the files named in [Storage](#storage). They leave `epics/`, checkpoints, and reports untouched. Narrative files stay human-edited. `.braid/state.json` is authoritative for ledger status.

## Toolchain

| Choice | Pin | Source checked 2026-11-03 |
| --- | --- | --- |
| Node.js | Active LTS 26, `engines.node` `>=26.13.0 <27`. GitHub Actions `node-version: "26"`. | [Release schedule](https://github.com/nodejs/Release/blob/main/schedule.json): 26 entered LTS on 2026-10-28, maintenance 2027-10-20, end 2029-04-30. [Release index](https://nodejs.org/en/about/previous-releases) lists 26 as LTS. [latest-v26.x](https://nodejs.org/dist/latest-v26.x/) lists `node-v26.13.0` dated 2026-10-28. |
| PowerShell | `pwsh` 7.6 LTS, minimum 7.6.0. Workflow jobs set `shell: pwsh`. | [PowerShell support lifecycle](https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle?view=powershell-7.6): 7.6 LTS, released 2026-03-18, supported through 2028-11-14 on .NET 10. The 7.4 LTS and 7.5 stable lines end support on 2026-11-10. |
| Package | One package. `name` `@exones/braid`, `version` `0.1.1`, `private` false, `type` `module`. `bin` maps `braid` to the compiled entry. Repository is `https://github.com/exones/braid.git`. | npm is the selected registry. Registry `latest` is `0.1.0`. This source is the unpublished `0.1.1` candidate. |
| Product code | Strict TypeScript, ESM source, compiled JavaScript. Product tests use `node:test`. | Matches `docs/decisions.md`. Pester is absent unless a later task adds PowerShell behavior that TypeScript tests cannot host. |
| Version probe | `braid --version` prints the version shipped inside the installed package. | Required so D's packed executable works outside the source checkout. |

Node 24 and 22 were still supported LTS lines on 2026-11-03. Node 24 entered maintenance on 2026-10-20. Node 27 was Alpha. The seed pins Active LTS 26 and keeps that pin when a workstation or runner image is older. `scripts/Verify.ps1`, exposed as `npm run verify`, is the local and Actions gate. It runs typecheck, build, and tests, and it stops on the first failed native command.

`braid` ledger commands perform no network calls and do not invoke Git. Evidence text is stored as text. The CLI does not check it against a commit, a test run, or a review.

## Delivery split

| Backlog | Implements | Stops before |
| --- | --- | --- |
| B | Package, toolchain pin, `braid --help`, `braid --version`, and a non-zero failure for every command that B has not implemented. Smoke checks cover those three behaviors and create no `.braid/` directory. | `init`, `new`, `status`, and `story`. |
| C | The ledger commands, storage rules, and scenarios below. Help then lists the full surface and includes the sentence `Completion is a manual record, not gate acceptance.` | Dispatch, messaging, scheduling, and any command that sets an arbitrary state. |
| D | The same C scenario through the packed `braid` executable in a clean directory, including a root path that contains a space and a second process. | Publishing, tagging, and starting stage 2. |

Until C lands, `braid init` and the other ledger commands fail as unknown commands. B's help describes the commands B implements.

## Command grammar

Flags may appear before or after positionals. A valued flag accepts `--flag value` and `--flag=value`. Argument checks finish before any ledger directory is created. Tests pass an argument array to the executable.

`--help` or `-h` with no command, or with a known command, prints help to stdout, writes nothing, and exits 0. Help for a known subcommand describes that command. `--help` with an unknown command word exits 1 with the unknown-command error. When help is absent, `--version` or `-v` prints one stdout line, `braid 0.1.1`, writes nothing, and exits 0, including when other arguments are present. With no arguments, behavior matches `--help`.

```text
braid [--root <dir>] [--help|-h] [--version|-v]
braid [--root <dir>] init
braid [--root <dir>] new <epic-id> --title <text> --outcome <text>
braid [--root <dir>] status [epic-id] [--json]
braid [--root <dir>] story add <epic-id> <item-id> --title <text> [--kind story|task|spike] [--note <text>] [--next <text>]
braid [--root <dir>] story start <epic-id> <item-id> [--note <text>] [--next <text>]
braid [--root <dir>] story block <epic-id> <item-id> --reason <text> [--note <text>] [--next <text>]
braid [--root <dir>] story complete <epic-id> <item-id> --evidence <text> [--note <text>] [--next <text>]
```

`--root` defaults to the process working directory. `--json` is valid only on `status`. The command family for every work item is `story`. `--kind` selects the record kind and defaults to `story`. `braid task`, `braid spike`, `braid story resume`, `braid story cancel`, and `braid story set` are unknown commands.

There is one epic-selection rule: the epic id is an explicit argument. Schema 1 stores no current-epic pointer.

### Identifiers and text

| Input | Rule |
| --- | --- |
| Epic id | `^[A-Z][A-Z0-9]{0,20}-[0-9]{3}$`. `DEMO-001` and `BRAID-001` match. |
| Item id | `^[A-Z][A-Z0-9]{0,15}$`. Unique inside its epic. The same id may exist in another epic. |
| `--kind` | `story`, `task`, or `spike`. Immutable after add. |
| `--title`, `--outcome` | Required, trimmed, 1–200 characters for a title and 1–2000 for an outcome. |
| `--reason`, `--evidence`, `--note`, `--next` | Trimmed. Reason, evidence, and note are 1–2000 characters. Next is 1–500. |
| Control characters | U+0000–U+001F and U+007F are rejected, including newlines and tabs. |
| Length | JavaScript string length after trim. |

Item ids are data fields. They are not path segments.

### Exit codes

Success text goes to stdout. Errors and warnings go to stderr. Expected errors contain no stack trace. An unexpected failure prints `error: unexpected failure` and exits 5.

| Code | When | State files |
| --- | --- | --- |
| 0 | Success, including init of an existing schema-1 ledger. | Unchanged on idempotent init. |
| 1 | Usage, unknown command, invalid identifier or text, missing root, root is not a directory, or the ledger directory is not initialized. | Unchanged. `--root` is not created. |
| 2 | The command is well formed and the ledger rejects it: unknown epic or item, duplicate epic or item, or a transition the table does not allow. | Byte-for-byte unchanged. |
| 3 | Persisted ledger files are missing, invalid, linked, ahead of state, or an incomplete event trail/partial line blocks a mutation. | Byte-for-byte unchanged. |
| 4 | The lock is still unavailable after the wait. | Byte-for-byte unchanged. |
| 5 | The process cannot write, or the event append fails after a successful state replace. | See [Writes](#writes-and-failure-boundaries). |

Stable error lines:

```text
error: unknown command: <words>
error: unexpected argument: <value>
error: unknown option: <flag>
error: duplicate option: <flag>
error: missing required argument: <name>
error: missing required option: <flag>
error: invalid epic id
error: invalid item id
error: invalid option: <flag>
error: root does not exist
error: root is not a directory
error: .braid must be a real directory inside the project root
error: not initialized; run braid init
error: epic <id> already exists
error: item <id> already exists
error: epic <id> not found
error: item <id> not found
error: cannot start item <id> from <state>
error: cannot block item <id> from <state>
error: cannot complete item <id> from <state>
error: unsupported schema version <value-or-missing>; supported schema 1; state preserved
error: state file is invalid JSON; preserved for diagnosis
error: state file is invalid; preserved for diagnosis
error: state file missing; not recovered automatically
error: .braid is not an empty ledger directory; state preserved
error: state file must be a regular file inside .braid
error: events file must be a regular file inside .braid
error: temporary state file is not a regular file; preserved
error: events log is invalid; state preserved
error: events log has a partial trailing line; state preserved
error: events are ahead of state; preserved for diagnosis
error: events lag state; mutation refused; state preserved
error: state lock held at .braid/lock
error: cannot write state
error: state updated to revision <n> but the event append failed; not rolled back
```

Unknown-command stderr has a second line: `Run braid --help.`

`init` is the only command that creates `.braid`. `new`, `status`, and `story` leave an absent `.braid` untouched and exit 1 with `error: not initialized; run braid init`. After `lstat` shows that `.braid` is a real directory and `state.json` is absent, those commands exit 3 with `error: state file missing; not recovered automatically`. A link is rejected before that lookup.

### Success stdout

Each success prints one line and a newline:

| Command | Stdout |
| --- | --- |
| `init` of a new ledger | `initialized schema 1` |
| `init` of schema 1 | `already initialized schema 1` |
| `new` | `created epic <epic-id>` |
| `story add` | `added <kind> <item-id> backlog` |
| `story start` from backlog | `started <kind> <item-id> in-progress` |
| `story start` from blocked | `resumed <kind> <item-id> in-progress` |
| `story block` | `blocked <kind> <item-id>` |
| `story complete` | `completed <kind> <item-id> manual` |

`<kind>` is `story`, `task`, or `spike`.

## Work items and transitions

Schema 1 states are `backlog`, `in-progress`, `blocked`, and `done`.

The Agile labels `ready`, `in-review`, and `cancelled` have no schema 1 state and no command. `story start` from `backlog` is the start transition. Resume is `story start` from `blocked`. A task or a spike uses the same states and the same `story` commands; `kind` distinguishes it. A review task is `kind: task`. Marking it `done` records a manual note and leaves the separate review gate unchanged.

| Command | From | To | Result |
| --- | --- | --- | --- |
| `story add` | item absent | `backlog` | Creates the item. |
| `story start` | `backlog` | `in-progress` | Starts it. |
| `story start` | `blocked` | `in-progress` | Resumes it. `blockedFrom` was `in-progress`. |
| `story block` | `in-progress` | `blocked` | Requires `--reason`. Sets `blockedFrom` to `in-progress`. |
| `story complete` | `in-progress` | `done` | Requires `--evidence`. Sets `acceptance` to `manual`. |

Every other pair exits 2. In particular, a second `start` while `in-progress` exits 2, `complete` from `blocked` or `backlog` exits 2, and `block` from `backlog`, `blocked`, or `done` exits 2. The operator completes a blocked item by resuming it first. Repeating `add` or `new` for an existing id exits 2.

`new` creates one epic and no items. The outcome text is immutable because schema 1 has no epic-edit command.

Omitted `--next` stores:

| Command | `nextAction` |
| --- | --- |
| add | `Start item <item-id>.` |
| start, including resume | `Continue item <item-id>.` |
| block | `Resolve: <reason>` when that generated text is at most 500 characters; otherwise `Resolve block; see block reason.`. The full reason is preserved in `blockReason` and the event's `reason`. |
| complete | `None. Manual record only.` |

An explicit `--next` replaces that default. Omitted `--note` stores null on add and keeps the existing note on later commands. An explicit `--note` replaces it. Resume clears `blockReason` and `blockedFrom` in the state file. The block event retains the reason. Completion stores the evidence string and `acceptance: "manual"`. The only acceptance value schema 1 can store is `manual`.

`init` is the idempotent command. A second `init` against valid schema 1 exits 0 and rewrites nothing, including when the event log is unhealthy. `init` is not a repair tool. `new` and `story` are not idempotent.

## Status

`status` takes the same lock as a mutation, reads state, and writes nothing. It deletes neither temp nor backup files.

Without an epic id, stdout is:

```text
schema 1
revision <n>
epics <count>
```

Zero epics end there. Otherwise one blank line follows, then one line per epic in stored order:

```text
<epic-id> backlog=<n> in-progress=<n> blocked=<n> done=<n> <title>
```

With an epic id:

```text
schema 1
revision <n>
epic <epic-id>
title <title>
outcome <outcome>
```

Zero items add a blank line and `no items`. Otherwise a blank line separates the header and each item:

```text
<item-id> <kind> <state> <title>
  next: <nextAction>
```

These indented lines follow `next`, and only when their value is present:

```text
  note: <note>
  blocked-from: in-progress
  reason: <reason>
  evidence: manual record; not gate acceptance
  evidence-note: <evidenceNote>
```

The evidence label is that fixed sentence. Done output uses it for every done item. Status wording for a manual record is `manual record; not gate acceptance`.

`--json` prints one JSON document to stdout. List shape:

```json
{
  "schemaVersion": 1,
  "revision": 0,
  "eventsRevision": 0,
  "eventsLag": false,
  "epics": [
    {
      "id": "DEMO-001",
      "title": "Example",
      "counts": {
        "backlog": 1,
        "in-progress": 0,
        "blocked": 0,
        "done": 0
      }
    }
  ]
}
```

Detail shape uses `epic` in place of `epics`. `epic.items` contains the stored item objects. `eventsRevision` is the greatest revision among complete event lines, `0` when the log is empty or absent at state revision `0`, and `null` when the log file is absent while state revision is greater than `0`. `eventsLag` is true when that revision is below `state.revision` or the log file is absent past revision `0`.

Warnings go to stderr and leave status exit 0 only when state is valid and every complete event revision is less than or equal to the state revision. A complete event revision above the state revision exits 3 with the ahead error; it is not a warning, and a partial tail does not change that result. A missing event file prints the missing-file warning and no other event warning. A present file that is not ahead prints the partial-line warning when its tail is partial, then the lag warning when its greatest complete revision is below the state revision:

```text
warning: events file missing; not repaired
warning: events log ends with a partial line; ignored for display
warning: events lag state (state revision <n>, last event revision <m>); not repaired
```

Status exits 3, with empty stdout, when state is unreadable, complete events are invalid (including duplicate or noncontiguous revisions), or any complete event revision is above the state revision. On the exit 0 path, a partial last line is ignored for display and still warned about. A mutation that sees a partial last line exits 3 before it writes. A mutation with an otherwise valid contiguous event prefix behind state also exits 3, with `error: events lag state; mutation refused; state preserved`. It cannot append a higher revision that hides a missing event.

## Storage

```text
<resolved-root>/.braid/state.json
<resolved-root>/.braid/events.jsonl
<resolved-root>/.braid/state.json.tmp
<resolved-root>/.braid/lock/
```

`state.json` is a regular file. `events.jsonl` is a regular file. `lock` is a directory. `state.json.tmp` is a transient regular file. Schema 1 creates no backup file and none of `run.json`, `config.json`, `stream.json`, inbox, outbox, or checkpoint files. Git ignores `.braid/` and does not ignore epic evidence. The superseded pre-release directory `.crew/` is not a ledger path. The CLI does not create, read, alias, migrate, or delete it. This unreleased correction does not move old disposable ledgers.

The resolved root is `realpath` of `--root`. `.braid` is `path.join(root, ".braid")`. Before following `.braid`, `lstat` must show a real directory. A symbolic link or a Windows junction exits 1 on init and 3 when a later command finds the ledger path linked. `state.json`, `events.jsonl`, and `state.json.tmp` must each be a regular file when present. The CLI does not open a linked path to read or write ledger contents.

UTF-8 without a BOM. Automated checks decode piped stdout and stderr as UTF-8.

### State document

Top-level key order: `schemaVersion`, `revision`, `epics`.

```json
{
  "schemaVersion": 1,
  "revision": 0,
  "epics": []
}
```

The writer emits `JSON.stringify(value, null, 2)` plus a final newline, with keys inserted in the order below. `revision` is an integer greater than or equal to 0. It starts at 0. Each committed `new` or `story` command increments it by 1. Rejected commands and failures before replacement leave it unchanged. An event append failure after replacement exits 5 with state committed, as described below.

Epic key order: `id`, `title`, `outcome`, `createdAt`, `updatedAt`, `items`. Item key order: `id`, `kind`, `title`, `state`, `note`, `blockedFrom`, `blockReason`, `evidenceNote`, `acceptance`, `nextAction`, `createdAt`, `updatedAt`.

Timestamps use `Date.prototype.toISOString` (`YYYY-MM-DDTHH:mm:ss.sssZ`). One command uses one timestamp for every field it updates. Epic `createdAt` stays fixed. Epic `updatedAt` changes when the epic is created and when one of its items changes. Arrays keep insertion order.

A reader accepts schema version integer `1` only. Any other version, a missing version, a non-integer revision, an unknown or missing key, a duplicate id, a value outside the sets below, or a failed cross-field rule exits 3 and preserves the files.

| Field | Accepted values |
| --- | --- |
| `kind` | `story`, `task`, `spike` |
| `state` | `backlog`, `in-progress`, `blocked`, `done` |
| `note` | `null` or a non-empty string |
| `blockedFrom` | `in-progress` while blocked; otherwise `null` |
| `blockReason` | non-empty string while blocked; otherwise `null` |
| `evidenceNote` | non-empty string while done; otherwise `null` |
| `acceptance` | `manual` while done; otherwise `null` |
| `nextAction` | non-empty string |
| timestamps | `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$` |

### Events

`events.jsonl` is an append-only log of accepted mutations. It is not a source of truth, a projection input, or a replay store. The seed has no replay command and no event bus. Readers do not rebuild state from events.

Each accepted mutation appends one JSON object and a `\n` line ending, including on Windows. Key order: `schemaVersion`, `revision`, `at`, `action`, `epicId`, `itemId`, `kind`, `from`, `to`, `note`, `nextAction`, `reason`, `evidenceNote`. `schemaVersion` is `1`. `revision` equals the state revision just written. `action` is `epic.new`, `story.add`, `story.start`, `story.block`, or `story.complete`. Item events use the `story.` prefix for every kind. Unused fields are JSON `null`. `story.add` uses `from: null` and `to: "backlog"`. `epic.new` uses a null item id and kind.

Init writes an empty, zero-byte event file and no init event. A missing event file at revision 0 is an empty log. The first mutation may create the file by appending its line. A missing event file at revision greater than 0 makes status warn and exit 0; mutations refuse with the lag error. Complete event revisions must be positive integers, appear in order, and form the contiguous prefix `1..N` with no repeats or gaps. A complete event whose `schemaVersion`, keys, action, or revision shape is wrong makes status and mutation exit 3. After structural parsing, check for revisions above state (ahead error), then check prefix continuity (invalid-events error). A valid prefix whose final revision is below state makes status warn and mutations refuse. The seed does not repair gaps or replay events.

A file that does not end in `\n` has a partial trailing line. Status ignores that tail and warns. A mutation exits 3 before replacing state.

### Init

1. Resolve `--root`. Missing or non-directory roots exit 1 and are not created.
2. `lstat` `.braid`. A link exits 1. A non-directory exits 1. An absent path is created as a real directory.
3. Acquire the lock.
4. Re-read under the lock. Valid schema 1 exits 0 with `already initialized schema 1` and writes nothing.
5. Invalid existing state exits 3 and writes nothing.
6. Absent `state.json` with any directory entry other than `lock` exits 3. Temp files, operator backups, and event files count as entries.
7. An otherwise empty ledger writes revision 0, then an empty event file, and prints `initialized schema 1`.

Two concurrent init processes both exit 0 and leave one schema-1 ledger.

### Writes and failure boundaries

Every `init`, `new`, `status`, and `story` command that reaches the ledger acquires `.braid/lock` by creating that directory. The first try is immediate. Retries are every 100 ms until 5000 ms after the first try. The directory's existence is the lock. The process removes it on every exit path after acquiring it. A process that ends while holding the lock leaves the directory in place. Schema 1 does not inspect process ids, steal a lock, or delete a stale lock. An operator may remove `.braid/lock` only after confirming that no `braid` process is using that root. That cleanup is outside the CLI.

Under the lock, a mutation reads `state.json` and the event file, validates them, and only then builds the next document. A second process therefore bases its write on the latest accepted document.

Replacement procedure when `state.json` already exists and the mutation's state and event checks have passed:

1. Remove a leftover regular `state.json.tmp` only after validation succeeds. An invalid ledger keeps its diagnostic files. Never remove operator backups.
2. Write the complete next document to `state.json.tmp`, flush it with a file sync, and close its handle.
3. Rename `state.json.tmp` directly over `state.json` in the same directory/filesystem. Do not first delete or rename the live state file away. [Node's rename API](https://nodejs.org/api/fs.html#fsrenameoldpath-newpath-callback) supports overwriting the destination. If the platform cannot replace it, fail rather than using an unlink-then-rename fallback.
4. Append and flush the event line.
5. Release the lock in cleanup.

The first write of a missing `state.json` flushes `state.json.tmp` and renames it onto the absent destination. The implementation does not truncate `state.json` in place.

If replacement fails before committing, exit 5 with `error: cannot write state`, preserve the previous state and event files, and leave any temp file for diagnosis. There is no backup dance or automatic recovery. C must prove successful overwrite and an injected pre-commit replacement failure on its supported environments.

If the event append fails after step 3, the command exits 5 with `error: state updated to revision <n> but the event append failed; not rolled back`. State stays at the new revision. If the append wrote no complete event, status warns about the lag (and any partial tail), and later mutations refuse; they must not hide the gap by appending a higher revision. If a full event was appended but its sync reported failure, status may show matching revisions; the command still reports exit 5 and makes no durability claim. Inspect status before deciding whether a command needs retrying: its state may already be committed. Reconciliation is a manual operator action outside this CLI, after preserving the diagnostic files.

The next command preserves diagnosis in these planted layouts:

| Layout | Result |
| --- | --- |
| Valid `state.json` plus `state.json.tmp` | Reads `state.json`. A later successful mutation may remove the temp file. |
| Missing or invalid `state.json`, with temp or backup present | Exit 3. The CLI does not promote either file and does not delete it. |
| Partial trailing event line | Status warns and shows state. Mutation exits 3 with state unchanged. |
| Event revision above the state revision | Exit 3 with files unchanged. |
| Contiguous event prefix behind state or missing event file past revision 0 | Status warns and displays committed state; mutation exits 3 without writes. |
| Duplicate or skipped complete event revision | Status and mutation exit 3 without writes; do not hide the history defect. |

These outcomes are the seed's consistency target, which C must implement and test. Schema 1 has no crash-recovery command. A kill or power loss during rename/sync is untested; same-directory replacement is not a guarantee of filesystem durability. C proves the table, replacement failure preservation, the lock timeout, and successful serialization. C records a permissions failure only on a platform where denying write access needs no elevation.

## Acceptance scenarios

`<root>` is a temporary directory whose path contains a space. Each invocation is a separate process. File comparisons use the raw bytes of `state.json` and `events.jsonl`.

### 1. Normal lifecycle

Given an absent `.braid` directory, when separate processes run `init`, `new DEMO-001 --title "Demo ledger" --outcome "Track one story by hand"`, `story add DEMO-001 S --title "Ship the ledger" --kind story --note "operator note"`, `story start DEMO-001 S --next "Write the ledger."`, `story block DEMO-001 S --reason "Waiting on review notes"`, `story start DEMO-001 S`, and `story complete DEMO-001 S --evidence "Reviewed the manual record"` in that order, then each command exits 0. The outputs are `initialized schema 1`, `created epic DEMO-001`, `added story S backlog`, `started story S in-progress`, `blocked story S`, `resumed story S in-progress`, and `completed story S manual`. A following `status DEMO-001` shows state `done`, the note, next `None. Manual record only.`, and `evidence: manual record; not gate acceptance`. The finished root contains `.braid/` and does not contain `.crew/`. State, events, the temporary state file, and the lock stay under `.braid/`.

The same add/start/block/resume/complete sequence succeeds for `story add DEMO-001 T --kind task --title "Prepare the package"` and for `story add DEMO-001 K --kind spike --title "Check a limit"`.

### 2. Resumption in a new process

Given scenario 1's epic after `story start` and before `block`, when a new process runs `status DEMO-001 --json`, then it exits 0 and reports item `S` as `in-progress`, note `operator note`, and next action `Write the ledger.`. The revision and event revision match.

### 3. Invalid transition

Given item `S` is `done`, when a new process runs `story start DEMO-001 S`, then it exits 2, stderr is `error: cannot start item S from done`, and both ledger files are byte-for-byte unchanged. Given a new item still in `backlog`, `story complete` exits 2 and leaves the files unchanged. Given an `in-progress` item, a second `story start` exits 2 and leaves the files unchanged.

### 4. Repeated init and new

Given a ledger that already contains `DEMO-001` and item `S`, when a new process runs `init`, then it exits 0, prints `already initialized schema 1`, and both ledger files are byte-for-byte unchanged. When that process instead runs `new DEMO-001 --title "Other" --outcome "Other"`, it exits 2, stderr is `error: epic DEMO-001 already exists`, and both files are unchanged. An existing item's title, note, state, and evidence remain.

### 5. Safe paths

Given any root, when item id `..`, epic id `DEMO-001/../NO`, or epic id `DEMO-001\NO` is submitted, then the command exits 1 and creates no ledger file. When `--root` names a missing path, the command exits 1 and that path remains absent. When `.braid` is a symbolic link or a Windows directory junction, `init` exits 1 and the link target's marker file is unchanged. When a `.crew` directory is already present, the command leaves that directory and its contents unchanged and does not use it as the ledger. A successful command creates or changes files only in the storage list for that root.

### 6. Preservation of accepted data

Given `state.json` contains `"schemaVersion": 2` and otherwise readable bytes, when `story add` runs, then it exits 3, stderr begins `error: unsupported schema version 2`, and the file bytes are unchanged. Given a valid ledger and a `state.json.tmp` whose text contains `"revision": 999`, when `status` runs, then it reports the revision from `state.json`. Given a valid ledger whose event file ends in `{` with no newline, when `status` runs, it exits 0 and warns; when `story add` runs, it exits 3 and `state.json` is unchanged. Given `.braid/lock` already exists, when `story add` runs, then it exits 4 after the 5000 ms budget, before 15 seconds have elapsed, and `state.json` is unchanged. Given two processes both exit 0 after adding different item ids, the stored document contains both items and its revision has increased by 2.

Given a committed state whose event log is a shorter contiguous prefix (including a missing log past revision 0), when status runs, then it warns about lag and shows committed state; when a mutation runs, then it exits 3 and both files remain unchanged. Given an event sequence that skips or repeats a revision, status and mutations exit 3. Given a replacement failure before commit, the previous state and events remain unchanged; an event-append failure after replacement must instead report that state is already committed. These failure paths require focused fault-injection or planted-layout tests in C; no product implementation is claimed by this spike.

## Outside schema 1

Schema 1 stops at the manual ledger. Stage 2 and later own T3 dispatch, execution runs, `.braid/run.json`, automated gate decisions, messaging, scheduling, lock stealing, replay, and automatic promotion/recovery of temp or operator backup files. A human or agent completion recorded here is a manual record. Independent verification remains a separate gate that names the revision it checked.

## Coordinator acceptance corrections

2026-11-03: replaced the worker's rename-away/backup sequence with direct same-directory replacement, preserving C's atomic-replacement requirement. Required contiguous event prefixes and refusal of mutations behind state, so a later write cannot hide a missing event. These are correctness corrections before implementation; they do not add a new command, replay subsystem, or recovery feature. The original worker report remains the record of its submission; `epics/braid/001-seed/reports/A-review.md` records acceptance of this corrected contract.
