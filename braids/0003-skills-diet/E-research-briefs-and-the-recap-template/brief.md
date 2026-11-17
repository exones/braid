---
id: '0003/E'
title: "Research briefs and the recap template"
status: To Do
labels: ["kind:story", "tier:S", "ask:process"]
dependencies: []
order: 40
---

## Goal

Two small skill fixes found during 0003, put into it by the user (2026-11-17).

Expected size: about 10 to 30 lines in 3 files.

## Start here

- `.agents/skills/braid/assets/brief.md` (the brief template), `.agents/skills/braid/SKILL.md` (the recap template, "Talking to the user"), `braid-worker/SKILL.md` (spikes).
- `src/commands/facts.ts` or wherever `braid handover` / `braid recap` build the recap draft, to see what it already prints.
- Why research: `../B-reviewer-researched-review-practices/report.md` (the first, thin version) and `research.md` (the redo).

## Change

- **Research briefs:** when an item includes research (a spike, or "research X" in a story), its brief asks for a sources file in the item folder (each source: link, how it was read, what it says, adopted or not and why), says how wide to look, and names that file in Completion. One or two lines in the brief template; the worker's spike line points to it. (0003/B's first research named four sources, one not read, because the brief asked only to "name the sources".)
- **Recap template:** `braid/SKILL.md`'s recap template repeats what the draft from `braid handover` already prints (about 110 words, found by 0003/A's worker). Keep only what the coordinator adds to the draft; point to the draft for the rest. Context first still holds.
- Word counts before and after in the report.

## Out of scope

- Any other skill change.

## Completion

- [ ] The brief template asks research items for a sources file, how wide to look, and names it in Completion
- [ ] The recap template no longer repeats the handover draft
- [ ] Word counts before and after in the report
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open, decisions
