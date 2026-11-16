# 0003/A analysis: how far the braid skills can shrink

Phase 1 of 0003/A. Nothing in the skills has been edited yet. The choice to make is in "Options"; the rest is the evidence behind it.

## The choice in short

The coordinator skill (`braid/SKILL.md`) is 3,576 words and the ceiling is 2,800. Moving auto mode out and removing duplicates is not enough on its own: that lands near 3,050. Reaching the ceiling also needs the densest paragraphs reworded.

**Recommendation: option "Dedupe plus plain wording"**, about 2,750 words. It is the smallest change that meets the ceiling, and it is the only one that also addresses "in words the user can follow".

## What is there today

| File | Words | Lines |
| --- | ---: | ---: |
| `braid/SKILL.md` | 3,576 | 142 |
| `braid/references/workflow.md` | 1,461 | 98 |
| `braid/assets/brief.md` | 781 | 105 |
| `braid/assets/braid-md.md` | 395 | 31 |
| `braid/references/stop-cases.md` | 401 | 21 |
| `braid-worker/SKILL.md` | 1,427 | 73 |
| `braid-reviewer/SKILL.md` | 423 | 41 |
| the two extra copies of `stop-cases.md` | 802 | 42 |
| **Total** | **9,266** | **553** |

Findings:

- **97 rules, 60 of them stated in more than one place.** The full list is in the appendix. The most repeated: who sets Done (7 places), who merges what (6), edit briefs directly then `braid check` (4), the converge loop (3), the Outline rule (4), the red-CI fix strand (3).
- **Auto mode is about 430 words of `SKILL.md` (12%)**: its own section is 355 words, and about 75 more are scattered through six other places (the description, the commit points, both review steps, "Merge on request", "Resuming"). Another 70 words sit in `workflow.md`, including one auto-mode rule that exists only there (a moved head is reviewed again). The file grew by 1,024 words since before auto mode, so auto mode is less than half of the growth; the rest came with the CLI commands (`braid ask`, `handover`, `done`, `facts`) and the watch and wake rules.
- **The longest single rules are the hardest to follow.** Three paragraphs hold 6 to 10 rules each in one block: "Run an item" step 3 (waiting, watching, waking: 300 words), "Accept and hand over" steps 2 and 3 (330 words), and the commit-points rule. This is where the wording options differ.
- **Six contradictions or mismatches**, all small, all fixed by stating the rule once (appendix, "Contradictions"). The three PR #50 leftovers are all still true.
- **The user is asked for input in about 25 places** (appendix, "Where the user is asked"). None of them requires context first today; the only format rule is "numbered questions with lettered options".

## Options

### Move and dedupe only

Every rule keeps its current wording; it is only moved to one place, and the other places point there. This is the safest for "no rule lost", because old and new text can be compared word for word.

- Auto mode goes to `references/auto-mode.md`, one `stop-cases.md`, `brief.md` prose folded into its examples, the six mismatches fixed, the new context-first rule added.
- `braid/SKILL.md`: about **3,050 words**. It misses the 2,800 ceiling by about 250.
- All skills together: about 8,100 words (from 9,266).
- Easier for you: nothing reads differently from what you already reviewed.
- Harder for you: the dense paragraphs stay as they are, so the rules you could not follow before are still hard to follow.

### Dedupe plus plain wording (recommended)

The same moves, and the densest paragraphs are rewritten as short steps in plain words, one rule per sentence. No rule is dropped or moved out of the main skill; only its wording changes.

- Rewritten: "Run an item" step 3 (waiting and wakes), "Accept and hand over" steps 2 and 3, the commit points, "Plan" step 5, "Finish", "Resuming". The rest is left alone apart from the dedupe.
- `braid/SKILL.md`: about **2,750 words**, just under the ceiling.
- All skills together: about 7,700 words. `workflow.md` about 1,250, `brief.md` about 650, worker about 1,350, reviewer about 430, new `auto-mode.md` about 450.
- Easier for you: each step says one thing, and the long blocks become lists you can skim.
- Harder for you: about 1,200 words of rules read differently, so the wording review in the PR is real work. `rules.md` will show old and new text side by side for each one, and the independent reviewer checks that none changed meaning.

### Short core, details in references

