---
id: '0034/C'
title: "Preset files: the format, three presets and braid autonomy"
status: To Do
labels: ["kind:story", "tier:L", "ask:architecture"]
dependencies: []
order: 30
---

## Goal

Give autonomy a form the user can read and edit in a minute: a preset is one Markdown file, a braid names the preset it runs on, and one command prints the preset a braid has. This strand builds the format, the three presets braid ships, and the commands that read them; nothing merges or decides differently yet.

Expected size: about 380 lines in 12 files.

## Start here

- `.agents/skills/braid/references/stop-cases.md`: the eight keys the table's rows are.
- `src/braids/brief.ts` and `src/braids/write.ts`: how `delivery` and `related` are read and written (braids only, written only when set).
- `src/commands/edit.ts`: `--delivery` and `--related` on `braid new` and `braid edit`.
- `src/braids/check.ts`: errors and warnings of `braid check`.
- `src/commands/coordinate.ts`, `ciChecks`, and `src/commands/board.ts`, `readStartContext`: the two places that read `BRAID.md` today.
- `src/commands/facts.ts`, `PROCESS`: the paths that count as a `process` change.
- `docs/braids-format.md`: the format's document, and the note under `related` about older CLIs.

## Change

- The preset format. Front matter: `name`, `merge` (`none`, `strands` or `all`) and `continue` (`yes` or `no`: start the next item without a go). Body: a heading, one table with the columns `Case`, `Decide yourself when` and `Ask me when`, and free lines after it. Each of the eight stop-case keys appears in exactly one row; a row may name several keys, separated by commas.
- Three presets shipped inside the CLI package:
  - `careful`: `merge: none`, `continue: no`; every case "never" and "always", except `scope`, whose row is today's mandate; the line "Tier L items: always ask". It is what braid does today without auto mode.
  - `steady`: the text below.
  - `free`: `merge: all`, `continue: yes`; every case "always, and log it" and "never", except `quality` ("never" and "always, after two fix rounds").
- A project's own presets: `autonomy/<name>.md` at the repository root. One with a shipped name replaces the shipped one.
- `src/braids/brief.ts`, `write.ts`, `edit.ts`: an optional `autonomy: <name>` field on braids, not strands, written only when set; `--autonomy <name>` on `braid new` and `braid edit` (`none` clears it). `braid view` shows `Autonomy: <name>`.
- `BRAID.md`: an optional `autonomy: <name>` key, the project's default. Without it the default is `careful`.
- `src/commands/autonomy.ts` (new), wired in `src/cli.ts`: `braid autonomy <number>` prints the preset's name, where the name comes from (the brief, `BRAID.md` or the built-in default), where the text comes from (the project file or the shipped one), the preset text, and then the brief's `## Autonomy` section when it has one, under `This braid:`. `braid autonomy --list` names the presets available here.
- `src/braids/check.ts`: an error for a preset file with an unknown key or value, a missing or repeated case, or a brief or `BRAID.md` naming a preset that doesn't exist; a warning, one line, for a preset whose `security`, `data` or `outward` row has anything but "never" under "Decide yourself when".
- `src/commands/facts.ts`: `autonomy/` joins `PROCESS`.
- Tests for each of the above; `docs/autonomy.md` (new): the format and the three presets; `docs/braids-format.md`, `docs/cli.md`; `docs/decisions.md`: the format and why.

`steady`:

```markdown
---
name: steady
merge: strands
continue: yes
---
# steady: I look at the result and at the big decisions

| Case | Decide yourself when | Ask me when |
| --- | --- | --- |
| architecture | internal shape: a new module or function, a flag or optional field that older versions ignore, a refactor inside the item's files | an older CLI, file or habit breaks; a new command, storage or process; it contradicts docs/decisions.md |
| dependency | a dev-only tool, a patch or minor bump | a new runtime dependency, a major bump, a licence change, a paid service |
| scope | absorb within twice the size; up to two S or M strands | the goal or a Completion box changes; new tier L work |
| process | tests added or restructured, CI made stricter | skills, AGENTS.md, CLAUDE.md, BRAID.md, a preset, CI loosened, tests deleted or skipped: ask at the final PR |
| security, data, outward | never | always |
| quality | never | always, after two fix rounds |

When unsure which column applies: ask.
```

## Already decided

- The table is guidance for the agents; the CLI checks its shape (the cases are all there) and never its meaning.
- A brief with `autonomy` can't be read by an older CLI (`unknown key`), as with `related`; say so in `docs/braids-format.md`. That is the `architecture` stop of this strand.
- The brief's `## Autonomy` section holds a braid's exceptions in free text, a line or two ("architecture: ask for everything in 0031/B"); the CLI prints it and doesn't parse it.
- No ceiling and no `auto: allowed`: what a project permits is what its presets and `BRAID.md` say, and those are the user's files.
- Agents read a preset through `braid autonomy`, never by opening the file, so the shipped ones need no copy in the skills.
- The `auto` label and `auto: allowed` keep working until 0034/E and 0034/F replace them; don't touch them here.

## Out of scope

- Any change to `braid accept`, recaps or the skills (0034/D, 0034/E).
- Editing this repository's `BRAID.md` (0034/F).
- A `plan` key, a preset per strand, and showing the preset on the board.

## Completion

- [ ] `braid autonomy <number>` prints the right preset for a brief that names one, for the `BRAID.md` default and for neither, and a project file replaces a shipped preset of the same name (tests)
- [ ] `braid new` and `braid edit` set and clear `autonomy`; a brief without it is written byte for byte as before (test)
- [ ] `braid check` reports the errors above and warns, without failing, about a preset that delegates `security`, `data` or `outward` (tests)
- [ ] The three presets ship with the built package and pass `braid check`'s own rules (test)
- [ ] `braid facts` flags a change under `autonomy/` as `process` (test)
- [ ] `docs/autonomy.md` describes the format and the three presets; the format and CLI docs name the field and the command
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
