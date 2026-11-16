---
id: '0003/B'
title: "Reviewer: researched review practices"
status: In Progress
labels: ["kind:story", "tier:M", "ask:process"]
dependencies: ['0003/D']
order: 20
---

## Goal

The `braid-reviewer` skill finds more of what matters, using practices from well-regarded code-review skills and prompts, and stays short (user's PR #50 review).

Expected size: about 30 to 80 lines in 2 files.

## Plan

Research review prompts online, pick four practices, add them as short bullets under Check in the reviewer skill, name the sources in report.md.

## Start here

- `.agents/skills/braid-reviewer/SKILL.md` after 0003/A, and `braid/references/stop-cases.md`.
- Recent review comments on PRs #96 to #102, for what the reviewer caught and missed.

## Change

- Research well-regarded code-review skills and prompts online; pick what improves braid's reviews (for example edge cases and failure paths, testing the tests, a confidence bar for findings).
- Add it to `braid-reviewer/SKILL.md`, short; name the sources in the report.

## Already decided

- No change to the blocking bar or the stop cases.

## Out of scope

- The coordinator's and worker's skills.

## Acceptance

- [x] The reviewer skill adds researched practices; the sources are named in the report
- [x] Word count before and after in the report

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
