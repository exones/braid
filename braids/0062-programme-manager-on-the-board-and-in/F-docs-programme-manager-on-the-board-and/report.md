# Report: 0062/F Docs: Programme manager on the board and in notifications

## What changed

Strands B to E and G documented their own changes as they went, so this strand filled the gaps and checked the docs as a whole.

- **`docs/board.md`:**
  - Lane rules 2 and 3 now say a request addressed to the PM counts only once escalated or forwarded, that the PM's own request (also `action`) is Needs You and wins over a coordinator's handover, and that a request the PM still handles skips both rules.
  - "Working and stalled" cited D46 as counting the coordinator as an agent; it names the coordinator on its own now (the 0062/A review's note).
  - New section **Run the board at login**: a Windows scheduled task at logon and a Linux systemd user service, so pushes reach the phone without a board window open.
  - Requests point at D89.
- **`docs/braids-format.md`:** the request command bullets gain `--to pm` (ask and handover), `--by pm`, `braid ask pm/<slug>`, the kind `action`, `braid forward`, `braid answer --by pm` and the `braid requests` labels; the Requests record names the PM and D89.
- **`docs/decisions.md`:** new **D89**, the programme manager name and routing requests through the board (`--to pm` with escalation, `braid forward`, the PM's own requests, the hold, cleared pushes), with reasons; a decision-log line for D88 and D89. D46's stale `braid start --review` worktrees now point at D69, and it says a running coordinator, though no agent, holds back the braid stall and keeps a programme Working. D88 names the coordinator the same way. D82 notes the rename and that D89 replaced its "no CLI or board change". D45 gets a dated note: one open request per item and asker since 0062/C.
- **`README.md`:** a feature line for the programme manager and what reaches you.
- **`docs/getting-started.md`:** what the user sees of a programme on the board and phone, with every way a request to the PM reaches the user (forward, 20 or 60 minutes, a gone PM thread); "See the board" links ntfy setup and the login recipes.
- **`docs/autonomy.md`:** the `PM-run` line routes the coordinator's asks to the PM (`--to pm`); a hold is `braid pause --hold`, and a limit pause replaces it (one record per braid).
- **`docs/roadmap.md`:** programmes built (0062, D88, D89).
- **CLI help:** `braid forward`'s help line and doc comment no longer say "at once" without the pause case (0062/B's note).

`docs/cli.md` was already complete for every command the brief names (`--to pm`, `braid forward`, `braid ask pm/<slug>`, `--by pm`, `braid pause --hold`, `braid check --plan`): unchanged.

## Why

The brief: bring the docs from BRAID.md `docs` up to date as a whole after 0062, with the notes the strand reviews left for F.

## Validation

- **Windows recipe, run once:** registered the task as written (named `braid board 0062F test`, `--demo --port 8799` so it reads no project and sends no push), without administrator rights; `Start-ScheduledTask` started it and `/api/board` answered HTTP 200. Found on the way: `Stop-ScheduledTask` ends only `pwsh`, the board's `node` process keeps listening; the recipe now stops the board by its port. The process was stopped that way and the task unregistered.
- **Linux recipe, not run:** this machine has no Linux with systemd (WSL Ubuntu runs without systemd as PID 1 and has Node.js 22, below braid's 26). The unit file from the doc was checked with `systemd-analyze --user verify` (systemd 259) in WSL: no warnings; a copy with a bad `Restart=` value was flagged, so the check does read the file. Starting it under a real `systemctl --user` is still to do.
- Every command and flag the docs name was checked against `src/cli.ts`, `src/commands/requests.ts` and `src/commands/pauses.ts`.
- `npm run verify`: see the PR.

## Docs

Updated: `README.md`, `docs/getting-started.md`, `docs/board.md`, `docs/autonomy.md`, the CLI's help text (`src/cli.ts`), `docs/decisions.md`, `docs/braids-format.md`, `docs/roadmap.md`. Checked, unchanged: `docs/cli.md` (complete already), `docs/development.md` and `docs/npm-distribution.md` (nothing in 0062 touches them).

## Open

- The Linux recipe has not run under systemd.
- A board started at login hides its token URL, so its local page can read but not act (Start, Merge, Open thread); the doc says so. Printing the URL to a file the user can open would fix it.

Decisions: Decided: the login recipes were run with `--demo`, so the test read no project and sent no push. Decided: "Fix the description of D46" was read as the misstatement the 0062/A review found (docs citing D46 for counting coordinators); D46 itself was right on that and only got its stale `--review` wording fixed.
For later items: a limit pause on a held braid replaces the hold record (one record per braid), and the resume at the reset then clears it, so held work could restart; `braid pause --provider` could refuse or keep a hold. `braid board` could write its token URL to `.braid/` (or `~/.braid/`) so a board started at login can still act locally.
Needs the user: none
