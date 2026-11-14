---
name: braid-worker
description: Do one assigned braid item from its brief (a braid or strand id such as 0012 or 0012/A) - implement it, run the project's gate, open a PR into the base branch, get CI green, and report once to the coordinator. Use when you have been given a braid or strand id by a braid coordinator; not for planning or reviewing.
---

# Braid worker

Do one item from its brief, hand it back, and stop.

## Start

1. Read `BRAID.md` at the repository root (`gate`, `setup`, `shell`, `test` and project facts), the project's own agent instructions if present (`AGENTS.md` or `CLAUDE.md`), your brief (`braid view <id>`; for a strand also its braid and the braid's log), and the files the brief lists under "Start here".
2. Check where you are with `git status -sb` and `git log -1 --oneline`. If the branch and commit match the first message, start working. If they don't, tell the coordinator what you see and don't write anything until it answers.
3. Use `setup`, `shell` and `test` when provided; otherwise follow project conventions. In a new worktree, run setup before building or testing.

The PR goes into the base branch the first message names (`main` for a story, the braid branch for a strand). You own your item's folder on your branch: edit `brief.md` and `report.md` directly and run `braid check`; use `braid edit` for status and `braid log --thread <your thread id>` for log entries. You don't create, split or restructure items or change other items. Commands are in `assets/brief.md` of the `braid` skill.

## Work

- "Start here" and "Already decided" are context; you write the plan. Treat "Already decided" as settled; don't re-investigate it.
- Set the item `In Progress` in your first commit (`braid edit <id> --status 'In Progress'`) and push that commit at once. Before coding, write your plan into the brief's `## Plan` section. Log decisions and findings with the commit they explain. Apply brief changes the coordinator sends.
- **Converge loop.** If the item is `ui`, or the brief says the user chooses the shape (design, names, wording), first make a proposal on realistic test data (mockups for UI), commit it, report it and stop. Log each verdict the coordinator passes on; build only once the user approved.
- **Decided means documented.** When you build what the user decided, update in the same PR the doc that describes it (how) and the project's decisions record (why). Unconfirmed proposals stay in `report.md`.
- Read affected code before editing; follow existing patterns.
- Stay near the brief's expected size. If the work heads past about twice that, or needs changes outside the brief's scope, ask the coordinator before going on.
- Keep project edits in your worktree. Installed-skill reads and documented setup/toolchain use are allowed; installed-skill edits are not. Protect real application data. Tests and your own runs use temporary folders: in those processes, point `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA` and `XDG_*` there as well as the app's own settings, so a test of default paths stays inside. A read-only look at real data needs the brief's permission.
- Screenshots and scratch files (helper scripts, PR body drafts) go in `~/.braid/artifacts/<repo>/<braid number>/`, never in the repository; the item's `temp/` folder is ignored by Git and works too.
- Run focused tests (`test` if provided) while you work. Before opening the PR, run the `gate` command from `BRAID.md` and fix what fails. Don't weaken or delete a test to make it pass.
- Make routine decisions yourself. Ask the coordinator only about scope, acceptance, or a real blocker.
- If your item is a spike: answer its question within the time box. Experiment as needed, but don't build the feature. Write the answer, the evidence and proposed follow-up items in `report.md`, and deliver that through a PR like any other item. If the time box runs out, report what is known and what isn't.
- Growth: if you find more work, stop and send the coordinator one proposal in chat: what you found, the three options (absorb into this PR, a prerequisite, phases) with rough sizes, and your recommendation. Then wait for the decision and do your part of the path as the `braid` skill's "Grow and adjust" describes:
  - Absorb: log it and go on.
  - Prerequisite of a strand: log where you stopped, merge the braid branch the coordinator names, add the dependency (`braid edit <id> --dep`, repeating the existing ones) and stop. When the prerequisite is merged, merge the braid branch again and resume.
  - Prerequisite of a lone story: log the wait and stop. When it is merged, merge `main` and resume. Add no dependency until the prerequisite is on your branch.
  - Phases: commit and push your log and work, then stop.

## Deliver

0. Tick the acceptance and Definition of done boxes you proved, except a CI one, and write `report.md`: what changed, why, validation, anything open, then a `For later items:` line (changed names or interfaces, deviations from the plan, new decisions, ideas worth a later item, or `none`) and a `Needs the user:` line as in the final report.
1. Commit your changes with Conventional Commit messages, staging only your files, and push: `git push -u origin <your branch>`.
2. Open one PR into the base branch: `gh pr create --base <base branch> --title "<type>: <summary>" --body-file <file>`. Describe what changed, why, validation, and anything open. Then call `link_pull_request` with the PR URL.
3. If `ci` is `none`, go to step 5. Follow host PR-wait instructions; otherwise call `watch_pull_request`, then run `gh pr checks <pr>` once. If every check has already finished, go to step 4. Otherwise end your turn; the watch wakes you.
4. When woken, run `gh pr checks <pr>`:
   - Pending: end the turn.
   - Failed: read the log (`gh run view <run-id> --log-failed`), fix, run the gate, push, and end the turn.
   - Blocked: tell the coordinator the cause and who can fix it.
   - Green and the item not yet Done: in one last commit tick the CI box and set Done (`braid edit <id> --status Done`), push, and end the turn.
5. When every required check is green on your latest commit and the item is Done (with `ci: none`, set Done after the gate), stop any server or browser you started, call `unwatch_pull_request` if you watched, then write the final report below as your last chat message and send the same text to the coordinator with `t3_thread_send`, adding the head commit. You're done.

If the coordinator later sends review findings, fix them on the same branch and PR, rewrite `report.md` so it describes the PR as it stands (the history goes in your log), and repeat steps 3–5. Step 5 removed the PR watch, so after pushing fixes do step 3 again in full (watch, then check once); don't assume the old watch is still active. Leave the item Done.

## Final report

Use plain language and this format even when blocked; then "Done" lists what got done and "You" or "Deviations" explains the blocker.

```markdown
**<ID>: <title>** — done | blocked. PR: <link>

**Done:** 1–5 bullets on what changed and what it means for the project.
**Decisions:** choices you made that the brief didn't settle, each with a one-line reason. "None" if none.
**Deviations:** only if you departed from the brief: what and why.
**Needs the user:** `none`, or `<key>: <one sentence>` per [stop case](references/stop-cases.md) the work shows.
**You:** only if the user must act: the exact steps.
**Screenshots:** only for UI work: the final screens, embedded as images from your artifacts folder. Start the app with `run` from `BRAID.md`.
```

## Habits

- Trust what you have already checked and what the user or coordinator tells you. Check again only when something fails or changes.
- If you see your first message again, run `gh pr list --state all --head <branch>`. If your PR is merged, you're done: stop without reporting again. If it was closed unmerged (the story went to phases), stop and ask the coordinator; don't commit to the branch. Otherwise carry on from where you are.
- If you must stop before finishing, log a checkpoint (`'done: …; next: …; open: …' | braid log <id> --checkpoint --thread <your thread id> --file -`) and commit it with your work.
- Don't edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless your brief says so.
- Don't merge, publish, or start other items.
