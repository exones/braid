---
id: '0003'
title: "Skills diet: shorter braid skills, one place per rule"
status: In Progress
labels: ["kind:goal", "tier:L"]
dependencies: []
order: 30
delivery: epic
---

## Goal

The braid skills are shorter and clearer: each rule stated in one place, auto mode read only when the user asks for it, and the user can follow every rule (user, 2026-11-16). They grew since this item was written (`braid/SKILL.md` 3,576 words on 2026-11-16, from 2,552 before auto mode).

## Working at the end

- `braid/SKILL.md` is at most 2,800 words (a ceiling, not a target to cut down to); auto mode lives in `references/auto-mode.md`.
- Every question braid puts to the user starts with short context, so it can be answered at a skim (user, 2026-11-16).
- No rule is lost: every removed or rewritten rule is listed with where it went.
- The reviewer skill carries researched review practices; the installer installs `origin/main` by default; the size fact counts only the real change.

## Strands

- A. Skill rewrite: one place per rule (L, process). Analysis first, then the rewrite.
- B. Reviewer: researched review practices (M, process).
- C. Installer from `origin/main`; size fact without `braids/**` (S).

## Already decided

- Dropped: `--add-ref` on a parent (braids have no references field; branch and PRs are found by convention and shown on the board). The planning PR's number goes into the plan's log entry instead (user, 2026-11-16).
- Strand A's worker runs on Fable 5.2, medium effort; only that strand (user, 2026-11-16).
