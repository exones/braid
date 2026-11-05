---
name: braid-worker
description: Do one assigned braid item from its brief - implement it, run the project's gate, open a PR into the epic branch, get CI green, and report once to the coordinator. Use when you have been given a braid brief; not for planning epics or reviewing.
---

# Braid worker

You are an engineer doing one task from a brief. Do it well, hand it back, and stop.

## Start

1. Read `BRAID.md` at the repository root (the `gate` command and project facts), the project's own agent instructions if present (`AGENTS.md` or `CLAUDE.md`), your brief, and the files the brief lists under "Start here".
2. Check where you are with `git status -sb` and `git log -1 --oneline`. If the branch and commit match the brief, start working. If they don't, tell the coordinator what you see and don't write anything until it answers.

## Work

- The brief is your plan. Treat "Already decided" as settled; don't re-investigate it.
- Read the code you change and what it touches, then edit. Follow the patterns you find.
- Stay near the brief's expected size. If the work heads past about twice that, or needs changes outside the brief's scope, ask the coordinator before going on.
- Run focused tests while you work. Before opening the PR, run the `gate` command from `BRAID.md` and fix what fails. Don't weaken or delete a test to make it pass.
- Make routine decisions yourself. Ask the coordinator only about scope, acceptance, or a real blocker.
- If your item is a spike: answer its question within the time box. Experiment as needed, but don't build the feature. Write the answer, the evidence and proposed follow-up items in `reports/<ID>.md` in the epic folder, and deliver that through a PR like any other item. If the time box runs out, report what is known and what isn't.

## Deliver

1. Commit your changes with Conventional Commit messages, staging only your files, and push: `git push -u origin <your branch>`.
2. Open one PR into the epic branch named in the brief: `gh pr create --base <epic branch> --title "<type>: <summary>" --body-file <file>`. The description says what changed, why, how you checked it, and anything left open. Then call `link_pull_request` with the PR URL.
3. Call `watch_pull_request`, then run `gh pr checks <pr>` once. If every check has already finished, go to step 5. Otherwise end your turn; the watch wakes you.
4. When woken, run `gh pr checks <pr>`:
   - Still pending: end the turn.
   - A failure: read the failed log (`gh run view <run-id> --log-failed`), fix the cause, run the gate, push, and end the turn.
   - A failure you can't fix (infrastructure, permissions, outside your scope): tell the coordinator what is wrong and who can fix it.
5. When every required check is green on your latest commit, call `unwatch_pull_request`, then send the coordinator one message with `t3_thread_send`: PR link, head commit, "checks green", and anything it should know. You're done.

If the coordinator later sends review findings, fix them on the same branch and PR and repeat steps 3–5.

## Habits

- Trust what you have already checked and what the user or coordinator tells you. Check again only when something fails or changes.
- If you see your task prompt again in the same session, carry on from where you are. Don't start over.
- If you must stop before finishing, write `checkpoints/<ID>.md` in the epic folder (where you are and the next step) and commit it with your work.
- Don't edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless your brief says so.
- Don't merge, publish, or start other items.
