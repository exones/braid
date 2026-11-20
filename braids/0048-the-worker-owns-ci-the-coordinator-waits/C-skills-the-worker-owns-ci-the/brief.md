---
id: '0048/C'
title: "Skills: the worker owns CI, the coordinator waits in the foreground"
status: Done
labels: ["kind:story", "tier:M", "ask:process"]
dependencies: ['0048/A']
order: 30
---

## Goal

The braid skills make the worker the only one who waits on an item PR's CI, and give every coordinator wait a wake that can't be lost: the worker's report for item PRs, a PR watch for the planning and final PRs, a foreground `braid wait` for the braid branch, and a `delegate_task` result for reviewers.

Expected size: about 130 lines in 5 files, mostly skill text.

## Start here

- Inbox idea `2026-11-20-80k2`: the evidence and the "Coordinator habits" list.
- `.agents/skills/braid/SKILL.md`: "Run an item" steps 3 and 4 (Wait, Watch), "Accept and hand over" step 3 (Checks), and the "Say waiting" line under "Talking to the user".
- `.agents/skills/braid/references/autonomy.md`, "Merging" step 4: today it runs `braid wait` as a background command and waits with `t3_background_wait`.
- `.agents/skills/braid/references/workflow.md`, "Checks and reports".
- `.agents/skills/braid-worker/SKILL.md`, "Deliver" steps 3 to 5: the worker's CI loop, which stays.
- `docs/decisions.md`: D71.

## Change

- `SKILL.md`, "Run an item": no `watch_pull_request` on an item PR. After launching a worker or sending it fixes, wait with `t3_thread_wait`. When that returns without a report while the worker waits on its own PR watch, end the turn: its report wakes you. A worker that stopped with no watch and no report gets a nudge, as now.
- `SKILL.md`, "Accept and hand over" step 3: one `gh pr checks` read. On red, send the PR back to the worker; on pending, tell the worker CI isn't finished and end the turn.
- `autonomy.md`, "Merging" step 4: wait for braid-branch CI in the foreground with `braid wait <number> --timeout <under 10>`, and call it again on the "still running" code from 0048/A. No background command.
- The "Say waiting" line: only the worker's message, a PR watch on the planning or final PR, a `delegate_task` result, or a foreground wait running now.
- Coordinator habits from the idea, kept short:
  - after a wake or a resume, check the state first (branches, worktrees, worker threads, `braid next`);
  - run nothing in parallel with `t3_thread_wait`;
  - a "STOP" result during a wait is an incoming message, not the user;
  - after "session ended", re-check before retrying (0048/B makes `braid start` safe to retry).
- `docs/decisions.md`: a new decision that replaces D71's background wait and says the worker alone watches item-PR CI, with the reason (the idea's evidence and 0044's interrupted wait), plus a dated note on D71.

## Already decided

- The worker skill's CI loop doesn't change, except wording that names the coordinator's watch.
- Planning and final PRs keep the coordinator's PR watch.
- The skills change only at the user's request, which this braid is; the user merges the final PR into `main`.

## Out of scope

- CLI code (0048/A and 0048/B).

## Completion

- [x] No skill text sets a coordinator watch on an item PR or tells any agent to wait on a background command; `rg -n "background" .agents/skills` shows no such instruction.
- [x] `autonomy.md` waits for braid-branch CI with the bounded foreground `braid wait` and its exit codes from 0048/A.
- [x] The "Say waiting" line lists only reliable wakes, and the coordinator habits are in the skill.
- [x] The new decision and the dated note on D71 are in `docs/decisions.md`.
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
