---
id: '0062/F'
title: "Docs: Programme manager on the board and in notifications"
status: Done
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

- [x] Each doc from BRAID.md `docs` is checked, and report.md lists it as updated or unchanged
- [x] The docs describe programmes, PM routing and escalation, the stalled programme, the pushes under a PM and the login recipes
- [x] Each login recipe was run once on its OS, or report.md says why not
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Read the strand reports and the braid log for the notes left to F; take what B to E already documented as the base.
2. Fill the gaps: board.md lane rules 2 and 3 for requests to the PM and PM requests; braids-format.md command bullets (`--to pm`, `--by pm`, `pm/<slug>`, `action`, `braid forward`, `answer --by pm`); the `braid forward` help line (pause case).
3. The D46 misstatement: board.md cited D46 as counting the coordinator as an agent; name the coordinator on its own. Update D46's stale `braid start --review` wording; add D89 (PM routing) beside D88, with a decision-log line for both.
4. README, getting-started, autonomy and roadmap: the programme manager and what reaches the user.
5. "Run the board at login" in board.md: Windows scheduled task (run once here with `--demo`), Linux systemd user service (no systemd Linux here: verify the unit file with systemd-analyze in WSL).
6. Gate, report, PR.