Everything above, and the procedures needed only now and then also leave the main skill: growth ("Grow and adjust"), resuming, and the wake handling move to reference files that the skill names at the moment they apply.

- `braid/SKILL.md`: about **2,250 words**: one straight path through planning, running and handing over a normal item.
- All skills together: about 7,700 words (the same; the text moves, it is not cut).
- Easier for you: the main skill reads start to finish as the normal case.
- Harder for you: a rule you look for may be in one of five files instead of two. The larger risk is behaviour: a coordinator applies what it has read, and a reference it should open "when a worker proposes growth" may not be opened at that moment. Auto mode is safe to move because you switch it on by name; growth and wakes happen unannounced.

### Why the middle option

The first misses the ceiling and leaves the hard paragraphs hard. The third buys 500 words with a real risk of skipped rules, and the ceiling does not need it. If the middle option lands above 2,800 after the rewrite, I will say so with the count instead of cutting into clarity (the brief makes clarity win).

## Two smaller points I will settle as follows unless you say otherwise

- **The docs gate forbids the link the brief asks for.** Today a link in a skill may not leave that skill's folder, so `braid-worker` linking to `../braid/references/stop-cases.md` fails `npm run verify`. I will let the gate accept links between the braid skills (`braid` and `braid-*`, which the installer always installs together) and keep refusing every other outside link. The alternative, naming the path as plain text instead of a link, would leave the link unchecked.
- **`braid-md.md` keeps its repeated explanations.** It is a template copied into other projects as their `BRAID.md`, so what it says about `ci`, `auto` and `models` must stand on its own there. I will not count those as duplicates.

## The new rule, as I plan to word it

For "Talking to the user", to be reviewed in the PR:

