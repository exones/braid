---
id: '0015/E'
title: "Skills: ask before every stop"
status: Done
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0015/D']
order: 50
---

## Goal

The braid skills use requests: before the coordinator ends a turn that waits for the user, it has run `braid handover` or `braid ask`, so the board says what is needed.

Expected size: about 20 to 40 lines in 4 files; the skills' total word count must not grow by more than 100 words.

## Start here

- `../states.md`; the commands from 0015/C and 0015/D (`braid help`).
- `.agents/skills/braid/SKILL.md` ("Accept and hand over", "Merge on request", "Auto mode", "Finish", "Talking to the user", ground rules), `references/workflow.md`, `references/stop-cases.md`, `.agents/skills/braid-reviewer/SKILL.md`.

## Change

- Handing a PR to the user: `braid handover <id> --head <sha>` (it prints the recap draft; `braid recap` stays for drafts without a handover).
- Any other stop for the user (a stop case, a plan or spike decision, a question): `braid ask <id> "<what is needed>"`, then the question; when the user answers, `braid answer <id> --log -`.
- The reviewer's checkout comes from `braid start <id> --review`, replacing the hand-made detached worktree.
- One rule in the ground rules: a turn that waits for the user ends with an open request; a wait for agents or CI needs none.
- Report the word counts before and after.

## Already decided

- The user approved this process change in the plan (2026-11-15); the wording is theirs to review in the PR.

## Out of scope

- Any other skill cleanup (braid 0003).

## Acceptance

- [x] Every place where the skills stop for the user names `braid handover` or `braid ask`
- [x] The reviewer launch uses `braid start <id> --review`
- [x] The skills grew by at most 100 words in total

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Ground rules: merge the "ask the user" bullet with the new rule: a turn that waits for the user ends with an open request (`braid handover` for a PR to merge, else `braid ask`), closed with `braid answer --log -`; a wait for agents or CI needs none.
2. braid SKILL.md: name `braid handover` or `braid ask` at each stop for the user (plan approval, plan-only stop, converge loop, growth past the mandate, recap of a strand, story and final PR, moved head, auto-mode stop, side ideas, Outline questions); `braid recap` only for drafts without a handover; the reviewer's checkout from `braid start <id> --review`.
3. braid-reviewer SKILL.md: the checkout comes from `braid start <id> --review`.
4. workflow.md and README: To Review follows `braid handover`, not an open PR; stop-cases.md (all three copies): a stop opens a `braid ask --key` request.
5. Pay for the additions with shorter wording nearby; total growth at most 100 words. Count before and after.
