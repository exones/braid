# Report 0073/H

## What changed
- Merged `origin/main` (0071, PR #290) into the braid tip with a merge commit. Four docs conflicted; each keeps both braids' text:
  - `docs/braids-format.md`, `docs/cli.md`: 0071's `braid review <id|pm/<slug>>` text and 0073's `ci: all`, merge gate, second-parent answer of `braid wait`, `braid facts` naming the gate.
  - `docs/decisions.md`, `docs/roadmap.md`: main's D100/D101 rows, log lines and 0070/0071 roadmap lines, then 0073's.
- 0073's decisions renumbered: merge gate D100 to D102, `ci: all` D101 to D103, review bots D102 to D104. Updated in decisions.md, autonomy.md, braids-format.md and the roadmap. `braids/` and `epics/` unchanged. No code or help text referenced them.

## Why
0071 reached `main` first and owns D100 and D101.

## Validation
- `git grep -E "D10[0-4]"` outside `braids/` and `epics/`: every reference points to the right decision; decisions.md has D100 to D104 once each.
- `npm run verify`: 681 tests, all pass, about 6 min.

## Docs
Only the docs above; no other doc was affected.

## Open
Nothing. For later items: none. Needs the user: none.
