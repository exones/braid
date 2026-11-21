# 0054 report

## What changed

- New skill `.agents/skills/braid-pm/`: `SKILL.md`, the plan file template `assets/plan.md`, and `agents/openai.yaml`. The PM takes a goal, drafts braid sketches with order, dependencies and parallel lanes, settles the product-shaping questions with the user (at most three rounds), then launches one coordinator thread per braid (as the braid skill's "Plan" step 0 does), up to a limit (default 2) after an overlap check. It keeps `pm/<slug>.md` on its own branch `pm/<slug>` (own worktree, committed and pushed on every change, never merged). It answers coordinators as the user's proxy by reversal cost, sends a periodic digest, replans, holds, checks results live with a checker subagent before and after a merge into `main`, and resumes from the plan file and the coordinator threads' titles.
- The exception line every PM-run braid gets on the `free` preset is quoted once in the skill: security, data and outward always ask; architecture, dependency and scope ask when expensive to reverse; a merge into `main` waits for the PM's go (its live check).
- `.agents/skills/braid/SKILL.md`: a "Launched by a PM" section. Requests are still opened on the board and also sent to the PM thread with their options; under a PM the coordinator never uses the question tool and never asks the user in chat, it ends its turn and the PM's reply (or the user's answer on the board) wakes it. The PM's reply counts as the user's; a new braid is a proposal to the PM; Done, stopped and waiting-for-the-user's-merge are messaged to the PM. Without a PM nothing changes.
- `test/pester/Install-Skills.Tests.ps1` names `braid-pm` and checks its link to the braid skill resolves where installed (`Install-Skills.ps1` already installs every `braid-*` folder, so it needed no change). `docs/getting-started.md` and `README.md` list it. `docs/decisions.md`: D80 and a log line.

## Why

The user, acting as CTO, wants to hand over a goal and hear only about decisions that shape the product, instead of coming back for every braid under `steady`.

## Validation

- `npm run verify` passed (docs gate, 434 tests).
- `scripts/Test-Pester.ps1` passed (22 tests, including the install test naming `braid-pm`).
- `braid check` OK.

## Open

- The skill has not been run for real yet; the first PM run will show whether the digest triggers and the checker's task text need tuning.

## Decisions

- `allow_implicit_invocation: false` for `braid-pm` in `agents/openai.yaml`: the PM launches threads and merges on its own, so it starts only when asked by name.
- The checker's title is `🧭 <repo> pm check: <number> <title>`, so the board's title parser doesn't take it for a braid thread.
- Digest triggers: three braids finished, five PM decisions, or nothing can run until the user acts.

For later items: a `braid pm` view on the board (out of scope here).
Needs the user: process: this braid changes skills (`braid-pm` new, `braid` gains "Launched by a PM"); the user asked for it in the plan and merges it into `main`.
