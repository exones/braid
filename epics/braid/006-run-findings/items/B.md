# B: quieter coordinator: milestone commits, questions, UI merges

- Kind: task. Tier: L. UI: no.
- Expected size: about 80 changed lines in five files; the coordinator skill ends at 1,400 words
  at most (1,258 now).
- Branch: `item/006-b-coordinator-flow` at the epic tip given at launch.
- PR into: `epic/006-run-findings`.
- Result to: the coordinator thread given at launch.

## Goal

In the first real run the coordinator made 19 commits for 5 items, none of them Conventional
Commits ("Item C in review", "Item D done; start item E"), because the skill requires a commit for
every status change. After the epic was merged it made one more commit and a status-only PR the
user had to merge. It also switched the user's checkout to the epic branch, asked decisions as
prose at the end of long messages, moved a new item ahead of approved work without asking, merged
a UI item the user wanted to judge, and didn't notice a reviewer run that failed.

Fix this by replacing scattered rules with one short "Ground rules" section. The plan, run, review,
fix and recap flow worked; keep it.

## Start here

- `.agents/skills/braid-coordinate/SKILL.md` (1,258 words now).
- `.agents/skills/braid-coordinate/references/workflow.md`; its "Checks" section was edited by
  item A.
- `.agents/skills/braid-coordinate/assets/epic.md`, `brief.md`, `review.md`.

Don't read `epics/reports/`; this brief has what you need.

## Change

Use this wording. Adjust grammar to fit, but don't add sentences.

1. `SKILL.md`, new section after "Project facts". It replaces the "Limits" section, which you
   delete:

   ```markdown
   ## Ground rules

   - Work in your own worktree on the epic branch. Never switch, reset or commit in the user's checkout.
   - Every commit uses Conventional Commits; yours are `docs(epic): …`, for example `docs(epic): A done, start B`.
   - Commit `epic.md` only at milestones: the plan; an item done, together with the items it unblocks, the next launch and its thread links; a block or cancellation; a settled decision or brief change, before a worker needs it. Anything else waits for the next milestone; PRs and threads show progress in between.
   - Ask the user with the host's question tool if it has one, otherwise as numbered questions with lettered options and your recommendation. If an answer is a value such as a path, say where it will be stored. Keep working on whatever the answer doesn't block.
   - Name threads `<repo> <epic>/<ID> <role>: <title>`, for example `chinese-trainer 001/B review: data model`.
   - Never edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless the user asks; work that changes them is tier L. Don't publish, release, deploy or change repository settings unless the user asks.
   ```

2. `SKILL.md`, other sections:
   - Project facts: "If it is missing" becomes "If it is missing, or not committed on the base of
     the epic branch, ask the user before launching anyone: they commit it to `main`, or you commit
     it on the epic branch." Add: "When launching, state the model and its settings in one line."
     Shorten the paragraph's list of `BRAID.md` fields to "its facts (`gate`, `main`, `epics`,
     `ci`, `run`, `models` and the optional ones)".
   - Plan, step 2: "Create the epic branch from `main` in your own worktree …".
   - Plan, step 3: replace the spike sentence with "Plan items that depend on a spike only roughly
     until it returns." Add: "Later items go at the end; ask before moving any row."
   - Plan, step 4: replace the "A good brief" bullet list with "Fill every section of the
     template, keep 'Done when' to a few testable points, mark `UI: yes` for new or noticeably
     changed user-facing UI, and use the lowest tier that fits."
   - Run an item: delete "Keep each item's status … pushed on the epic branch." Step 3 becomes:
     "Wait for the worker's message without polling. If a run fails or ends without a report, read
     its error and retry once with the same model and settings; if it fails again, ask the user,
     naming the error. If the user says the worker has finished, believe them and look at the PR."
   - Accept and merge, step 1 ("Set the item to `in-review`"): delete; renumber.
   - Review, S: "Send small problems back …" becomes "Send problems back, including small factual
     errors in docs, …". M and L: add "For L, if blocking fixes substantially changed failure or
     recovery behavior, have the reviewer check the fix again."
   - Merge step: "S and M without `UI: yes`: when nothing blocking remains, read the PR's checks
     once with `gh pr checks <pr>`; it only reads what CI reported, and it is what stops a red PR
     from being merged. Merge with `gh pr merge <pr> --merge` if every required check is green on
     the latest commit, or if `ci` is `none` and the worker's gate passed. If a check failed, send
     the PR back to its worker; if checks are still running, wait. Don't download artifacts or
     re-run the gate. L and `UI: yes`: give the user the recap, with screenshots of the final
     state, and wait for their merge."
   - Done step: "Once merged, interrupt the worker's thread if it is still running
     (`t3_thread_interrupt`). Set the item to `done` with its PR link, set newly unblocked items to
     `ready`, launch the next item, and commit all of that as one milestone." Keep the
     blocked/cancelled and spike sentences.
   - Finish the epic: "When every item is done, set the epic's status to `ready for main` in a last
     commit, open one PR into `main` and tell the user. Only the user merges it. The merge marks
     the epic done: don't commit or open a PR after it."
   - Talking to the user: in the recap template the Screenshots line becomes "**Screenshots:** for
     `UI: yes` items: the final screens, embedded as images from the worker's artifacts folder."
     Delete the line "Also tell the user, in a few sentences, …"; the ground rules and "Finish the
     epic" cover it.
   - Resuming: add "An item whose PR is merged (`gh pr list --state all`) is done."

