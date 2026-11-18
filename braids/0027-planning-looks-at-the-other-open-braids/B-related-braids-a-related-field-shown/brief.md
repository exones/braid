---
id: '0027/B'
title: "Related braids: a related field, shown both ways"
status: To Do
labels: ["kind:story", "tier:L", "ask:architecture"]
dependencies: ['0027/A']
order: 20
---

## Goal

When a new braid overlaps an open one, the plan records the link so coordinators, workers and reviewers of both see it. A `related` front-matter field holds braid ids; `braid view` shows it both ways, since the other braid's brief belongs to its own branch and is never edited for the link.

Expected size: about 250 lines in 8 files.

## Start here

- `docs/braids-format.md`: the front-matter table and rules ("Unknown or repeated keys are errors") and the `braid view`, `braid new`, `braid edit` and `braid check` entries.
- `src/braids/frontmatter.ts`, `src/braids/brief.ts`, `src/braids/write.ts`: parsing and writing front matter; `dependencies` is the model for a list of ids.
- `src/commands/edit.ts`, `src/commands/braids.ts`: `--dep` and `braid view`.
- `src/braids/check.ts`: how `braid check` validates dependencies.
- `src/braids/branches.ts`: `loadLiveBraids`, and what 0027/A added for `plan/` branches.

## Change

- Front matter: optional `related`, a list of braid ids (`'0025'`), braids only; a strand that sets it is an error. braid writes it in the same form as `dependencies`, and only when it is non-empty, so existing briefs don't change.
- `braid new --related <ids>` and `braid edit <braid> --related <ids>|none`, replacing the list as `--dep` does.
- `braid view <braid>`: a `related:` line with each id and title, then `linked from:` with the open braids whose `related` names this one, read through the sources of 0027/A.
- `braid list --open`: `related: …` under a braid that has links.
- `braid check`: a `related` id that is the braid itself is an error; one found in no source is a warning (printed, exit 0), because the braid it names may live on a branch this checkout hasn't fetched.
- `docs/braids-format.md`: the field, the options, the view lines. `docs/decisions.md`: a new decision (one-way storage, back-links computed, unknown ids warn) and why.

## Already decided

- A link has no type in the front matter. What the relation is (overlap, a decision taken over, a split of work) is one line in the brief's "Already decided", written by the coordinator (0027/C).
- `dependencies` stays the only thing that orders work; `related` never blocks `braid next` or `braid start`.

## Failure modes

- A braid CLI older than this change fails `braid check` and every read of a brief with `related` ("unknown key"). Say so in the report and in `docs/braids-format.md`; the fix is updating the installed CLI.
- A malformed `related` on a branch copy must not break `braid list --open` or `braid view` for the other braids: that copy is skipped, as malformed branch copies are today.

Required regression tests: a brief without `related` is written byte for byte as before; `related` on a strand is rejected; back-links are found from a braid branch and from a `plan/` branch; an unknown id warns with exit 0.

## Out of scope

- Showing links on the board.
- Links between strands, or to Done braids' decisions.

## Completion

- [ ] `related` is read, written, edited and checked as above (tests, including the regression tests)
- [ ] `braid view` shows `related:` and `linked from:` (test)
- [ ] `docs/braids-format.md` and `docs/decisions.md` updated
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
