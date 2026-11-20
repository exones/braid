---
id: '0045'
title: "Working on several projects: research and design options"
status: Done
labels: ["kind:spike", "tier:M"]
dependencies: []
related: ['0011']
delivery: epic
---

## Goal

The user runs braid in several repositories (this one, chinese-trainer and others), but braid sees one repository at a time: a board per main checkout (D40, "one project for now"), `.braid/` state, requests, inbox and T3 threads per project, and notifications only from a board that is running. The question: how should one person work on several projects with braid, seeing what needs them across all of them, and starting and steering work in any of them from one place? The answer is a report with options and a recommendation, which feeds the user's decision on which braids to plan next. Time box: one working session, about three hours of research and writing.

Expected size: about 400 lines in 2 files (`report.md`, `sources.md`), plus optional sketches.

## Start here

- `docs/board.md`: how the board reads one project today: the main checkout, `.braid/` (requests, broke clock, reviews), `t3 thread list --project <main checkout>`, GitHub; Start and Promote; "Notifications" (one ntfy topic per machine, but only a running board sends).
- `docs/decisions.md`: D29 (skills in any repository, `Install-Skills.ps1`), D33 to D35 (the `braids/` store), D39 (the installed `braid`), D40 ("one project for now"), D57 (the inbox on `braid-inbox`), D69 (reviewers as subagents), D70 (notifications).
- `src/commands/board.ts`, `src/board/t3.ts`, `src/braids/worktrees.ts`, `src/notify/config.ts`: where the project root is found, how T3 is queried, and what is already per machine rather than per repository (`~/.braid`, the toolchain store, the notify settings).
- `docs/getting-started.md`: how another project gets the skills and the CLI, and what it must declare in `BRAID.md`.
- `braids/0011-reports-and-several-agents/brief.md`: several agents inside one braid (Outline).
- The inbox ideas `2026-11-19-8m40` (Uber-coordinator: a project manager over the coordinators) and `2026-11-19-s12b` (Wait on another braid's completion): `braid inbox show <id>`. Read them as input; this spike doesn't take them.
- The T3 tools a coordinator has (projects, threads, environments across machines) and the `t3` CLI the board calls: what T3 already knows across projects.

## Change

- `braids/0045-working-on-several-projects-research-and/report.md`: the report, with these parts:
  1. **Today:** what working on two or three projects at once looks like now, step by step (boards, ports, Tailscale, notifications, T3 threads, installing and updating skills and CLI per project, `BRAID.md` per project), and where it hurts. Prove it by running `braid board` (or `--demo`) for two checkouts side by side if you can, and say what you saw.
  2. **The questions:** split "several projects" into its parts: seeing (one board or inbox across projects), being notified, acting (Start, Merge, Open thread for another project), state (what stays per repository, what becomes per machine, and where a machine-wide list of projects would live), and versions (several projects on different skill and CLI versions).
  3. **Options**, at least three, from the smallest to the largest, for example: documented status quo (a board per project); one `braid board` that serves several registered projects; a hub that links or aggregates per-project boards; a cross-project coordinator (the uber-coordinator idea). For each: what the user sees and does, what changes in the CLI, board, skills and stored state, the cost (rough size and tier), the risks (security of a board serving several repos over Tailscale, stale or partial reads, one slow project slowing the board), and what it rules out later.
  4. **How others do it:** how tools that coordinate coding agents or track work across many repositories handle several projects (for example GitHub Projects, Linear, Backlog.md, and agent orchestrators and boards such as Vibe Kanban, Conductor, Claude Squad, OpenHands or similar), and what braid should copy or avoid.
  5. **Recommendation:** one option or a staged path, with the proposed follow-up items, each with a title, kind, tier and two or three lines of scope, in the order they would run.
- Look at about 10 sources: braid's own docs and code above, T3's project and thread model, and at least five outside tools or write-ups. Read each one rather than its title, and record each in `sources.md` in the item folder.
- Optional: rough sketches of a multi-project board (ASCII or a single HTML file in the item folder), only to make an option clear. They are not mockups to approve.

## Already decided

- A spike: the output is the report in this item's folder. No product code, no edits to `docs/`, `README.md`, the roadmap, skills, `AGENTS.md` or `BRAID.md`; what the user decides goes into follow-up briefs and, once built, into the docs and decisions.
- The question is one place across projects: seeing, being notified and acting (user, 2026-11-20).
- Today a project is a repository with its own `braids/`, `BRAID.md`, `.braid/` in its main checkout and `braid-inbox` branch; braid's skills and CLI are installed once per machine (D29, D39).
- Related to 0011 (Reports and several agents, Outline, read from `main`): 0011 runs several agents inside one braid; this spike looks across projects and braids. The spike writes only its own folder, so nothing overlaps; if an option changes 0011's scope, the report says so and the coordinator adjusts 0011 after the user decides.

## Out of scope

- Building anything, including a prototype board or a project registry.
- Mockups for the user's review: a UI follow-up starts with its own mockups.
- Several agents inside one braid (0011) and resuming runs (0010).
- Changing how one project's braids, branches or merges work.
- Goals that span repositories (one goal with strands in several repositories, dependencies between braids of different projects): left out by the user, 2026-11-20.

## Completion

- [x] `report.md` in the item folder has the five parts above: today, the questions, at least three options with cost and risks, how others do it, and a recommendation with proposed follow-up items (title, kind, tier, scope, order)
- [x] "Today" says what was actually tried with two checkouts and what was seen, or why it couldn't be tried
- [x] `sources.md` in the item folder (per source: link, how it was read (whole, part, search result only), what it says, adopted or not and why)
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
