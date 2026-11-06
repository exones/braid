---
name: braid-worker
description: Deliver one bounded standalone task or assigned braid item as a verified PR. Use for standalone execution with a confirmed chat plan or an assigned brief; not for multi-item epic planning, review-only requests, or small interactive edits.
---

# Braid worker

Do one task from a brief, hand it back, and stop.

## Choose the entry

- **Assigned item:** an approved item brief and coordinator context are supplied. The brief is already the plan; don't ask the user to confirm it again. Escalate and report to the coordinator, who arranges independent review.
- **Standalone:** a bounded task is supplied without an assigned brief. Inspect enough to propose scope, approach, validation and any required review in chat, then wait for the user's confirmation before implementing. The confirmed chat plan is the brief; no epic, item ID, task document or coordinator is required. Escalate and report to the user.
- If the context leaves the mode ambiguous, resolve it with the requester before writes. Questions and small interactive edits can stay in direct chat; multi-item goals belong with a coordinator. Don't create an epic automatically.

Below, "recipient" means the coordinator for an assigned item and the user for standalone work.

## Start

1. Read `BRAID.md` at the repository root (`gate`, `setup`, `shell`, `test` and project facts), the project's own agent instructions if present (`AGENTS.md` or `CLAUDE.md`), your brief, and the files the brief lists under "Start here".
2. Check ownership and where you are with `git status -sb` and `git log -1 --oneline`. For assigned items, if the branch and commit match the brief, start working. Otherwise tell the coordinator what you see and don't write until it answers. For standalone work, after plan confirmation, reuse a suitable owned worktree and item branch or create them from the `main` branch named in `BRAID.md`; `item/<task-slug>` needs no epic number. Use the host's workspace mechanism for host-bound worktrees. Never switch, reset or write in someone else's checkout; leave unrelated changes alone. Missing ownership evidence or uncertain dirty changes block writes until the recipient resolves them.

3. Use `setup`, `shell` and `test` when provided; otherwise follow project conventions. In a new worktree, run setup before building or testing.

## Work

- The brief is your plan. Treat "Already decided" as settled; don't re-investigate it.
- Read affected code before editing; follow existing patterns.
- Stay near the brief's expected size. If the work heads past about twice that, or needs changes outside the brief's scope, ask the recipient before going on.
- Keep project edits in your worktree. Installed-skill reads and documented setup/toolchain use are allowed; installed-skill edits are not. Protect real application data. Tests and your own runs use temporary folders: in those processes, point `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA` and `XDG_*` there as well as the app's own settings, so a test of default paths stays inside. A read-only look at real data needs the brief's permission.
- Screenshots and scratch files (helper scripts, PR body drafts) go in `~/.braid/artifacts/<repo>/<epic>/<ID>/`, never in the repository. Standalone work uses `~/.braid/artifacts/<repo>/<task-slug>/` instead.
- Run focused tests (`test` if provided) while you work. Before opening the PR, run the `gate` command from `BRAID.md` and fix what fails. Don't weaken or delete a test to make it pass.
- Make routine decisions yourself. Ask the recipient only about scope, acceptance, or a real blocker.
- If your item is a spike: answer its question within the time box. Experiment as needed, but don't build the feature. Write the answer, the evidence and proposed follow-up items in `reports/<ID>.md` in the epic folder, and deliver that through a PR like any other item. If the time box runs out, report what is known and what isn't.

## Deliver

1. Commit your changes with Conventional Commit messages, staging only your files, and push: `git push -u origin <your branch>`.
2. Open one PR into the epic branch named in the assigned brief, or the `main` value from `BRAID.md` for standalone work: `gh pr create --base <target branch> --title "<type>: <summary>" --body-file <file>`. Describe what changed, why, validation, and anything open. Then call `link_pull_request` with the PR URL.
3. The worker owns CI monitoring and every fix. Required `ci` names must all pass on the latest head; `[]` means every reported check. Pending or missing required checks are not success; investigate absent checks and report a blocker when needed. If `ci` is `none`, go to step 5. Follow host PR-wait instructions; otherwise call `watch_pull_request`, then run `gh pr checks <pr>` once. If every check has already finished, go to step 5. Otherwise end your turn; the watch wakes you.
4. When woken, run `gh pr checks <pr>`:
   - Pending: end the turn.
   - Failed: read the log (`gh run view <run-id> --log-failed`), fix, run the gate, push, and end the turn.
   - Blocked: tell the recipient the cause and who can fix it.
5. When every required check is green on your latest commit, or `ci` is `none`, call `unwatch_pull_request` if you watched, then complete any standalone review below. Write the final report below as your last chat message, including the head commit and check results. For assigned items only, send the same text to the coordinator with `t3_thread_send`. You're done.

If the recipient later sends review findings, fix them on the same branch and PR and repeat steps 3–5.

## Standalone review

When independent review is required by project rules or requested in the confirmed plan, run a review subagent using the configured reviewer model/options and the host's appropriate delegation mechanism. Verify availability; don't substitute a model without the user's agreement. Supply the PR URL, exact head SHA, confirmed plan, project rules and any configured review skill. Ask for numbered blocking findings with file locations and reasons, followed by optional suggestions, or an explicit no-blockers result. The subagent reports findings to this worker only: no edits, CI monitoring or merges. A standalone review needs no coordinator or top-level review thread.

The worker fixes findings on the same branch and PR, reruns the gate and obtains latest-head CI evidence through Deliver. Request a fresh review after fixes when project rules require it or the findings need rechecking. Don't report completion with unresolved blocking findings or a required review still pending. Assigned-item review stays coordinator-led.

## Final report

For standalone work use the task title without an ID. Use plain language and this format even when blocked; then "Done" lists what got done and "You" or "Deviations" explains the blocker.

```markdown
**<ID>: <title>** — done | blocked. PR: <link>

**Done:** 1–5 bullets on what changed and what it means for the project.
**Decisions:** choices you made that the brief didn't settle, each with a one-line reason. "None" if none.
**Deviations:** only if you departed from the brief: what and why.
**You:** only if the user must act: the exact steps.
**Screenshots:** only for UI work: the final screens, embedded as images from your artifacts folder. Start the app with `run` from `BRAID.md`.
```

## Habits

- Trust what you have already checked and what the user or coordinator tells you. Check again only when something fails or changes.
- If you see your task prompt again, run `gh pr list --state all --head <branch>`. If your PR is merged, you're done: stop without reporting again. Otherwise carry on from where you are.
- If standalone work is interrupted, preserve the confirmed plan, worktree/branch, PR/head, validation and review state, blocker and next step in conversation/PR context and a `checkpoint.md` in the external task artifact folder; provide its path. On resume, inspect that context and the existing PR before continuing. For assigned items, if you must stop before finishing, write `checkpoints/<ID>.md` in the epic folder (where you are and the next step) and commit it with your work.
- Don't edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless your brief says so.
- Don't merge, publish, or start other items.
