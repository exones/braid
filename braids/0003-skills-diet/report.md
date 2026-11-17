# 0003 report: skills diet

## Done

The braid skills state each rule once, ask the user with context first, separate the worker's completion from the coordinator's acceptance, and carry researched review practices. Five strands, each merged into `braid/0003-skills-diet` on the user's request:

- **C, installer and size fact** (PR #104): `Install-Skills.ps1` without `-Ref` fetches and installs `origin/main`; `braid facts` leaves `braids/**` out of the size fact.
- **A, skill rewrite, one place per rule** (PR #105, Fable 5.2): rules shared by every role live in `workflow.md`, the coordinator skill names them by link; auto mode, resuming and setup problems are reference files read only when needed; one `stop-cases.md`; the context-first rule for every question to the user; `rules.md` lists every rule merged, moved or reworded (none removed).
- **D, completion and acceptance** (PR #107): briefs have one box section, `## Completion`, for what the worker can do and prove; `braid accept` replaces `braid done` (kept as an alias), writes an "Accepted" log line and posts it on the PR; user approvals go through `braid ask`, then the log, then the report's Decisions; the "answer first" rule.
- **B, reviewer practices** (PR #109, redone by Fable 5.2 from 23 read sources): the reviewer reads around the diff, checks failure paths, tests the tests, names input and wrong result for a finding, keeps likely blocking problems Blocking, and says what it could not check. Sources in `B-…/research.md`.
- **E, research briefs and the recap template** (PR #110): research briefs say how wide to look and ask for `sources.md`; the recap skeleton left `braid/SKILL.md`, since `braid handover` prints it.

The final PR also merges `main` (0016, 0017): 0017 moved the README's install and gate text to `docs/`, so 0003's wording there moved with it (`docs/getting-started.md`, `docs/development.md`, `docs/cli.md`), and `references/setup.md` now points to `docs/getting-started.md`.

Review fixes on the final PR (the user's go, 2026-11-17): a goal's brief has Completion boxes too, ticked by the coordinator at Finish (`braid accept` refuses a brief without them); after a merge on request of a story or final PR, only steps 1 and 2 of "After the merge" run, so Finish can't loop; the story `braid accept` example passes `--review` and `--thread`; "acceptance criteria" became "Completion boxes".

## Word counts (`wc -w`)

| File | Before 0003 | Now |
| --- | --- | --- |
| `braid/SKILL.md` | 3,575 | 2,871 |
| `braid/references/workflow.md` | 1,461 | 1,461 |
| `braid/references/auto-mode.md`, `resuming.md`, `setup.md` | new | 435, 197, 95 |
| `braid/references/stop-cases.md` (was three copies) | 401 ×3 | 407 |
| `braid/assets/brief.md` | 781 | 780 |
| `braid/assets/braid-md.md` | 395 | 395 |
| `braid-worker/SKILL.md` | 1,426 | 1,487 |
| `braid-reviewer/SKILL.md` | 422 | 556 |
| **All skill Markdown** | **9,263** | **8,684** |

## Decisions (from the log)

- User, 2026-11-16: plan approved (C, A on Fable with an analysis stop, B); `--add-ref` dropped; every question braid puts to the user starts with short context and names the thing.
- User, 2026-11-16: A's option "dedupe plus plain wording"; resuming and setup problems moved out of `SKILL.md`; resume means recovery after lost context, not "continue"; about 3,000 words is fine, no squeezing for the count.
- User, 2026-11-16: completion and acceptance split (D): section `Completion`, command `braid accept`, the acceptance in the log and a PR comment, approvals through requests; the `braid done` alias stays.
- User, 2026-11-17: B redone by a Fable worker after a thin first pass; research briefs record their sources (E).

## Deviations

- `braid/SKILL.md` is 2,871 words, over the 2,800 ceiling in "Working at the end"; the user said about 3,000 is fine and not to cut for the count.
- Two strands were added during delivery: D (from the user's completion and acceptance point) and E (the research rule after B, and A's recap idea).

## Validation

`npm run verify` passes on the braid branch after merging `main` (179 tests). Each strand passed the gate and CI; A, D and B had an independent review, C and E the coordinator's.

## Open

- After the merge: reinstall the skills from `origin/main` so other projects get them; installed skills that still say `braid done` keep working through the alias.
- For later items: from B, a second validating reviewer, merging independent reviews, learning from the user's verdicts on findings; requests across machines.

Needs the user: process: the skill wording across the three skills; the user reviews and merges the final PR into `main`.
