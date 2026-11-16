## What changed

- `braid/SKILL.md`, ground rules: one rule replaces the "ask the user" bullet: a turn that waits for the user ends with an open request, `braid handover` for a PR to merge, otherwise `braid ask <id> "<what is needed>"` (`--kind`, `--key`), then the question; `braid answer <id> --log -` records the answer; a wait for agents or CI needs none.
- `braid/SKILL.md`, each stop for the user names its command: plan approval and the plan-only go (`braid ask --kind plan`), converge loop (`--kind decision`), growth past the mandate (`--key scope`), a worker failing twice, side ideas, Outline questions, a moved head, the auto-mode stop (`--key <case>`), resuming; strand, story and final PR handovers use `braid handover`, whose printed recap replaces `braid recap` there ("Talking to the user": `braid recap` stays for merged or blocked items).
- Reviewer launch: `braid start <id> --review` and a thread on the folder it prints, replacing `git worktree add --detach` (braid SKILL.md and braid-reviewer SKILL.md).
- `workflow.md` and README: To Review follows `braid handover`, not any open PR; Needs You follows `braid ask`. `stop-cases.md` (all three copies, kept identical) names `braid ask --key` and the handover recap.
- `docs/decisions.md`: D45 records the rule and the reviewer checkout; a decision-log line.

## Why

0015's plan (user, 2026-11-15): the board can only show "Needs You" or "To Review" when a request exists, so the coordinator must open one before it stops for the user.

## Validation

- Word counts (whitespace-split), before -> after:
  - `braid/SKILL.md` 3489 -> 3552 (+63)
  - `braid/references/workflow.md` 1458 -> 1459 (+1)
  - `braid/references/stop-cases.md` 393 -> 401 (+8), same for the braid-worker and braid-reviewer copies (+8 each)
  - `braid-reviewer/SKILL.md` 418 -> 423 (+5)
  - Total 6544 -> 6637 (+93, within 100); +77 counting stop-cases once.
- Command usage checked against `node dist/cli.js help` on this branch.
- `npm run verify` passes.

## Open

- Waits with no item yet (`braid --version` failing, no models in BRAID.md) can't open a request; the ground rule covers item waits only by its nature.
- The planning PR has no item branch, so `braid handover` can't find it; the plan request from step 4 stays open until the user answers.

For later items: none

Needs the user: process: changes to the braid skills (the user reviews the wording)
