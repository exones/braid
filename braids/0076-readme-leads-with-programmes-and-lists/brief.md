---
id: '0076'
title: "README leads with programmes and lists what braid does"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: []
related: ['0075']
delivery: epic
autonomy: free
---

## Goal

Programme pm/autonomous-dev-machine, row P23. A reader who opens README.md knows what a programme is and how to start one, and finds every feature braid has, one line each, with a link to its doc. The README opens with programmes, then lists the features, then keeps what is still true of today's README, tightened.

The user, 2026-11-24, in full: "update the main README page because now we have program and questions and it's not updated and I would make the programs more visible and maybe start with them because they really shine when you say something business-oriented like I need this please check with me on this and also list all the features autonomy how to wake up pausing before limits I mean that the auto wake up it's when the board checks if the agent is has gone stale".

Expected size: about 120 changed lines in README.md; the README stays near its current 145 lines (not much longer).

## Start here

- `README.md`: today's version; "What it can do" already mentions most features, but programmes come eighth and the list has no doc links.
- `.agents/skills/braid-pm/SKILL.md`: what the PM does (plan file on its own branch, slicing into braids, product-shaping questions, coordinators up to a limit, proxy answers, live checks, escalation).
- `docs/board.md`: Lanes, Requests, Wakes, Reminders, Paused, Provider limits, Programmes, The inbox, Open thread and Merge on request; link to its sections.
- `docs/autonomy.md`, `docs/getting-started.md` (BRAID.md, braid on a large repo, Merging and autonomy presets, Questions and answers), `docs/cli.md` (`braid ask`, `answer`, `requests`, `limits`, `pause`, `wait`, `eta`, `note`, `inbox`).
- `src/`: check any claim the docs leave unclear against the code.

## Change

- `README.md`:
  - **Open with programmes** (right after the tagline and board picture): the user gives a business-level goal in a few lines ("I need this; check with me on that"); the PM (`braid-pm` skill, `$braid-pm <goal>`) slices it into braids, settles only the hard-to-reverse questions with the user, runs coordinators up to a limit, answers them as the user's proxy, checks each result live and brings merges to the user. A short, concrete example of such a goal and what happens. Say how to start one.
  - **Then one list of what braid does**, one line each, each with a link to its doc (a section anchor where one exists): questions and requests on the board (short on the board, full in chat, answered by code; `braid ask`/`answer`/`requests`); autonomy presets; the board's wakes, hourly reminders and the nudge when an agent has gone quiet; pausing agents before provider limits and resuming after the reset; the merge gate and `ci: all`; live checks by the PM; the ideas inbox; the board itself (lanes, Open thread, programmes panel); plus the features today's list has that still hold (plan into reviewed PRs, review, resume from files, phone and Tailscale, Claude/Codex/Cursor in T3).
  - **Keep, tightened:** Why braid, the walk-through, the parts (add the PM), quick start, the CLI, the docs index, contributing, licence. Drop repetition the new sections make redundant.

## Already decided

- Programmes first, features listed, as quoted in the Goal (the user, 2026-11-24).
- Programme-wide (the user): "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". This braid changes no skill.
- Product description only: work status stays in `braids/` (AGENTS.md). Every claim must be true of `origin/main` at the PR's head; check each against `docs/` and the code, not against plans or open braids.
- Related to 0075 (Lifecycle off the code branches, one pure lane, on `braid/0075-lifecycle-off-the-code-branches-one-pure`): 0075 changes docs (board.md, braids-format.md, cli.md, decisions.md) and skills, and maybe README lines on accept/Done. 0075 merges into `main` first. Before the PR is handed over, merge `main` in and make the README match it (`braid accept` no longer moves a PR head; Done comes from the merged PR).
- Screenshots and images stay as they are; no new images.

## Out of scope

- Any change under `.agents/skills/`, `AGENTS.md`, `CLAUDE.md`, `BRAID.md`, or code.
- Editing `docs/` beyond a link target the README needs. A doc found wrong is a leftover in report.md's "For later items", not a fix here.

## Completion

- [ ] README.md opens (after the tagline and board picture) with programmes: what one is, a short concrete example, and how to start one
- [ ] One feature list follows, one line per feature, each linking to its doc; it covers every feature named under Change
- [ ] Every claim and link in README.md checked against `docs/` and the code on `main` at the PR's head, including 0075's changes once merged; report.md lists any doc found wrong as a leftover
- [ ] README.md is at most about 170 lines and keeps the walk-through, parts, quick start, CLI and docs index
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
