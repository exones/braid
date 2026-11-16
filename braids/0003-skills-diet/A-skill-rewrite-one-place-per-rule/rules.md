# 0003/A: what happened to each rule

Every rule that was removed, merged, moved or reworded, with its old text, its new text or place, and why. A rule not listed here is unchanged, word for word (W15 lists the trims of a word or two). Old text is from commit `862cbaf`.

Files: **S** `braid/SKILL.md`, **W** `braid/references/workflow.md`, **B** `braid/assets/brief.md`, **SC** `braid/references/stop-cases.md`, **WK** `braid-worker/SKILL.md`, **RV** `braid-reviewer/SKILL.md`. New files: `auto-mode.md`, `resuming.md`, `setup.md`, all in `braid/references/`.

How to read it:

- **Part 1** is the one new rule.
- **Part 2**: the six contradictions, and which side won.
- **Part 3**: rules that were stated in several places and are now stated once. The wording of the surviving copy is unchanged unless the entry says so.
- **Part 4**: rules that moved to a reference file without a change of wording.
- **Part 5**: rules whose wording changed. Old and new side by side.
- **Part 6**: text removed with nothing in its place.

One principle decides where a duplicate survives. What is true for every role (items, writers, Done, branches, tiers, who merges) is stated in the workflow. What one role does is stated in that role's skill. A step may still *name* a rule in a few words with a link, and a role's skill keeps the short line for what that role itself does, because a worker or reviewer reads only its own skill.

## Part 1: new

**N1. Context first** (user, 2026-11-16)

- New, S "Talking to the user": "**Context first.** Start every question or decision for the user with one or two short sentences of context: what it is about and why it comes up now, enough to answer without reading anything above. Name the thing itself (the item's title, the file, the PR), never "option 2" of an earlier message. This holds for a stop, a recap's "Needs the user" and "You", a `braid ask` text and a plan question, and for a worker's or reviewer's question you pass on."
- New, WK "Work": "**Context first.** Whatever is meant for the user (a proposal, a question, the `Needs the user` and `You` lines) starts with one or two short sentences of context: what it is about and why it comes up now, enough to answer without reading anything else. Name the thing itself, never a list number."
- New, RV "Check": "The user reads this line without the rest of the review: say what it is about, then what is needed."
- The templates follow it. `Needs the user` was "`<key>: <one sentence>`" and is now "`<key>: <what it is about, then what is needed>`" in the recap (S), the worker's final report (WK), `report.md` (B), the reviewer's comment (RV) and SC. The worker's `You` line was "the exact steps" and is now "what it is for, then the exact steps".
- Why: the user had to ask back about almost every input braid asked for.

## Part 2: contradictions, and which side won

**C1. When a goal's braid goes In Progress** (PR #50 leftover)

- Old, S "Ground rules": "Only a goal's braid is yours from the start: `In Progress` in its branch's first commit, `Done` at the end."
- Old, S "Ground rules", W table: "the braid In Progress in its branch's first commit after the planning merge".
- Won: "after the planning merge". The braid branch's first commit is the planning merge itself, so the shorter wording named the wrong commit.
- New, W "One writer per branch": "A goal's braid item is the coordinator's from the start: `In Progress` in the first commit after the planning merge, `Done` at the end." S "Plan" step 5 keeps the action: "Then pull the braid branch and set the braid `In Progress` in its next commit."

