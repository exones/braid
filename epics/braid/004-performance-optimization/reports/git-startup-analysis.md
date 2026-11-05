# Git startup analysis and backlog addition

The repeated startup work has two parts: comparing Git facts and constructing/rediscovering the procedure and context. [Item C](../backlog/C-git-startup-check.md) adds a shared local checker and explicit entry instructions; the running A assignment continues unchanged.

## What changed

Added C as a separate story, queued after A for shared-file ownership, with no functional dependency on B. It specifies a PowerShell/Git-only helper, explicit expectations, structured match/mismatch output, read-only offline fixtures, and worker/reviewer/coordinator entry integration. No checker or skill change is implemented in this planning update.

## Why

The supplied review screenshot shows `git rev-parse --show-toplevel`, `git branch --show-current`, `git rev-parse HEAD`, and status in one command batch. It then shows searches for review conventions, headings and assignment context, followed by substantive proof-script review. The displayed 3m10s includes those activities; no individual Git duration, redundant rerun count, or comparable baseline is available. It supports a command-construction/context-discovery concern, not a measured claim that local Git takes minutes.

At analysis revision `50e594bb3a20db7dffff149c5ecfe7fcac134e85`, [worker initial entry](../../../../.agents/skills/braid-worker/SKILL.md#initial-entry-context-and-checkout) already requires one verification batch and no routine fetch/history/upstream repair. The [packet](../../../../.agents/skills/braid-worker/assets/assignment-packet.md) lists the required facts but leaves command construction and comparison to each agent. `git ls-files scripts` shows no shared workspace-binding helper. The [review template](../../../../.agents/skills/braid-coordinate/assets/review.md) supplies candidate/evidence fields but no equivalent executable startup contract.

Existing [startup-efficiency work](../../../reports/worker-startup-efficiency.md) already separates initial/read-now from checkpoint-first resume. BRAID-003 [D](../../003-worker-skill/backlog/D-worker-behavior-proof.md) already covers broader behavioral proof and startup measurements. [Stage 2 doctor](../../../../docs/roadmap.md#bootstrap-rules) plans these checks in the product later. C addresses the missing reusable maintenance script now, without repeating those projects or claiming product doctor exists.

The expected gain is less agent reasoning, command authoring and output interpretation, plus fewer unguided context searches. The mandatory checks remain useful: a wrong checkout, stale candidate or another owner's index can invalidate the work. One script still uses several short local Git reads; performance and behavioral improvement must be observed rather than assumed.

## Left for you

No action is needed. C is added to the backlog; A remains the single active implementation worker. Future dispatch must pin C's execution skill outside the candidate checkout because C edits skills. A's packet, pin and checks are not changed.

## Technical record

- Checkout/branch: `C:/worktrees/agento/epic-braid-004-performance-optimization`, `epic/braid-004-performance-optimization`; local/origin HEAD at analysis `50e594bb3a20db7dffff149c5ecfe7fcac134e85`.
- Input: user-supplied review screenshot `image_43891f50-c61b-4665-8caf-5fc51e503048`, supplied 2026-11-05. Record the visible observations above; do not rely on the host's temporary attachment path as a future worker dependency.
- Sources: exact named policy/templates, tracked script inventory, prior startup-efficiency report, D's scoped acceptance and roadmap doctor boundary. No live trial, delegate, worker interruption, toolchain install or Git mutation in another checkout was used for this analysis.
- Planning validation passed (exit 0): `pwsh -NoProfile -File scripts/Test-CoordinatorRecordsGate.ps1 -Base 50e594bb3a20db7dffff149c5ecfe7fcac134e85` checked all 5 changed paths under epics/, relative Markdown links/anchors and LF/whitespace across 256 tracked text files; 7 existing exclusions matched. Staged `git diff --check` also passed. No implementation CI, review, merge or speedup is claimed.
- Next: preserve C for a later committed assignment; await A's green result and perform the existing independent-review/human-merge flow.
