# Spike A: preflight and seed contract

Status: done. Delivered in PR #1, human-merged as `afc05074a27da2cb1a3c225bc9d42d10f184e504`; see `reports/bootstrap-delivery.md`. Implementation agent: one. Depends on: none.
Kind: spike. Epic: AGENTO-001. Feature: F1, verified manual tracking.

Research question: what is the smallest exact epic/story CLI contract supported by this environment? Limit: one bounded research assignment; aim for half a day or less and record any unanswered question rather than expanding into implementation.

## Read first

`AGENTS.md`, `docs/decisions.md`, `docs/agile-workflow.md`, `docs/roadmap.md`, this epic, and its current checkpoint. Use `inspiration/README.md` for the file discipline only. The coordinator has already analyzed/refined the assignment; do not start another coordinator/team.

## Outcome

Turn the seed scope into a small exact contract and record the environment facts the implementation agent needs. No product implementation in this task.

## Work

1. Inspect workspace, Git status/repository/remote if present, and available Node/npm/PowerShell/git/gh/t3 versions. Report missing tools. Do not dump authentication files or environment variables.
2. Record facts in `reports/A.md`. The initial planning inventory contained only the MVP plan and inspiration; recheck rather than assuming Git was initialized.
3. Select a supported Node LTS and PowerShell 7 baseline, consulting current official release/support information. Record the intended pin and the reason. CLI executable is already selected: `agento` (see `docs/cli-name.md`). Choose a provisional local npm package name if the publication identity is unknown; do not reopen the command name.
4. Write `docs/seed-contract.md`: exact CLI usage, epic selection/path handling, validation, exits, idempotent `init`, non-overwriting `new`, `story` commands, allowed backlog transitions, manual evidence notes, status output, storage/schema version, state/event consistency and failure boundaries. Distinguish an epic's outcome from a future execution run. Keep it implementable by B/C/D.
5. Enumerate Given/When/Then acceptance scenarios: initialize a temporary folder, create an epic ledger, add/start/block/resume/complete a story, restart the CLI, inspect status/events, reject an invalid transition, and preserve prior data on repeated initialization. Record how tasks/spikes fit the minimal ledger without adding a second tracking system.
6. Optional read-only `t3 --help`/subcommand help can confirm installed command availability. Record current vs historical observations. Live thread creation, messaging, restart/kill tests and full adapter fixtures belong to stage 2. Unknowns do not block the seed.
7. Record missing GitHub target/setup questions in the report. Continue independent contract work. Do not create a remote, initialize Git, or change infrastructure in A.

## Acceptance

- The next agent can implement B/C without inventing command semantics or completion claims.
- Contract specifies manual completion separately from future gate acceptance.
- Defaults match TypeScript product plus PowerShell automation.
- Missing external facts have clear effects; local work remains unblocked where possible.

## Output and stop

Accepted outputs: `docs/seed-contract.md`, `reports/A.md`, and coordinator `reports/A-review.md`. The corrected contract is authoritative; the worker report preserves the original submission's decisions.

Create `docs/seed-contract.md` and `reports/A.md`. Update `checkpoints/current.md` and task A's row. End with B's assignment and any input needed for remote CI. Do not start B or other agents.
