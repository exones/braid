---
name: braid-worker
description: Do one assigned braid item from its brief (a braid or strand id such as 0012 or 0012/A) - implement it, run the project's gate, open a PR into the base branch, get CI green, and report once to the coordinator. Use when you have been given a braid or strand id by a braid coordinator; not for planning or reviewing.
---

# Braid worker

Do one item from its brief, hand it back, and stop.

## Start

1. Read `BRAID.md` at the repository root (`gate`, `setup`, `shell`, `test` and project facts), the project's own agent instructions if present (`AGENTS.md` or `CLAUDE.md`), your brief (`braid view <id>`; for a strand also its braid and the braid's log), the braid's preset (`braid autonomy <number>`), and the files the brief lists under "Start here".
2. Check where you are with `git status -sb` and `git log -1 --oneline`. If the branch and commit match the first message, start working. If they don't, tell the coordinator what you see and don't write anything until it answers.
3. Use `setup`, `shell` and `test` when provided; otherwise follow project conventions. In a new worktree, run setup before building or testing.

The PR goes into the base branch the first message names (`main` for a story, the braid branch for a strand). You own your item's folder on your branch: edit `brief.md` and `report.md` directly and run `braid check`; use `braid edit` for status and `braid log --thread <your thread id>` for log entries ("Your thread id" in the first message, never the thread you send your result to). You don't create, split or restructure items or change other items. Commands are in [the brief template](../braid/assets/brief.md).

## Work

- "Start here" and "Already decided" are context; you write the plan. Treat "Already decided" as settled; don't re-investigate it.
- Set the item `In Progress` in your first commit (`braid edit <id> --status 'In Progress'`) and push that commit at once. Before coding, write your plan into the brief's `## Plan` section. Log decisions and findings with the commit they explain. Apply brief changes the coordinator sends.
- **Converge loop.** If the item is `ui`, or the brief says the user chooses the shape (design, names, wording), first make a proposal on realistic test data (mockups for UI), commit it, report it and stop. Log each verdict the coordinator passes on; build only once the user approved.
- **Context first.** Whatever is meant for the user (a proposal, a question, the `Needs the user` and `You` lines) starts with one or two short sentences of context: what it is about and why it comes up now, enough to answer without reading anything else. Name the thing itself, never a list number.
- **Docs stay true.** In the same PR, update every doc from `docs` in `BRAID.md` (without it, `README.md` and `docs/`) that your change makes untrue or incomplete, and the project's decisions record for what the user decided. This holds whenever your brief has the docs Completion box; with `docs.update: on-demand` and no box, only the user's decisions are documented (the doc that describes it, and the decisions record). Docs that need the user's go (`AGENTS.md`, `CLAUDE.md`, `BRAID.md`, skills) go under `For later items:` as proposals, unless your brief allows editing them. Unconfirmed proposals stay in `report.md`.
- Read affected code before editing; follow existing patterns.
- Stay near the brief's expected size. If the work heads past about twice that, or needs changes outside the brief's scope, ask the coordinator before going on.
- Keep project edits in your worktree. Installed-skill reads and documented setup/toolchain use are allowed; installed-skill edits are not. Protect real application data. Tests and your own runs use temporary folders: in those processes, point `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA` and `XDG_*` there as well as the app's own settings, so a test of default paths stays inside. A read-only look at real data needs the brief's permission.
- Screenshots and scratch files (helper scripts, PR body drafts) go in `~/.braid/artifacts/<repo>/<braid number>/`, never in the repository; the item's `temp/` folder is ignored by Git and works too.
- Run focused tests (`test` if provided) while you work. Before opening the PR, run the `gate` command from `BRAID.md` and fix what fails. Don't weaken or delete a test to make it pass.
- Make routine decisions yourself. Ask the coordinator only about scope, the Completion boxes, or a real blocker.
- A [stop case](../braid/references/stop-cases.md) on the preset's "decide yourself" side: decide it and log it as `Decided:` (stop cases, "Who records what"). Your `Needs the user` holds only cases on its "ask me" side, or where unsure.
- If your item is a spike: answer its question within the time box by the Method in [braid-researcher](../braid-researcher/SKILL.md); experiment as needed, but don't build the feature. Write `report.md` in that skill's Report shape, plus follow-up items, and the sources in `sources.md`, and deliver that through a PR like any other item. If the time box runs out, report what is known and what isn't.
- A side question your item needs that the code doesn't answer: launch a researcher subagent the way the coordinator does ([braid](../braid/SKILL.md), "Plan" step 2), with your item's id. Put its findings into `report.md` or the brief, citing source ids, and record the sources you use in the item's `sources.md`.
- Growth: if you find more work, stop and send the coordinator one proposal in chat: what you found, the three options (absorb into this PR, a prerequisite, phases) with rough sizes, and your recommendation. Then wait for the decision and do your part of the path as the `braid` skill's "Grow and adjust" describes:
  - Absorb: log it and go on.
  - Prerequisite of a strand: log where you stopped, merge the braid branch the coordinator names, add the dependency (`braid edit <id> --dep`, repeating the existing ones) and stop. When the prerequisite is merged, merge the braid branch again and resume.
  - Prerequisite of a lone story: log the wait and stop. When it is merged, merge `main` and resume. Add no dependency until the prerequisite is on your branch.
  - Phases: commit and push your log and work, then stop.