3. `workflow.md`:
   - Epics and items: the `epic.md` item table columns become "ID, title, kind, tier, UI, depends
     on, status, PR, threads". "A new item takes the next unused letter and goes where it should
     run" becomes "… and goes at the end; the coordinator asks the user before moving any row."
   - Statuses: the lead-in becomes "Only the coordinator changes an item's status, in the
     `epic.md` table, and commits it at the milestones its skill names." Delete the `in-review` row;
     the `in-progress` row becomes "A worker is launched on it; its PR and thread show progress."
   - Tiers: the L review cell becomes "Independent reviewer, again after fixes that substantially
     change failure or recovery behavior; the brief lists failure modes and required regression
     tests." Below the table add: "Whatever the tier, the user merges a `UI: yes` item (new or
     noticeably changed user-facing UI) after review; the coordinator sends final screenshots and
     waits."
   - Branches and merges: add the bullet "Every commit uses Conventional Commits." The S/M merge
     bullet applies to items "without `UI: yes`". The final-PR bullet becomes "When the epic is
     finished, the coordinator marks it `ready for main` and opens one PR from the epic branch into
     `main`. Only the user merges into `main`; no commit follows that merge."
   - Reports: replace the three bullets with "The PR description is the item's record: what
     changed, why, how it was checked, and anything left open. The worker's final report and the
     coordinator's recap to the user follow their skills."

4. `assets/epic.md`:
   - The status line becomes `Status: planning | in-progress | ready for main | cancelled.` and
     the next line reads "The user's merge into `main` marks it done."
   - The table gets `UI` (after Tier) and `Threads` (last) columns; update both example rows.
   - The run-order sentence becomes "Rows are in run order: the next item to run is the first
     `ready` row. New items go at the end; ask the user before moving a row. IDs never change."

5. `assets/brief.md`: after the Tier line add "- UI: yes | no (yes: new or noticeably changed
   user-facing UI; the user merges it)."

6. `assets/review.md`: the Focus line gets "For a second look after fixes: the commits since
   `<sha>`."

## Already decided

- `in-review` is no longer a recorded status. "Ready for your merge" exists only in the recap.
- About one coordinator commit per item is the target, not a quota. A blocker or a settled
  decision is committed when it happens.
- Keep the recap template, the review flow, same-thread fixes and the CI-failure ownership rules
  in "Fixes" unchanged.
- No validation of models against the host and no polling or watchdog; the one-retry rule covers
  runs that fail.

## Out of scope

- The worker skill, `braid-md.md`, `BRAID.md`, README, and the "Checks" section of `workflow.md`
  (item A).
- History rewriting, commit linting or hooks, author identities, new status files.

## Done when

- Word caps hold: coordinator skill at most 1,400 words, `workflow.md` at most 820, `epic.md` at
  most 150, `brief.md` at most 225, `review.md` at most 170. Put before and after counts in the
  PR description.
- `rg -n "in-review|small commit|## Limits" .agents/skills` finds nothing.
- Walk-throughs in the PR description, one or two lines each, against the new text:
  - a tier S item gives exactly one coordinator commit (done, next start, thread links);
  - a tier M `UI: yes` item waits for the user's merge, with screenshots in the recap;
  - a failed reviewer run is retried once, then the user is asked;
  - a new item mid-epic is appended, and moving it needs the user's answer;
  - finishing the epic leaves no commit after the user's merge.
- The `gate` command from `BRAID.md` passes and the PR checks are green.

## Check with

```powershell
npm run verify
rg -n "in-review|small commit|## Limits" .agents/skills
foreach ($f in Get-ChildItem .agents/skills/braid-coordinate -Recurse -Filter *.md) {
  '{0,5} {1}' -f ((Get-Content $f.FullName -Raw) -split '\s+' | Where-Object { $_ }).Count, $f.Name
}
```
