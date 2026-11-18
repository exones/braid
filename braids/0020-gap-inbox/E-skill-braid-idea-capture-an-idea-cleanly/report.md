# Report: 0020/E Skill braid-idea: capture an idea cleanly

## What changed

- `.agents/skills/braid-idea/SKILL.md` (36 lines), as the user approved on three samples. `$braid-idea <a sentence>` runs these steps:
  1. Check `braid inbox --ideas --no-fetch`. If `braid` is missing or too old, follow the setup reference and stop.
  2. Read only `braid list`, the touched briefs and the named files.
  3. Ask one question only if the idea can't be stated without guessing.
  4. Write the idea with `braid note --idea --file -` (never a commit in the checkout).
  5. Show the id and the text, then stop.

  The idea's shape: a title, the idea restated (when it touches an existing braid, it says what it adds), `Why:`, `Related:`, `Open questions:`, and the user's words quoted, with their answer after "then:" if a question was asked. Empty sections are left out, and there's no plan, tiers or estimates.
- `test/pester/Install-Skills.Tests.ps1`: the real-repository install now expects `braid-idea` too, and checks that its link to `braid/references/setup.md` resolves where it is installed.
- `README.md` (the skills sentence and the Skills row), `docs/getting-started.md` (the skills list) and D56 in `docs/decisions.md`, with its log line.

## Why

The user wanted a place to drop an idea without it being forgotten. Capture is a separate small skill so the main skills stay lean.

## Validation

- Proposal: the draft and three sample ideas (a clear input, a vague one with one question, and one touching 0012/0009). The user approved them; the verdict is in the log.
- `pwsh -NoProfile -File scripts/Test-Pester.ps1`: 20 passed. The install test lists `braid-idea` and checks its setup link. It fails on a ref without the skill, because it compares the whole folder list.
- `npm run verify` passes. It includes the docs gate, which checks the new skill's links.
- Not tried end to end: the installed `braid` comes from `main` and has no `braid note` yet (the braid's "During this goal").

## Open

- The first real capture can happen only after this goal is merged and installed.

For later items: none.
Needs the user: process: a new skill, `braid-idea`, in `.agents/skills/`; the user merges skill changes (AGENTS.md).
