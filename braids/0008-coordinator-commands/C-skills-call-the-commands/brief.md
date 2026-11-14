---
id: '0008/C'
title: "Skills call the commands"
status: In Progress
labels: ["kind:story", "tier:M", "ask:process"]
dependencies: ['0008/B']
order: 30
---

## Goal

The braid skills call the new commands instead of describing their steps, and get shorter.

Expected size: about 150 to 300 changed lines, mostly removals.

## Start here

- `.agents/skills/braid/` (`SKILL.md`, `references/workflow.md`, `references/stop-cases.md`, `assets/brief.md`), `.agents/skills/braid-worker/SKILL.md`.
- The reports of 0008/A and 0008/B.

## Change

- Resuming and "Starting the next item" use `braid status` and `braid next`; Run an item uses `braid start`.
- When a review is still blocking after two fix rounds, the coordinator adds the `ask:quality` label, so the board shows it in Needs You (board decision, 2026-11-13).
- `.github/workflows/ci.yml` and the README drop the `epic/**` trigger and the `backlog/**` skip.
- `test/github.test.ts` ("share one gh read") is flaky: it failed once when the test took 10 s against the 3 s sharing window (0008/A). Make it independent of wall-clock time (inject the clock or the window).

## Already decided

- Keep each rule; replace only the hand-run steps with the command that does them.

## Out of scope

- The skills diet beyond these replacements (0003).

## Acceptance

- [x] The skills name the commands where they did the steps by hand, and are shorter
- [x] The epic/** trigger and backlog/** skip are gone from ci.yml and the README
- [x] The gh-sharing test no longer depends on timing
- [ ] CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

Replace the hand-run steps in the braid skill and workflow with `braid status`, `braid next`, `braid start` and `braid clean`; add the `ask:quality` rule; drop `epic/**` and `backlog/**` from ci.yml and the README; give `github.ts` an injectable clock so the sharing test doesn't depend on timing.
