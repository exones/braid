# A validation

These are instruction walkthroughs, not executed agent simulations.

| Scenario | Expected actions and recipient | Instruction evidence |
| --- | --- | --- |
| Assigned | Matching branch/SHA starts; mismatch/scope escalates to coordinator; epic base, spike report and checkpoint remain. | Start, Work, Deliver, Habits |
| Standalone | Chat plan waits for confirmation; owned worktree/item branch, project main, setup/gate, worker CI and user report; no epic/ID. | Choose the entry, Start, Deliver |
| Dirty/unowned/ambiguous | Resolve mode and ownership before writes; leave unrelated changes alone. | Choose the entry, Start 2 |
| Scope/blocker | User for standalone, coordinator for assigned; no automatic epic creation. | Recipient definition, Work, Deliver 4 |
| CI | Failure gets worker fix/gate/push; pending waits; missing required check is not success; ci: none uses gate. | Deliver 3–5 |
| Review/resume | Configured review subagent reports only; worker fixes same PR and owns CI. Required review/blockers prevent completion. External checkpoint preserves context; repeated merged prompt stops. | Standalone review, Habits |
| Portability | Main/model/setup from project facts; task artifacts need no epic; worker has no external skill links. | Entire self-contained worker file |

Executed: npm ci and worker quick_validate.py passed. Gate results are recorded in the PR. No executable behavior changed; no new executable tests were added. Independent review remains coordinator-led and pending. Walkthroughs do not prove live model behavior.

Five files changed including this report. Existing coordinator review and project-facts templates remain applicable without edits. No installed skills changed.