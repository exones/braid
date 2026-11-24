---
id: '0073/F'
title: "Fix: final review, braid skill no longer than on main"
status: In Progress
labels: ["kind:task", "tier:S"]
dependencies: []
order: 60
---

## Goal

The review of 0073's final PR #287 (https://github.com/exones/braid/pull/287#issuecomment-7118634198) found two blocking points.

1. **The braid skill folder is longer than on main.** It is 270 words longer, almost all from the BRAID.md template `.agents/skills/braid/assets/braid-md.md`, which went from 565 to 806 words when 0073/B, C and D extended it. The user's rule: skills, each as a whole, get no longer ("don't overblow skills").
2. **Docs credit the wrong command with reading checks.** `braid facts` doesn't read checks; `braid recap` does.

This strand brings the braid skill folder back to at most its size on `main` and makes the command names true.

Expected size: about 270 words moved out of the template into the docs, plus a few doc lines.

## Start here

- `.agents/skills/braid/assets/braid-md.md`: the template, compared with `git show origin/main:.agents/skills/braid/assets/braid-md.md`.
- `docs/braids-format.md`, where BRAID.md's fields are described, and `docs/getting-started.md` ("braid on a large repo").
- The review comment above.

## Change

- **The template:** keep each key with a one-line example and at most one short clause. Move the explanations to `docs/braids-format.md` (or getting-started's large-repo section), and add one line in the template pointing there. Covers: what `[]`, `all`, a list and `none` mean for `ci`; `merge-gate` and `merge-gate-on`; `review-bots` and `reviewer-with-bots`; partial CI; caches; path stops.
- **Size target:** the braid skill folder as a whole is at most its word count on `main`, measured as the sum of `wc -w` over the folder's files on `origin/main` and on this branch. The two `L-only` sentences in SKILL.md and autonomy.md stay, so the template pays for them.
- **Command names:** wherever docs or a Completion box say `braid facts` checks CI for `ci: all`, name the commands that do: `braid wait`, `braid accept`, `braid handover` and `braid recap`. In getting-started, the 2-minute start grace applies only to `braid wait`; the others read once.

## Already decided

- Nothing in the CLI changes, and no skill outside the braid skill folder changes.
- The other skills are already shorter than on `main`.

## Out of scope

- Any behaviour change.

## Completion

- [x] The braid skill folder's `wc -w` sum is at most its sum on `origin/main`, with both numbers in report.md
- [x] The template keeps every key from 0073 with an example; their explanations live in the docs, and the template links to them
- [x] Docs name `braid wait`, `braid accept`, `braid handover` and `braid recap` (not `braid facts`) for `ci: all`, and give the start grace to `braid wait` only
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
