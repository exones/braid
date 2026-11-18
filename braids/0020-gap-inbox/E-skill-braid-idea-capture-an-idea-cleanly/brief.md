---
id: '0020/E'
title: "Skill braid-idea: capture an idea cleanly"
status: In Progress
labels: ["kind:story", "tier:L", "ask:process"]
dependencies: ['0020/A']
order: 35
---

## Goal

The user can drop an idea so that it isn't forgotten. They open a thread, write one sentence prefixed with `$braid-idea`, and a small skill turns it into a clean, readable idea on `braid-inbox`. The skill understands the idea, asks only when it really can't, and restates it well. The idea is a seed for future braids: there may be one, several or none, and nothing says when.

Expected size: about 80 to 150 lines: a new `.agents/skills/braid-idea/` (SKILL.md, perhaps a template), plus docs.

This item's wording and the idea's shape are the user's to choose. Start with a proposal: the draft SKILL.md, plus three ideas the skill would write from realistic one-sentence inputs. Make one input clear, one vague, and one that touches existing braids. Stop and wait for the user's verdict, and build only after they approve (workflow, "Converge loop").

## Start here

- `../brief.md`: the two kinds, and why ideas never expire and are never proposed for review.
- `../A-inbox-entries-braid-note-and-braid-inbox/report.md`: `braid note --idea` and the idea format.
- `.agents/skills/braid-worker/SKILL.md` and `.agents/skills/braid-reviewer/SKILL.md`: the size and shape of a small braid skill, and its front matter `description`.
- `.agents/skills/braid/references/setup.md`: what a skill says when `braid` is missing or too old.
- `scripts/Install-Skills.ps1` and `scripts/Test-DocsGate.ps1`: every `braid-*` folder is installed and link-checked.
- `README.md`: the skills list.

## Change

- `.agents/skills/braid-idea/SKILL.md`. Its `description` says to use it when the user prefixes a message with `$braid-idea`, or asks to note down an idea for later, and not for planning or running braids. The steps:
  1. Check that `braid inbox` runs; if not, follow the setup reference and stop.
  2. Read the sentence. Look only as far into the repository as the idea needs to be stated correctly: `braid list`, the names of the braids it touches, and the files it names.
  3. If the idea can't be stated without guessing, ask one short question; otherwise don't ask.
  4. Write the idea with `braid note --idea --file -`: a title; the idea restated clearly in a few sentences; why it matters, if the user said or implied it; the related braids or files; open questions; and the user's own words, quoted.
  5. Show the user the entry id and the text, and stop.
- The idea stays short and readable: no plan, strands, tiers or estimates. It is a seed, not a brief.
- `braid note` commits and pushes the idea to `braid-inbox` itself, so the skill never commits in its checkout.
- `README.md` lists the skill; `docs/decisions.md` gets a line on why it is a separate skill.

## Already decided

- A separate small skill, so the main skills stay lean (user, 2026-11-18).
- Ideas never expire and are never proposed for review; only the user drops one or asks for it to become braids.
- No board capture for now (user, 2026-11-18).

## Failure modes and regression tests

- The docs gate (`npm run verify`) checks the new skill's links; it must pass.
- `scripts/Install-Skills.ps1` installs `braid-idea` with the other skills: check it with the existing installer tests, adding a case if none covers a new `braid-*` folder.
- An older `braid` without `braid inbox`: step 1 catches it.

## Out of scope

- The coordinator's use of ideas (0020/D). Turning an idea into a braid, which is the `braid` skill's planning.

## Completion

- [ ] The proposal (draft SKILL.md and three sample ideas) shown to the user and approved before building, with the verdicts in the log
- [ ] `.agents/skills/braid-idea/SKILL.md` written as approved: it checks for `braid inbox` first and writes ideas through `braid note --idea`
- [ ] The installer installs `braid-idea`; covered by a test
- [ ] `README.md` and `docs/decisions.md` describe it
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
