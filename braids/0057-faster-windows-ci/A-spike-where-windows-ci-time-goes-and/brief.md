---
id: '0057/A'
title: "Spike: where Windows CI time goes and what cuts it"
status: Done
labels: ["kind:spike", "tier:M"]
dependencies: []
order: 10
---

## Goal

Question: where do the ~8 minutes of `verify (windows-latest)` go, and which changes cut them the most at an acceptable cost? The answer decides what strand B builds. Time box: 3 hours of work, CI waits included.

The braid's brief has the first measurements ("Measured so far"): `node --test` takes 300 s on Windows against 41 s on Ubuntu, and the tests that start processes take most of it. Confirm that picture, then measure the fixes rather than estimate them.

Expected size: no product code. A report, a `sources.md` and throwaway experiment branches.

Look at about 8–15 sources: GitHub's runner-images docs and issues, the docs of `actions/setup-node`, the Node.js test runner docs, and write-ups of Windows CI speedups (Dev Drive, Defender exclusions, the cost of starting processes). Read each one rather than its title. Record each in `sources.md` in the item folder in the [braid-researcher](../../../.agents/skills/braid-researcher/SKILL.md) source line format, and cite source ids (`[S1]`) for claims in `report.md`.

## Start here

- `braids/0057-faster-windows-ci/brief.md`: the measurements so far and what is already decided.
- `.github/workflows/ci.yml`: the job. `push` runs only on `main` and `braid/*`, and `pull_request` runs on every PR.
- `scripts/Verify.ps1`: the order of the phases in `verify:full`.
- `test/inbox.test.ts`, lines 30–34: the typical pattern. Each test spawns `git` and `node dist/cli.js` through `spawnSync`, in a fresh temporary repository.
- `package.json`, the `test` script: `node --test` with the default concurrency.
- `scripts/Test-Pester.ps1` and `test/pester/`: the second-largest phase.

## Change

- Run the experiments on GitHub-hosted runners. Push throwaway branches named `spike/0057-<what>` and open draft PRs from them into `main` to trigger CI (a push to a branch outside `braid/*` runs no CI). Title each PR `spike 0057: <what> (do not merge)`. Before you report, close every one unmerged, delete its branch and list them in the report.
- Run each variant at least twice and report the Windows job time and the `node --test` time.
- Try these candidates, cheapest first, and add any others you find:
  1. Microsoft Defender real-time scanning off on the runner, or exclusions for the workspace, the temp folder and Node.js.
  2. The workspace and `TEMP`/`TMP` on a Dev Drive (ReFS) on the runner.
  3. `node --test --test-concurrency=<n>` above the default.
  4. Git settings for many small repositories (for example `core.fscache`, `core.preloadindex`, no auto-gc, no fsmonitor), set through the test environment.
  5. Cheaper process start in the hottest tests, for example calling the CLI in-process. Measure it on the two or three slowest files only, and estimate the rest.
  6. Sharding the Windows tests across jobs. Measure it only; the check names must stay as they are (the braid's "Already decided").
- Price a larger paid Windows runner, without trying it.
- `report.md`: the time breakdown; a table of the variants with measured times and run links; the recommended set for strand B, in order, each with expected saving, cost, risk and whether the `steady` preset needs the user for it; and proposed Completion boxes for B.

## Already decided

- The braid's "Already decided" holds here too: the check names stay, Windows runs the full `verify:full` on every PR, and no paid runner without the user.
- This strand merges none of the experiments. Its PR into the braid branch carries only its `braids/` files.

## Out of scope

- Changing `ci.yml`, tests or scripts on the braid branch. That is strand B.
- Edits to `docs/` or `docs/decisions.md`. They come with B, after the user decides.

## Completion

- [x] The Windows time per `verify:full` phase is confirmed on at least two runs
- [x] At least the first four candidates are measured on real Windows runners, each at least twice, with run links
- [x] Every experiment PR is closed unmerged and its branch deleted; the report lists them
- [x] `sources.md` in the item folder (per source: id, link, version, access date, how it was read (whole, part, search result only), what it says, adopted or not and why), and `report.md` cites source ids for its claims
- [x] `report.md` recommends B's changes in order, with expected saving, cost and risk, and proposes Completion boxes for B
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Round 1 (PR #209, `spike/0057-variants`): split `verify:full` into one step per phase, so each phase has its own time from the jobs API. Run 8 Windows variants × 2 samples: baseline, Defender off plus exclusions, Dev Drive (workspace and TEMP), `--test-concurrency` 8 and 16, git settings, `NODE_COMPILE_CACHE`, and all combined. A probe records the image, the Defender state and the drives. A small benchmark times one process start the way the tests start them.
2. Researcher subagent in parallel: runner image facts, Dev Drive, process-start cost, Node test runner options, setup-node caching, larger-runner prices.
3. Round 2 (PR #211, `spike/0057-paired`): runner noise was ±25%, so run baseline and variant `node --test` back to back on one runner, alternating the order, 3 samples each. Measure sharding (`--test-shard` 1–3/3, 2 samples).
4. Count process starts per test file locally (a preload that counts `child_process` calls) to price the in-process CLI candidate.
5. Round 3 (PR #212, `spike/0057-combined`): whole `verify:full` jobs, baseline against TEMP on D:, 3 samples each, plus a sharded layout (rest of `verify:full` ‖ 3 test shards → gate job), 2 samples.
6. Write report.md and sources.md, then close the spike PRs and delete their branches.
