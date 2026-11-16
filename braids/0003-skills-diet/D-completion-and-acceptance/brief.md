---
id: '0003/D'
title: "Completion and acceptance"
status: Outline
labels: ["kind:story", "tier:M", "ask:process"]
dependencies: []
order: 15
---

## Goal

Completion and acceptance are two separate things in braid, with names that say so (user, 2026-11-16):

- **Completion**, by the worker, in good faith: it ticks the boxes of what it did and proved.
- **Acceptance**, by the coordinator, once: after the review loop (reviewer, fixes back to the worker, re-check, green CI) the coordinator records that the item is accepted. Always run from the coordinator's thread.

Why: a brief's "Acceptance" boxes are ticked by the worker today, so it looks as if the worker accepts its own work; and a box that needs someone else (0003/A's "the independent review confirms none is lost") costs a worker round and a CI run only to tick it.

## Known so far

- Today: the worker ticks "the boxes it proved" (`braid/references/workflow.md`, `braid-worker/SKILL.md`); `braid done` refuses unticked boxes and is run only by the coordinator, after review and green CI; the coordinator never commits on a worker's branch except the Done stamp.
- Direction: the brief's "Acceptance" section gets a completion name (for example "Done when"); briefs carry no box that needs someone other than the worker; acceptance is one coordinator step that records who accepted, at which head and with which review (`braid done`, or an alias such as `braid accept`).
- Old briefs with "## Acceptance" keep working.

## Open, to plan with the user

- The section name, and whether "Definition of done" merges into it.
- One acceptance command: rename `braid done`, an alias `braid accept`, or a separate step before Done; where acceptance is recorded (log, brief front matter, PR comment).
- How the user's own approvals (mockups, plan) fit: requests and answers, not boxes?
- Size and files: CLI (`done.ts`, brief parsing), `assets/brief.md`, the worker and coordinator skills, `docs/braids-format.md`, a decision.
