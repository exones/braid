---
id: '0049'
title: "One board for all your projects"
status: In Progress
labels: ["kind:story", "tier:L", "ask:architecture", "ask:security"]
dependencies: []
related: ['0045', '0047', '0011']
delivery: epic
---

## Goal

braid sees one repository at a time: a board per main checkout, each on its own port, token, tab and Tailscale address, and phone pushes only from a board that happens to run. After this goal one `braid board` serves every project on a per-machine list: one combined board with every lane of every project, each card tagged with its project, and a project filter that narrows it to one project or to any several; one address and one bookmark, and pushes for every listed project from that one process. A project that isn't ready for braid says so instead of showing an empty board. This is option 3 of spike 0045 ([report](../0045-working-on-several-projects-research-and/report.md)), chosen by the user on 2026-11-20.

Expected size: about 1,500 to 2,000 lines with tests, in four strands.

## Working at the end

- With two projects listed (`braid projects add`), one `braid board` shows both in one combined board: every lane holds the cards of both projects, each tagged with its project, with their usual actions. The project filter shows all projects, one, or any several; the address keeps the choice, so a bookmark opens the same view.
- With notifications set up, a new Needs You in either project reaches the phone from that one board, and its push title names the project.
- A listed project that is on Backlog.md, has no readable `BRAID.md`, or that T3 doesn't know shows a readiness line saying so, instead of an empty card.
- Run in a project folder with no list, `braid board` behaves as today.

## Strands

- A. Project readiness check (M): `braid board` and `braid status` say why a folder isn't a working braid project.
- B. Project list in `~/.braid/projects.json` (L): `braid projects add|remove|list`.
- C. Board server for several projects (L): one process reads every listed project; a combined board API; actions by project name; pushes for all.
- D. Combined board page with a project filter (M, ui): mockups first for the user's review, then the build.

## Already decided

- One combined board for all projects, with a project filter for one or any several of them; a single project is the filter with one project, not a separate view (user, 2026-11-20).
- Option 3, staged as A to D; the cross-project coordinator (idea 2026-11-19-8m40) stays in the inbox, and goals that span repositories are out (user, 2026-11-20).
- Only the project list is new and per machine (`~/.braid/projects.json`); `braids/`, `BRAID.md`, `.braid/` (requests, broke clock, reviews, `notified.json`) and the inbox stay in each repository. No skill changes: coordinators and workers keep working per project.
- Security stays as today: owner-only whois on Tailscale, the token, Host, Origin and `x-braid-request` checks. Only listed projects are served, and an action names a listed project; a folder path from the client is never accepted.
- This supersedes D40's "one project for now"; strand C records the new decision in `docs/decisions.md`.
- Corrections to the spike from its review (leftover 2026-11-20-flmj): GitHub reads already time out after 30 s (`src/board/github.ts`), and what is new is a whole-read timeout per project; `t3 thread list --project <folder>` prints `[]` both for a folder T3 doesn't know and for a T3 project with no threads, so readiness compares against T3's project list; the project list is a new stored format, so B is tier L.
- Related to 0045 (Working on several projects, Done on `main`): its report is this goal's source.
- Related to 0047 (Board tab shows the braid favicon, on `braid/0047-board-tab-shows-the-braid-favicon`): both touch `src/commands/board.ts` (0047 only its `TYPES`); 0047 is small and merges first, and this braid merges `main` before its strands touch that file.
- Related to 0011 (Reports and several agents, Outline): 0011 works inside one braid of one project; this goal only reads what it produces, and the combined board shows new card states the way the single-project board does.

## Out of scope

- The cross-project coordinator, goals that span repositories, and changes to the braid skills, `AGENTS.md` or `BRAID.md`.
- A board that runs headless at login: C's plan may propose it as a flag, but it isn't built here.
- Moving any per-repository state out of the repositories.

## Completion

- [ ] With two projects listed, one `braid board` shows both in one combined board, and the project filter narrows it to one or several projects
- [ ] Pushes for every listed project come from that one board, each titled with its project
- [ ] A project that isn't ready shows why, on the board and in `braid status`
- [ ] `braid board` in a project folder with no list works as before
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
