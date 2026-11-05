# Assigned task

Standalone resumed task. This message is the filled assignment. The operating skill revision is `d66843cfb23b1c5c3891732c458d30d2b077fae1`. Your bound root is `<bound-root>`.

Print these files with TWO SEPARATE commands, once each:

```powershell
Get-Content -LiteralPath '<bound-root>/AGENTS.md' -TotalCount 200
```

```powershell
Get-Content -LiteralPath 'C:/Users/exon/.codex/braid-pins/d66843cfb23b1c5c3891732c458d30d2b077fae1/.agents/skills/braid-worker/SKILL.md' -TotalCount 200
```

Do not use Read on those two paths. If either command prints no file text, stop and report the empty stdout. Do not retry either read. If output is truncated, say that only the visible portion was delivered; do not make another dump.

When both commands print file text, open `epics/braid/003-worker-skill/validation/D/live/probe-3/checkpoint.md` and continue its recorded next action. You may Read only that checkpoint and `epics/braid/003-worker-skill/validation/D/live/probe-3/checks/simulated.json`. Do not search the worktree or Git history. Do not open another path. Read-only Git metadata/status commands needed by the task are allowed. Do not contact GitHub. Do not edit any path, commit, push, or open a pull request.

Send one concise factual result to coordinator `8a3c206a-9192-498f-b90a-19b5bf807c8c` via `t3_thread_send`, naming actual root, branch, HEAD, whether each stdout contained text, any output truncation, the classification, changed paths, and any blocker. Then end the turn. Do not launch agents or self-queue.
