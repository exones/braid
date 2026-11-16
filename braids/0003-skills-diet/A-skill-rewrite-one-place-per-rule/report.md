# 0003/A report: skill rewrite, one place per rule

## What changed

- **Each rule is stated once.** What holds for every role (items, writers, Done, branches, tiers, who merges) is in `workflow.md`; the coordinator skill keeps its steps and names those rules by link. A role's skill still carries the short line for what that role itself does, because a worker or reviewer reads only its own skill.
- **Auto mode, resuming and setup problems are reference files** of the `braid` skill. `SKILL.md` says when to read each: the user asks for auto mode; the coordinator doesn't have the braid's state in its own conversation (the user's definition, stated in the skill's opening lines with its three cases and what is not a resume); a tool or file is missing.
- **The dense paragraphs are steps.** Waiting and wakes, review, hand over, "after the merge" and "Finish" are numbered steps or lists with one rule per line.
- **Context first** is a new rule in "Talking to the user", and the worker's and reviewer's report lines for the user follow it.
- **One `stop-cases.md`**, in `braid/references/`. The worker and reviewer skills link to it. The docs gate now lets the braid skills (`braid`, `braid-*`) link to each other and no longer compares copies.
- **`assets/brief.md`**: the prose is folded into comments on the commands, and `report.md` is a template block.
- `docs/decisions.md` has D47 (one place per rule, context first) and D29 reworded; the README follows the gate change.

[rules.md](rules.md) lists every rule that was merged, moved, reworded or removed, with old and new text. No rule was removed.

## Contradictions resolved, and which side won

| What disagreed | Won | Why |
| --- | --- | --- |
| When a goal's braid goes In Progress: "its branch's first commit" against "the first commit after the planning merge" (PR #50 leftover) | After the planning merge | The braid branch's first commit is the planning merge itself |
| May braid merge a story or the final PR: the description read "never", "Merge on request" allowed it (PR #50 leftover) | "Merge on request": on the user's request any PR; only auto mode never merges into `main` | It is what the skill and `AGENTS.md` already meant |
| A grown story's braid "stays In Progress until the final PR" against "Finish", where it is Done before that PR is handed over (PR #50 leftover) | "Finish" | It matches what `braid done` does |
| Rounds before `ask:quality`: "after two fix rounds" against "more than 2 blocking review rounds" | After two fix rounds | The stop-cases file already used it; the other count is one round later |
| "For later items": the worker's list had "ideas worth a later item", the brief template didn't | The worker's list, with the ideas | The user wants ideas proposed there |
| "Never commit to a branch a worker holds" without exception (skill) against the Done stamp as an exception (workflow); and "leave a CI box" (worker) against "briefs have no CI box" (template) | The workflow's exception; no CI box | Both are what `braid done` does |

## Word and line counts

| File | Before | After |
| --- | --- | --- |
| `braid/SKILL.md` | 3,575 words, 142 lines | 2,954 words, 165 lines |
| `braid/references/workflow.md` | 1,461 / 98 | 1,444 / 81 |
| `braid/references/auto-mode.md` | new | 437 / 41 |
| `braid/references/resuming.md` | new | 197 / 15 |
| `braid/references/setup.md` | new | 94 / 7 |
| `braid/references/stop-cases.md` | 401 / 21 | 407 / 21 |
| `braid/assets/brief.md` | 781 / 105 | 694 / 98 |
| `braid/assets/braid-md.md` | 395 / 31 | unchanged |
| `braid-worker/SKILL.md` | 1,426 / 73 | 1,460 / 74 |
| `braid-reviewer/SKILL.md` | 422 / 41 | 447 / 41 |
| `braid-worker/references/stop-cases.md` | 401 / 21 | removed |
| `braid-reviewer/references/stop-cases.md` | 401 / 21 | removed |
| **All skill files** | **9,263 words, 553 lines** | **8,529 words, 574 lines** |

Counted with `wc`. Outside `braids/` the PR changes 16 files, 279 lines added and 260 removed.

## Deviations

- **`braid/SKILL.md` is 2,954 words, 154 over the 2,800 ceiling.** My estimate in the analysis (2,750) was too low: with every rule kept in the skill the rewrite came to 3,040, because lists read better but are not shorter. The user then chose to move "Resuming" and the setup problems out, said about 3,000 would also have been fine, and asked not to squeeze further for the count. The acceptance box is ticked on that statement, and its text in the brief says so.
- **Lines went up by 21** (the brief expected net fewer): the words went down by 734, but paragraphs became lists.
- **The totals are higher than the analysis said** (8,529 words against an estimated 7,700): `workflow.md` took in the rules that left `SKILL.md` and stayed near its old size.
- `rules.md` and `analysis.md` are not skill files and are not counted.

## Validation

- `npm run verify` (the gate): passed.
- `scripts/Test-Pester.ps1`: 17 passed. The installer test now installs this repository's skills and checks that `stop-cases.md` exists once and that the worker's and reviewer's link to it resolves where they are installed.
- Docs-gate negatives: all cases behave as required, with three new ones: a braid skill linking to another braid skill passes; a braid skill linking to any other skill fails; another skill linking into a braid skill fails.
- Rule check: a word-level diff of old and new `SKILL.md` was compared against `rules.md`; every difference has an entry.

## Open

- The wording itself is for the user's review in the PR, as the brief says.
- `rules.md` W1 to W14 are where wording changed most; M11 to M15 are where two texts were merged into one.

For later items: the docs gate accepts links between `braid` and `braid-*` skills, so 0003/B can link from `braid-reviewer` into `braid`; "Resuming" and the setup problems are now `braid/references/resuming.md` and `setup.md`; "step 3 of Accept and hand over" is now called "After the merge" (step 5); the worker's `Needs the user` form is `<key>: <what it is about, then what is needed>`. Idea: the recap template in `SKILL.md` repeats the draft that `braid handover` prints, with its `<edit>` hints (about 110 words); a later item could drop the template and let the draft carry the format.
Needs the user: process: this PR rewrites the braid skills and changes the docs gate's link rule, both asked for; the wording is to be reviewed before the merge, with rules.md as the guide.
