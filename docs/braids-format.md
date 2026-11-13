# The braids/ format

braid keeps its work items in a `braids/` folder at the repository root. A **braid** is a top-level item; a **strand** is one part of a braid, delivered as one PR. This page describes the files `braid list` and `braid view` read. The decisions behind it are in [doc-5](../backlog/docs/doc-5%20-%20New-braid-implementation-plan-draft.md) ("Decided so far").

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
- Log files are named `log-<YYYY-MM-DD>-<thread>.md`: the date the log was started and the first 8 letters or digits of the thread id, or `user` when there is no thread.
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
- A list is inline, `[a, 'b c']`, or a key with nothing after the colon followed by indented `- item` lines. `[]` is an empty list.
- Blank lines and lines starting with `#` are skipped. Unknown or repeated keys are errors.

The body after the front matter is free Markdown. Its `## ` headings divide it into sections (headings inside code fences don't count); `braid view` prints the body as it is.

## Commands

- `braid list`: every braid by number, with its strands indented in run order: id, status, order (`-` if none) and title.
- `braid view <id>`: a braid (`0002`, or `2`) or a strand (`0002/A`) with its fields, folder, report, log files, its strands or its braid, and then the brief's body.

braid finds the repository from the current folder: the nearest folder upwards that holds `braids/` or `.git`. A repository without `braids/` has no braids.

A malformed brief or folder stops the command with exit code 2 and an error naming the file, with the line where there is one:

```text
error: braids/0002-braids-folder/brief.md: line 4: status must be one of Outline, To Do, In Progress, Done; got: Doing
```

Usage errors, such as an unknown id, exit with code 1.