**C2. May braid merge a story or the final PR?** (PR #50 leftover)

- Old, S description: "hand each PR to the user to merge (unless they ask braid to, or auto mode merges a strand into its braid branch; never a story or the final PR into main)". This reads as "never", whoever asks.
- Old, S "Merge on request": "A story or the final PR is already Done at that head, so it only merges." So on request it may.
- Won: "Merge on request". Only auto mode never merges into `main`.
- New, S description: "braid merges a PR itself only when the user asks, or in auto mode a strand into its braid branch (auto mode never merges into main)."
- New, W "Who merges": "The user merges, whatever the tier. The coordinator merges in two cases only: the user explicitly asks it to merge a PR ("Merge on request" in the skill); this may be any PR, including a story or the final PR into `main`; [auto mode] is on for a goal: then it merges that goal's strand PRs into the braid branch, and never anything into `main`."

**C3. When a grown story's braid goes Done** (PR #50 leftover)

- Old, W table, grown story: "the braid stays In Progress until the final PR".
- Old, S "Finish": the braid is set Done with `braid done` after the final PR is reviewed and green, before it is handed over. So it is Done before that PR merges, not "until the final PR".
- Won: "Finish", which matches what `braid done` does.
- New, W table: "the braid stays In Progress and from here follows the planned goal", whose row says "the braid Done on it before the final handover".

**C4. How many rounds before `ask:quality`**

- Old, S "Ground rules" and SC: "still blocking after two fix rounds".
- Old, S "Auto mode": "on more than 2 blocking review rounds".
- Won: "after two fix rounds". The two counts differ by one round, and the stop-cases file already used this one.
- New, S "Accept and hand over" step 1: "Still blocking after two fix rounds: add the `ask:quality` label to the item (`braid edit <id> --labels`, repeating the others)." `auto-mode.md`: "when a review is still blocking after two fix rounds (`quality`; the skill's review step adds the `ask:quality` label)".

**C5. What "For later items" holds**

- Old, WK "Deliver": "changed names or interfaces, deviations from the plan, new decisions, ideas worth a later item, or `none`".
- Old, B: "changed names or interfaces, deviations from the plan, new decisions, or `none`".
- Won: the worker's list, with the ideas. The user wants ideas found along the way proposed there.
- New, B `report.md` template: "For later items: <changed names or interfaces, deviations from the plan, new decisions, ideas worth a later item, or none>". WK points to that template instead of repeating the list.

**C6. The coordinator on a worker's branch, and the CI box**

- Old, S "Ground rules": "Never commit to a branch a worker holds", with no exception.
- Old, W "One writer per branch": "except the Done stamp `braid done` commits on a story's or the final PR's branch after its worker has stopped (D43)".
- Won: the workflow, with the exception. It is what `braid done` does.
- New, W: "The coordinator never commits to a branch a worker holds. The one exception is the Done stamp that `braid done` commits on a story's or the final PR's branch after its worker has stopped." "(D43)" is dropped: it points into this repository's decisions, which other projects don't have.
- Also old, WK "Deliver": "(leave a CI box to `braid done`, which checks CI)", while B said "briefs have no CI box". Won: there is no CI box. New, B: "there is no CI box, braid done checks CI". The worker's remark is removed.

## Part 3: stated once now

**M1. Who sets Done, and what `braid done` checks**

- Old places: S "Ground rules" ("Its worker sets `In Progress` in its first commit and never sets `Done`; you mark an item Done with `braid done`, where you hold the base: a strand after its merge, on the braid branch; a story or the final PR in a status-only commit on its branch before the handover."), S "Accept" step 2 ("it checks the PR (base, head, checks, mergeable, boxes, `report.md`, no running worker), commits Done on its branch and prints the new head"), S "Finish" ("(`braid done` set Done in it before the handover)"), W "One writer per branch", W table (three rows), B (command comments and "Every refusal names the failed condition and changes nothing.").
- Now: W "One writer per branch", the **Done** bullet, wording unchanged apart from the refusal sentence joined to it: "a refusal names the condition that failed and changes nothing".
- Elsewhere only the action remains: S "Ground rules" ("One writer per branch, and Done is yours through `braid done`: the workflow says who holds what."), S "Accept" steps 4 and 5 (the commands), B (the commands), WK (the worker never sets Done).
- Why: seven places, and C1 and C6 show the copies had drifted.

**M2. One writer per branch; who creates items**

- Old places: S "Ground rules" ("Only you create or restructure items; a worker proposes them." and "One writer per branch (workflow). You hold `plan/<slug>`, then the braid branch, and a new story's branch only until launch. Never commit to a branch a worker holds, or in the user's checkout. Work in your own worktree."), W "One writer per branch", B intro ("The coordinator creates it; its worker owns it from then on.").
- Now: W "One writer per branch": "The **coordinator** holds `plan/<slug>`, then the braid branch, and a new story's branch only until the worker is launched; for a lone story it holds no branch after launch. Only it creates and restructures items, on a branch it holds; a worker proposes them. It works in its own worktree, on the branch it holds, and never commits in the user's checkout."
- Kept as the role's own line: WK "You don't create, split or restructure items or change other items."

**M3. "Already decided" and "Start here" are context**

- Old places: S "Ground rules" ("A brief's "Already decided" and "Start here" are context, not a plan; the worker writes the plan."), WK "Work", B template ("<a fact or choice; don't re-investigate>").
- Now: in the template itself (B), where the coordinator fills it in: "Start here ... context, not a plan: the worker writes the plan" and "Already decided: <a fact or choice; settled, not to be re-investigated>". WK keeps the worker's line unchanged.

**M4. Conventional Commits**

- Old places: S "Ground rules" ("Every commit uses Conventional Commits; yours are `docs(braids): …`"), W "Branches per case", WK "Deliver".
- Now: W "Every commit uses Conventional Commits." S keeps only its own part: "Your commits are `docs(braids): …`, for example `docs(braids): 0012 phases: add 0012/A, 0012/B`." (one example instead of two). WK unchanged.

**M5. Skill edits are tier L**

- Old places: S "Ground rules" ("work that changes them is tier L"), W "Tiers" table.
- Now: the W table only. S keeps the ban itself, unchanged.

**M6. What a story, a goal and an Outline are; the lowest tier; real dependencies**

- Old places: S "Plan" step 2 ("Work for one PR is a **story**: a braid without strands...") and step 3 ("the lowest tier that fits, a few testable acceptance criteria, real dependencies only, `order` in run order, an `ask:<key>` label for each stop case the plan already shows"), W "Items are braids" and "Tiers", B "Fields" (the Outline definition, dependencies, order, labels).
- Now: definitions in W "Items are braids" (the Outline sentence moved there from B: "An `Outline` holds only the goal, what works at the end, strand titles and open questions. It is never started as it is: the coordinator details it into a full brief when its turn comes."); "pick the lowest that fits" in W "Tiers"; dependencies, order and labels in B "Fields".
- S "Plan" keeps the decision, shorter: "2. Decide the shape: work for one PR is a story; anything bigger, or with phases, is a goal with strands, each small enough for one PR. Items further out, or that depend on a spike, may stay `Outline`." and "3. Draft the briefs from the brief template, each with a few testable acceptance criteria."

**M7. The braid's log entry**

- Old places: W "Items are braids" ("one entry per merged strand, written before the next strand starts"), B ("after each strand merges into the braid branch, and before the next strand's branch is cut, the coordinator adds one entry on the braid branch, in the commit that sets the strand Done"), S "Accept" step 3.
- Now: B "Work on it", as a comment on the example: "the braid's log entry, on standard input of the braid done that sets the strand Done, so it is written before the next strand's branch is cut". W says only that the log exists and who reads it; S step 5.3 gives the command.

**M8. Spikes**

- Old places: W "Items are braids", B ("A spike's answer, evidence and proposed follow-ups are its `report.md`; the worker proposes follow-ups, the coordinator creates them."), WK "Work", S "Accept" step 3.
- Now: W: "**spike** (a time-boxed question; the answer, evidence and proposed follow-ups are its report, and the coordinator turns the follow-ups into briefs)". WK (what the worker does) and S step 5.5 (what the coordinator does) unchanged. The B sentence is removed.

**M9. Converge loop**

- Old places: W "Checks and reports", S "Run an item" step 5 ("show it to the user ... and send each verdict to the worker, which logs it at once; repeat until the user approves, then tell the worker to build"), WK "Work".
- Now: the rule in W, unchanged. S step 6 keeps the coordinator's part: "when the worker stops with a proposal, show it to the user (`braid ask <id> "<what is needed>" --kind decision`) and send each verdict to the worker. When the user approves, tell the worker to build." WK unchanged.

**M10. Decided means documented**

- Old places: W "Checks and reports" and WK "Work", the same sentence twice.
- Now: WK only, unchanged. It is the worker who does it.

**M11. A run that failed; a worker without a report**

- Old places: S "Run an item" step 3 ("A run that failed: read its error and retry once with the same model and settings; if it fails again, `braid ask`, naming the error."), W "Failure modes" ("If the PR is merged, the item is done. Else read its `report.md`, log and the PR; retry once with the same model and settings; then `braid ask`, naming the error.").
- Now: S step 3, with the two merged: "The PR is already merged: the item is done." and "The run failed: read its error, and the item's `report.md`, log and PR. Retry once with the same model and settings; if it fails again, `braid ask`, naming the error." The W row points there.

**M12. Growth beyond the mandate**

- Old places: S "Grow and adjust" ("...goes to the user first (`braid ask <id> "<what is needed>" --key scope`); the worker waits at a clean point."), W "Failure modes" ("Tell the worker to stop at a clean point and note where it is. `braid ask` the user. Record the answer in the braid's log.").
- Now: S "Mandate": "Anything more, new tier L work, or a change to the goal or acceptance criteria goes to the user first (`braid ask <id> "<what is needed>" --key scope`); tell the worker to stop at a clean point and note where it is." Recording the answer is the general rule in S "Talking to the user". The W row points there.

**M13. Growth paths: each side once**

- Old: S "Grow and adjust" and WK "Work" both described both sides of each path. For example S: "**Absorb:** tell the worker; it logs it." and "**Prerequisite of a lone story:** the dependency can't resolve until the prerequisite is on the story's branch. Create it as its own story into `main`; the worker logs the wait and stops; when it is merged, the worker merges `main` and resumes."
- Now: S has the coordinator's steps ("**Absorb:** tell the worker." "**Prerequisite of a lone story:** create it as its own story into `main`, and tell the worker when it is merged."), and says "Its own steps are in its skill; these are yours." WK has the worker's steps, unchanged.

**M14. Red CI on a braid branch**

- Old places: S "Fixes", S "Auto mode" ("Red: a fix strand as in "Fixes"; a second red is a stop (`quality`)."), W "Failure modes" ("Add a tier S fix strand and run it before the next item. A second red is a stop (`quality`).").
- Now: S "Fixes": "Add a tier S fix strand at the end of the braid, with no dependencies, and run it before the next item. A second red on the braid branch is a stop (`quality`)." `auto-mode.md` and the W row point there.

**M15. A head that moved**

- Old places: S "Merge on request", W "Failure modes" ("Don't merge. Show the user what changed and `braid ask`; in auto mode get the new head reviewed.").
- Now: S "Merge on request" ("don't merge: show what changed and `braid ask`"); the auto-mode half is condition 7 in `auto-mode.md`. The W row points to both.

**M16. Dropped strands**

- Old places: W "Items are braids", S "Adjusting the plan" ("A dropped strand's folder is removed (`git rm -r`) after a log entry on the braid, and its dependents' dependencies are fixed in the same commit.").
- Now: the rule in W, unchanged. S keeps the steps: "For a dropped strand, write the log entry, then `git rm -r` its folder and fix its dependents' dependencies in the same commit."

**M17. A running item's brief changes only through its worker**

- Old places: W "One writer per branch", S "Run an item" step 4, S "Adjusting the plan" ("A running item's brief changes only through its worker.").
- Now: W and S "Run an item" step 5, both unchanged. The third copy is removed.

**M18. Statuses, `ui` screenshots, `braid status` hint**

- "An open PR reads as in review." (W, a second time in the same file): removed; the first statement stays.
- "A `ui` item's recap embeds final screenshots." (W "Tiers"): removed; it is a line of the recap template in S.
- "`braid status` ends the line of a merged item that isn't Done with `run braid done <id>`." (B): removed; W "Branches per case" says it.

**M19. Edit directly, then `braid check`**

- Old places: S "Ground rules", WK "Start", B intro ("`braid` holds the logic (numbers, letters, logs); edit `brief.md` and `report.md` directly like any Markdown file, then run `braid check`, which must print `braids OK`.").
- Now: S and WK unchanged (one per role). In B it is the comment on the command: "after any direct edit of brief.md or report.md, and after a merge conflict in braids/; must print `braids OK`".

**M20. `report.md`**

- Old places: WK "Deliver" step 0 (the full list of contents), B (the same as a paragraph, and "It describes the PR as it stands: after a fix round the worker rewrites it; the history is in the log.").
- Now: the contents are a template in B. WK step 0 points to it: "write `report.md` as the brief template shows: what changed, why, validation, anything open, then the `For later items:` and `Needs the user:` lines." "Describes the PR as it stands" stays in WK only, where the worker is told to rewrite it after fixes.

**M21. Stop cases: one file**

- Old: three identical files, in `braid`, `braid-worker` and `braid-reviewer`, kept the same by a check in the docs gate.
- Now: `braid/references/stop-cases.md` only. WK and RV link to `../braid/references/stop-cases.md`. The docs gate lets the braid skills link to each other (they are installed together) and the same-file check is removed; a Pester test installs the skills and checks that the link resolves.

**M22. Failure-mode rows that repeat the skill**

- The W rows for a worker without a report, growth beyond the mandate, red CI and a moved head now name the section of the skill that holds the rule (M11, M12, M14, M15). The branch-protection row keeps "Never `--admin` or another bypass. `braid ask` and wait for the user."; its auto-mode half is in `auto-mode.md`.

## Part 4: moved to a reference file, wording unchanged

**A1. Auto mode** → `references/auto-mode.md`

- Old: S "Auto mode" (355 words), and pieces in six other places.
- Now: all of it in `auto-mode.md`, as short sections (switching on and off, review, merging, stopping). The seven conditions are a numbered list with their old wording. S keeps: "When the user asks for auto mode on a goal, or the braid has the `auto` label, read [auto mode] first: there you merge the goal's strand PRs into the braid branch yourself."
- Pieces collected from elsewhere:
  - S "Accept" step 1, "(in auto mode, review it as for M)" and W "in auto mode tier S gets an independent review too" → "Tier S gets an independent review too, as for tier M."
  - S "Ground rules", commit point "auto mode on or off" → "Both commits are among your commit points."
  - S "Accept" step 2, "or, when auto mode is on, merge it yourself under "Auto mode"" → S step 4: "You merge only under "Merge on request" or "Auto mode"."
  - W "Failure modes", "in auto mode get the new head reviewed" → condition 7: "If it moved after the review, get the new head reviewed first."
  - W "Failure modes", "In auto mode it is a stop" (branch protection) → "Stopping".
  - "The final PR into `main` is always the user's to merge." → the opening paragraph of `auto-mode.md`.

**A2. Resuming** → `references/resuming.md` (user's choice, 2026-11-16)

- Old: S "Resuming", one paragraph of 164 words.
- Now: the same rules as a list in `resuming.md`. S says, in its opening lines: "**Resuming.** If you are asked to run or continue a braid that already exists and has started, and you are in a new session or your context was summarized, read [resuming] before you do anything else. Nothing detects this for you: when unsure whether a braid has started, check `braid status <number>`."

**A3. Setup problems** → `references/setup.md` (user's choice, 2026-11-16)

- Old, S "Project facts": "Stop and tell the user what to run if `braid --version` fails (...), or if the project has `backlog/` and no `braids/` (...). If `BRAID.md` is missing, offer the template; it is committed before workers launch, with `braids/**/temp/` in `.gitignore`."
- Now: the same three cases as a list in `setup.md`. S keeps: "If `braid --version` fails, the project has `backlog/` and no `braids/`, or `BRAID.md` is missing, follow [setup problems] before anything else."

## Part 5: reworded

**W1. Waiting for a worker** (S "Run an item" step 3)

- Old, one paragraph: "After launching a worker or reviewer, or sending it fixes, call `t3_thread_wait` on its thread; it returns when the run ends, and at once on an idle thread. If no report arrived, read the thread's last message and `gh pr checks`. CI pending: make sure your watch is on, then end your turn; the watch wakes you. Green but no report: take the result from the thread and continue. Stopped without a watch, or stuck: send it a nudge. A run that failed: ... If the user says it finished, believe them and look at the PR."
- New: the same sentences as a list of six cases under "**Wait.**", one case per line, plus "The PR is already merged: the item is done." from the workflow (M11).

**W2. Watching the PR and wakes** (S "Run an item", now step 4)

- Old: "Once the worker's PR exists, call `watch_pull_request` on it (one item PR at a time) and end your turn." then four wake bullets, among them "Failed checks, conflicts or comments while the worker is active or watching are the worker's: do nothing and end your turn. Nudge it only if it stopped without a watch." and "Green and no report: take the result from the thread."
- New: its own step, "**Watch.**". The two bullets that repeated the waiting step are replaced by "without a report, step 3 applies", where "stopped without a watch: nudge" and "green: take the result from the thread" already are.
- The unwatch rule: old "your own PRs (the planning PR, the final PR into `main`) once their checks are green and any review is done"; new "the planning and final PRs once their checks are green and any review is done".

**W3. Launching the worker** (S "Run an item" steps 1 and 2)

- Old: the first message, then two paragraphs after it: "Launch the thread with no message (it starts idle), then send this first message with `t3_thread_send`, filling in the thread id the launch returned, so the worker logs under its own id and not yours." and the `SKILL.md` path hint.
- New: in the order they happen. Step 1 ends "Launch it with no message, so it starts idle." Step 2 begins "Send the first message with `t3_thread_send`, filling in the thread id the launch returned, so the worker logs under its own id and not yours." The message text is unchanged.

**W4. Review** (S "Accept and hand over" step 1)

- Old: two bullets, the second holding five rules in one paragraph (launch the reviewer, wait, blocking findings, the tier L re-check, the fresh review task). "S: read the diff yourself (in auto mode, review it as for M). Send problems back, including small factual errors in docs, to the same worker to fix on the same PR."
- New: six bullets, one rule each, same content. Sending findings back is one bullet for every tier: "Send blocking findings, and small factual errors in docs, to the same worker to fix on the same PR; decide non-blocking ones yourself." The `ask:quality` rule moved here from "Ground rules" (C4).

**W5. Facts, checks, handover** (S "Accept and hand over", old step 2)

- Old, one paragraph of 150 words: `braid facts`, reading the checks, the strand handover, the story's `braid done` and handover, when the coordinator merges, and "you don't re-run the gate or download artifacts".
- New: three steps, "**Facts.**", "**Checks.**", "**Hand over**", same content. The story line: "A story: first run `braid done <id> --head <reviewed sha> --thread <your thread id>`; when the new head it prints is green, hand that head over the same way." What `braid done` checks is in the workflow (M1).

**W6. After the merge** (S "Accept and hand over", old step 3)

- Old, one paragraph of 180 words: interrupt the worker, `braid clean`, stamp the strand Done, fix later items, the Outline step, start the next item, follow-ups after a spike.
- New: seven numbered sub-steps under "**After the merge**", same content. "It pulls, sets the strand Done and commits both as `docs(braids): <id> done`" is now "it commits as `docs(braids): <id> done`"; the rest is the command's comment in B. Other sections that said "step 3 of "Accept and hand over"" now say "After the merge".

**W7. Merge on request** (S)

- Old: "merge it in any mode with `braid done <id> --head <head commit of your last recap of it> --thread <your thread id> --merge` (a strand: add `--log -` with the braid's log entry; it merges, then stamps Done on the braid branch. A story or the final PR is already Done at that head, so it only merges). If you haven't recapped it, or its head has moved since, show what changed and `braid ask`; `braid done` refuses a moved head."
- New: "merge it with `braid done <id> --head <head commit of your last recap of it> --thread <your thread id> --merge` (for a strand add `--log -` with the braid's log entry). If you haven't recapped the PR, or its head has moved since, don't merge: show what changed and `braid ask`; `braid done` refuses a moved head."
- Why: what the command then does is its comment in B; that a story or final PR may be merged on request is now said in W "Who merges" (C2). "Don't merge" is added from the workflow row (M15).

**W8. Commit points** (S "Ground rules")

- Old: "Commit brief changes only at these points: the plan and its review rounds; the braid In Progress in its branch's first commit after the planning merge; auto mode on or off; a growth or plan-change decision; a log entry; an item Done (`braid done`); an Outline detailed; the braid Done at the end. PRs and threads show progress in between."
- New: the same, with "the braid In Progress, after the planning merge" (C1) and without "auto mode on or off" (A1).

**W9. Planning PR** (S "Plan" step 5)

- Old: "first create and push the braid branch `braid/<number>-<slug>` from `main`, then open the planning PR from `plan/<slug>` into it and tell the user; merging it records the approval (keep the plan request open until then, or `braid ask` for that merge), and `main` gets the briefs with the final PR. Then pull the braid branch in your worktree and set the braid `In Progress` in its next commit."
- New: "create and push the braid branch `braid/<number>-<slug>` from `main`, open the planning PR from `plan/<slug>` into it and tell the user. Its merge records the approval: keep the plan request open until then, or `braid ask` for that merge. Then pull the braid branch and set the braid `In Progress` in its next commit."
- "`main` gets the briefs with the final PR" stays in the W table only.

**W10. Finish** (S)

- Old: "A goal: when every strand is Done on the braid branch, merge `main` in, open one PR from the braid branch into `main` and watch it, review it by the braid's tier. Before review, in one commit tick the braid's boxes that now hold, write its `report.md` naming any box left open and why, and add a closing log entry. Once it is reviewed and green, run `braid done <number> --head <reviewed sha> --thread <your thread id>` to set it Done; when CI is green on the new head, unwatch it, hand it over with `braid handover` and wait for the user. Their merge marks it done: don't commit or open a PR after it."
- New: four numbered steps in the order they happen. Step 3: "Take the PR through "Accept and hand over" as a story of the braid's tier: review, facts, checks, `braid done <number>`, then unwatch it and hand over the new head once its CI is green."
- Why: review, `braid done` and handover of the final PR are the story path of "Accept and hand over"; they were written out twice.

**W11. Talking to the user** (S)

- Old, S "Ground rules", one bullet: the open-request rule, the question format, "Record the answer with `braid answer <id> --log -`. Keep working on whatever the answer doesn't block."
- New: the same sentences as three bullets in "Talking to the user", next to the new context-first rule and the recap, so everything about addressing the user is in one section.

**W12. Project facts: where the rest is** (S)

- Old: "Layout, ownership, branches per case, tiers and failure modes are in [the workflow]. Fields, the brief and the exact commands are in [the brief template]."
- New: "Read these too; this skill names their rules without repeating them:" and a list of the workflow, the brief template and the stop cases, each with what it holds.
- Why: the skill now relies on the workflow for the rules of M1 and M2, so reading it is asked for, not only mentioned.

**W13. The brief template** (B)

- Old: prose paragraphs between the examples (the intro, "Then write the body...", the `report.md` paragraph, the braid's log paragraph, the standard-input note).
- New: each is a comment on the command it explains, and `report.md` is a template block. The Fields list points to the workflow for statuses and tiers. Rules that left the file are M1, M2, M6, M8, M18 and M20.

**W14. The workflow** (W)

- "Who merges" is its own section (C2). "Items are braids" is one fact per bullet. The **Done** bullet lists its two cases on separate lines. The table cells that restated Done are shorter: "created on the new branch before launch; Done on it before the handover".
- The opening sentence now says what the file holds: "what an item is, who writes where, who sets Done, which branches and PRs each case has, the tiers and who merges".

**W15. Small trims, same meaning** (S unless marked)

- "Plan" step 1: "Ask the user only about things that change scope or acceptance." → "Ask the user only what changes scope or acceptance."
- "Plan" step 2: "may stay `Outline` until their turn" → "may stay `Outline`" (the workflow says an Outline is detailed when its turn comes).
- "Plan" step 4: "Check `git diff` first so that only the intended lines changed" → "Check with `git diff` that only the intended lines changed".
- "Plan" step 6: "Once approved, start the first ready strand without waiting, unless the user asked only for a plan: then show the table..." → "Then start the first ready strand without waiting. If the user asked only for a plan, show the table...".
- "Project facts": "Follow the project's agent instructions (`AGENTS.md` or `CLAUDE.md`)." moved from the end of the paragraph into its first sentence.
- "Finish": "Their merge marks it done" → "Their merge finishes the goal".
- "Talking to the user": "Edit the recap draft `braid handover` prints (...)" → "The recap: edit the draft `braid handover` prints (...)".
- WK "Start": "Commands are in `assets/brief.md` of the `braid` skill." → "Commands are in [the brief template]." with a link to `../braid/assets/brief.md`, now that the gate allows it.

## Part 6: removed, nothing in its place

- "(D43)" in W: see C6.
- "in any mode" in S "Merge on request": the rule has no modes; auto mode is described in its own file.
- "You don't fix product code yourself." as its own bullet in S "Fixes": joined to the bullet it explains ("belong to no worker, and you don't fix product code yourself").
- "`docs(braids): plan 0012`", the first of two example commit messages in S "Ground rules": "Plan" step 5 shows that message.
- "in your worktree" in two steps of S ("pull the braid branch in your worktree", "in your worktree on the braid branch"): the workflow says the coordinator works in its own worktree (M2).

No rule was removed.
