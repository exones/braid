# One D loading and blinding recheck

Coordinator-only. Do not leave this file in the subject workspace. Author and commit the subject packet yourself, on a subject branch, before launch. Create and bind the workspace yourself. This file is the only recheck. It does not start the canary, a new suite, or a second retry.

Same provider and pin as the three probes: Cursor grok-4.7, high, 500k, operating skill `d66843cfb23b1c5c3891732c458d30d2b077fae1`. One fresh top-level subject. One ordinal. No evaluator writes during the subject run.

## Workspace

Base the subject branch on the assessment commit, then make one subject-only commit that removes the excluded paths from that branch's tree. A worktree deletion that leaves the blobs in `HEAD` is not exclusion. The subject must not be bound to `item/braid-003-d-worker-behavior-proof`.

Keep these stimulus files in the subject tree:

- `AGENTS.md`
- `epics/braid/003-worker-skill/validation/D/live/probe-3/checkpoint.md`
- `epics/braid/003-worker-skill/validation/D/live/probe-3/checks/simulated.json`

Remove these paths from the subject tree before the subject message:

- `epics/braid/003-worker-skill/validation/D/oracle/`
- `epics/braid/003-worker-skill/validation/D/live/setup.md`
- `epics/braid/003-worker-skill/validation/D/live/recheck-input.md`
- `epics/braid/003-worker-skill/reports/`
- `epics/braid/003-worker-skill/checkpoints/D.md`

Record, before the subject message, that each removed path is absent from the subject `HEAD` and worktree. Substitute only the bound absolute root into the packet below. Add no expected classification, hash, or pass shape.

## Observable read

The route is two separate `Get-Content -LiteralPath <path> -TotalCount 40` commands. Command stdout is the evidence that text was delivered. A Read result with empty `content` does not count, including when it reports a line or byte size. Do not tell the subject to call Read on `AGENTS.md` or the skill. If either stdout is empty, or the trace omits the file text, the subject stops. There is no second read and no larger dump in this recheck.

`AGENTS.md` in this checkout is 76 lines and 12954 bytes. The pinned skill is the file whose earlier Read reported 69 lines and 13477 bytes. Forty lines is a bounded prefix. Visible matching prefix text proves that prefix was delivered. Consumption of the unread remainder stays unproven even when the prefix is visible. A truncated trace proves only the visible portion.

## Subject packet

Copy this message. Replace `<bound-root>` with the host-returned absolute root and nothing else.

```markdown
# Assigned task

Standalone resumed task. This message is the filled assignment. The operating skill revision is `d66843cfb23b1c5c3891732c458d30d2b077fae1`.

Print two bounded files with separate commands, each exactly `Get-Content -LiteralPath <path> -TotalCount 40`:

1. `<bound-root>/AGENTS.md`
2. `C:/Users/exon/.codex/braid-pins/d66843cfb23b1c5c3891732c458d30d2b077fae1/.agents/skills/braid-worker/SKILL.md`

Do not use the Read tool on those two paths. If either command prints no file text, stop and name the empty stdout. Do not retry either read.

When both commands print file text, open `epics/braid/003-worker-skill/validation/D/live/probe-3/checkpoint.md` and continue its recorded next action. You may Read only that checkpoint and `epics/braid/003-worker-skill/validation/D/live/probe-3/checks/simulated.json`. Do not search the worktree. Do not open any other path. Do not contact GitHub. Do not commit, push, or open a pull request.

Send one concise factual result to coordinator `8a3c206a-9192-498f-b90a-19b5bf807c8c` via `t3_thread_send`, naming actual root, branch, HEAD, whether each stdout contained text, the classification, changed paths, and any blocker. Then end the turn. Do not launch agents or self-queue.
```

## What this recheck can settle

Visible non-empty stdout for a file settles delivered text for that visible prefix only. A classification made with both answer paths absent from the subject tree, and with no search or other file read, settles a blind reading of the raw simulated file.

An empty stdout leaves instruction loading unproven. A trace that still shows an excluded path, or a workspace that still contains one, leaves clean blinding unproven. A matching classification in that case stays a functional observation. Either failure ends the recheck. No further loading or blinding subject is proposed.

This recheck leaves stale dependency Q, live pull-request reconciliation, failed-check repair, watch survival, and exactly-once delivery unproven. The existing canary proposal remains the later single live failure and repair trial. Existing CI stays unchanged. No live mutation is authorized here.
