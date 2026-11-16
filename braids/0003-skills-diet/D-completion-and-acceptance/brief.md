---
id: '0003/D'
title: "Completion and acceptance"
status: In Progress
labels: ["kind:story", "tier:M", "ask:process"]
dependencies: []
order: 15
---

## Goal

Completion and acceptance are two separate things in braid, with names that say so (user, 2026-11-16):

- **Completion**, by the worker, in good faith: it ticks the boxes of what it did and proved.
- **Acceptance**, by the coordinator, once: after the review loop (reviewer, fixes back to the worker, re-check, green CI), `braid accept` records that the item is accepted. Always run from the coordinator's thread.

Why: a brief's "Acceptance" boxes are ticked by the worker today, so it looks as if the worker accepts its own work; and a box that needs someone else (0003/A's "the independent review confirms none is lost") costs a worker round and a CI run only to tick it.

Expected size: about 250 to 400 lines in 12 files, with tests.

## Start here

- `src/commands/done.ts` (the checks, `--merge`, the Done stamp, `--log`), `src/cli.ts`, the brief parsing of box sections (`rg -n "Acceptance|Definition of done" src`).
- `.agents/skills/braid/assets/brief.md`, `braid/SKILL.md`, `braid/references/workflow.md`, `braid/references/auto-mode.md`, `braid-worker/SKILL.md`, `braid-reviewer/SKILL.md`.
- `docs/braids-format.md`, `docs/decisions.md`.

## Change

- **Briefs:** one box section, `## Completion`, replaces `## Acceptance` and `## Definition of done` (their items fold into it). The template says: only what the worker can do and prove; no box that needs the reviewer, the coordinator or the user. The CLI still reads old briefs with `## Acceptance` and `## Definition of done`; existing briefs are not rewritten.
- **`braid accept <id>`** replaces `braid done`, with the same checks, `--head`, `--merge`, `--log` and `--thread`. `braid done` stays as an alias that prints one line naming `braid accept` (the installed skills of other projects still say `braid done`).
- **Recording an acceptance:** the braid log entry gets an "Accepted" line: the head, the review comment's link (or "reviewed by the coordinator" for tier S), and the coordinator's thread. `braid accept` also posts a short PR comment with the same facts.
- **The user's approvals** (mockups, plans, skill wording) are never boxes: `braid ask --kind decision`, the answer recorded with `braid answer --log`. The report's "Decisions" summarises the decisions from the log, so the user finds them in one place.
- **Recording the user's answer first** (`braid/SKILL.md`, "Talking to the user"): replace the loose "Record the answer…" line with one ordered rule: when the user replies to an open request, first `braid answer <id> --log -`, then act; if the reply leads to another question, end with a new `braid ask`. (On 2026-11-16 the coordinator acted on the answers to D's design questions without `braid answer` or a new ask, so the board kept showing the answered question.)
- **Skills and docs:** the worker ticks "Completion"; the coordinator accepts with `braid accept`; every `braid done` in the skills and docs becomes `braid accept`. Keep the skills' word count within +40. `docs/braids-format.md`; a decision in `docs/decisions.md`.

## Already decided

- Section name "Completion"; command `braid accept`; the acceptance in the log and a PR comment; user approvals through requests, then the log, then the report (user, 2026-11-16).
- The `Done` status and lane keep their name.

## Out of scope

- Rewriting old briefs. The reviewer's practices (0003/B).

## Completion

- [x] Briefs use `## Completion`; old briefs with `## Acceptance` / `## Definition of done` still pass `braid accept`'s box check (tested)
- [x] `braid accept` does what `braid done` did, writes the "Accepted" log line and posts the PR comment (tested with a fake gh); `braid done` is an alias with a hint
- [x] The skills, the brief template and the docs say completion for the worker and `braid accept` for the coordinator; word counts before and after in the report
- [x] The ordered "answer first" rule replaces the loose line in "Talking to the user"
- [x] `report.md` has a "Decisions" summary drawn from the log
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. src/commands/done.ts: openBoxes reads `Completion` too (old `Acceptance`, `Definition of done` stay). Rename the command to `accept` (acceptCommand, messages, usage); `braid done` is an alias: cli prints one hint line, then runs accept.
2. Recording: with --log the entry gets an "Accepted" line (head, review link from new `--review <url>` or "reviewed by the coordinator", coordinator thread). Every accepted path also posts a PR comment through gh with the same facts; a failed comment is a warning, not a refusal.
3. Tests: done.test.ts gets Completion + old-brief cases, accept log line, comment via fake gh, alias hint.
4. Skills, brief template, docs, decisions entry; skill word counts before/after. Answer-first rule in braid/SKILL.md. Report with Decisions.
