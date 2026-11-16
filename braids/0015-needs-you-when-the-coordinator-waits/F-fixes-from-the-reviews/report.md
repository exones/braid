# 0015/F report

**Changed**
- Skills (asked for by the user): `braid/SKILL.md` names `braid handover` for the story head; the three `braid ask` short forms carry `"<what is needed>"`; the planning PR keeps its plan request open until it merges (or `braid ask` for the merge). `workflow.md` failure table says `braid ask` instead of "ask the user" (4 rows). Words: SKILL.md 3551 → 3575 (+24), workflow.md 1459 → 1461 (+2); total +26, under the 30 limit.
- `docs/board.md`: a braid with strands is not Done when its strands are; with its final PR open it reads To Review (or Working) and is Done after the merge. "Everything else is Working" now says To Do when not started. Wrap-up agents/spinner described; `docs/braids-format.md` updated for `--review`.
- `src/board/model.ts`: in wrap-up the braid's own derive sees its reviewer threads (not the coordinator), so the card shows review activity, is `running`, and `checks failed` is held back while a reviewer runs; with no agent, pending final-PR checks show the `checks` spinner.
- `src/commands/start.ts`: `braid start <n> --review` accepts a braid with strands when its final PR is open (`<repo>/<n>-review`); without an open final PR it still refuses. `braid clean` already removed it (now tested).

**Validation:** `npm run verify` passes (173 tests). New tests: wrap-up checks spinner, reviewer counted, coordinator not (`test/lanes.test.ts`); `--review` on a braid and its clean (`test/start.test.ts`). `braid start 0015 --review` made `…/0015-review` for PR #100 (run in a temporary worktrees folder, removed).

**Open:** none.

For later items: none
Needs the user: none
