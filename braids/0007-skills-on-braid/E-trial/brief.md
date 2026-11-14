---
id: '0007/E'
title: "Trial: one braid end to end on the new skills"
status: Done
labels: ["kind:story", "tier:S"]
dependencies: ['0007/D']
order: 50
---

Goal: prove the MVP: with the skills and `braid` installed from the epic branch, one small real braid runs from plan to merge without Backlog.md.

Expected size: the trial braid's own change plus fixes to the skills or CLI it shows are needed.

Start here (read in this order):
- The parent TASK-7 (from TASK-7.4 on, braid `0007`) and the new skills.

Change:
- The coordinator installs the skills and `braid` from the epic branch (installer with `-Ref`), plans one small real braid with the user (a one-strand item from the outlines or a small fix), and runs it end to end on the new skills: brief, worker, review, merge into the epic branch, log and report.
- Every gap it shows is fixed in this strand's PR, or proposed as follow-up if large.
- The report lists what worked, what broke and what was fixed.

Already decided (don't re-investigate): the parent TASK-7; the trial braid is chosen with the user when this strand starts.

Out of scope: new features beyond what the trial needs.

## Trial run (coordinator, 2026-11-14)

Done: the skills and `braid` 0.1.1 were installed from the epic branch at 1edaaf4 (installer, all four hosts). Braid `0013` "braid view shows strand dependencies" was planned as a story by the new skill (`braid new` in a temporary worktree, brief edited directly, `braid check`, branch `braid/0013-…`), run by a worker launched with the skill's three-line first message, reviewed by the coordinator (tier S) and merged into the epic branch (PR #76, eeca1d8). The worker set In Progress and Done, ticked its boxes and wrote `report.md` with no Backlog.md. Deviation: its PR went into the epic branch, because `main` has no `braids/` until 0007 merges.

Found, to fix in this strand:
- On Windows the `braid.cmd` shim (Volta, npm) splits a text argument holding a quoted phrase with a space (`'x "b c" d'` → "braid log takes an id and one text"); run through `node` it works. Make text-taking commands safe to call from agents on Windows: the brief template's and skills' `braid log`/`braid report` examples use `--file -` (standard input) where text may hold quotes, and say why in one line.
- The shim also drops an empty `''` argument, so `braid edit --dep ''` and `--labels ''` can't clear a list (docs say `''` empties it). Accept `none` to clear (`--dep none`, `--labels none`), as `--order none` already does; update `braid help`, `docs/braids-format.md` and the template.
- Not a bug: the exit code passes through the shim (126).

## Acceptance

- [x] One real braid ran from plan to merge on the new skills, with its brief, logs and report in braids/
- [x] Gaps found are fixed or proposed as follow-ups in the report
- [x] npm run verify passes; CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open
