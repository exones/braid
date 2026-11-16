# Report: reviewer, researched review practices

## What changed

`.agents/skills/braid-reviewer/SKILL.md`, Check section: four bullets added, none touching the blocking bar or the stop cases.

- Failure paths: empty or missing input, errors, second or concurrent run, Windows against Linux.
- Test the tests: would each new test fail on the old code; assertions that can't fail; risky paths untested.
- What the diff left out: callers of a changed interface, docs and decisions made stale.
- A confidence bar: report findings about 90% sure of, each with the input and the wrong result; weaker suspicions go to Suggestions as "unverified" or get a quick run; skip style and preexisting problems; one entry for a repeated problem.

## Why

These are the practices that recur in published review prompts and match what PRs #96 to #102 needed: #96's blocking finding was a lost-update race (a failure path a second writer exposes), and #98's suggestions were commands and docs left stale (what the diff left out).

## Sources

- Claude Code `code-review` plugin (marketplace page and third-party mirrors; official text not retrieved): findings scored 0 to 100, only 80 and above posted, nothing posted when none remain. https://claude.com/plugins/code-review
- Agent Patterns, "Signal over volume in AI review": confidence floor of about 90%, silence when nothing clears it, cluster repeated issues, skip style and intentional patterns; also the caveat that a clean result is not proof. https://agentpatterns.ai/code-review/signal-over-volume-in-ai-review/
- Cubic, "learnings from building AI agents": narrow, specific checks cut false positives by 51% (vendor figure). https://www.cubic.dev/blog/learnings-from-building-ai-agents
- Search results on false positives (codeant.ai, zenml.io summaries): explicit criteria beat self-reported confidence alone, which is poorly calibrated, so the bar asks for a concrete input and wrong result, not a number only.

Not adopted: parallel scoring agents and dismissal tracking (need machinery braid doesn't have; out of scope).

## Word count

`braid-reviewer/SKILL.md`: 447 before, 547 after (+100). Total of the lines added is 4 bullets (3 in Check plus the bar), well inside the brief's 30 to 80 lines.

## Validation

`npm run verify` (gate) run before the PR; see the PR checks. The installer test reads the reviewer skill only for installation, not wording.

## Open

Wording is the user's to review.

For later items: none

Needs the user: process: the braid-reviewer skill changes (`.agents/skills/braid-reviewer/SKILL.md`); the user reviews the wording.