> Every question or decision you put to the user starts with one or two short sentences of context: what this is about and why it comes up now, enough to answer without reading anything above. Name the thing itself (the item's title, the file, the PR), never "option 2" or "point 3" of an earlier message. This holds for a stop, a recap's "Needs the user" and "You", a `braid ask` text and a plan question.

The worker's and reviewer's report templates get the same requirement on their "Needs the user" and "You" lines, since the coordinator passes those on to you.

---

## Appendix: every rule, where it lives today

Files: **S** `braid/SKILL.md`, **W** `workflow.md`, **B** `assets/brief.md`, **M** `assets/braid-md.md`, **SC** `stop-cases.md`, **WK** `braid-worker/SKILL.md`, **RV** `braid-reviewer/SKILL.md`. The first place named is where the rule is fullest. "Dup" counts the places beyond the first.

### Roles and project facts

| # | Rule | Where | Dup |
| --- | --- | --- | --- |
| 1 | The coordinator plans and runs workers; it writes no product code | S intro, S Fixes | 1 |
| 2 | One implementation worker at a time | S Run, S description | 1 |
| 3 | Read `BRAID.md` first; follow `AGENTS.md` or `CLAUDE.md` | S Project facts, WK Start, RV Start | 2 (one per role, kept) |
| 4 | Model lookup: tier key, then kind, then role; ask if none | S Project facts, M | 1 (template, kept) |
| 5 | Exact provider, model and options; never substitute; state them when launching | S Project facts | |
| 6 | Stop if `braid --version` fails or the project has `backlog/` and no `braids/`; offer the `BRAID.md` template | S Project facts | |
| 7 | Don't edit skills, `AGENTS.md`, `CLAUDE.md`, `BRAID.md` unless asked; such work is tier L | S Ground rules, WK Habits, W Tiers, SC `process` | 3 |
| 8 | Don't publish, release, deploy or change repository settings unless asked | S Ground rules, WK Habits | 1 |
| 9 | Thread names: `<repo> <id> <role>: <title>` | S Ground rules | |

### Items and briefs

| # | Rule | Where | Dup |
| --- | --- | --- | --- |
| 10 | An item is a braid; a story has no strands; strands are its phases, one PR each | W Items, S Plan 2, B intro | 2 |
| 11 | Kinds: story, task, spike | W Items, B Fields | 1 |
| 12 | Statuses; no "In Review", an open PR is in review | W Items, W One writer, B Fields | 2 |
| 13 | Outline items hold only the goal and open questions, and are detailed before they start | B Fields, W Items, S Plan 2, S Accept 3 | 3 |
| 14 | Run order is `order`, then dependencies; real dependencies only | W Items, B Fields, S Plan 3 | 2 |
| 15 | A dropped strand: log why, remove the folder, fix dependents; letter never reused | S Grow (adjusting), W Items, S Resuming | 2 |
| 16 | Edit `brief.md` and `report.md` directly, then `braid check`; use `braid` for numbers, status, labels, logs | S Ground rules, WK Start, B intro, M | 3 |
| 17 | "Already decided" and "Start here" are context; the worker writes the plan | S Ground rules, WK Work, B template | 2 |
| 18 | Labels: kind, tier, `ui`, `ask:<key>` per stop case the plan shows | B Fields, S Plan 3, SC | 2 |
| 19 | Lowest tier that fits | W Tiers, S Plan 3 | 1 |
| 20 | Tier table: typical work and the review each tier gets | W Tiers, S Accept 1 | 1 |
| 21 | A tier L brief lists failure modes and regression tests | W Tiers | |
| 22 | The braid's log: one entry per merged strand, before the next starts, in the Done commit | B (with the entry format), W Items, S Accept 3 | 2 |
| 23 | Pass log and report text on standard input when it may hold quotes | B | |
| 24 | `report.md`: what changed, why, validation, open; "For later items"; "Needs the user" | WK Deliver 0, B, W Checks | 2 |
| 25 | `report.md` describes the PR as it stands; history goes in the log | B, WK Deliver (fixes) | 1 |
| 26 | A spike: answer in the time box, no feature; report with follow-ups; the coordinator turns them into briefs | WK Work, W Items, B, S Accept 3 | 3 |

### Branches, writers, Done

| # | Rule | Where | Dup |
| --- | --- | --- | --- |
| 27 | One writer per branch; who holds which | W One writer, S Ground rules | 1 |
| 28 | The coordinator never commits to a worker's branch or the user's checkout; works in its own worktree | S Ground rules, W One writer | 1 |
| 29 | Only the coordinator creates or restructures items; a worker proposes | S Ground rules, W One writer, WK Start, B intro | 3 |
| 30 | The worker sets In Progress in its first commit and pushes it | WK Work, S Ground rules, W One writer, B commands | 3 |
| 31 | The worker never sets Done and makes no commit after green | WK Deliver 4, W One writer, S Ground rules, B commands | 3 |
| 32 | Done is the coordinator's, with `braid done`: a strand after its merge; a story or final PR before the handover | W One writer, S Ground rules, S Accept 2, S Accept 3, S Finish, W Branches table, B commands | 6 |
| 33 | What `braid done` checks before it stamps | W One writer, S Accept 2, S Auto | 2 |
| 34 | A goal's braid goes In Progress in the first commit after the planning merge | W Branches table, S Ground rules (two bullets), S Plan 5 | 3 |
| 35 | A running item's brief changes only through its worker | W One writer, S Run 4, S Grow (adjusting), WK Work | 3 |
| 36 | Branches, PRs and briefs per case (story, planned goal, grown story) | W Branches table, S Plan 4 and 5, S Grow (phases) | 2 |
| 37 | Merge `main` into the braid branch before the next strand and the final PR | W Branches, S Finish | 1 |
| 38 | Never rebase or force-push shared branches | W Branches | |
| 39 | Conventional Commits; the coordinator's are `docs(braids): …` | S Ground rules, W Branches, WK Deliver 1 | 2 |
| 40 | The coordinator commits brief changes only at the listed points | S Ground rules | |
| 41 | The board: what the user sees after `handover`, `ask`, a merge | W Branches | |

### Planning

| # | Rule | Where | Dup |
| --- | --- | --- | --- |
| 42 | Explore enough to plan; ask only what changes scope or acceptance | S Plan 1 | |
| 43 | Create items locally and push nothing; where and how per case | S Plan 4 | |
| 44 | Show the plan with links and open a plan request | S Plan 4 | |
| 45 | Each round of comments is one local commit; check the diff; say briefly what changed | S Plan 4 | |
| 46 | On approval squash to one commit and push once; planning PR into the braid branch records the approval | S Plan 5, W Branches table | 1 |
| 47 | Start the first strand after approval unless only a plan was asked | S Plan 6 | |

### Running an item

| # | Rule | Where | Dup |
| --- | --- | --- | --- |
| 48 | `braid next` names the next strand; `braid start` makes branch and worktree | W Starting, S Run 1 | 1 |
| 49 | Launch the thread idle, then send the first message with the worker's own thread id | S Run 2, WK Start | 1 |
| 50 | Wait with `t3_thread_wait`; what to do when no report arrived | S Run 3 | |
| 51 | A failed run: retry once with the same model and settings, then ask | S Run 3, W Failure modes, SC `quality` | 2 |
| 52 | Watch the item's PR once it exists; one at a time | S Run 3 | |
| 53 | On a wake: the worker's report wins; failed checks are the worker's; a wake is never a merge decision | S Run 3 | |
| 54 | Unwatch a PR when it is handed to the user | S Run 3, S Finish, S Auto | 2 |
| 55 | Converge loop: proposal first, each verdict logged, build after approval | W Checks, S Run 5, WK Work | 2 |
| 56 | Decided means documented: the doc (how) and the decisions record (why) in the same PR | W Checks, WK Work | 1 |
| 57 | The worker checks branch and commit against the first message before writing | WK Start | |
| 58 | The worker stays near the expected size; past twice, it asks | WK Work, S Grow, SC facts | 2 |
| 59 | Project edits stay in the worktree; tests use temporary folders; real data is protected | WK Work, M | 1 (template, kept) |
| 60 | Scratch files go to `~/.braid/artifacts/…` or the item's `temp/` | WK Work, RV Report | 1 |
| 61 | The gate passes before every PR; no weakened or deleted tests | WK Work, W Checks | 1 |
| 62 | CI evidence: `gh pr checks` green on the latest commit for the `ci` names; with `ci: none` the gate run | W Checks, S Accept 2, WK Deliver 3 to 5, RV Check, M | 4 |
| 63 | The worker's PR steps: commit, push, one PR, watch, fix failures, report once, unwatch | WK Deliver | |
| 64 | The worker's checkpoint and "first message seen again" habits | WK Habits | |

### Growth and plan changes

| # | Rule | Where | Dup |
| --- | --- | --- | --- |
| 65 | A worker that finds more work stops and sends one proposal with three options | WK Work, S Grow | 1 |
| 66 | Mandate: up to two strands or one prerequisite of tier S or M without asking; the rest goes to the user | S Grow, W Failure modes, SC `scope` | 2 |
| 67 | Absorb, prerequisite of a strand, prerequisite of a story, phases: each side's steps | S Grow, WK Work | 1 (both sides in both files) |
| 68 | Adjusting items that haven't started: one commit, logged, same limits | S Grow | |
| 69 | Side ideas from the user get a home, by asking | S Ground rules | |

### Review, handover, merge

| # | Rule | Where | Dup |
| --- | --- | --- | --- |
| 70 | Review by tier; S by the coordinator, M and L independent; L re-check after big fixes | S Accept 1, W Tiers | 1 |
| 71 | The reviewer's first message; a fresh review task, never a resumed one | S Accept 1, RV Start | 1 |
| 72 | What the reviewer checks, the blocking bar, one PR comment, never commits | RV | |
| 73 | Blocking findings go to the worker; the coordinator decides the rest | S Accept 1 | |
| 74 | `braid facts`, judged against the stop cases; a fact is not a verdict | SC, S Accept 2 | 1 |
| 75 | Handover with `braid handover`; the coordinator doesn't re-run the gate | S Accept 2 | |
| 76 | After the merge: interrupt the worker, `braid clean`, stamp Done, fix later items, start the next | S Accept 3 | |
| 77 | Who merges: the user, unless they ask, or auto mode into a braid branch; never auto into `main` | W Tiers, S description, S Accept 2, S Merge on request, S Auto (twice), M | 6 |
| 78 | Merge on request: only the recapped head; a moved head is shown and asked about | S Merge on request, W Failure modes | 1 |
| 79 | The worker that opened a PR fixes it, on its existing thread | S Fixes, S Accept 1 | 1 |
| 80 | Red CI on a braid branch or final PR: a tier S fix strand; a second red is a stop | S Fixes, S Auto, W Failure modes | 2 |
| 81 | `ask:quality` when a review still blocks after two fix rounds | S Ground rules, S Auto, SC `quality` | 2 |
| 82 | Finish: when a story or goal is done, and the steps of the final PR | S Finish, W Branches table | 1 |
| 83 | Resuming: how to rebuild the state | S Resuming | |
| 84 | Failure table rows that exist only there: a brief edited on two branches, `--dep` lookups, a worktree that can't be deleted | W Failure modes | |

### Stop cases and talking to the user

| # | Rule | Where | Dup |
| --- | --- | --- | --- |
| 85 | The eight stop cases and their keys | SC (three identical files) | 2 |
| 86 | Who records what: plan labels, worker line, reviewer section, coordinator facts | SC, S Plan 3, WK report, RV report, S recap | 4 |
| 87 | A turn that waits for the user ends with an open request (`braid handover` or `braid ask`); record the answer | S Ground rules | |
| 88 | Question format: the host's question tool, or numbered questions with lettered options and a recommendation | S Ground rules | |
| 89 | The recap template | S Talking to the user | |
| 90 | The worker's final report template | WK Final report (near copy of 89) | 1 |
| 91 | `ui` items: screenshots in the report and the recap | WK report, S recap, W Tiers | 2 |

### Auto mode (all of it moves to `auto-mode.md`)

| # | Rule | Where | Dup |
| --- | --- | --- | --- |
| 92 | When it may be switched on, and how (the `auto` label and a log entry) | S Auto, M | 1 (template, kept) |
| 93 | The seven merge conditions | S Auto | |
| 94 | In auto mode tier S gets an independent review | S Accept 1, W Tiers, S Auto (condition 3) | 2 |
| 95 | The PR comment before merging; wait for the braid branch's CI after | S Auto | |
| 96 | Stops: any stop case, more than two blocking rounds, branch protection (never a bypass) | S Auto, W Failure modes | 1 |
| 97 | A head that moved after review is reviewed again | W Failure modes only | |

### Contradictions and mismatches

| What disagrees | Where | Fix |
| --- | --- | --- |
| PR #50 leftover: when a goal's braid goes In Progress. One bullet says "its branch's first commit", others add "after the planning merge" | S Ground rules (two bullets), S Plan 5, W Branches | State once, with "after the planning merge" |
| PR #50 leftover: the description reads as if a story or final PR may never be merged by braid, but "Merge on request" allows it when the user asks | S description, S Merge on request, W Tiers | Reword the description: only auto mode never merges into `main` |
| PR #50 leftover: a grown story's braid "stays In Progress until the final PR", but Done is committed before that PR is handed over | W Branches table, S Finish | The grown-story row says "then as a planned goal" |
| How many rounds before `ask:quality`: "still blocking after two fix rounds" against "more than 2 blocking review rounds" | S Ground rules, SC, S Auto | One wording: after two fix rounds |
| "For later items" lists "ideas worth a later item" in the worker skill but not in the brief template | WK Deliver 0, B | One list, with the ideas |
| "Never commit to a branch a worker holds" has no exception in the skill, while the workflow names the Done stamp as one; the worker is told to "leave a CI box", though briefs have no CI box | S Ground rules, W One writer, WK Deliver 0, B | One statement with the exception; drop the CI-box remark |

### Where the user is asked for input

The context-first rule applies to each of these.

| Place | What is asked |
| --- | --- |
| S Project facts | which model to use when `BRAID.md` names none; what to run when `braid` or `braids/` is missing; whether to add `BRAID.md` |
| S Ground rules | side ideas: track it, and where |
| S Plan 1, 4, 5, 6 | scope questions; plan approval; the planning PR's merge; the go for the first strand |
| S Run 3, 5 | a run that failed twice; each converge-loop proposal |
| S Grow | growth beyond the mandate |
| S Accept 2, 3 | the handover recap ("Needs the user", "You"); what an Outline leaves open |
| S Merge on request | a head that moved since the recap |
| S Auto | every stop |
| S Resuming | an item whose state can't be worked out |
| W Failure modes | growth beyond the mandate, a worker without a report, branch protection, a moved head |
| WK Final report, `report.md` | "Needs the user" and "You", which the coordinator passes on; the growth proposal and the converge-loop proposal |
| RV Report | "Needs the user" in the PR comment |
