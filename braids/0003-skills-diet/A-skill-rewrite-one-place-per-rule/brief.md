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

- [x] `analysis.md` written and an option chosen by the user
- [x] `braid/SKILL.md` at most 2,800 words; auto mode in `references/auto-mode.md` (2,954 words: the user said on 2026-11-16 that about 3,000 is fine and not to squeeze further for the count)
- [x] Each rule stated once; `rules.md` lists every removed or rewritten rule, and the independent review confirms none is lost
- [x] Every place where the skills ask the user for input applies the context-first rule
- [x] `stop-cases.md` exists once and the installed skills still resolve it
- [x] Word and line counts of every changed skill file, before and after, in the report

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Phase 1 (done): `analysis.md`; the user chose "Dedupe plus plain wording".
2. `braid/references/auto-mode.md`: the whole of auto mode, including the pieces scattered in `SKILL.md` and `workflow.md`.
3. `braid/SKILL.md`: the coordinator's procedure only. Ownership, Done, branches, tiers and who merges are stated in `workflow.md` and named here by link. The dense paragraphs (waiting and wakes, accept and hand over, commit points, finish, resuming) become short steps. "Talking to the user" holds the open-request rule, the new context-first rule, the question format and the recap.
4. `workflow.md`: the one place for items, writers, Done, branches, tiers, who merges, CI evidence and the converge loop; failure rows that repeat a skill rule become pointers.
5. `assets/brief.md`: prose folded into the command examples and a `report.md` template.
6. One `stop-cases.md` in `braid/references/`; worker and reviewer link to it. The docs gate accepts links between `braid` and `braid-*` skills and drops the same-file check; fixture, Pester test, README and D29 follow.
7. Worker and reviewer: links, the context-first line, report templates; the worker keeps its own action lines (a role reads only its skill).
8. `rules.md`: every removed, merged or rewritten rule with old text, new text or place, and why. `docs/decisions.md`: the decisions and the reason. Report with counts and every contradiction resolved.
