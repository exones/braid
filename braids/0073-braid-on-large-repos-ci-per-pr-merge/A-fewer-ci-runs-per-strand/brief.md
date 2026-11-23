---
id: '0073/A'
title: "Fewer CI runs per strand"
status: In Progress
labels: ["kind:task", "tier:M"]
dependencies: []
order: 10
---

## Goal

Fewer CI runs per strand, quickly (the user: "I need it quite quickly. Even make it first in P20"): pushes to braid branches no longer start CI, `braid wait` still answers after a strand's merge, and a worker pushes a review round's fixes at once. This strand reaches `main` early (see the braid's "Already decided").

Expected size: about 60 lines of code and tests in 3 files, plus a few doc and comment lines.

## Start here

- `.github/workflows/ci.yml`: the `on:` block and the comment above it. `braid/*` matches a braid or story branch (`braid/<n>-<slug>`), not a strand's (`braid/<n>/<letter>-<slug>`).
- `src/commands/wait.ts`: `ciCommit` and the check range from the tip down to the CI commit; `test/wait.test.ts`.
- `docs/braids-format.md` (`braid wait`), `docs/cli.md` (its row), `src/cli.ts` (its usage line), `docs/autonomy.md` (line on the braid branch's CI after a merge), `docs/decisions.md` (D71, D91).
- `.agents/skills/braid-worker/SKILL.md`: the paragraph on review findings after step 5.

## Change

- `.github/workflows/ci.yml`: push runs only on `main` (`branches: [main]`, `paths-ignore` kept). Rewrite the comment so it is true: PR branches are covered by `pull_request`; braid and story branches get no push run, since a strand's PR run already tests the strand merged onto the braid branch, a story's PR run tests its branch, and the final PR into `main` runs everything; `main` keeps its push run.
- `src/commands/wait.ts`: when no commit from the tip down to the CI commit has a run for a `ci` check and the CI commit is a merge commit, the check is answered by the runs on the CI commit's second parent (the merged strand's head, whose PR run tested it merged onto the braid branch; or `main`'s tip after a merge of `main`, which has its push run). The output names the answering commit as it does now. Everything else (exit codes, the cancelled rule, the start limit when nothing answers) stays.
- `test/wait.test.ts`: a merge commit with no runs of its own is answered green and red from its second parent; a merge commit with its own runs still uses them.
- Docs: the `braid wait` text in `docs/braids-format.md`, `docs/cli.md`, `src/cli.ts`; a note on D71 or D91, or a new decision in `docs/decisions.md` (no push CI on braid branches; why; the second-parent answer); `docs/development.md` if it describes when CI runs.
- `.agents/skills/braid-worker/SKILL.md`: in the review-findings paragraph, the fixes of one review round go out in one push (each push to a PR starts a CI run). Reword so the skill's word count doesn't grow.

## Already decided

- `main` keeps its push run; `pull_request` stays as it is, the fast path (D58) included.
- The user asked for this change to CI and the skill line (PM's brief for 0073); the CI change makes CI run less often, not less strictly per commit that reaches `main`.
- The second-parent answer is the way `braid wait` keeps working without push CI; no new flag or BRAID.md field.

## Out of scope

- CI skipping draft PRs (P10, not landed).
- The braid and braid-pm skills (0071 changes them).
- `ci: all` and the merge gate (0073/B, 0073/C).

## Completion

- [x] `.github/workflows/ci.yml` runs push CI only on `main`, and its comments say why
- [x] `braid wait` answers a merge commit without runs of its own from its second parent, with tests for green and failed
- [x] The braid-worker skill says one push per review round, and its word count is not higher (`wc -w` before and after in report.md)
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
