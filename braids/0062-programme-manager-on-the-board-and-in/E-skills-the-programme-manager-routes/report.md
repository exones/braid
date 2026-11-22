# Report: 0062/E Skills: the programme manager routes through the board

## What changed

- **`braid-pm/SKILL.md`:**
  - Named "programme manager" (title, description, opening; "PM" stays the short form). `braid-pm`, the `🧭 <repo> pm:` titles and `pm/<slug>` are unchanged.
  - "Taking a goal": the plan file is created and pushed before the user sees the plan, so `braid ask pm/<slug> --kind plan` can open the programme's request (the CLI needs the `pm/*` branch). The request is closed with `braid answer pm/<slug> --by pm`.
  - "The plan file": the front matter the board reads (`state`, `limit`, `hold`, `next`, `digest`, `rows`, `thread`), kept true at every commit, and `braid check --plan pm/<slug>.md` before every push. Braids are named "P4 · 0007".
  - "Answering coordinators": a coordinator's request reaches the PM addressed `--to pm`, with the board's escalation after 20 or 60 minutes. What the PM won't decide goes on with `braid forward <id> --note`. The PM's own questions use `braid ask pm/<slug>` or `braid ask <number> --by pm`, and `--kind action` for what only the user can do. All of these still go in chat too, context first, and never through the question tool.
  - "The digest" also writes the plan's `digest`. "Checking the result live": where `main` is the user's, a passed check forwards the handover to the user's To Review and tells the coordinator it is with the user.
  - "Hold": `braid pause <number> --hold "<words>" --thread <PM thread> --by pm` for each running braid, plus the plan's `state: held` and `hold`. On "go" it runs `braid resume`, empties `hold` and sets `state: running`. "Provider limits" (0061/D) is untouched.
  - "Resuming" sets `thread` in the front matter to the new PM thread.
- **`braid-pm/assets/plan.md`:** the front matter, with the header line's fields moved into it, and rows named `P<n>`.
- **The braid skill, "Launched by a PM" only:** `--to pm` on `braid ask` and `braid handover`. On the PM's reply the coordinator closes its own request without `--by pm` (`--by` is who asked); the log entry names the PM. It never closes a request the PM forwarded or one of the PM's own (`--by pm`, an `action` among them).
- **`docs/getting-started.md`:** "project manager" becomes "programme manager". The rest of the docs are 0062/F's.
- The install test is unchanged, because no skill name changed.

## Why

0062/A's design (questions 2, 3, 6 and 7, and "Strands, restated", E): the board can only route, escalate and show programmes if the agents use the commands B to D built.

## Validation

- I filled in a copy of the new template: `node dist/cli.js check --plan <that copy>` prints `plan OK: pm/working-product, running, 1 row`.
- I checked the commands and flags the skills use against `docs/cli.md` and `src/commands/requests.ts`. For example, `braid requests` is what shows "forwarded by the PM".
- `npm run verify`: 504 tests pass.

## Docs

`docs/getting-started.md` (the name). No other doc is made untrue by this change; 0062/F updates the docs as a whole.

## Open

- The installed `braid` on this machine is older than D (`braid check --plan` is refused). The PM needs a CLI built from this braid.

For later items: the openai.yaml `display_name` stays "Braid PM" (the short form); rename it to "Braid programme manager" if the user wants it spelled out.
Needs the user: process: this PR changes skills (`braid-pm`, the braid skill's "Launched by a PM"), so the user reviews and merges it.
