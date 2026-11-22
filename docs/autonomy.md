# Autonomy presets

An autonomy preset says what braid's agents decide by themselves in a braid and what they bring to you. It is one short Markdown file you can read and edit in a minute. A braid names the preset it runs on; `braid autonomy <number>` prints it.

This page describes the file format, where presets come from and the three presets braid ships. How the agents act on a preset (merging, starting the next item, deciding and logging stop cases, telling you their decisions) is in the braid skill's [autonomy reference](../.agents/skills/braid/references/autonomy.md) and its [stop cases](../.agents/skills/braid/references/stop-cases.md).

## The format

```markdown
---
name: steady
merge: strands
continue: yes
---
# steady: I look at the result and at the big decisions

| Case | Decide yourself when | Ask me when |
| --- | --- | --- |
| architecture | internal shape: a new module or function, ... | an older CLI, file or habit breaks; ... |
| security, data, outward | never | always |
| ... | ... | ... |

When unsure which column applies: ask.
```

Front matter, in the brief's [front matter subset](braids-format.md#briefmd):

| Key | Value |
| --- | --- |
| `name` | The preset's name: lowercase letters and digits joined by single hyphens. It must match the file name (`steady` in `steady.md`). |
| `merge` | What the coordinator merges by itself: `none`, `strands` (strand PRs into the braid branch) or `all` (also the final PR). |
| `continue` | `yes`: the coordinator starts the next item without waiting for your go. `no`: it waits. |

No other key is allowed.

The body has a `# ` heading, then one table with the columns `Case`, `Decide yourself when` and `Ask me when`, then any free lines (a rule such as "Tier L items: always ask"). The rows are the eight [stop cases](../.agents/skills/braid/references/stop-cases.md): `security`, `dependency`, `architecture`, `data`, `process`, `outward`, `scope` and `quality`. Each case appears in exactly one row; one row may name several, separated by commas. Both columns are filled in every row; "never" and "always" are fine.

The table is guidance for the agents, in your words. braid checks its shape (all eight cases are there, once each) and never its meaning.

## Which preset a braid runs on

1. The braid's own: `autonomy: <name>` in its brief, set with `braid new --autonomy <name>` or `braid edit <number> --autonomy <name>` (`--autonomy none` removes it). Strands have no preset of their own.
2. Otherwise the project's default: `autonomy: <name>` in the front matter of `BRAID.md`.
3. Otherwise `careful`.

A braid's exceptions go in its brief's `## Autonomy` section, in a line or two of free text ("architecture: ask for everything in 0031/B"). braid prints that section and doesn't parse it.

