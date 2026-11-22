braid 0062 puts the programme manager (`braid-pm`, 0054) on the board and in the ntfy pushes. Requests a coordinator sends to its PM stay off the user's side unless the PM doesn't answer in time, its thread is gone, or it forwards them. The PM's own questions and the things only the user can do are board requests, pushed at high priority, opening the PM thread. Each programme shows in a collapsible panel left of the lanes, across all projects the board serves.

## What changed

- **0062/A, spike (PR #230).** Report and mockups the user reviewed twice: the first design (a block above the lanes) was replaced by the user's left panel with two states, Working and Needs you, across projects. The user also set the stalled-programme rule.
- **0062/B, requests addressed to the PM (PR #234).** `to: user|pm` on requests (`braid ask|handover --to pm`, the PM thread taken from the brief's `PM-run` line), `braid forward`. A request to the PM keeps its lane with "The PM is handling" and 🧭, sends no push, and escalates after 20 minutes (60 for a handover), on a gone PM thread or a forward, never while the braid is paused. Only user-side needs are pushed; ntfy sequence IDs clear answered pushes. The hold joins 0061's pause store (`braid pause --hold`).
- **0062/C, the PM asks you through the board (PR #236).** Requests keyed by item and asker; `braid ask pm/<slug>`, `--by pm`, `--kind action`, `braid answer --by pm`; pushes titled `<repo> <slug|id>: the PM asks`.
- **0062/D, the programme on the board (PR #240).** Plan front matter and `braid check --plan`; programmes read from `pm/*` branches, keyed `<project>/<slug>`; the panel, rail, "Only these" filter, programme details, 🧭 tags, the phone strip; the stalled programme pushed once; held plans hold their braids; D88.
- **0062/E, skills (PR #241, merged by the user).** `braid-pm` is the programme manager and uses B to D; the braid skill's "Launched by a PM" opens requests `--to pm`.
- **0062/G, sweep (PR #243).** Added on 2026-11-22 at the user's request (through the 0066 coordinator) for the four review leftovers: exact T3 thread-id keys, a gone push cleared by its own sequence ID, `Held: the plan says held`, and `braid notify test` sending and clearing a push (run once live on ntfy.sh: the server accepted both; the phone was not checked).
- **0062/F, docs (PR #244).** board.md, braids-format.md, D89 with notes on D45, D46 and D82, README, getting started, autonomy, roadmap, help text, and "Run the board at login" for Windows and Linux.

## Why

The first real PM run (dctl-studio, 2026-11-21) showed the board pushing to the user every request the PM was handling, while the PM's own questions reached the user only in chat. The user wanted the board to show programmes and to be notified when the PM, and only the PM, needs them.

## Validation

- Every strand: `npm run verify` locally and CI (`verify (ubuntu-latest)`, `verify (windows-latest)`) green on its PR and on the braid branch after its merge; an independent review per strand, with fix rounds re-checked (B, D, E, F, G had one fix round each).
- The final PR's CI on the braid branch merged with `main` decides the gate box.
- Live checks: the Windows login recipe was run once with `--demo`; the Linux unit was verified with `systemd-analyze` but not run (no systemd in WSL); the ntfy clear was accepted by ntfy.sh but not seen on the phone; the board screens were taken from the running demo board.

## Open

- Leftovers in the inbox: 2026-11-22-7kqa (a limit pause on a held braid replaces the hold, so the resume could restart held work) and 2026-11-22-uk4f (a board started at login can't act from its page: the token address is only printed to its console).
- The installed `braid` CLI on this machine is older than this braid (it refuses `braid check --plan`); a PM using the new skill needs the CLI from `main` after this merges.
- `agents/openai.yaml` of `braid-pm` still has the display name "Braid PM".

Decisions: the user approved the plan (2026-11-21); chose the left panel across projects and named it programme manager (2026-11-21); set the stalled-programme rule (2026-11-22); passed and later cleared the sweep request, then asked for the sweep inside 0062 (0062/G); merged 0062/E. Coordinator: forwards wait for a resume like the other escalations (the brief, over the worker's first choice); the strand merges under `steady`.
For later items: the two leftovers above.
Needs the user: process: this braid changes skills (`braid-pm`, the braid skill's "Launched by a PM"), so the user reviews and merges the final PR into `main`.
