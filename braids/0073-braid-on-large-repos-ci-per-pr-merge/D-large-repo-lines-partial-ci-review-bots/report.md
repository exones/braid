# 0073/D report

## What changed

- `braid facts <pr>` ends with `merge gate: <command> (runs on this merge)`, or `(not on this merge: merge-gate-on is [...])`, when `BRAID.md` has `merge-gate` (`mergeGateLine` in `src/commands/facts.ts`; a PR into `main` is the `main` merge, any other base `strand`; an invalid `merge-gate-on` is named on that line). Leftover 2026-11-23-avsv.
- BRAID.md template (`.agents/skills/braid/assets/braid-md.md`): front matter gains `review-bots` (with the line: list the bots' checks in `ci`, or use `ci: all`, so green CI means reviewed), `reviewer-with-bots` and a per-worktree cache example in `setup`; body lines with examples for partial CI on braid branches, review bots, `merge-gate` (exit code is the contract; a script that only prints failure needs a wrapper or an exit-code flag) and `merge-gate-on: [main]`, caches, and path stops (`AGENTS.md`, the merge gate, path-scoped checks in the gate script). The `ci`, `autonomy`, `docs` and `models` lines were shortened to pay for it.
- braid-worker skill: with `review-bots`, at green CI the worker reads the bots' threads once, fixes, answers or marks as a nit each comment, pushes the fixes in one push, replies, resolves each thread (`gh api graphql`, `resolveReviewThread`) and, after a push, goes back to the CI step for the new head. A named bot that posted nothing is `<bot>: no review` in the report; the worker never waits for a bot, so there is no new waiting state. The report lists each bot comment and what was done, and where CI on the braid branch is partial or none, the gate's output summary and duration.
- braid-reviewer skill: reads the bots' threads and the worker's replies; a promised fix not made or a wrong dismissal is a finding.
- `reviewer-with-bots: L-only`: one sentence in braid SKILL.md "Accept and hand over" step 1 (no review for S and M items the bots reviewed) and one in `references/autonomy.md` condition 3 (the bots' review with every thread resolved stands in for S and M).
- Docs: a "braid on a large repo" section in `docs/getting-started.md` with a generic monorepo example; D102 and decision-log lines for D100 and D102.

## Why

The rest of what a large repository needs (inbox n1xv, odxc, bbd3), as lines rather than code, per the braid's scope; the user's q-gbni answers (configurable reviewer with bots, the worker resolves bot threads).

## Validation

`npm run verify` passes (629 tests, about 5 minutes). New test in `test/facts.test.ts`: no gate → no line; a gate with default scope, `[strand]` and `[main]` on a PR into `main` (fails on the old code, which printed no such line).

Skill size (`wc -w`, before → after):

| File | Before | After |
| --- | --- | --- |
| braid skill folder (all `.md`) | 12801 | 12799 |
| braid `assets/braid-md.md` | 837 | 806 |
| braid `SKILL.md` | 6365 | 6379 |
| braid `references/autonomy.md` | 798 | 813 |
| braid-worker `SKILL.md` | 1773 | 1771 |
| braid-reviewer `SKILL.md` | 709 | 706 |

The two one-sentence edits allowed in braid SKILL.md and autonomy.md add 14 and 15 words; with no other edits allowed in those files, the template's cuts pay for them, so the braid skill as a whole is 2 words shorter.

## Docs

- README.md: updated ("Review before it reaches you": a coordinator's merge gets a reviewer or, if you choose, review bots for small and medium ones; a "Works on large repositories" bullet).
- docs/getting-started.md: updated (BRAID.md keys `ci: all`, `merge-gate`, `review-bots`; the review condition with `L-only`; the "braid on a large repo" section).
- docs/cli.md: updated (`braid facts` row).
- docs/board.md: unchanged (0073 changes no board behaviour before 0073/E).
- docs/autonomy.md: updated (`reviewer-with-bots: L-only` under "What the CLI enforces"; the merge gate line from 0073/B is still true).
- CLI help text (`src/cli.ts`): updated (`facts`).
- docs/development.md: unchanged (0073/A updated its CI section; nothing here touches development).
- docs/decisions.md: updated (D102; log lines for D100 and D102).
- docs/braids-format.md: updated (`braid facts` merge gate line).
- docs/roadmap.md: updated (braid 0073 entry, with what was not built).
- docs/npm-distribution.md: unchanged.

## Open

- The bots' round is not tested live here (this repository has no review bots).
- The worker skill lost the sentence that allowed reading installed skills and using documented setup; "don't edit installed skills" remains, and BRAID.md still allows both here.

**Decisions:** the word limit is checked per file for the worker and reviewer skills and per skill folder for the braid skill, whose two allowed sentences can't be paid for in their own files; D102 is the next free number on `main`, 0071 and 0072.

For later items: none.
Needs the user: none.
