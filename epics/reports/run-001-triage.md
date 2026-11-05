# Run 001: findings triage

Date: 2026-11-05. Evidence: [run observations](run-001-chinese-trainer.md) and the skills at
`92c9feb`. Delivery: [epic 006](../braid/006-run-findings/epic.md), items A and B.

## Assessment

The simplified workflow worked. Workers started promptly, implemented their briefs, fixed review
findings in the same thread and delivered useful changes; reviews caught real bugs; the recaps
were readable. The run doesn't justify a rewrite or a supervision layer.

Two problems matter most. A test escaped its temporary data folder through an OS default and wrote
fixture data into the user's real `%LOCALAPPDATA%`; that needs real isolation, not more checking.
And the coordinator made 19 non-conventional commits for 5 items, plus a status-only PR after the
epic merged, because the skill required a commit per status change. The rest are missing project
facts (setup, shell, test command, `ci: none`) and a few coordinator habits: asking in prose,
reordering without asking, merging a UI item the user wanted to judge, not noticing a failed run.

## Triage

| Disposition | Findings | Decision |
| --- | --- | --- |
| Item A (P0) | 53, 56, 59 | Workers stay in their worktree; tests point the OS home and app-data variables at temporary folders, not only the app's own settings. A read-only look at real data needs the brief's permission. |
| Item A | 8, 9a, 13, 14, 19, 22, 46, 51 | `BRAID.md` gains optional `shell`, `setup` and `test`; `ci: none` is defined; models use exact IDs and option keys, omitted options mean host defaults. Scratch files go to `~/.braid/artifacts/`. A replayed prompt checks `gh pr list --state all` and stops if merged. |
| Item B (user priority) | 66, 68 | One coordinator commit per milestone, Conventional Commits, `ready for main` before the final PR and nothing after the user's merge. |
| Item B | 6, 7, 15, 26, 30, 31, 32, 38, 40, 41, 44, 45, 47, 48, 50, 54, 64 | Ground rules: own worktree, question tool or lettered fallback, thread names. New items at the end, ask before reordering. `UI: yes` items are merged by the user, with final screenshots in the recap. One retry for a failed run. Interrupt a worker whose PR merged. Docs errors go back to the worker. Tier L gets a second look after substantial fixes. Thread links in the table. |
| Host issue, mitigated by A and B | 18, 21, 25, 37 | Replayed prompts and unfinished runs are T3 or provider behavior; report them there. The replay rule (A) and interrupting merged workers (B) limit the damage. The PR-merge trigger remains a hypothesis. |
| Host request | 40 | Ask T3 for a question tool usable by Cursor-provider threads. |
| Deferred | 23, 67 | Model-display mismatch unconfirmed; bot identity for agent commits is separate work. |
| No change | 10, 33, 65 | Observer's corrected diagnosis; that run's Bugbot configuration; T3 checkpoint refs aren't project commits. |
| Keep doing | 1–5, 9, 11, 12, 16, 17, 20, 24, 27–29, 34–36, 39, 42, 43, 49, 52, 55, 57, 58, 60–63 | Evidence that the workflow works, not new rules. |

## Limits

Both items replace wording rather than add it; each brief gives the exact text and a word cap per
file. Coordinator skill at most 1,400 words (1,258 before), worker at most 850 (735 before).

After the user merges the epic and reinstalls the skills, the next ordinary product run is the
check: conventional, batched coordinator commits; setup without guessing; tests on temporary data;
a UI item waiting for the user's merge with usable screenshots.
