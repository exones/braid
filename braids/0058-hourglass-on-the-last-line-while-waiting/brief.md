---
id: '0058'
title: "Hourglass on the last line while waiting"
status: In Progress
labels: ["kind:story", "tier:L", "ask:process"]
dependencies: []
related: ['0054']
delivery: epic
---

## Goal

The user can't always tell whether the coordinator's turn ended waiting for something or just ended. From now on, a coordinator message that ends while waiting has an ⏳ line as its last line, naming what it is waiting for. And whenever the coordinator mentions a worker or reviewer thread, it links that thread, so the user can open it.

Expected size: about 4 lines in 1 file.

## Start here

- `.agents/skills/braid/SKILL.md`, "Talking to the user": the "Say "waiting" only when something will wake you" bullet, which already lists what can wake the coordinator, and "The question tool" bullet ("Write nothing for after it").

## Change

- `.agents/skills/braid/SKILL.md`, "Talking to the user": two short bullets, one or two lines each.
  - **Hourglass.** A message that ends the turn while waiting has `⏳ Waiting for <what>` as its last line, for example `⏳ Waiting for the worker's report on 0058/A` or `⏳ Waiting for you: approve the plan`. This holds for waits on agents or CI (only what the "Say waiting" bullet allows) and for waits on the user. When the turn ends with the question tool, the ⏳ line is the last line of the chat message, before the call. With nothing pending, there is no ⏳ line.
  - **Links.** Every worker or reviewer thread (its T3 `link`), PR (its URL) and item brief (its brief.md on GitHub, at the branch it is read from) the coordinator names is a link, also in the ⏳ line, e.g. `⏳ Waiting for the [worker](<thread link>)'s report on [0058](<brief url>), CI pending on [PR #210](<pr url>)`.

## Already decided

- The user, 2026-11-21: "if you change skills, make it very short because it's enough to be very short to make this change." No examples sections, no docs pages, no new references. Only the bullets above.
- The same ⏳ marker covers waits for the user, worded `⏳ Waiting for you: …`, so every waiting turn looks the same on its last line.
- Related to 0054 (braid-pm: a project manager that runs the braids toward one goal, on `braid/0054-braid-pm-a-project-manager-that-runs-the`): 0054 writes the new `braid-pm` skill and adds a "Launched by a PM" rule to the same `SKILL.md`. This story touches only the "Talking to the user" section, so the two merge independently. The PM skill gets the same ⏳ line once it is on `main`: the coordinator captures that as a leftover after this merges, unless 0054 has merged first, in which case the worker adds the same one line to `braid-pm`'s SKILL.md too.

## Out of scope

- The worker, reviewer and researcher skills, the CLI, the board, `docs/`.

## Plan

Add the two bullets after the "Say waiting" bullet in SKILL.md, then run the gate.

## Completion

- [x] "Talking to the user" in `.agents/skills/braid/SKILL.md` has the hourglass rule: the last line is `⏳ Waiting for <what>` when the turn ends waiting (agents, CI or the user), it comes before a question tool call, and no ⏳ line appears when nothing is pending
- [x] The same section says to link every worker or reviewer thread, PR and item brief the coordinator names, also in the ⏳ line
- [x] The diff adds no more than about 6 lines to skill files
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
