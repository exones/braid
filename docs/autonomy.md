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

A braid a [programme manager](getting-started.md#the-skills) runs has the `PM-run (thread <id>)` line there. braid reads one thing from it, the PM's thread: the coordinator's "ask" cases then go to the PM with `braid ask --to pm` (and its handovers with `braid handover --to pm`), and reach you only when the PM forwards them, hasn't answered in 20 minutes (60 for a handover), or its thread is gone (archived, failed or unknown to T3) ([Requests](board.md#requests)).

A braid's preset is set only at your request, in the plan you approve or later in chat.

## Where the text comes from

- braid ships `careful`, `steady` and `free` inside the CLI package.
- A project adds its own as `autonomy/<name>.md` at the repository root. A project file with a shipped name replaces the shipped preset in that project.

`braid autonomy --list` names the presets available in the project and marks the default. Agents read a preset only through `braid autonomy <number>`, never by opening a file, so the shipped presets need no copy in the skills. A change under `autonomy/` is a `process` fact in `braid facts`, so an agent's change to a preset always reaches you.

## `braid autonomy <id>`

The id is a braid number, or a strand id (`0031/B`), which prints its braid's preset.

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

## The base decides

A PR can't loosen the preset it is judged by: `braid autonomy` reads it as `origin/<base>` has it, as last fetched. The base is `main` for a braid number, and the braid branch for a strand id (`main` with `delivery: main`). The preset files, the `BRAID.md` default and the braid's brief come from there, and the output adds `Base: origin/<base>`. When the checkout or the braid's branch says something else, a `Differs here:` line names its preset; it counts once it is on the base. Without that ref (no remote, nothing pushed) the checkout is read.

`braid accept --merge --preset` fetches the PR's base and merges only when both the base's preset and the checkout's allow the merge, so a looser preset waits for the base and a stricter one holds at once.

One gap is left: a goal's braid brief, and a story's, are not on `main` before their own PR into it. Their `autonomy` and `## Autonomy` are then read from the brief that PR brings (the `Base:` line says so); only the preset files and the project default are protected.

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

A pause for a provider's usage limit is not part of a preset: every preset pauses and resumes by itself, since it needs no decision. The running board does it: over a threshold it pauses the braid's agents through a steering thread and resumes them at the reset plus a buffer ([the board](board.md#the-board-pauses-and-resumes), D90). The coordinator runs `braid limits` only before a launch and, over a threshold, launches nothing on that provider, says so once and ends its turn; a PM-run coordinator also tells its PM. Coordinators and PMs answer the board's pause and resume messages and keep no check task and no resume task. Without a running board nothing pauses and you say go on. Two cases are the exception, whatever the preset: a weekly window, where the board shows the braid in Needs You until the reset, and a pause that failed (the steering thread didn't complete it, so agents may still run), where it shows Needs You so you can open the steering thread or pause by hand. Moving a role to another provider is your edit of `BRAID.md`. A "hold" is separate: it is your request, recorded with `braid pause <number> --hold "<words>"` and cleared by `braid resume`, and a resume after a limit is no go for held work. A hold outlives a limit pause: `braid pause --provider` refuses a held braid, `braid resume --limit` clears only a limit pause, and the board's own limits pause skips a held braid ([the board](board.md#the-board-pauses-and-resumes)). See [the CLI](cli.md#provider-limits) and [decision D90](decisions.md).

## What the CLI enforces

- `braid accept <id> --head <sha> --merge --preset` is a merge the coordinator makes under the braid's preset. `merge: strands` lets it merge a strand's PR, `all` also a story's and a final PR into `main`, `none` nothing; it also refuses when `ci` in `BRAID.md` is `none`. The refusal names the preset and its `merge` value. Without `--preset`, `--merge` is a merge you asked for.
- After merging a strand, the coordinator starts the next item without waiting for the braid branch's CI. It reads that CI in one short `braid wait <number> --timeout 0.25` call when it checks the next strand's PR, and before opening the final PR; a red braid branch gets a fix strand first. The final PR's own CI is watched, so nothing reaches `main` on a red braid branch ([decision D91](decisions.md)).
- A project's `merge-gate:` in `BRAID.md` ([decision D102](decisions.md)) runs before every merge `braid accept --merge` makes, a strand's into its braid branch and any into `main` unless `merge-gate-on` narrows it. It runs under every preset and when you ask for the merge; no preset or flag skips it, and a failing gate (exit code other than 0, or no answer in 9 minutes) refuses the merge, changing nothing. Merges made elsewhere (GitHub's button) are the project's branch protection's to guard.
- With `reviewer-with-bots: L-only` in `BRAID.md` ([decision D104](decisions.md)), a tier S or M item the review bots reviewed gets no braid reviewer: the bots' review, with every thread resolved by the worker, is its independent review for a merge under a preset. The default, `always`, keeps the braid reviewer. The CLI doesn't check it: picking the review is the coordinator's step.
- Whether a stop case needs you stays the coordinator's judgement against the preset's table; the CLI checks only the `merge` value.
- A decision made under a preset is logged as an ordinary log entry whose text starts with `Decided:` (`braid log <id> "Decided: ..."`). Your answers and the PM's (with its reason) are on [the request record](braids-format.md#the-request-record), recorded with `braid answer <code>`. `braid decisions <id> [--since <date, time or sha>]` lists both, the `Decided:` entries and the answered requests, and the recap draft carries them under Decisions, so you read them in one place.
