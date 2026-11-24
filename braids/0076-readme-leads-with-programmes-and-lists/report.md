# 0076 report

## What changed

`README.md` (145 → 156 lines) now opens, after the tagline and board picture, with "Start with a programme": what a programme is, a concrete example goal, the four steps the PM takes, and how to start one (`$braid-pm <goal>`). One feature list follows ("What braid does", 12 lines, each linking to its doc or section): reviewed PRs, review, questions and requests, autonomy presets, wakes/reminders/nudges, pausing before limits, merge gate and `ci: all`, live checks, the board (lanes, Open thread, programmes panel, phone, Tailscale, login service), the ideas inbox, resume from files, Claude/Codex/Cursor. "Why braid", the walk-through, the parts (the PM added), quick start, the CLI, docs index, contributing and licence are kept; the old long list's repetition is folded into the new lines. No images changed.

## Why

The user, 2026-11-24: programmes should lead the README, with every feature listed.

## Validation

Every claim checked against `docs/board.md` (requests, wakes, reminders, nudges, provider limits, programmes, inbox, Open thread, Tailscale, run at login), `docs/getting-started.md`, `docs/autonomy.md`, `docs/cli.md` and `braid-pm` SKILL.md; every anchor exists. Gate: `npm run verify`.

## 0075

0075's final PR (and its docs PR #301) isn't in `main` yet. The README names no `braid accept` or Done behaviour, so nothing in it depends on 0075. `origin/main` was merged in (nothing new at the time); if 0075 lands before this merges, merge `main` again.

## Docs

No other docs affected.

For later items: none.
Needs the user: none.
