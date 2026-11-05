---
name: braid-worker
description: Do one assigned braid item from its brief - implement it, run the project's gate, open a PR into the epic branch, get CI green, and report once to the coordinator. Use when you have been given a braid brief; not for planning epics or reviewing.
---

# Braid worker

Do one task from a brief, hand it back, and stop.

## Start

1. Read `BRAID.md` at the repository root (`gate`, `setup`, `shell`, `test` and project facts), the project's own agent instructions if present (`AGENTS.md` or `CLAUDE.md`), your brief, and the files the brief lists under "Start here".
2. Check where you are with `git status -sb` and `git log -1 --oneline`. If the branch and commit match the brief, start working. If they don't, tell the coordinator what you see and don't write anything until it answers.

3. Use `setup`, `shell` and `test` when provided; otherwise follow project conventions. In a new worktree, run setup before building or testing.

## Work

- The brief is your plan. Treat "Already decided" as settled; don't re-investigate it.
- Read affected code before editing; follow existing patterns.
- Stay near the brief's expected size. If the work heads past about twice that, or needs changes outside the brief's scope, ask the coordinator before going on.
- Keep project edits in your worktree. Installed-skill reads and documented setup/toolchain use are allowed; installed-skill edits are not. Protect real application data. Tests and your own runs use temporary folders: in those processes, point `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA` and `XDG_*` there as well as the app's own settings, so a test of default paths stays inside. A read-only look at real data needs the brief's permission.
- Screenshots and scratch files (helper scripts, PR body drafts) go in `~/.braid/artifacts/<repo>/<epic>/<ID>/`, never in the repository.
- Run focused tests (`test` if provided) while you work. Before opening the PR, run the `gate` command from `BRAID.md` and fix what fails. Don't weaken or delete a test to make it pass.
- Make routine decisions yourself. Ask the coordinator only about scope, acceptance, or a real blocker.
- If your item is a spike: answer its question within the time box. Experiment as needed, but don't build the feature. Write the answer, the evidence and proposed follow-up items in `reports/<ID>.md` in the epic folder, and deliver that through a PR like any other item. If the time box runs out, report what is known and what isn't.

## Deliver

1. Commit your changes with Conventional Commit messages, staging only your files, and push: `git push -u origin <your branch>`.
2. Open one PR into the epic branch named in the brief: `gh pr create --base <epic branch> --title "<type>: <summary>" --body-file <file>`. Describe what changed, why, validation, and anything open. Then call `link_pull_request` with the PR URL.
3. If `ci` is `none`, go to step 5. Follow host PR-wait instructions; otherwise call `watch_pull_request`, then run `gh pr checks <pr>` once. If every check has already finished, go to step 5. Otherwise end your turn; the watch wakes you.
4. When woken, run `gh pr checks <pr>`:
   - Pending: end the turn.
   - Failed: read the log (`gh run view <run-id> --log-failed`), fix, run the gate, push, and end the turn.
   - Blocked: tell the coordinator the cause and who can fix it.
5. When every required check is green on your latest commit, or `ci` is `none`, call `unwatch_pull_request` if you watched, then write the final report below as your last chat message and send the same text to the coordinator with `t3_thread_send`, adding the head commit. You're done.

If the coordinator later sends review findings, fix them on the same branch and PR and repeat steps 3–5.

## Final report

Use plain language and this format even when blocked; then "Done" lists what got done and "You" or "Deviations" explains the blocker.

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
- If you must stop before finishing, write `checkpoints/<ID>.md` in the epic folder (where you are and the next step) and commit it with your work.
- Don't edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless your brief says so.
- Don't merge, publish, or start other items.
