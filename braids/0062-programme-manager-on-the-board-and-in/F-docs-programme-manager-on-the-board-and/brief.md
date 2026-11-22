---
id: '0062/F'
title: "Docs: Programme manager on the board and in notifications"
status: To Do
labels: ["kind:task", "tier:L"]
dependencies: ['0062/A', '0062/B', '0062/C', '0062/D', '0062/E', '0062/G']
order: 60
---

## Goal

Read everything braid 0062 changed, from its first strand, and bring the docs from BRAID.md `docs` up to date as a whole:

- `README.md` and `docs/getting-started.md`: the programme manager, and what the user sees of it on the board and phone.
- `docs/board.md`: the programmes panel and its filter, programmes across projects, PM routing and escalation, the stalled programme, pushes under a PM, and paused with a hold.
- `docs/braids-format.md`: the plan file's front matter, the request fields (`to`, `pm`, `by`, the kind `action`) and the hold in the pause store.
- `docs/cli.md` and the CLI's help text: `--to pm`, `braid forward`, `braid ask pm/<slug>`, `--by pm`, `braid pause --hold`, `braid check --plan`.
- `docs/roadmap.md`: status.
- `docs/decisions.md`: one decision for PM routing, the programmes panel and the stalled programme, with reasons. Fix the description of D46 where it misstates how coordinators count (the reviewer's note on 0062/A).
- **"Run the board at login"**, a new section in `docs/board.md`: a recipe for Windows (a scheduled task at logon) and one for Linux (a systemd user service), so pushes reach the phone without a board window open. Run each recipe once on its OS, or say in `report.md` which couldn't be run and why.

Tier L, because the docs describe agent instructions changed in E.

Expected size: about 200 lines.

## Completion

- [ ] Each doc from BRAID.md `docs` is checked, and report.md lists it as updated or unchanged
- [ ] The docs describe programmes, PM routing and escalation, the stalled programme, the pushes under a PM and the login recipes
- [ ] Each login recipe was run once on its OS, or report.md says why not
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
