# N: storage naming correction plan

Date: 2026-11-03. Outcome: decision recorded and bounded follow-up prepared; product rename not yet applied.

The user clarified that the tool's `agento` name also applies to its state directory. `.agento/` supersedes the earlier explicit `.crew/` retention default. Updated root guidance, naming decision, decision D18, epic dependency order, and D's prerequisites. Task N covers runtime, internal identifiers, help/errors, tests, ignore rules, and current contract/usage documentation.

Checkout: `C:\code\agento`, branch `main`, HEAD `3283807afee076d2d4cf1ee24c44ba1df20576da`. Existing staged/unstaged user and worker changes are preserved. Both root `.crew` and `.agento` were absent when checked. No ledger data was moved or deleted.

The current checkpoint records C running in the shared checkout. The coordinator skill says: "If a worker is already running in a shared checkout, do not switch branches, stage, commit, push, or edit its files concurrently." Accordingly, C's code, tests, README, contract, and ignore file remain unchanged by this planning turn. No delegate was polled, interrupted, or messaged.

Validation for this turn: inspect remaining naming references, check local links in new/updated planning files, and run scoped `git diff --check`. No product gate or hosted CI result is claimed for the rename. Historical reports and original reference material retain their recorded names.

Next: after C returns, review its result and assign N before packaging D. No user input is required. The correction is pre-release and introduces no automatic migration; existing old-name directories must remain untouched.

## C returned at the handoff boundary

C's completion arrived during this turn. Read `reports/C.md`, `checkpoints/C.md`, and the filesystem implementation; independently reran `pwsh -NoProfile -File ./scripts/Verify.ps1`: exit 0, Node v26.13.0/npm 11.20.0, typecheck/build, 3 suites and 38 tests passed, no skips. C is In Review, with hosted CI/review/merge still outstanding. The candidate is available for N; this is not a claim of release readiness or full independent correctness review.

Scoped `git diff --check` and the epic/new-task planning-link check passed. Capability discovery confirms provider `cursor`, model `grok-4.7`, and option `reasoning_effort: xhigh`; N can use the user's preferred configuration without substitution. Continue in the same shared checkout to include uncommitted context, with no Git writes by the worker and no parallel implementation.

N implementation started through `delegate_task`, client request `93edcb2b-7aab-4d58-ad1e-b45467cbbdc2`, confirmed Cursor `grok-4.7` / `reasoning_effort: xhigh`, shared isolation. Result says completion wakes this thread: end the turn, do not poll. Worker: <t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/thread:delegated-task:command%3Amcp%3Ad516eddd-b5de-42ae-905c-f8e6669b5562%3Adelegate-task%3A93edcb2b-7aab-4d58-ad1e-b45467cbbdc2>.
