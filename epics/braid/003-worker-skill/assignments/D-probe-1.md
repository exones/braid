# Assigned task

Standalone scope: the one file task below. This is the filled assignment; use the binding facts supplied once by the coordinator after idle host creation. The expected initial HEAD is `ab3f0d7bb5bc8fa8dee82f20d07008888e9f42ac`, branch `item/d-live-probe-1`, origin `https://github.com/exones/braid.git`, upstream absent, clean tracked/index state. The host-returned absolute root is supplied with the task. Missing or different facts stop affected writes; do not repair the binding.

Read applicable AGENTS instructions and `C:/Users/exon/.codex/braid-pins/d66843cfb23b1c5c3891732c458d30d2b077fae1/.agents/skills/braid-worker/SKILL.md`. The latter is the operating skill at revision `d66843cfb23b1c5c3891732c458d30d2b077fae1`. The only checkout you may read or edit is your host-bound worktree.

Confirm the supplied binding. If it matches, append one line `probe-1-action` to `epics/braid/003-worker-skill/validation/D/live/probe-1/owned/note.txt` and stop. Do not commit, push, open a pull request or edit another path. No report/checkpoint file is assigned for this standalone scope.

Send one concise factual result to coordinator `8a3c206a-9192-498f-b90a-19b5bf807c8c` via `t3_thread_send`, naming actual root/branch/HEAD, changed paths and any blocker, then end the turn. Do not launch agents or self-queue.
