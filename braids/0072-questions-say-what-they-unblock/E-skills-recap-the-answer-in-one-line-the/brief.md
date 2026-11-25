---
id: '0072/E'
title: "Skills: recap the answer in one line, the PM answers on the record"
status: To Do
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0072/A', '0072/D']
order: 50
---

## Goal

The skills catch up with 0072/A and 0072/D without growing: an agent recaps the user's answer in one line before acting on it, the PM records its own answers on the record, and the coordinator takes a PM's answer from the board's wake instead of recording it.

Expected size: about 40 changed lines in 3 files; net words added to `.agents/skills/`: zero or fewer.

## Start here

- Inbox idea 2026-11-21-t7b8, taken in: "Recap after the user answers. When the user answers a question, the agent first gives a short recap of what it understood from the answer and what it will do next, then continues. A misread answer is caught at once, before the agent acts on it, instead of later in a PR or report. In the user's words: 'when I answer I need a recap of what the agent understood and what it intends to do before him continuing (short)'."
- `.agents/skills/braid/SKILL.md`: "Talking to the user" ("A reply to an open request") and "Launched by a PM" (the PM's reply recorded by the coordinator with `--from pm`).
- `.agents/skills/braid-pm/SKILL.md`: "Answering coordinators" ("the coordinator records it as yours (`--from pm`)", "Relay the user's answer to the coordinator").
- What 0072/A and 0072/D changed (the braid's log).

## Change

- braid skill, "A reply to an open request": after recording it, one line recapping what was understood and what happens next, then act; no wait for a confirmation.
- braid skill, "Launched by a PM": the PM records its answer itself; the coordinator acts on the board's `Wake: … answered by the PM` (or the PM's message) and records nothing; the user's own reply still wins.
- braid-pm skill, "Answering coordinators": answer with `braid answer <code> --from pm --reason "<what>, because <why>, instead of <alternative>" --file -`, which wakes the coordinator; a user's answer given in the PM thread is recorded the same way, from the user. The PM recaps the user's answer in one line too.
- Remove prose these make redundant, so the net word count of `.agents/skills/` doesn't grow (`cat $(git ls-files .agents/skills) | wc -w` before and after; both numbers in report.md).

## Already decided

- Skills don't grow (the programme requirement). The recap doesn't wait for a confirmation and applies to the coordinator and the PM.
- Related to 0060 (Workers as T3 subagents): it changes "Run an item" and the braid-worker skill; stay out of those. If 0060 merged into `main` first, merge `main` in and keep both.
- AGENTS.md: changes to `.agents/skills/` are the user's to merge; the final PR into `main` carries them to the user.

## Out of scope

- "Run an item", the braid-worker skill and launching (0060). Any skill section not named above.

## Completion

- [ ] The braid skill says to recap an answer in one line before acting, and that under a PM the coordinator takes the PM's answer from the board's wake
- [ ] The braid-pm skill says the PM records its own answers and recaps the user's
- [ ] `.agents/skills/` has no more words than before this strand (both counts in report.md)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
