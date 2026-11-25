`braid launch` is in: one call before `delegate_task` and one after it.

**What changed**

- `braid launch <id> --role worker|review|research` (`src/commands/launch.ts`) checks the limits for the role's model (`braid limits --role`, same `--tier`/`--kind` from the item's labels), then prints the `delegate_task` input as JSON: `role` (`implementation`/`review`/`research`), `isolation` (`worktree`/`worktree`/`shared`), `mode: async`, `title`, `target` (`providerInstanceId`, `model`, `options` as an object) and `task`, the first message. On `pause` it prints the limits block on stderr, exits 3 and starts nothing. It never calls T3.
- A worker launch first runs the new branch-only start (`braid start --no-worktree`, `startBranch` in `src/commands/start.ts`): the item branch is created from its base and pushed, and the `started` event is recorded with `--thread`. No worktree and no local branch. Run again, it reuses the branch and records nothing twice. The worktree stays the default of `braid start`.
- `braid launch <id> --role <role> --child <thread id>` records the child through `recordChild`, now shared with `braid review` (extracted from `reviewCommand`, same output, same folder and branch from T3). `ReviewRecord` has an optional `role`; `review` records stay without one, and a record without one reads as `review` (`childRole`).
- `ModelLine` gained `options` (`effort=high, fastMode=false` becomes `{effort: "high", fastMode: false}`), parsed from the BRAID.md line.
- The reviewer's message takes the PR url and head from `gh pr view` of `--pr <n>`; the researcher's takes `--question`. Messages follow the skill's templates, with the worker's gaining the switch-the-checkout line, `parentThreadId` and the final `PR <url>, head <sha>, checks <state>` line.
- Docs: `docs/cli.md` (start, new launch rows, review), `docs/braids-format.md` (the record's `role`), `braid help`.

**Why**: the launch prose becomes two calls that fail loudly (limits, branch, model, title) instead of steps the coordinator must remember.

**Validation**: `test/launch.test.ts` (7 tests, on a temporary repository with a test BRAID.md): the input for worker, review and research with models by tier and kind, options as an object, exit 3 on pause with no branch and no event, a second worker launch changing nothing, the child record with its role, `braid review` unchanged, an old record without role reading as review, bad arguments. `test/cli.test.ts` lists `launch` among the commands `main` handles itself. Gate (`npm run verify`): see the PR.

**Docs**: updated as above. `docs/decisions.md` and the skills are left to 0060/D and 0060/C.

**Open**: the researcher message has a fixed time box (20 minutes) and "the plan of <id>" as the decision it feeds, because the command has no flags for them; the coordinator can edit the printed `task`.

Decisions: none from the user. Mine: `--no-worktree` is a flag on `braid start` (not a separate function only) so a coordinator can run it by hand too; the base branch for the message is the braid branch for a strand and `main` for a story.
For later items: 0060/C: the skill's launch prose can now say "run `braid launch <id> --role <role>`, pass its output to `delegate_task`, then `braid launch ... --child <id>`"; the worker's message already tells it to read its own id from `orchestrator_capabilities`. 0060/B: records now carry `role` (`worker`), and a worker's record has T3's folder and branch, so `braid clean` and the board can read them. `--time-box` and `--decision` flags for research are not built.
Needs the user: none
