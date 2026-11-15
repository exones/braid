---
id: '0015/E'
title: "Skills: ask before every stop"
status: In Progress
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

- [ ] Every place where the skills stop for the user names `braid handover` or `braid ask`
- [ ] The reviewer launch uses `braid start <id> --review`
- [ ] The skills grew by at most 100 words in total

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
