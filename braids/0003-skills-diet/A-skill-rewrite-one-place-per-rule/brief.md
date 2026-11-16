---
id: '0003/A'
title: "Skill rewrite: one place per rule"
status: In Progress
labels: ["kind:story", "tier:L", "ask:process"]
dependencies: []
order: 10
---

## Goal

The braid skills state each rule once, in words the user can follow, and are shorter where that costs no clarity (user, 2026-11-16).

Expected size: net fewer lines; about 300 to 600 lines changed in 8 files, plus the analysis and the rule list.

## Start here

- `.agents/skills/braid/SKILL.md`, `references/workflow.md`, `references/stop-cases.md` (three copies), `assets/brief.md`, `assets/braid-md.md`.
- `.agents/skills/braid-worker/SKILL.md`, `.agents/skills/braid-reviewer/SKILL.md`; `test/` and `scripts/` checks that read the skills (the stop-cases same-file check).
- History: the old 0003 brief in `git log -p braids/0003-skills-diet/brief.md` (PR #50 leftovers).

## Change

Phase 1, analysis (stop for the user before editing any skill):

- `analysis.md` in this folder: every rule of the skills listed once with where it lives today (file, section), duplicates and contradictions marked, and what auto mode alone accounts for.
- How far it can shrink before it loses clarity: two or three options (for example "move and dedupe only", "plus tighter wording"), each with the expected word count and what the user would find harder or easier to follow. A recommendation.
- Then stop and send it to the coordinator; the user chooses.

Phase 2, the rewrite (the option chosen):

- Auto mode to `braid/references/auto-mode.md`; `SKILL.md` keeps one line saying when to read it.
- Each rule in one place across `SKILL.md` and `workflow.md` (who merges what, branches, tiers, review); the other points to it.
- `assets/brief.md`: prose folded into its command examples.
- One `stop-cases.md`, in `braid/references/`; `braid-worker` and `braid-reviewer` point to `../braid/references/stop-cases.md` (the installer installs the three skills together); the same-file check goes away.
- Recheck the PR #50 leftovers (old brief) and fix those still true.
- New rule, one place ("Talking to the user"), and the worker and reviewer report templates follow it: every question or decision put to the user (a stop, a recap's "Needs the user", a `braid ask` text, a plan question) starts with one or two short sentences of context, enough to answer at a skim without reading anything above; it names the thing, not a list number (user, 2026-11-16: the user had to ask back about almost every input braid asked for).
- `rules.md` in this folder: every rule removed, merged or rewritten, with its old text, its new text or place, and why. Nothing removed without a line there.

## Already decided

- Worker: Fable 5.2 (`claude-fable-5-2`), medium effort (user, 2026-11-16).
- `braid/SKILL.md` at most 2,800 words, a ceiling; clarity for the user wins over the count.
- The user reviews the analysis before the rewrite, and the wording in the PR.

## Out of scope

- New behaviour. The reviewer's review practices (0003/B).

## Acceptance

- [ ] `analysis.md` written and an option chosen by the user
- [ ] `braid/SKILL.md` at most 2,800 words; auto mode in `references/auto-mode.md`
- [ ] Each rule stated once; `rules.md` lists every removed or rewritten rule, and the independent review confirms none is lost
- [ ] Every place where the skills ask the user for input applies the context-first rule
- [ ] `stop-cases.md` exists once and the installed skills still resolve it
- [ ] Word and line counts of every changed skill file, before and after, in the report

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
