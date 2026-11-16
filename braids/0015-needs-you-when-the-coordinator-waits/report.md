# 0015: Needs You when the coordinator waits

## What changed

The board now shows five states, To Do, Working, To Review, Needs You and Done, and an item is on the user's side only when someone asked for them or something broke ([states.md](states.md)).

- **A. Spike** ([report](A-spike-how-the-board-sees-the-coordinator/report.md)): T3 has no field that tells the coordinator from a worker, and every coordinator wait (a worker, a PR watch, `t3_background_wait`) reads the same `completed`, unsettled state. Guessing "waits for the user" from T3 would be shaky, so the user chose explicit requests instead.
- **B. Mockups** ([report](B-mockups-five-lanes-and-what-is-needed/report.md)): the request line on cards, one reason icon on the user's side, the Details toggle (a cookie; off moves the text to the icon's tooltip). Approved by the user.
- **C. Requests** ([report](C-requests-braid-handover-and-braid-ask/report.md)): `braid handover`, `braid ask`, `braid answer`, `braid requests`, stored in `.braid/requests.json` of the main checkout under a lock; requests close themselves on merge, close, a new head, `braid start` and `braid done` (D45).
- **D. Board** ([report](D-board-lanes-from-requests-and-broke/report.md)): lanes from requests and the 10-minute "checks failed" and "stalled" alarms; agents are only threads in braid-made worktrees, so the coordinator never counts; `braid start <id> --review` makes the reviewer's checkout; the request text on cards and in `braid status` (D46).
- **E. Skills** ([report](E-skills-ask-before-every-stop/report.md)): a turn that waits for the user ends with an open request; every stop names `braid handover` or `braid ask`; reviewers start with `braid start <id> --review`. +93 words.

## Working at the end

- While the coordinator waits for the user, its braid sits in Needs You (or To Review) with what is needed; `braid answer`, the merge or the next `braid start` takes it out. Used for real on 0015/E: `braid handover` put it in To Review, `braid done --merge` closed it.
- The coordinator's thread never makes its braid read as Working, and `braid done` needs no caller skip.

## Validation

`npm run verify` passes on the braid branch with `main` merged in. Each strand was reviewed (S by me, M and L by an independent reviewer) and merged with green CI.

## Open

- The final review's findings, and the small points left from D and E, go into one fix strand.
- For later: requests are local to one machine; T3 could tell its waits apart (the feature requests drafted in A's report, not sent).
