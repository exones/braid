One approval of a goal's plan now covers the planning PR's merge and the start, and the plan names its braid first.

- `.agents/skills/braid/SKILL.md`: a new "Ground rules" line says the plan and the first message after a start or resume (including one taken over through `references/resuming.md`) open with the braid's number and title; "Plan" step 6 points to it. "Plan" step 7 closes the plan request with `braid answer` at the approval; for a goal the coordinator opens and watches the planning PR and, once its `ci` checks are green, merges it itself with `gh pr merge <pr> --merge --match-head-commit <squashed sha>`. A head other than that commit is not merged: the coordinator shows what changed and asks again (`braid ask … --kind plan`). Step 8 starts the first strand after that merge with no further go; "asked only for a plan" still stops. "Run an item" step 4 no longer hands the planning PR to the user and sends a wake on it to "Plan" step 7, and the description and "Accept and hand over" step 5 name the planning PR as the exception.
- `references/workflow.md`: "Who merges" has the planning PR as a third case; the "Planned goal" row says the coordinator merges it under the plan's approval.
- `docs/getting-started.md`, "Merging and auto mode": the same, for the user.
- `docs/decisions.md`: new D67 with the reasons (0028's 221-minute wait, 0012's wrong number, `braids/`-only PR into the braid branch, D58's fast checks); D28 and D31 point to it; a decision-log line. Numbered D67 because braid 0037 holds D66 on its branch.

Why: approving a plan took three answers (approve, merge, go), and the merge gives the coordinator nothing the user did not approve because it is pinned to the approved commit, goes into the braid branch only and still waits for green checks.

Validation: `npm run verify` passes (312 tests). Text-only change to agent instructions and docs; no code.

Decisions: D67 rather than D66 (0037 holds D66); the re-ask on a changed head uses `--kind plan`, since it is still the plan's approval.
For later items: 0040/E moves the plan-approval wording into the autonomy reference as it stands; plan approval stays with the user in every preset. Whichever of 0037 and 0040 lands second checks the D66/D67 numbering.
Needs the user: process: SKILL.md "Plan" steps 6 to 8 and workflow.md "Who merges" change who merges the planning PR; reviewed at the final PR into main as planned.
