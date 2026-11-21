---
id: '0056'
title: "Every braid keeps the docs current"
status: In Progress
labels: ["kind:story", "tier:L", "ask:process"]
dependencies: []
related: ['0054', '0036', '0035']
delivery: epic
---

## Goal

Every braid leaves the project's documentation true: public docs (README, getting started, the CLI reference, help text) and internal docs (development notes, the decisions record, format and workflow references). Today only the user's decisions must be documented ("Decided means documented" in the worker skill) and the reviewer only glances at docs around the diff, so whether a braid updates the docs depends on the worker. This makes it a fixed step, at the level the project chooses in `BRAID.md`: each item's PR keeps the docs it touches true, every goal ends with a docs strand that brings the whole set up to date before the final PR, or both; or docs are updated only on demand.

Expected size: about 130 lines in 9 files (the skills and templates, `BRAID.md`, the docs that describe the workflow).

From the user's idea `2026-11-19-qkie` "Each braid keeps the project's docs current" and the user's request of 2026-11-21: "every braid should have ... one of the last stages is the documentation update because if it changes something it has to go there and update the relevant docs both internal and public".

## Start here

- `.agents/skills/braid-worker/SKILL.md`: "Decided means documented" under Work, and Deliver step 0 (report.md).
- `.agents/skills/braid-reviewer/SKILL.md`: "Read around the diff" (docs made stale) and the blocking bar.
- `.agents/skills/braid/assets/brief.md`: the Completion section every brief copies.
- `.agents/skills/braid/SKILL.md`: "Plan" steps 4 to 6 (shape and drafting), "Finish" (a goal's final PR).
- `.agents/skills/braid/references/workflow.md`: "Tiers" and "Checks and reports".
- `.agents/skills/braid/assets/braid-md.md` and `BRAID.md`: the project facts file, where a project names its docs. Check how `src/braids/` reads `BRAID.md` front matter, so a new key is accepted (or ignored) and doesn't break `braid check` or the board.
- `docs/getting-started.md`, `docs/braids-format.md`, `README.md` ("Documentation" table), `docs/decisions.md` (latest is D79; 0054 takes D80).

## Change

- `BRAID.md` and `assets/braid-md.md`: a `docs` key with an `update` setting and the project's docs in two groups, public and internal (here: public `README.md`, `docs/getting-started.md`, `docs/cli.md`, `docs/board.md`, `docs/autonomy.md`, the CLI's help text; internal `docs/development.md`, `docs/decisions.md`, `docs/braids-format.md`, `docs/roadmap.md`, `docs/npm-distribution.md`). Without the lists, agents take `README.md` and `docs/`.
- The `update` setting (the user, 2026-11-21: "on every braid or on demand or on every strand"):
  - `strand`: each item's PR keeps its docs true (the Completion box below), in every strand and story.
  - `braid`: every goal ends with the docs strand below, and a story (a braid of one PR) carries the docs box; strands don't.
  - `both`: the two together. This repository sets `both`.
  - `on-demand`: neither; docs change only when a brief or the user asks for it (decisions the user made are still documented, as today).
  - Without the setting: `braid`.
- Worker skill: "Decided means documented" becomes "Docs stay true": in the same PR, update every doc from `docs` that the change makes untrue or incomplete, and the decisions record for what the user decided; report.md names the docs updated, or says none were affected. Docs that need the user's go (`AGENTS.md`, `CLAUDE.md`, `BRAID.md`, skills) are proposed under `For later items:`, not edited, unless the brief allows it.
- Brief template: a Completion box in every brief that `update` calls for (every brief with `strand` or `both`; a story with `braid`; none with `on-demand`), `Docs from BRAID.md docs that this change makes untrue are updated, or report.md says none are affected`.
- Reviewer skill: check the docs from `docs` against the change; a doc the PR leaves untrue fails that box, so it is blocking.
- Coordinator skill, "Plan": the coordinator reads `docs.update` and drafts the briefs to match; with `braid` or `both` every goal's plan ends with a docs strand (`Docs: <braid title>`, `kind:task`, tier S unless it edits agent instructions, ordered last, depending on every other strand). Its brief: read the braid branch's whole diff against `main` and bring the docs from `docs` up to date as a whole (overview and README, getting started, roadmap status, the decisions record, help text), and list each doc checked with updated or unchanged. A story has no docs strand; its Completion box covers it. The plan may drop the docs strand only with a reason the user sees in the plan.
- Coordinator skill, "Finish": before the final PR, the docs strand is Done (it is a strand like the others, so "every strand is Done" already holds it; say so in one line if needed).
- `workflow.md`: the docs strand in one line where goals and strands are described.
- `docs/getting-started.md` (and the `BRAID.md` section there): the `docs` key, its `update` values, and what braid does with docs. `docs/decisions.md`: one decision with its reasons and a log line.
- This braid follows its own rule: its PR updates every doc it makes untrue.

## Already decided

- Two levels, chosen per project with `docs.update` (`strand`, `braid`, `both`, `on-demand`; default `braid`; here `both`): each PR keeps its docs true (the Completion box), and a goal ends with a docs strand for the docs as a whole, which a single strand can't see.
- The docs strand is planned by the coordinator as an ordinary strand; no CLI command creates it.
- Only this repository's docs count for a braid in this repository; another project names its own in its `BRAID.md`.
- Related to 0054 (braid-pm, In Progress on `braid/0054-braid-pm-a-project-manager-that-runs-the`): both edit `.agents/skills/braid/SKILL.md` and `docs/decisions.md`. 0054 adds a "Launched by a PM" section; this braid edits "Plan" and "Finish". Whichever merges second merges `main` in and takes the next decision number.
- Related to 0036 (Coordinator polish, Outline on `main`): both change the coordinator skill; 0036 plans on top of whichever merged.
- Related to 0035 (Delivery into main, Outline on `main`): with `delivery: main` the docs strand is still the last strand, its PR into `main`; 0035 keeps that when it is planned.

## Out of scope

- A CLI check that a goal has a docs strand, or that docs changed.
- Fixing docs that are already stale today (for example inbox idea `2026-11-20-gj9u` on D47, D57, D66 and D68); the first docs strands will catch such things.
- Docs of other projects that use braid.
- A per-braid override of `docs.update` (a brief field); a plan that needs another level says so in the plan.

## Completion

- [ ] `BRAID.md` and `assets/braid-md.md` have the `docs` key (`update` and the public and internal lists; here `update: both`), and `braid check` and the board still work with it (a test if the front matter is parsed)
- [ ] The worker skill's "Docs stay true" rule replaces "Decided means documented", and report.md names the docs updated or says none were affected
- [ ] The brief template's Completion has the docs box, and the reviewer skill checks it as blocking
- [ ] The coordinator skill drafts briefs by `docs.update`: the docs box where it applies, and with `braid` or `both` a last docs strand in every goal (with its brief's content), none for a story; `workflow.md` says the same
- [ ] `docs/getting-started.md` describes the `docs` key, its four `update` values and the docs strand; `docs/decisions.md` has the decision and a log line
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
