---
id: '0073/D'
title: "Large-repo lines: partial CI, review bots, path stops, caches, and the docs"
status: In Progress
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0073/B', '0073/C']
order: 40
---

## Goal

The rest of what a large repo needs, as documented lines, not code: partial CI on braid branches, review bots, path-scoped gates and path stops, caches and disk. Plus the braid's docs brought up to date as a whole (the docs strand's duty; the braid has no separate docs strand). Inbox 2026-11-23-n1xv, odxc, bbd3. Evidence from Everix (`C:\code\everix4`, read-only), whose BRAID.md already says most of this in prose:

- Partial CI: "Strand PRs into a `braid/*` branch get no TeamCity build (its PR check runs only for PRs into `main`), only Woodpecker's path checks and the review bots. The worker's local gate is the full evidence for a strand" (everix4 `BRAID.md`).
- Path gates: `deploys/ci/pr-routing.json` `teamcitySkip` routes docs- and frontend-only PRs past the .NET build; BRAID.md lists the narrower checks for them.
- Path stops: "A change under `code/finance` that can move prices needs the non-regression run against LTS" (everix4 `BRAID.md`, `AGENTS.md` line 63).
- Caches: `setup` holds "set NUGET_PACKAGES to a private folder for the worktree (shared caches are cleaned by other builds)".
- Review bots: `.coderabbit.yaml` at its root, and a Cursor automation.

Expected size: about 40 lines of skill and template text changed (net zero or fewer words) and a docs section of about 60 lines.

## Start here

- 0073/A, B and C as merged on the braid branch (`braid view 0073` log): what changed and its docs.
- `.agents/skills/braid/assets/braid-md.md`: the BRAID.md template and its field explanations.
- `.agents/skills/braid-worker/SKILL.md` (steps 3 to 5, CI and the report) and `.agents/skills/braid-reviewer/SKILL.md`.
- `docs/getting-started.md`, `README.md`, `docs/roadmap.md`, `docs/decisions.md`.

## Change

- Template `braid-md.md`: short body lines with examples, one per topic: CI on braid branches is partial or none, so the worker's gate output and duration are the strand's evidence; review bots by name (their check names and comment authors), and that with `ci: all` their checks count unless `ci` lists names; caches and per-worktree folders as a `setup` note; `merge-gate` and `ci: all` as 0073/B and C left them; the `merge-gate` line says the project's command must exit non-zero to refuse (a script that reports failure only in its output, exiting 0, needs a wrapper or an exit-code flag).
- AGENTS.md example (in the docs, not this repo's AGENTS.md): a path-based "ask first" stop (`code/finance/**`: ask before merging), and that the project's `merge-gate` can block such paths for `main`; path-scoped gates belong in the project's gate script.
- braid-worker skill: when BRAID.md says CI on the braid branch is partial or none, the report gives the gate's output summary and duration; when BRAID.md names review bots, after CI is green the worker waits for their reviews, triages each comment (fix it, answer why not, or mark a nit), pushes the round's fixes in one push, replies on each comment, and resolves the thread itself, and the report lists them.
- BRAID.md keys, read by the agents (no code): `review-bots: [<check name or comment author>, ...]` and `reviewer-with-bots: always` (the default: the braid reviewer still reviews and reads the bots' comments and the worker's replies) or `L-only` (tier S and M items the bots reviewed get no braid reviewer). The braid-reviewer skill reads the bots' comments and replies; the line that skips the reviewer for `L-only` goes where the coordinator picks the review by tier, and autonomy's merge condition 3 says the bots' review stands in for it there.
- A "braid on a large repo" section in `docs/getting-started.md` (or a new doc it links) with the Everix-like examples, all generic (no client or product names beyond "a large polyglot monorepo").
- `braid facts <pr>` (`src/commands/facts.ts`): one line naming the merge gate when BRAID.md has `merge-gate`, and whether `merge-gate-on` covers this PR's merge, e.g. `merge gate: <command> (runs on this merge)` (leftover 2026-11-23-avsv), with a test. The one code change in this strand.
- The docs as a whole for everything 0073 changed: README, getting started, `docs/cli.md`, `docs/braids-format.md`, `docs/autonomy.md`, roadmap status, decisions; `report.md` lists each doc from BRAID.md `docs` as updated or unchanged.

## Already decided

- No new code here beyond the `braid facts` line, and no new BRAID.md fields beyond those named; `review-bots`, partial CI and path stops are lines.
- Skill text gets shorter or stays the same size: `wc -w` per touched skill before and after, in `report.md`. Find words to cut in the same skills to make room.
- The braid-pm skill is not touched; the braid skill only for the `L-only` sentence above and its template under `assets/`.
- The user (q-gbni): the merge gate's scope is configurable, default strand and main (0073/B, `merge-gate-on`); the Everix-style example sets `merge-gate-on: [main]`. The braid reviewer with bots is configurable ("Configurable."); the default `always` is the PM's (cheap to reverse). The worker replies to each bot comment and resolves the thread itself ("A").
- The `L-only` line touches the braid skill (SKILL.md "Accept and hand over" step 1 and `references/autonomy.md` condition 3), which 0071 also changes: the coordinator tells the PM before this strand starts, and the worker keeps those edits to one sentence each.

## Out of scope

- `braid doctor` (P18), a `cleanup:` field, a disk-space check, `gate:` as a list, path rules in `ci`.
- This repository's own BRAID.md and AGENTS.md (the user's).

## Plan

1. `braid facts`: `mergeGateLine` in `src/commands/facts.ts` (scope: base is `main` → `main`, else `strand`), a test in `test/facts.test.ts`.
2. Template `braid-md.md`: front matter gains `review-bots`, `reviewer-with-bots` and a `setup` cache example; body lines for partial CI, review bots, caches, path stops; the `ci` and `merge-gate` lines shortened (the full behaviour is in `docs/braids-format.md`) so the file does not grow.
3. Skills: braid-worker (partial-CI gate evidence in the report; a review-bots round after green), braid-reviewer (read the bots' threads and replies), braid SKILL.md "Accept and hand over" step 1 and autonomy.md condition 3 (one sentence each, `L-only`); cut words elsewhere in each file; `wc -w` before and after.
4. Docs: a "braid on a large repo" section in `docs/getting-started.md`; braids-format (the new keys), cli (facts line), autonomy, README, roadmap, decisions; each doc from `docs` listed in report.md.
5. Gate, report, PR into the braid branch.

Baseline `wc -w`: braid-md.md 837, braid-worker SKILL.md 1773, braid-reviewer SKILL.md 709, braid SKILL.md 6365, braid references/autonomy.md 798 (braid skill folder 12801).

## Completion

- [x] The template shows, each with an example: partial CI on braid branches, `review-bots` and `reviewer-with-bots`, caches in `setup`, `merge-gate` and `merge-gate-on` (an Everix-style example with `[main]`), `ci: all`
- [x] The braid-worker skill covers the bots' comments (triage, one push, reply, resolve as decided) and the gate evidence for partial CI; the braid-reviewer skill reads the bots' comments and replies; `reviewer-with-bots: L-only` is honoured where the review is picked
- [x] `braid facts` names the merge gate and whether it runs on this PR's merge, with a test
- [x] `wc -w` of each touched skill is not higher than before (numbers in report.md)
- [x] The docs from BRAID.md `docs` are true for everything 0073 changed; report.md lists each as updated or unchanged
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
