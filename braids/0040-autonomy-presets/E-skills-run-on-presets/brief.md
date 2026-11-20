---
id: '0040/E'
title: "Skills run on presets"
status: Done
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0040/A', '0040/B', '0040/D']
order: 50
---

## Goal

The three skills stop treating autonomy as one switch. The coordinator reads the braid's preset, merges and continues as its front matter says, and judges each stop case against its table: on the "decide yourself" side it decides and logs it, on the "ask me" side it asks. Workers do the same for the decisions they meet, and the reviewer checks what was decided against the preset.

Expected size: about 220 lines in 8 files. Keep to the skills' rule: each rule in one place, one sentence per rule.

## Start here

- `docs/autonomy.md` (0040/C, 0040/D): the format, the three presets, `braid autonomy`, `braid accept --merge --preset`, `braid decisions`.
- `.agents/skills/braid/references/auto-mode.md`: everything in it moves or changes.
- `.agents/skills/braid/references/stop-cases.md`: the cases and "Who records what".
- `.agents/skills/braid/SKILL.md`: "Plan" step 6, "Grow and adjust" (the mandate), "Accept and hand over" steps 2 and 5, "Sweep", "Merge on request", "Auto mode", "Talking to the user".
- `.agents/skills/braid/references/workflow.md`: "Tiers" and "Who merges".
- `.agents/skills/braid-worker/SKILL.md` and `.agents/skills/braid-reviewer/SKILL.md`: where each reports `Needs the user`.
- The braid log of 0027 and the thread review in 0040's brief: `architecture` on 0027/B was a stop that changed the design; `process` on 0024, 0026 and 0027/C got only "merge it".

## Change

- `references/auto-mode.md` becomes `references/autonomy.md`, read whenever the braid's preset is not `careful`:
  - Read the preset with `braid autonomy <number>` when you take the braid, and again after the user changes it.
  - Merging: `merge` says which PRs you merge yourself. The conditions for a merge stay as auto mode has them, with two changes: "Needs the user: none" becomes "nothing the preset says to ask about is open", and the merge is `braid accept … --merge --preset`. Then `braid wait` (0040/A).
  - Continuing: with `continue: yes`, start the next ready item, and a pending sweep story, without a go.
  - Deciding: for each stop case from the plan, the worker, the reviewer or `braid facts`, find its row. On the "decide yourself" side, decide, and log `Decided: <what>, because <why>, instead of <alternative>` on the item. On the "ask me" side, or when unsure, `braid ask` as today. "Ask at the final PR" means: go on, and put it under "Needs the user" in the final PR's recap.
  - Telling: after every third merge you made yourself, send the user `braid decisions <number> --since <the last one sent>` in a few lines, without stopping.
  - Hold: "hold", "pause" or "stop" from the user means finish the running item, start nothing and merge nothing until they say go; log it.
  - Changing the preset: only at the user's request, with `braid edit <number> --autonomy <name>` and a log entry, as one commit.
- `references/stop-cases.md`: the table stays; a line under it says the braid's preset decides, per case, who decides. "Who records what" gains the `Decided:` line.
- `SKILL.md`: the plan shows the preset the braid will run on and any exceptions (the brief's `## Autonomy` section), and the approval covers them; the mandate in "Grow and adjust" becomes "the preset's `scope` row" (the default row says what the mandate says today); "Auto mode" becomes "Autonomy" and points to the reference; "Accept and hand over" and "Sweep" name the preset where they name auto mode.
- `references/workflow.md`: "Who merges" names the preset; "Tiers" says the tier decides the review, not who merges.
- `braid-worker/SKILL.md`: read `braid autonomy <number>` with the brief; a stop case on the "decide yourself" side is decided and logged as `Decided:`, and the report's `Needs the user` holds only what the preset says to ask.
- `braid-reviewer/SKILL.md`: read the preset as the base branch has it; for each `Decided:` entry of the item say whether it is within the preset, and report one that isn't under `Needs the user` with its case.
- Remove the `auto` label and `auto: allowed` from the skills and from `assets/braid-md.md`, which gets `autonomy: <preset>`.

## Already decided

- `careful` is today's behaviour without auto mode, so a project that sets nothing changes nothing.
- The evidence for a merge is the same in every preset; the reference must not let a preset waive the review, the checks or the reviewed head.
- Tier L doesn't stop a merge by itself; only a preset's own line does.
- The reviewer reads the preset from the base branch because a PR could otherwise loosen the preset it is judged by. The wider idea (all rule files from the base branch, idea 2026-11-18-aske) is not part of this.
- 0029 edits one line of `assets/brief.md`; merge `main` into the braid branch first if 0029 is merged by then.

## Out of scope

- `AGENTS.md`, `BRAID.md`, the README and `docs/` outside `docs/autonomy.md` (0040/F).
- New stop cases, or a change to what each case means.
- `delivery: main` (0035).

## Completion

- [x] The autonomy reference covers reading, merging, continuing, deciding, telling, hold and changing the preset, and no skill file mentions auto mode, the `auto` label or `auto: allowed`
- [x] A coordinator can tell from the skill alone what to do with a stop case on either side of a row, and when unsure
- [x] The plan shown to the user names the preset and the braid's exceptions
- [x] The worker's skill has the `Decided:` rule and the reviewer's the check against the base branch's preset
- [x] The line counts of each changed skill file, before and after, are in the report
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. `references/auto-mode.md` → `references/autonomy.md` (git mv, then rewrite): Reading, Merging (seven conditions, 5 and 6 reworded, `--merge --preset`, `braid wait` step kept), Continuing, Deciding, Telling, Hold, Changing the preset, Stopping.
2. `references/stop-cases.md`: one line under the table (the preset decides who decides, per case); "Who records what" gains the `Decided:` line (the one place for its format and where it is logged).
3. `SKILL.md`: description; Plan steps 5–6 (preset and `## Autonomy` exceptions in the plan, approval covers them); Grow and adjust mandate = the preset's `scope` row; Accept and hand over steps 2 and 5; After the merge step 7; Sweep; "Auto mode" → "Autonomy"; Finish step 4; Talking to the user.
4. `references/workflow.md`: Tiers (review, not who merges), Who merges (the preset), failure-mode row.
5. `references/resuming.md`: the `auto` label line → read the preset.
6. `assets/brief.md`: `autonomy` field and `## Autonomy`; the accept comment names `--preset`.
7. `assets/braid-md.md`: `auto: allowed` → `autonomy: <preset>`.
8. `braid-worker/SKILL.md`: read `braid autonomy`, `Decided:` rule, `Needs the user` only what the preset says to ask.
9. `braid-reviewer/SKILL.md`: preset read from the base branch; each `Decided:` entry checked against it.
