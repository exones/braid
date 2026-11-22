# Report: 0064/D Skills: the board pauses, coordinators and PMs follow

The skills now say that the board pauses and resumes. Coordinators and PMs keep only the check before a launch and answer the board's messages.

## What changed

- `references/limits.md` is rewritten: the board's pause and resume; the check before a launch (exit 3: launch nothing, say so once, end the turn); the board's pause messages for a worker, a coordinator and a PM, and its resume messages, quoted from `src/board/steer.ts`; no running board (nothing pauses; the user says go on; `braid resume --limit` clears a limit pause and leaves a hold); weekly windows (the board's Needs You, the user moves a role in `BRAID.md`).
- Removed from limits.md, the braid skill ("Run an item" steps 1 and 3, "Launched by a PM", "Finish" step 0, the waiting line), `resuming.md`, `workflow.md` and braid-pm: the 15-minute check task, the wait-timeout check, the resume task, and `braid pause`/`braid resume` by agents.
- braid-pm "Provider limits": the pause and resume messages, `Paused: pm`, no steering of coordinators.
- braid-worker: its pause step stays; `Paused:` now says the line carries the item id, never a thread id, and goes to the thread the message names.
- `models.steering` (`first`, `fallback`) is named where the skills list the `BRAID.md` roles (braid, braid-pm, the `braid-md.md` template).
- Docs the old flow made untrue: `docs/getting-started.md`, `docs/autonomy.md` ("Pausing for a provider limit": the board pauses and resumes, the coordinator keeps the launch check, a weekly window is the board's Needs You, D90), `docs/cli.md` ("Pauses": the board resumes, older `coordinator`/`pm` records), `README.md` (the pause bullet) and `docs/board.md` (the resume-was-due causes).

## Why

The board does the watching, pausing and resuming (0064/C); agents' own check and resume tasks would race it.

## Validation

- `npm run verify` passes.
- Checked the worker's pause and resume steps against the steering thread's messages in `src/board/steer.ts`: they match (`Pause for …`, `Paused: <id> at <sha>`, `Resume: continue <id> from your checkpoint`). The only change is the id rule above.
- No leftover `limits check`/`resume task` wording in `.agents/skills/`.

## Docs

Updated: `docs/getting-started.md`, `docs/autonomy.md`, `docs/cli.md`, `README.md`, `docs/board.md` (see above). 0064/C had already covered the rest (`braids-format.md`, `decisions.md`). A `rg` over the docs for the old flow (15-minute check, resume task, PM pauses) finds only history in `decisions.md` and the old design mockups.

## Open

None.

For later items: none.

Needs the user:
- process: this PR changes skills (`.agents/skills/`); you merge it, and `steady` asks at the final PR. The `steering` role in this repository's `BRAID.md` is still your edit (see 0064/C).
