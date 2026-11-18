---
id: '0027'
title: "Planning looks at the other open braids"
status: In Progress
labels: ["kind:story", "tier:L", "auto"]
dependencies: []
delivery: epic
---

## Goal

A coordinator plans a new braid without knowing what the other unfinished braids already cover, so it can plan a duplicate, or a goal that contradicts a decision another open braid has made. Most of them don't show on `main`: a braid lives on its braid branch from the planning merge until its final PR, and a plan being drafted lives only on `plan/<slug>`. Observed while planning this braid: 0024, 0025 and 0026 were open only on their branches, and `braid list` on `main` showed none of them. After this goal, planning starts with a look at every unfinished braid, wherever it lives; each overlap becomes a `related` link, and a duplicate or a contradiction is put to the user before the plan is approved.

Expected size: about 500 lines in 12 files over three strands.

## Strands

- 0027/A `braid list --open`: every unfinished braid (Outline, To Do, In Progress) from the working tree, braid branches and `plan/` branches, local and on `origin`, with where it lives and the first lines of its Goal.
- 0027/B A `related` front-matter field: `braid new` and `braid edit --related`, shown both ways by `braid view` and `braid list --open`, unknown ids a warning in `braid check`.
- 0027/C The braid skill: a "Look around" step in Plan; the brief template and the plan request carry the links and any warning.

## Already decided

- Only unfinished braids are compared, as the user asked. Done braids and `docs/decisions.md` are out of this goal.
- Judging overlap, duplication and contradiction is the coordinator's reading, not a CLI heuristic: the CLI only gathers the braids and their goals.
- A link is stored only in the brief that makes it, because the other braid's brief belongs to whoever holds its branch. `braid view` computes the back-links.
- Related to 0025 (Sweep: inbox counts, on `braid/0025-sweep-inbox-counts`): it changes `listBraids` in `src/commands/braids.ts` and the `braid list` text in `docs/braids-format.md`, which 0027/A changes too. No contradiction. 0027/A doesn't wait for 0025 (user, 2026-11-18): whichever lands second merges `main` and resolves `listBraids`.
- Related to 0024 (Reviewer threads linked to their PR): it edits `.agents/skills/braid/SKILL.md`, "Accept and hand over"; 0027/C edits "Plan" in the same file. No contradiction; 0027/C merges `main` first if 0024 is merged by then.

## Completion

- [ ] `braid list --open` shows every unfinished braid, including those only on a braid or `plan/` branch
- [ ] Briefs carry `related` links, shown both ways
- [ ] The braid skill's Plan looks at the open braids, links overlaps and puts duplicates and contradictions to the user
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
