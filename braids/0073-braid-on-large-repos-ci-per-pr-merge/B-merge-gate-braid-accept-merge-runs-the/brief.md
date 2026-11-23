---
id: '0073/B'
title: "Merge gate: braid accept --merge runs the project command"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: []
order: 20
---

## Goal

A project can name one command in BRAID.md, `merge-gate:`, that braid runs before any merge into `main` it makes, under every preset and on the user's request alike; a failure refuses the merge and shows the command's output. The project's own script decides the rest (test counts, merge windows, shared staging in use, a finance non-regression run). Inbox 2026-11-23-60mj.

Expected size: about 150 lines of code and tests in 4 to 5 files, plus docs.

## Start here

- `src/commands/done.ts`: `braid accept` and its `--merge` path, the order of its checks and how a refusal is printed.
- `src/commands/coordinate.ts`: `ciChecks`, how BRAID.md front matter is read.
- The tests of `braid accept --merge` (`rg -l "merge" test/*.test.ts`).
- `.agents/skills/braid/assets/braid-md.md`: the BRAID.md template and its field lines.
- `docs/braids-format.md` (`braid accept`), `docs/autonomy.md` ("Merging").

## Change

- BRAID.md front matter: optional `merge-gate: <command>`, with `<pr>` and `<sha>` filled in (the PR number and the head being merged). Absent: nothing changes.
- `braid accept --merge`, when the PR's base is `main` (BRAID.md `main`): after its own checks pass and before the merge, run the command from the repository root through the project's shell (cross-platform: Windows and Linux), with a time limit of 9 minutes, so `braid accept --merge` stays one foreground call under an agent's 10-minute command limit; a timeout refuses with "the merge gate didn't finish in 9 minutes; run braid accept again". By then `braid accept` has already found the `ci` checks green, so a gate that waits on checks (Everix's waits up to 45 minutes for pending ones) returns quickly. Exit 0: merge. Anything else, or a timeout: refuse, changing nothing, with the command, its exit code and the tail of its output. `--preset` or not, no flag skips it. Merges into a braid branch don't run it.
- `braid facts`, if cheap: one line naming the merge gate when BRAID.md has one, so the recap shows it.
- Tests: gate passes and the merge goes on; gate fails and the merge is refused with its output, under `--preset` too; no gate configured; a strand merge into the braid branch doesn't run it; `<pr>` and `<sha>` are filled in.
- Docs: `merge-gate` in the template (`braid-md.md`, one line with an example), `docs/braids-format.md`, `docs/autonomy.md` ("Merging": the gate runs on every merge into `main`, no preset skips it), `docs/cli.md`, help text, a decision in `docs/decisions.md`.

## Already decided

- The contract is the exit code: 0 passes, anything else refuses. Everix's `deploys/ci/gate/gate.py` exits 0 with `gatePassed` true or false in one JSON line (its docstring: "Exit 0 with gatePassed true/false; a timeout prints {"timeout": true}"), so Everix needs a wrapper or a flag on its side; braid parses no project output.
- Scope of the gate (every merge into `main` only, or also strand merges): pending the user's answer through the PM; this brief assumes merges into `main` only until then.

- One command, not a list or a policy language; the project's script holds the rules.
- No preset, exception or flag skips it. It guards braid's merges only; branch protection on GitHub stays the project's guard for merges made elsewhere.
- This repository's own BRAID.md gets no `merge-gate` (BRAID.md changes are the user's).

## Out of scope

- Path-based stops as code (0073/D makes them lines; a project's merge gate can block them).
- `ci: all` (0073/C).

## Completion

- [ ] With `merge-gate:` in BRAID.md, `braid accept --merge` into `main` runs it with `<pr>` and `<sha>` filled in, merges on exit 0 and otherwise refuses with the command's output, with and without `--preset`; tests cover each case and a strand merge that doesn't run it
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, and the template shows `merge-gate` with an example
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
