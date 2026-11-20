---
id: '0049/D'
title: "Combined board page with a project filter: mockups, then build"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0049/C']
order: 40
---

## Goal

The board page for several projects: one combined board with every lane of every project, each card showing its project, and a project filter to show all projects, one, or any several, with one line per project for its counts and readiness. The filter is kept in the address, so a bookmark or a phone link opens the same view. The work starts with mockups on demo data: the worker stops for the user's review and builds only the approved design.

Expected size: about 500 lines in 5 files, plus the mockups.

## Start here

- `braids/0045-working-on-several-projects-research-and/report.md`: the option 3 sketch.
- `web/src/App.tsx`, `web/src/api.ts`, `src/board/route.ts`: today's page, its data and its addresses (`#/0003`, `#/inbox`).
- Strand C's `/api/all`, `/api/projects` and `/api/board?project=`, and its demo data for three projects.
- `docs/board.md` (lanes, cards, the side panel, the phone layout) and the earlier approved mockups in `docs/design/board-mockups/`, for the style.

## Change

- Mockups first, in `docs/design/board-mockups/` as before, built from `braid board --demo` data with three projects, one of them not ready:
  - the combined board with all projects, on a desktop and on a phone;
  - the project filter: all, one project, and two of three selected;
  - the line for each project, including the one that isn't ready;
  - a card with its project tag, and its side panel.

  Then stop and report for the user's review. Each verdict goes into the strand's log.
- After approval:
  - build it in `web/src/`;
  - routes per project (for example `#/p/<name>/0003`), with today's single-project routes still working;
  - screenshots from `--demo` in `docs/design/board-screenshots/`;
  - `docs/board.md`.

## Already decided

- The user chooses the design (converge loop): nothing is built before the user approves the mockups.
- One combined board with a project filter (all, one, or any several), not a separate per-project view (user, 2026-11-20).
- The inbox page follows the same filter, each entry tagged with its project.
- With one project served, the page looks as it does today, with no filter and no tags.

## Out of scope

- Server changes beyond what the page needs to read: strand C owns the API.
- The dark theme and the other board ideas in the inbox.

## Completion

- [ ] Mockups of the combined board and its project filter, for desktop and phone, approved by the user and logged
- [ ] The built page matches them: combined board, project filter for one or several projects kept in the address, project lines with readiness, project tags on cards
- [ ] Single-project routes and the one-project page work as before
- [ ] Screenshots from `--demo` and `docs/board.md` updated
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
