---
id: '0087'
title: "Lighter local gates: a step runs only its tests"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: []
related: ['0077', '0078']
delivery: epic
autonomy: free
---

## Goal

Programme pm/autonomous-dev-machine, row P33. A strand's local gate runs only the tests for what it touched, and the tests it does run start fewer processes and leave nothing behind. Today 53 of 74 test files make real git repos and spawn the CLI, `npm run verify` runs all of them before every PR (23.6 minutes for 0082's final PR), and parallel braids overloaded the machine. The PM's CPU investigation (2026-11-28): about 43% CPU from process starts alone while `npm run verify` runs (about 600 git.exe, 160 conhost and 77 sh every 10 s, each scanned by Defender), 1,773 leftover `braid-*` temp repos in %TEMP% (1,515 of them `braid-title-*`), and 96 `git fsmonitor--daemon` processes alive since 11-26 that never exit (turned on by global git settings, not by braid or T3).

What a user can try at the end: a one-file strand's `npm run verify` takes minutes, not 20; afterwards %TEMP% has no new `braid-*` folders and no new fsmonitor daemons.

## Strands

- A: the quick gate (`npm run verify`) picks the test files that import the changed files, directly or through src modules, read from import lines; everything when shared parts change, no tests for docs-only changes; tests for the picker.
- B: every test that makes a temp repo removes it, even when it fails; temp repos run with pinned git settings (no fsmonitor, no auto-gc, `core.fscache`/`core.preloadindex`).
- C: fewer git processes in the fixtures where cheap: one repo per suite instead of per test, `git -c` instead of separate `git config` runs; measured.
- D: docs, and BRAID.md saying which gate a worker runs when.

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.

## Already decided

- The user: "why do we have such heavy tests? surprising for such slim tool"; "I like 3" (run only the affected tests locally); "A" (a new braid); 2026-11-28: performance is the priority, start now rather than after 0077.
- The full gate (`npm run verify:full`) stays for a braid's final PR and for releases. CI keeps running the full suite on every PR; green CI still gates every merge (D104). A test the picker misses is caught by CI, not locally.
- BRAID.md says which gate a worker runs when. That is a BRAID.md change, so the user merges it (AGENTS.md): 0087/D is handed over, not merged under the preset.
- The PM folded its CPU findings (2026-11-28) into this goal: strands B and C.
- Keep the load light while working: one worker at a time.
- Related to 0077 (The board stays fast under load, on `braid/0077-the-board-stays-fast-under-load`): it adds `scripts/Test-Node.ps1` (`npm run test`, node --test capped at half the cores), `braid gate` (at most two gates per machine) and edits test/support. 0077 merges into main first; the coordinator merges main into this braid branch as soon as it lands, and before the final PR. A strand that starts before 0077 lands keeps its edits to `package.json`'s `test` script and to test/support small, so the merge conflicts only by line.
- Related to 0078 (Sweep: 0040 leftovers and a flaky test, on `braid/0078-sweep-0040-leftovers-and-a-flaky-test`): 0078/A rewrote parts of `scripts/Verify.ps1` and `scripts/Test-DocsGate.ps1` (the OIDC guard and the fixture harnesses moved to Pester), and 0078/E edits test/cli.test.ts and test/done-merge.test.ts. They share files and conflict only by line; whichever merges into main second merges main and keeps both sides.

## Out of scope

- CI: its workflows and its full suite stay as they are.
- Rewriting tests to not spawn the CLI or not make git repos; making the product itself faster.
- Changes to the braid skills or AGENTS.md.

## Completion

- [ ] `npm run verify` on a branch that changed one src module runs only the test files that import it, directly or through src modules; on a change to a shared part it runs every test; on a docs-only change it runs none
- [ ] `npm run verify:full` runs everything, as before, and CI still runs it on every PR
- [ ] A one-file strand's quick gate takes minutes, measured on this machine and written in the final report against the full gate
- [ ] After a gate run %TEMP% has no new `braid-*` folders and no new `git fsmonitor--daemon` processes
- [ ] The fixtures start measurably fewer git processes per gate run, before and after in the final report
- [ ] BRAID.md says which gate a worker runs when (merged by the user)
- [ ] The docs from BRAID.md `docs` describe the quick and full gates as they now are
