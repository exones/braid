# 0075/D report: docs and skills for lifecycle off the code branches and the pure lane

## What changed

The skills lost the text that only the Done stamp needed. Each change in one line:

- `braid/SKILL.md`, ground rules: "acceptance (Done) is yours" becomes acceptance is yours and Done comes from the merged PR; "an item accepted" and "the braid Done" leave the list of brief commits (accept commits no brief now; the braid's report stays).
- `braid/SKILL.md`, Run an item: `braid start <id> --thread <your thread id>`, so the `started` event names the coordinator.
- `braid/SKILL.md`, Watch rule and "Say waiting": no second watch of a story's PR after `braid accept`, because accept no longer moves the head.
- `braid/SKILL.md`, Hand over: one bullet for every item; a story or final PR runs `braid accept` first, then the same `braid handover`.
- `braid/SKILL.md`, After the merge: a strand's accept commits `docs(braids): <id> accepted`, the commit message the CLI now writes.
- `braid/SKILL.md`, Finish step 3: no "keep the watch until the new head is green"; unwatch at the handover.
- `references/workflow.md`: the worker's `In Progress` first commit, the stamp exception to one writer per branch, "Done at the end" and the two-case acceptance list go; acceptance records on the record branch, Done is read from the merged PR, and `braid-requests` joins `braid-inbox` as the branches only braid commands write. The Done columns of the branches table and the `run braid accept` hint go.
- `references/resuming.md`: "merged but not stamped; run braid accept" goes.
- `references/autonomy.md`: `braid accept --merge --preset` "merges and records the acceptance", not "stamps Done". Merge conditions 2 and 7 still hold as written.
- `assets/brief.md`: the worker's `braid edit --status 'In Progress'` line goes; the accept comments say what accept commits now (the strand's log entry only; never the PR's branch).
- `braid-worker/SKILL.md`: no `In Progress` first commit (`braid start` records `started`), no "never set the item Done", no "leave the status In Progress".

No new rule or special case was added.

**Size of `.agents/skills/`**, counted the same way both times (all tracked files concatenated, `git ls-files .agents/skills | xargs cat | wc -l`):
- At the braid's start (5c6c18d6): 1086 lines, 19742 words.
- Now: 1079 lines, 19510 words.

## Why

0075/B moved `started` and `accepted` to the record branch and made Done come from the merged PR. The skills still told coordinators to watch a story's PR again after accept, to run `braid accept` on "merged but not stamped" items, and told workers to commit `In Progress`. The user asked for the skills not to grow ("don't overblow skills, try to see how to make easier").

## Docs

| Doc | State |
| --- | --- |
| README.md | unchanged (it says nothing about accept or Done) |
| docs/getting-started.md | updated: a strand reads Done once its PR merged; braid commits nothing on a PR's branch for it |
| docs/cli.md | unchanged (0075/B updated `start` and `accept`) |
| docs/board.md | updated: the Done date of an item Done only from its merged PR is the PR's merge time; the pure lane cites D106 (0075/A, B, C updated the rest) |
| docs/autonomy.md | unchanged (it doesn't describe the stamp) |
| help text (src/cli.ts) | unchanged (0075/B updated `start` and `accept`) |
| docs/development.md | unchanged |
| docs/decisions.md | updated: D106, the pure lane derivation; D105 names the skill text it removed; D102's "before the Done stamp" now reads "before the acceptance is recorded" |
| docs/braids-format.md | unchanged (0075/B rewrote the status, lifecycle, start, accept, list, clean and `braid:<n>` parts) |
| docs/roadmap.md | updated: the 0075 line (built; not built: moving briefs, reports and logs off the code branches) |
| docs/npm-distribution.md | unchanged |

## Validation

- Gate (`npm run verify`, quick), run in its parts in the foreground because the whole run takes over 10 minutes: docs-gate passed (after merging f642bf63, the coordinator's fix of trailing whitespace in 0075/F's brief); the OIDC guard passed; `npm run typecheck` and `npm run build` passed; `node --test` over every suite in `test/`, in two halves: 313 + 385 = 698 tests, 0 failures (about 2.5 and 4.5 minutes). This PR changes no source code.
- A search of `.agents/skills/` for `stamp`, `sets Done`, `status-only` and `In Progress'` finds nothing.

## Open

- The skills reach other projects with the installer. A project that runs these skills with a CLI older than 0075/B gets no `started` event, and its workers no longer commit `In Progress`. Its items read To Do until their PR opens. Update the CLI with the skills, as 0075/B's report says.

Decisions: none from the user. My own: the story's and final PR's `braid accept` stays before the handover, not dropped. It still runs the Completion and report checks and posts the acceptance comment, which `braid handover` doesn't do.
For later items: none.
Needs the user: none
