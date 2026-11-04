# Task thread routing clarification

The user's top-level thread preference is now explicit standing authorization for future assignments within approved scope. H continues as its existing delegate; its review may be a subagent.

## What changed

AGENTS records the project preference. Coordinator routing and T3 continuation recognize standing requests and no longer let provider/settings differences alone select a child. Host-required exceptions remain explicit. The decision log and coordinator checkpoint retain H's user-approved exception.

## Why

Tasks should have their own listable identity and be able to watch their PR when needed. Continuation should preserve the user's selected route without repeated confirmation or silent substitution.

## Left for you

No action needed. H remains untouched. The coordinator will reconcile these local policy changes with any overlapping H edits at the next safe integration boundary, then continue acceptance/review under the existing gates.

## Technical record

Coordinator checkout `C:/worktrees/agento/epic-braid-003-worker-skill`, branch `epic/braid-003-worker-skill`, starting HEAD `27b62e87fa00fa043e358500e47a33b12957371d`. Documentation-only edit; no product, CI, assignment packet, worker checkout, task or PR mutation. Skill validation and scoped whitespace/link checks are recorded with the coordinator result; they do not prove live host behavior or change existing acceptance gates. No new PR or hosted proof is claimed.

Validation: both `python -X utf8 -B C:/Users/exon/.codex/skills/.system/skill-creator/scripts/quick_validate.py` runs for the coordinator and worker skills exited 0. All 50 local file links in the changed policy/report files resolve; no new anchor targets were introduced. `git diff --check` exited 0. Keep this coordinator commit local until the next safe H integration boundary to avoid changing its remote PR base during execution.
