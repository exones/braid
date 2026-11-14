---
id: '0003'
title: "Skills diet: shorter braid skills, one place per rule"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: []
order: 30
delivery: main
---

Goal: shorter braid skills with one place per rule, after auto mode (TASK-1) grew `braid/SKILL.md` by about 30% (2,552 to 3,328 words).

Run after the user's behavior trial of auto mode, so the trial uses the skills as reviewed.

Expected size: net fewer lines across the braid skills (braid-reviewer may grow); about 10 files.

Start here (read in this order):
- `.agents/skills/braid/SKILL.md`, `references/workflow.md`, `assets/task.md`, `references/stop-cases.md`.
- `.agents/skills/braid-worker/SKILL.md`, `.agents/skills/braid-reviewer/SKILL.md`.
- TASK-1's notes (the log) and the final review of PR #50.

Change:
- Move auto mode to `braid/references/auto-mode.md`; `SKILL.md` keeps one line saying to read it when the user asks for auto mode.
- Remove duplication between `SKILL.md` and `workflow.md` (who merges what, branch rules, tiers and review): each rule lives in one place, the other points to it.
- Fold the prose in `assets/task.md` into its command examples.
- Fix three leftovers from TASK-1 (PR #50 review): ground rule 2 still says the parent goes In Progress in "the epic's first commit" (the commit-points rule says after the planning merge); the skill's YAML description can be read as forbidding merge on request of a story or the final PR (only auto mode never merges them); the grown-story row in workflow.md and "Finish" disagree on when the parent goes Done.
- One copy of `stop-cases.md`: keep it in `braid/references/`; `braid-worker` and `braid-reviewer` point to `../braid/references/stop-cases.md` (the installer always installs the three skills together), and the docs gate's same-file check goes away (user's PR #50 review).
- Enrich `braid-reviewer`: research well-regarded code-review skills and prompts online and add what improves its reviews (for example edge cases and failure paths, testing the tests, a confidence bar for findings), still short; name the sources in the final summary (user's PR #50 review).
- `scripts/Install-Skills.ps1` without `-Ref` installs from `origin/main` after a `git fetch`, not the local `main` branch, which can be stale (on 2026-11-13 a stale local `main` replaced the new skills with the old `braid-coordinate`); README and the Pester test follow.
- Parent's references: the coordinator adds the epic branch and the planning PR with `--add-ref` at planning, and the final PR when it opens, so a goal's properties show at the top of its parent.

Already decided (don't re-investigate):
- No rule is lost: the reviewer compares old and new rule by rule.
- Keep instructions very short, as TASK-1's rule says; give before and after word and line counts of every changed skill file.

Out of scope: new behavior beyond the references field the reviewer enrichment and the installer default.

## Acceptance

- [ ] braid/SKILL.md is at most 2,600 words; auto mode lives in references/auto-mode.md
- [ ] Each rule is stated in one place; the reviewer confirms no rule was lost
- [ ] The three PR #50 leftovers are fixed
- [ ] A goal's parent carries the epic branch, planning PR and final PR as references
- [ ] npm run verify passes
- [ ] stop-cases.md exists once, in braid; braid-worker and braid-reviewer point to it and the installed skills still resolve it
- [ ] braid-reviewer adds review practices from researched sources, named in the final summary
- [ ] Install-Skills.ps1 without -Ref fetches and installs origin/main; a Pester test covers it

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] Final summary written: what changed, why, validation, anything open
