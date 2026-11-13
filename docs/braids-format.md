# The braids/ format

braid keeps its work items in a `braids/` folder at the repository root. A **braid** is a top-level item; a **strand** is one part of a braid, delivered as one PR. This page describes the files and the commands that read and write them; make and change briefs with braid, not by hand. The decisions behind it are in [doc-5](../backlog/docs/doc-5%20-%20New-braid-implementation-plan-draft.md) ("Decided so far").

## Folders and files

```text
braids/
├── 0001-fresh-start/               # a braid without strands
│   ├── brief.md                    # front matter and the brief
│   ├── report.md                   # the report (optional)
│   ├── log-2026-11-13-2831f09b.md  # one log per thread (optional)
│   └── temp/                       # scratch space, ignored by Git
└── 0002-braids-folder/             # a braid with strands
    ├── brief.md
    ├── A-read/                     # strand 0002/A
    │   ├── brief.md
    │   └── report.md
    └── B-create/                   # strand 0002/B
        └── brief.md
```

- A braid folder is `<number>-<slug>`: four digits, then a slug of lowercase letters, digits and single hyphens. Each number is used once.
- A strand folder sits inside its braid and is `<letter>-<slug>`: one capital letter, then a slug. A letter never changes once given; the run order is the `order` field.
- Every braid and strand folder needs a `brief.md`. `report.md` is optional.
- Log files are named `log-<YYYY-MM-DD>-<thread>.md`: the date the log was started and the first 8 letters or digits of the thread id (after its last `:`), or `user` when there is no thread.
- `temp/` folders are ignored by Git (`braids/**/temp/` in `.gitignore`) and by braid. Other files, and folders that don't match these names, are ignored inside a braid. Directly under `braids/`, every folder must be a braid folder; files there are ignored.

## brief.md

A brief starts with front matter between two `---` lines, followed by the brief in Markdown:

```markdown
---
id: '0002'
title: 'Braids folder: the format'
status: In Progress
labels: [kind:story, tier:L]
dependencies: ['0001']
order: 1
delivery: epic
---

## Goal

braid tracks braids from the command line.
```

| Key | Required | Value |
| --- | --- | --- |
| `id` | yes | `0002` for a braid, `0002/A` for a strand. It must match the folder. |
| `title` | yes | Text. |
| `status` | yes | `Outline`, `To Do`, `In Progress` or `Done`. |
| `labels` | no | A list of text. |
| `dependencies` | no | A list of braid or strand ids (`0001`, `0002/A`). |
| `order` | no | A whole number: the run order among a braid's strands. Strands without one run last, by letter. |
| `delivery` | no, braids only | `epic` (the default): strands merge into an epic branch, then one PR into `main`. `main`: each strand's PR goes into `main`. A strand can't set it. |

Front matter is a small subset of YAML, and braid rejects anything outside it:

- One `key: value` per line. Values are text: `0001` stays `0001`. Quote a value with `'…'` (a doubled `''` is a quote) or `"…"` (JSON escapes); a plain value may not start with `[ ] { } & * ! | > % @ #` or a backtick.
- A list is inline, `[a, 'b c']`, or a key with nothing after the colon followed by indented `- item` lines. `[]` is an empty list. List items are quoted the same way as values, so a quoted item may hold commas and escaped or doubled quotes.
- Blank lines and lines starting with `#` are skipped. Unknown or repeated keys are errors.

The body after the front matter is free Markdown. Its `## ` headings divide it into sections (headings inside code fences don't count); `braid view` prints the body as it is.

## Log entries and checkpoints

A log file holds one thread's entries, oldest first. The first `braid log` of a thread creates `log-<date>-<thread>.md` with the date (UTC) of that call; later entries go to the same file even on a later day. Each entry is a heading with the UTC time, a blank line and the text; entries are separated by a blank line:

```markdown
## 2026-11-13 14:05Z

Read the reader code; the writer must re-parse.

## 2026-11-13 15:30Z checkpoint

Done: parser. Next: the `braid log` command. Open: none.
```

A **checkpoint** is an entry whose heading ends in ` checkpoint`: a place a thread can be resumed from, written with `--checkpoint`. Its text says what is done, what comes next and what is open. The last checkpoint in a log is the current one.

## Commands

- `braid list`: every braid by number, with its strands indented in run order: id, status, order (`-` if none) and title.
- `braid view <id>`: a braid (`0002`, or `2`) or a strand (`0002/A`) with its fields, folder, report, log files, its strands or its braid, and then the brief's body.
- `braid new <title>`: a new braid with the next free number, its folder (the slug comes from the title, or `--slug`) and a `brief.md` with status `To Do`.
- `braid strand new <braid> <title>`: a new strand in that braid with the next free letter.
- `braid edit <id>`: changes the front matter. `--status`, `--title`, `--labels a,b` (replaces the list; `''` empties it), `--dep 0001,0002/A` (replaces the list; each id must exist), `--order <n>` or `--order none`, `--delivery epic|main` (braids only). `--labels` and `--dep` may be repeated. Changing the title keeps the folder name.
- `braid brief <id> <section>`: sets the `## <section>` part of the body, replacing that section or adding it at the end. The text comes from `--file <path>`, `--file -` (standard input) or `--text <text>`; CRLF becomes LF. It may not hold `## ` headings or an unclosed code fence.
- `braid log <id> <text>`: appends an entry to this thread's log in the braid or strand folder and stages the file with `git add`; it never commits. `--thread <id>` names the thread (the file uses the first 8 letters or digits of the part after the last `:`, so `mcp:launch:5d80964a…` and `mcp:2831f09b-f69a-…` give `5d80964a` and `2831f09b`; a shorter id is an error); without it the entry goes to the `user` log. `--checkpoint` marks the entry as a checkpoint. The text is the argument, `--text <text>`, `--file <path>` or `--file -` (standard input); CRLF becomes LF.
- `braid report <id>`: writes `report.md` from `--file <path>`, `--file -` or `--text <text>`, replacing an existing report; with `--append` the text is added after a blank line (a new file if there is none).

`braid new` and `braid strand new` also take the `braid edit` options, except `--title`. braid writes front matter in one form: ids in single quotes, other text in double quotes with JSON escapes, `labels` and `dependencies` always present, and `delivery` on every braid.

A number or letter is never given twice. Before choosing one, `braid new` and `braid strand new` run `git fetch --all` (when the repository has a remote; `--no-fetch` skips it, and a failed fetch stops the command). Taken are the folders in the working tree and every braid or strand folder that ever existed under `braids/` in the history of any branch, local or remote, including deleted ones. The next number or letter is one above the highest taken; gaps are not filled.

braid finds the repository from the current folder: the nearest folder upwards that holds `braids/` or `.git`. A repository without `braids/` has no braids.

A malformed brief or folder stops the command with exit code 2 and an error naming the file, with the line where there is one:

```text
error: braids/0002-braids-folder/brief.md: line 4: status must be one of Outline, To Do, In Progress, Done; got: Doing
```

Usage errors, such as an unknown id, exit with code 1.