A braid a [programme manager](getting-started.md#the-skills) runs has the `PM-run (thread <id>)` line there. braid reads one thing from it, the PM's thread: the coordinator's "ask" cases then go to the PM with `braid ask --to pm` (and its handovers with `braid handover --to pm`), and reach you only when the PM forwards them or doesn't answer in time ([Requests](board.md#requests)).

A braid's preset is set only at your request, in the plan you approve or later in chat.

## Where the text comes from

- braid ships `careful`, `steady` and `free` inside the CLI package.
- A project adds its own as `autonomy/<name>.md` at the repository root. A project file with a shipped name replaces the shipped preset in that project.

`braid autonomy --list` names the presets available in the project and marks the default. Agents read a preset only through `braid autonomy <number>`, never by opening a file, so the shipped presets need no copy in the skills. A change under `autonomy/` is a `process` fact in `braid facts`, so an agent's change to a preset always reaches you.

## `braid autonomy <number>`

```text
Preset: steady
Name from: BRAID.md (the project default)
Text from: shipped with braid

---
name: steady
...
When unsure which column applies: ask.

This braid:
architecture: ask for everything in 0031/B
```

`Name from` is `the brief of <number>`, `BRAID.md (the project default)` or `the built-in default`. `Text from` is `shipped with braid`, `autonomy/<name>.md`, or `autonomy/<name>.md (replaces the shipped one)`. `This braid:` appears only when the brief has a `## Autonomy` section. A name that no preset has is an error (exit 1); a broken project file is an error with its file and line (exit 2).

## Checks

`braid check` reports as errors:

- a preset file under `autonomy/` with an unknown front matter key or value, a name that doesn't match its file, a missing heading or table, wrong columns, an unknown case, or a case that is missing or repeated;
- `BRAID.md` or a brief naming a preset that doesn't exist.

It warns, without failing, about a preset that lets the agents decide `security`, `data` or `outward`: one whose row for them has anything but "never" under "Decide yourself when". Every row is yours to write, and a low-stakes project may delegate them; the warning makes sure it is meant. Project files are always checked for it; a shipped preset only when `BRAID.md` or a brief names it.

## The shipped presets

### careful

You decide every stop case and every merge, as braid did before presets.

- `merge: none`, `continue: no`.
- Every case "never" and "always", except `scope`: up to two strands or one prerequisite of tier S or M by itself, logged on the braid and in the next recap; anything more, new tier L work or a change to the goal or a Completion box goes to you.
- Tier L items: always ask.

It is the default when neither the brief nor `BRAID.md` names a preset.

### steady

You look at the result and at the big decisions.

- `merge: strands`, `continue: yes`.
- `architecture`: internal shape by itself; anything that breaks an older CLI, file or habit, a new command, storage or process, or a contradiction of [the decisions](decisions.md) goes to you.
- `dependency`: dev-only tools and patch or minor bumps by itself; a new runtime dependency, a major bump, a licence change or a paid service goes to you.
- `scope`: absorbs growth within twice the size and up to two S or M strands; a changed goal or Completion box and new tier L work go to you.
- `process`: added or restructured tests and stricter CI by itself; skills, `AGENTS.md`, `CLAUDE.md`, `BRAID.md`, a preset, looser CI and deleted or skipped tests go to you at the final PR.
- `security`, `data`, `outward`: always you.
- `quality`: you, after two fix rounds.
- When unsure which column applies: ask.

### free

The agents decide everything themselves and log it.

- `merge: all`, `continue: yes`.
- Every case "always, and log it" and "never", except `quality`: you, after two fix rounds.

`free` delegates `security`, `data` and `outward`, so `braid check` warns when the project or a braid uses it.

Print any of them in full with `braid autonomy <number>` on a braid that runs on it.

## Pausing for a provider limit

A pause for a provider's usage limit is not part of a preset: every preset pauses and resumes by itself, since it needs no decision. The coordinator runs `braid limits` before each launch and on a 15-minute check, pauses its agents when a window is over its threshold, and resumes them at the reset plus a buffer. In a braid run by a PM the PM pauses every braid on that provider and schedules the one resume; the coordinators launch nothing and tell the PM once. A weekly window is the exception: the agent asks you (`braid ask --kind decision`) whether to wait for the reset or move the role to another provider, whatever the preset. A "hold" is separate: it is your request, recorded with `braid pause <number> --hold "<words>"` and cleared by `braid resume`, and a resume after a limit is no go for held work. A hold outlives a limit pause: `braid pause --provider` refuses a held braid, `braid resume --limit` clears only a limit pause, and the board's own limits pause skips a held braid ([the board](board.md#the-board-pauses-and-resumes)). See [the CLI](cli.md#provider-limits) and [decision D87](decisions.md).

## What the CLI enforces

- `braid accept <id> --head <sha> --merge --preset` is a merge the coordinator makes under the braid's preset. `merge: strands` lets it merge a strand's PR, `all` also a story's and a final PR into `main`, `none` nothing; it also refuses when `ci` in `BRAID.md` is `none`. The refusal names the preset and its `merge` value. Without `--preset`, `--merge` is a merge you asked for.
- Whether a stop case needs you stays the coordinator's judgement against the preset's table; the CLI checks only the `merge` value.
- A decision made under a preset is logged as an ordinary log entry whose text starts with `Decided:` (`braid log <id> "Decided: ..."`). `braid decisions <number> [--since <date or sha>]` lists them, and the recap draft carries them under Decisions, so you read them in one place.