## Deliver

0. Tick the Completion boxes you proved, and write `report.md` as [the brief template](../braid/assets/brief.md#work-on-it) shows: what changed, why, validation, the docs you updated (or that none were affected), anything open, then the `For later items:` and `Needs the user:` lines.
1. Commit your changes with Conventional Commit messages, staging only your files, and push: `git push -u origin <your branch>`.
2. Open one PR into the base branch: `gh pr create --base <base branch> --title "<type>: <summary>" --body-file <file>`. Describe what changed, why, validation, and anything open. Then call `link_pull_request` with the PR URL.
3. If `ci` is `none`, go to step 5. Follow host PR-wait instructions; otherwise call `watch_pull_request`, then run `gh pr checks <pr>` once. If every check has already finished, go to step 4. Otherwise end your turn; the watch wakes you. You are the only one who waits on this PR's CI: the coordinator doesn't watch it and learns the result from your report.
4. When woken, run `gh pr checks <pr>`:
   - Pending: end the turn.
   - Failed: read the log (`gh run view <run-id> --log-failed`), fix, run the gate, push, and end the turn.
   - Blocked: tell the coordinator the cause and who can fix it.
   - Green: go to step 5. Make no commit after green and don't set the item Done: the coordinator accepts with `braid accept` after review.
5. When every required check is green on your latest commit (with `ci: none`, once the gate passed), stop any server or browser you started, call `unwatch_pull_request` if you watched, then write the final report below as your last chat message and send the same text to the coordinator with `t3_thread_send`, adding the head commit. You're done.

If the coordinator later sends review findings, fix them on the same branch and PR in one push per round (each push runs CI), rewrite `report.md` so it describes the PR as it stands (history goes in your log), and repeat steps 3–5. Step 5 removed the PR watch, so after pushing do step 3 again in full (watch, then check once). Leave the status `In Progress`.

## Final report

Use plain language and this format even when blocked; then "Done" lists what got done and "You" or "Deviations" explains the blocker.

```markdown
**<ID>: <title>** — done | blocked. PR: <link>

**Done:** 1–5 bullets on what changed and what it means for the project.
**Decisions:** choices you made that the brief didn't settle, each with a one-line reason. "None" if none.
**Deviations:** only if you departed from the brief: what and why.
**Needs the user:** `none`, or per [stop case](../braid/references/stop-cases.md) the work shows `<key>: <what it is about, then what is needed>`.
**You:** only if the user must act: what it is for, then the exact steps.
**Screenshots:** only for UI work: the final screens, embedded as images from your artifacts folder. Start the app with `run` from `BRAID.md`.
```

## Habits

- Trust what you have already checked and what the user or coordinator tells you. Check again only when something fails or changes.
- If you see your first message again, run `gh pr list --state all --head <branch>`. If your PR is merged, you're done: stop without reporting again. If it was closed unmerged (the story went to phases), stop and ask the coordinator; don't commit to the branch. Otherwise carry on from where you are.
- If you must stop before finishing, log a checkpoint (`'done: …; next: …; open: …' | braid log <id> --checkpoint --thread <your thread id> --file -`) and commit it with your work.
- Don't edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless your brief says so.
- Don't merge, publish, or start other items.
- **Pause message** (`Pause for <provider> …`, a provider is near its usage limit): do what it says: finish or undo your current step, commit and push your WIP, log a checkpoint, send `Paused: <id> at <sha>` (`<id>` is your item id, such as `0064/D`, never a thread id) to the thread the message names (the board's steering thread, or your coordinator) and end your turn. Start no new work until `Resume:`; if something wakes you meanwhile, note it, reply briefly only with your item's CI result if that is what woke you, and end your turn again.
- **`Resume: continue <id> from your checkpoint`:** read your last checkpoint (`braid view <id>` and your log) and go on from there.
