# Report: 0062/D The programme on the board

**What changed**

- **Plan file:** `pm/<slug>.md` gets front matter in the brief's YAML subset: `programme`, `title`, `goal`, `thread`, `limit`, `state` (`running|held|done|stopped`), `hold` (`<ISO> <words>`), `next`, `digest`, `rows` (`P<n> | <number or -> | <title> | <state>`). `parsePlan` (`src/braids/plan.ts`) names the line of each error and rejects unknown keys. `braid check --plan <file>` prints `plan OK: pm/<slug>, <state>, <n> rows` or `<file>: line <n>: …` (exit 2).
- **Reading:** `src/board/plans.ts` reads every `pm/*` branch with one `for-each-ref` and one `cat-file --batch`, the local branch before `origin/pm/*`. A plan that is missing or doesn't parse comes back with its reason. A failed read gives no programmes and never fails the board. `Sources.plans` is read in `readSnapshot`.
- **Programmes:** `src/board/programme.ts` derives one programme per plan from the rows, the braid cards, the programme request, T3 and the broke clock:
  - `section` is `needs` (a programme request, or the stall), `working`, or null (done or stopped).
  - It also carries the status line, the PM thread's state and link, the hold, done/total/running, and what the PM is handling.
  - **The stall:** the PM thread isn't running, and no braid of the programme runs (no agent, coordinator or PM checker, no checks pending). After ten minutes on `<repo>/<slug> pm` it reads stalled. It is held back while the programme is done, stopped, held or asking, and while T3 or GitHub is unread.
  - **A held plan** (`hold`, or `state: held`) holds its braids that have no pause record of their own, so they show 0061's paused mark ("Held: …") and don't stall.
  - The T3 read counts running `🧭 <repo> pm check:` threads (`pmChecks`).
- **API:** `programmes` on `/api/board` and `/api/all`, keyed `<project>/<slug>`, with `project`. Each braid card has `programme` (its slug). The `open` action takes `{ programme }` and opens the PM thread from the snapshot. C's synthetic `programmeCard` is gone, so `/api/item` is never asked for `pm/<slug>`.
- **Pushes:** a programme request is pushed from the panel as before (`<repo> <slug>: the PM asks`, same key). The stall pushes `<repo> <slug>: Needs You`, high, ⏳, opening the PM thread, once per stall. A Done braid that a programme runs is pushed at `low`.
- **Page** (`web/src/App.tsx`):
  - The panel left of the lanes, with Needs you and Working (screens 60 and 63). Each card has the PM's request with its lettered options as a list, the stall with what the board saw, the done bar, the status or hold line, and PM thread, ◎ Only these and ≡ Plan.
  - « and » fold the panel to the rail and back. The rail shows amber ?/⏳ with a count, then 🧭 or ⏸, with project dots. The choice is kept in local storage (screen 61).
  - Only these: `?programme=<project>/<slug>` sits next to `?projects=`. The other programme cards dim, and a teal bar above the lanes has Show all. A programme that is unknown, or whose project isn't shown, is dropped from the address (screen 62).
  - The details panel at `#/programme/<project>/<slug>` (screen 64).
  - The 🧭 tag on cards and Done rows.
  - On the phone, the drawer strip and the filter chip (screens 66 and 67).
  - With no programme the panel isn't drawn.
- **From the 0062/C review:**
  - A `--by pm` ask next to a coordinator's handover keeps the card in Needs You, with "Merge PR #n" as its line and the Merge button on the card.
  - The teal "The PM is handling" line now shows in any lane, so it stays next to a PM ask.
- **Demo:** programmes in `demo` (working-product asks, inbox-sweep stalled, ios-beta held, launch-v1 done) and `api` (a second `working-product`, and a plan that doesn't parse).

**Why:** the design the user approved in 0062/A (screens 60 to 67) and the user's stall rule of 2026-11-22.

**Validation**

- New `test/programmes.test.ts` (13 tests):
  - the template parses, and each error names its line;
  - `braid check --plan` through the CLI;
  - `readPlans` on a real repository: the local branch, a parse error, a missing file, no Git;
  - Working for each way of running (a running PM with no braid; an idle PM with an agent, checks, a coordinator or the checker);
  - the stall after ten minutes with an idle, failed, archived or unknown PM, keeping its first sighting so it is pushed once, clearing when the PM runs, and an unread T3 or GitHub leaving the clock alone;
  - done and stopped programmes leave the panel, held and all-paused programmes don't stall, and a request replaces the stall;
  - an unreadable plan keeps the board working;
  - a held plan's braids read held, not stalled;
  - two projects with one slug: keys, the filter and push sequence IDs;
  - the `?programme=` and `?projects=` address and the route;
  - the pushes (the request, the stall, a low-priority Done);
  - the PM ask next to a handover.
- `test/pm-asks.test.ts` was updated: the programme request now shows in the panel.
- `npm run verify`: see the PR.
- The built demo board was screenshotted in headless Edge at 1500 px and 390 px. These are the screens below, also in `docs/design/board-screenshots/94` to `100`. The rail, the filter and its reload, the details panel and the phone strip and chip were each driven in the browser. Collapsing the panel survived a reload.

**Docs:**

- `docs/board.md`: the new "Programmes" section; Requests (the PM ask next to a handover); where the states come from; Notifications (the stall push, `low` Done); Demo.
- `docs/braids-format.md`: "Plan files" and `braid check --plan`.
- `docs/cli.md`: `braid check --plan`.
- `docs/decisions.md`: D88.

**Open:** the PM's plan template (`.agents/skills/braid-pm/assets/plan.md`) still has no front matter. Strand E adds it from `docs/braids-format.md`.

Decisions:

- Decided: the stall clock's key is `<repo>/<slug> pm`. The clock lives in each project's own `.braid/broke.json`, and the board reads a project under its repository name, so the project prefix is only a label.
- Decided: a PM ask next to a coordinator's handover reads Needs You, the more urgent lane, and Merge stays on the card, instead of To Review.
- Decided: a held plan holds its braids that have no pause record (a synthetic `hold` pause by the PM), so they show paused even before the PM ran `braid pause --hold` on each.
- Decided: a plan with unknown keys is an error, so a typo is caught by `braid check --plan`.
- Decided: an unreadable plan shows in Working.

For later items: strand E puts this front matter into the `braid-pm` plan template and has the PM run `braid check --plan` before each push. The programme details could link the plan file on GitHub once the board knows the remote's web address.
Needs the user: none
