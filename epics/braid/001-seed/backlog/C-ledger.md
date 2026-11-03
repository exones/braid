# C: manual work ledger

Status: done. PR #1 passed CI/review and was human-merged as `afc05074a27da2cb1a3c225bc9d42d10f184e504`; see `reports/bootstrap-delivery.md` and `reports/bootstrap-review.md`. Depends on: B. One implementation agent.
Kind: story. Epic: AGENTO-001. Feature: F1, verified manual tracking.

Storage naming note: `.crew/` below records this item's original assignment. D18 and task N supersede it with `.agento/` in the current candidate.

As a coordinator, I want to persist an epic's story progress between sessions so a fresh agent can resume the next useful action without chat history.

## Read first

`AGENTS.md`, decisions, seed contract, epic/checkpoint, and `reports/A.md`, `reports/A-review.md`, `reports/B.md`, `reports/B-review.md`. The corrected contract uses direct state replacement and blocks mutations on an incomplete event trail; do not implement the superseded backup sequence from A's original report.

## Outcome

Make the installed CLI useful for organizing the next release's epic and backlog, without dispatching agents or claiming independent verification.

## Work

1. Implement the seed contract: `init`, `new`, `status`, and `story add/start/block/complete` with the exact usage settled in A.
2. Store schema-versioned state under `.crew/`, record revisions/events, and keep updates serialized across CLI processes. Use atomic state replacement and a bounded lock strategy appropriate to Windows/Linux. Document state/event ordering and any interrupted-operation limitation; do not add a general event-sourcing framework.
3. Validate paths, identifiers, inputs, persisted state, and transitions. Reject path traversal and accidental overwrite. Unknown schema versions fail clearly without destructive rewrites.
4. Record explicit manual evidence notes on completion; status must not label them as independent gate passes.
5. Preserve readable narrative checkpoints/reports; do not make the machine ledger and epic into two competing manually edited status stores.
6. Add focused tests for persistence across processes, valid/invalid transitions, repeated initialization, duplicate IDs, malformed/unsupported state, safe paths, concurrent updates, and the declared failure boundaries. Use temporary folders, including a path with spaces. Update the test command to execute every new suite; B's command names only `test/cli.test.ts`. Evolve B's unimplemented-command expectations for newly supported commands, retaining genuine unknown-command and help/version coverage.
7. Update user documentation with one full manual-ledger example and recovery limitations.

## Acceptance

- The scenario from A completes through CLI invocations and survives starting a new process.
- Given an epic with an In Progress story, when a new CLI process reads it, then status preserves the story's state, notes, and next action. Given an invalid transition, when requested, then the CLI rejects it without losing accepted progress.
- Repeated init/new never silently removes previous work.
- Conflicting writers cannot silently lose accepted updates. Tests establish the implemented guarantees; unsupported crash recovery is explicit.
- Errors are actionable and nonzero; invalid state is preserved for diagnosis.
- `npm run verify` passes. Remote CI result is reported separately.

## Output and stop

Write `reports/C.md`, update checkpoint and epic row, and identify D as next. Do not implement dispatch, automated acceptance, messaging, or scheduling. Do not start D.
