**Research: where do the ~8 minutes of `verify (windows-latest)` go, and which changes cut them the most at an acceptable cost?** Answered.

**Answer:** About 60–65% of the Windows job is `node --test`, and that phase is CPU-bound on starting processes. The suite starts about 9,100 `git` processes and 375 `node dist/cli.js` processes, each costing 25–140 ms on the 4-vCPU runner. Two changes cut the most:

1. Moving `TEMP`/`TMP` off the slow C: drive onto D:. In paired runs this made `node --test` 13–21% faster, for free.
2. Sharding `node --test` across three parallel Windows jobs behind one job named `verify (windows-latest)`. Measured, the longest job took 142–163 s, against about 6–8 minutes for the job today.

Defender, git settings, the Node compile cache and higher test concurrency gave nothing. A Dev Drive matches the `TEMP` move once its 31–38 s setup is counted.

Confidence in this basis is medium-high. Every candidate ran on real runners, and the key comparison was paired on the same machine. Runner-to-runner noise is ±25%, though, and the gains are expressed as ranges.

## Where the time goes

Baseline `verify:full` on `windows-latest` (image win25-vs2026 20261116.315.1, 4 CPUs). The table shows five runs: two with every phase as its own step ([R1 baseline 1](https://github.com/exones/braid/actions/runs/44907039971/job/136854737042), [R1 baseline 2](https://github.com/exones/braid/actions/runs/44907039971/job/136854737169)) and three of the unchanged `npm run verify:full`, timed from log timestamps ([R3 full baseline 1](https://github.com/exones/braid/actions/runs/44909422118/job/136861845131), [2](https://github.com/exones/braid/actions/runs/44909422118/job/136861845147), [3](https://github.com/exones/braid/actions/runs/44909422118/job/136861844954)). Measured.

| Phase | Seconds (5 runs) | Typical |
| --- | --- | --- |
| Set up job, checkout, setup-node, `npm ci` | 27–36 | ~30 |
| docs-gate + oidc-release | 8–13 | ~10 |
| docs-gate negatives | 20–28 | ~23 |
| install-policy | 3–4 | ~4 |
| node-toolchain | 13–21 | ~15 |
| Pester | 44–55 | ~49 |
| typecheck + build | 3–4 | ~3 |
| **`node --test`** | **226–310** | **~250** |
| packed-install proof | 8–13 | ~10 |
| Whole job | 353–500 | ~400 |

The `node --test` phase in detail:

- Measured: the tests' summed time is 638–815 s on Windows, and the phase wall time is 246–310 s. That is the default concurrency of 3 (`os.availableParallelism() - 1` on 4 vCPUs [S22]), giving about 2.6× parallelism.
- Measured (junit, R1 baseline 1): the slowest files are `done` (162 s), `start` (106 s), `inbox-sweep` (89 s), `inbox` (66 s) and `requests` (64 s). One file runs in one process on one thread [S23], so `done.test.ts` alone puts a floor of about 120–160 s under any schedule.
- Measured locally: a preload counted `child_process` calls, children included, over all 40 test files. The result was 9,106 `git` starts, 375 `node dist/cli.js` starts and 49 others. `done.test.ts` and `start.test.ts` already call the commands in-process; their cost is the `git` calls (1,485 and 1,620). The most common subcommands are `rev-parse` (1,670), `remote`, `push`, `commit`, `init` and `config`.
- Measured: a benchmark ran each kind of start 30 times, the way the tests start them, on every runner. `node -e 0` takes 25–44 ms and `node dist/cli.js --help` 67–121 ms. `git --version` takes 21–39 ms. With the temporary repository on C:, `git init` takes 43–62 ms and `git add` + `commit` 87–139 ms; with it on D:, they take 30–41 ms and 60–93 ms.
- Read [S16][S17]: process creation on Windows costs about 10–30 ms or more, against single-digit milliseconds on Linux. Inferred: that and the C: drive explain the 6–8× gap per test.
- Measured (probe, every R1 job): Defender real-time protection is already off, `C:\` and `D:\` are excluded, the workspace is on D:, and `TEMP` is `C:\Users\RUNNER~1\AppData\Local\Temp`. That matches [S1][S3][S6]. Read [S9][S10]: C: is much slower than D: on these runners.

## Variants measured

Runs: R1 [44907039971](https://github.com/exones/braid/actions/runs/44907039971) (whole job, one step per phase, 2 samples per variant), R2 [44908128050](https://github.com/exones/braid/actions/runs/44908128050) (paired, see below), R3 [44909422118](https://github.com/exones/braid/actions/runs/44909422118) (whole jobs and the sharded layout).

The R1 jobs land on different machines, and the noise is large. The two baseline samples took 246 s and 310 s, and the `defender` jobs, which change nothing (protection is already off), took 194 s and 229 s. R2 therefore runs `node --test` twice on one runner: baseline, then the variant, with the order swapped in sample 2. The R2 numbers are the evidence; R1 shows only the unpaired spread.

| Variant | `node --test`, R1 unpaired (s) | R2 paired, baseline → variant (s) | Change in pair | Verdict |
| --- | --- | --- | --- | --- |
| Baseline | 310, 246 ([1](https://github.com/exones/braid/actions/runs/44907039971/job/136854737042), [2](https://github.com/exones/braid/actions/runs/44907039971/job/136854737169)) | — | — | — |
| 1. Defender off plus exclusions for the workspace, temp folders, Git, node.exe, git.exe and pwsh.exe | 194, 229 ([1](https://github.com/exones/braid/actions/runs/44907039971/job/136854737154), [2](https://github.com/exones/braid/actions/runs/44907039971/job/136854737192)) | not run: already off on the image | 0 | no effect possible: protection is already off [S1][S3] |
| 2a. Dev Drive (ReFS, fixed 8 GB, trusted) for the workspace and TEMP | 202, 273, plus 29–38 s setup ([1](https://github.com/exones/braid/actions/runs/44907039971/job/136854736924), [2](https://github.com/exones/braid/actions/runs/44907039971/job/136854737163)) | — | — | setup eats most of the gain |
| 2b. Dev Drive for TEMP only | — | 315→190, 349→268, 327→276 ([1](https://github.com/exones/braid/actions/runs/44908128050/job/136857984768), [2](https://github.com/exones/braid/actions/runs/44908128050/job/136857984676), [3](https://github.com/exones/braid/actions/runs/44908128050/job/136857984785)), plus 31–38 s setup | −40%, −23%, −16% | works, but costs a third-party action and ~35 s |
| 2c. **TEMP/TMP on D:** (`$RUNNER_TEMP\tmp`) | — | 195→155, 223→194, 309→254 ([1](https://github.com/exones/braid/actions/runs/44908128050/job/136857984851), [2](https://github.com/exones/braid/actions/runs/44908128050/job/136857984653), [3](https://github.com/exones/braid/actions/runs/44908128050/job/136857984783)) | −21%, −13%, −18% | **recommended**: free, one step |
| 3. `--test-concurrency=8` | 282, 265 ([1](https://github.com/exones/braid/actions/runs/44907039971/job/136854737138), [2](https://github.com/exones/braid/actions/runs/44907039971/job/136854737109)) | — | summed test time 815 → 1,575 s | no gain: CPU-bound |
| 3. `--test-concurrency=16` | 275, 230 ([1](https://github.com/exones/braid/actions/runs/44907039971/job/136854737197), [2](https://github.com/exones/braid/actions/runs/44907039971/job/136854737148)) | — | summed test time 815 → 2,329 s | no gain: CPU-bound |
| 4. Git settings via `GIT_CONFIG_COUNT`: `core.fscache`, `core.preloadindex`, `gc.auto=0`, `maintenance.auto=false`, `core.fsmonitor=false`, plus a minimal `GIT_TEMPLATE_DIR` | 204, 245 (two tests failed: my first template had no `hooks/`) | 261→274, 326→298, 235→233 ([1](https://github.com/exones/braid/actions/runs/44908128050/job/136857984827), [2](https://github.com/exones/braid/actions/runs/44908128050/job/136857984658), [3](https://github.com/exones/braid/actions/runs/44908128050/job/136857984705)) | +5%, −9%, −1% | no effect |
| Added: `NODE_COMPILE_CACHE` | 224, 242 ([1](https://github.com/exones/braid/actions/runs/44907039971/job/136854737165), [2](https://github.com/exones/braid/actions/runs/44907039971/job/136854737232)) | 282→321, 313→306, 304→320 ([1](https://github.com/exones/braid/actions/runs/44908128050/job/136857984692), [2](https://github.com/exones/braid/actions/runs/44908128050/job/136857984704), [3](https://github.com/exones/braid/actions/runs/44908128050/job/136857984856)) | +14%, −2%, +5% | no effect (cache written at exit [S24]) |
| Added: TEMP on D: + git settings + compile cache | 244, 146 (the hooks failure again) | 241→186, 304→263, 224→189 ([1](https://github.com/exones/braid/actions/runs/44908128050/job/136857984830), [2](https://github.com/exones/braid/actions/runs/44908128050/job/136857984781), [3](https://github.com/exones/braid/actions/runs/44908128050/job/136857984747)) | −23%, −13%, −16% | the same as TEMP on D: alone |
| 5. In-process CLI in the hottest tests | not measured (see below) | — | estimated ≤ 15 s of wall time | low value |
| 6. Sharding `node --test` across 3 jobs (TEMP on D:) | — | shards 79–127 s of tests, jobs 81–163 s; the rest of `verify:full` in a fourth job, 112–129 s ([R3](https://github.com/exones/braid/actions/runs/44909422118); R2 shards without TEMP on D: 79–119 s) | longest job 142 s and 163 s, against 353–401 s whole | **largest cut**, but changes the job's shape |

Notes on the table:

- **Defender** is measured twice in R1, as the brief asks. On this image the change can only be a no-op: the probe shows `RealTimeProtectionEnabled: False` before the step. Its two samples show how far apart two identical jobs land.
- **In-process CLI.** The three slowest files (`done`, `start`, `inbox-sweep`) were to be measured. The first two already call the commands in-process, so there was nothing to convert there. The count gives the upper bound for the whole suite: 375 CLI starts × about 100 ms ≈ 38 s of summed test time, about 15 s of wall time at 2.6× parallelism. It is inferred, and too small to be worth changing the tests. Logged as a deviation.
- **Whole-job check of TEMP on D:** (R3, unpaired, 3 samples each). The whole jobs took 379–471 s with TEMP on D: and 353–401 s for baseline. Those runners were slower overall: docs-gate took 9–12 s against 7–8 s, and docs-gate doesn't use `TEMP`. So this check is confounded by runner speed and decides nothing. The paired R2 result stands. B should report before and after times over several runs (see the proposed boxes).
- **Flaky tests seen:** two of the 15 R2 baseline `node --test` runs exited 1 (pairs `gitcfg 2` and `all 2`). The dot reporter output was discarded, so the failing test isn't known. All R1 baseline and R3 jobs passed.

## Larger runner (priced, not tried)

- Read [S27][S28]: Windows larger runners cost $0.042/min (8-core) or $0.082/min (16-core), and public repositories pay for them. Standard runners stay free.
- Measured: `ci.yml` ran 929 times from 2026-10-22 to 2026-11-21, and 372 of those runs took over 4 minutes (full suite, not the fast path).
- Inferred: `node --test` is CPU-bound, so 8 cores might halve it, giving a job of about 4 minutes. That would cost about 372 × 4 × $0.042 ≈ $60 a month, or about $90 a month on 16 cores. Read [S9]: one user found 8 cores "only twice faster". Sharding gets a similar cut at no cost, so the paid runner isn't recommended.

## Recommended for strand B, in order

1. **Put `TEMP`/`TMP` on D: in the Windows job.** Add one step before `npm ci` that sets both to `$RUNNER_TEMP\tmp` through `GITHUB_ENV`.
   - Expected saving: `node --test` 13–21% faster (paired, 3 samples), about 30–55 s per Windows job. The Pester and fixture phases may gain a little as well; that isn't measured in a pair.
   - Cost: none.
   - Risk: low. Tests see a temporary path on D:, where the workspace already is. After 2026-11-30 D: becomes ReFS [S8], so B should re-measure once the rollout reaches the runners.
   - `steady`: decide yourself. It is CI configuration that neither loosens CI nor changes a test.
2. **Shard the Windows `node --test` across 3 jobs.** A fourth job runs the rest of `verify:full`, and a final job named `verify (windows-latest)` passes only when all of them succeeded.
   - Expected: the Windows wall time drops from about 6–8 minutes to about 2.5–3 minutes (measured with TEMP on D:: longest jobs 142 s and 163 s, plus the final job).
   - Cost: free on this public repository [S28], about 30–40% more runner minutes, and a more complex `ci.yml`: the fast-path decision and the tarball upload need a home, and `verify:full` needs a "without `node --test`" mode or the phases listed.
   - Risk: medium. The final job must fail when any job it waits for fails, is skipped or is cancelled (`if: always()` plus a check of `needs.*.result`); otherwise a red shard could leave a green check. Shards are uneven because `--test-shard` splits files by count [S22]. The test shard that gets `done.test.ts` is the slowest (about 120–160 s of tests).
   - `steady`: **the user's call**. The check name stays, but the Windows check no longer comes from one job running `verify:full`. The braid's "Already decided" said to measure this only.
3. **Optional, with 2: split `done.test.ts` and `start.test.ts` into two files each.** Each file runs on one thread, so this shortens the longest shard, and the unsharded job a little too.
   - Expected: inferred, about 30–60 s off the longest shard.
   - Cost: test restructuring only.
   - Risk: low.
   - `steady`: decide yourself (tests restructured).

Not recommended:

- Defender changes: already off.
- Git settings: no effect.
- `NODE_COMPILE_CACHE`: no effect.
- Higher `--test-concurrency`: CPU-bound.
- A Dev Drive: the same gain as TEMP on D:, minus 31–38 s of setup and a third-party action. D: becomes ReFS anyway.
- In-process CLI: at most about 15 s.
- A paid larger runner: costs money, and sharding is free.

### Proposed Completion boxes for B

- [ ] The Windows job sets `TEMP`/`TMP` to a folder on D: before `npm ci`, and `docs/` says why (C: is slow on hosted runners), with the reason in `docs/decisions.md`
- [ ] (If the user picks sharding) `verify (windows-latest)` comes from a final job that fails when any shard or the rest job fails, is skipped or is cancelled; a PR with a deliberately failing test in one shard shows the check red
- [ ] (If the user picks sharding) every phase of `verify:full` still runs on Windows on every full PR, and the braids-only fast path still passes in seconds
- [ ] Before and after `verify (windows-latest)` times from at least three PR runs each are on the final PR
- [ ] The gate (`npm run verify`) passes, and CI is green on both OSes

## Against

- *TEMP on D: is noise:* unlikely (5–20%). All nine pairs that moved TEMP off C: (`tempd`, `devdrive`, `all`) were faster, by 13–40%, including the three with the variant run first. The six pairs that kept TEMP on C: (`gitcfg`, `ncc`) moved by −9% to +14%. The unpaired R3 whole-job check went the other way, but it is confounded by slower runners (see the notes on the table).
- *The bottleneck is disk rather than CPU:* partly true. TEMP on D: helps, so disk costs something. But raising concurrency doubles the summed test time without lowering the wall time, which is CPU saturation. Most of the remaining time is starting processes.
- *A Dev Drive is better than D:* possible: its pairs averaged more (−26% against −17%), but with 3 samples each the ranges overlap, and setup costs 31–38 s. [S11] found plain D: faster than a ReFS VHDX for pip. The answer would change if a trusted D: ReFS after 2026-11-30 turns out faster still.
- Assumptions:
  - The runner image stays win25-vs2026 with Defender off. If Defender came back on (it is on in the arm64 image [S3]), the Defender candidate would matter again.
  - Sharding times come from 2 samples and would change if the queue delays the final job.

## Unknowns

- Which test failed in the two flaky R2 baseline runs. A run that keeps the reporter output would show it.
- How much fewer `git` starts in the test fixtures would save: building each file's fixture repositories once and copying them, or caching `rev-parse` in the commands. `git` starts are most of the 9,106 process starts, so this is the largest lever left. It needs its own measurement.
- The effect of D: becoming ReFS from 2026-11-30 [S8]. Re-measure afterwards.
- Pester and fixture phases with TEMP on D:, in pairs. Not measured.

## Searched

- In the repository: `ci.yml`, `scripts/Verify.ps1`, `scripts/Test-Pester.ps1`, `test/*.test.ts` (calls that start processes), and `src/cli.ts` (whose exported `run()` is already used in-process by some tests).
- On GitHub runners: the three runs above (31 Windows jobs), with step timings from the jobs API, logs from `gh run view --log` and junit artifacts.
- Local: the process-start count (a preload through `NODE_OPTIONS=--import`, all 40 files, Node.js v26.13.0 on Windows 11). It gives counts only, because local timings depend on this machine.
- The researcher subagent's search for the sources listed in `sources.md`: actions/runner-images source and issues (Defender, C: vs D:, ReFS), the Node v26 docs, the Git for Windows installer and docs, setup-node, setup-dev-drive, uv and pip write-ups, process-start benchmarks, and GitHub pricing pages. It set aside local-machine benchmarks and sources without a primary origin.

## Experiment PRs (all closed unmerged, branches deleted)

- #209 `spike 0057: variants (do not merge)`, branch `spike/0057-variants`: run R1
- #211 `spike 0057: paired (do not merge)`, branch `spike/0057-paired`: run R2
- #212 `spike 0057: combined (do not merge)`, branch `spike/0057-combined`: run R3

## Validation

- `npm run verify` passes on this branch, which changes only files under `braids/`.

Decisions:
- Variants ran as a matrix in one draft PR per round (3 PRs) instead of one PR per candidate. Same runners, fewer PRs, and the variants of a round ran in parallel.
- After R1 showed ±25% noise between runners, the comparisons were paired on one runner (R2).
- The in-process CLI was estimated from a count of process starts rather than measured: the hottest files already call the commands in-process.

For later items:
- Strand B: the recommendations above.
- Later item: cut `git` process starts in the tests, through fixture repositories built once per file and copied, and fewer `rev-parse` calls in the commands. `git` starts are 96% of the suite's 9,500 process starts. This helps Ubuntu too.
- Later item: find the test that failed in 2 of 15 Windows runs under load (R2 pairs `gitcfg 2` and `all 2`).

Needs the user:
- `process`: whether strand B shards the Windows `node --test` across three jobs behind a final `verify (windows-latest)` job. It cuts the Windows check from about 6–8 minutes to about 2.5–3, free on this public repository, but the Windows check no longer comes from one job running `verify:full`. Moving TEMP to D: B can do without asking.
- `dependency`: a larger paid runner is not recommended. It would cost about $60–90 a month.
