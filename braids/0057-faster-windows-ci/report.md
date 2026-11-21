Braid 0057 looked for why `verify (windows-latest)` takes about 8 minutes against 2 on Ubuntu, and applied the two changes the user picked.

- **0057/A** (spike, PR #213): `node --test` is 60–65% of the Windows job. The work is CPU-bound: the tests start about 9,500 processes, 96% of them `git`. Defender is already off on the runner, and `TEMP` sits on the slow C: drive. In pairs on one runner, moving `TEMP` to D: made `node --test` 13–21% faster. Splitting `node --test` across 3 parallel jobs cut the longest Windows job to 142–163 s. Git settings, `NODE_COMPILE_CACHE`, more test concurrency, a Dev Drive and paid runners didn't help or weren't worth it. The report has the evidence and 28 checked sources.
- **0057/B** (PR #215): the Windows job puts `TEMP`/`TMP` on D: before `npm ci`. `done.test.ts` and `start.test.ts` are each split into two files; all 434 tests are unchanged. `docs/development.md` describes the setup, and decision D85 records why (renumbered from D80 because braids 0053–0056 took D80–D84 on `main` first).

Windows job times on full runs, from the jobs API:

| | Runs | Job time |
| --- | --- | --- |
| Without the change, 2026-11-21, other branches | 30 | 310–533 s, median about 460 s |
| With the change: PR #215, three runs | 3 | 400, 425, 404 s |
| With the change: braid branch after the merge | 1 | 260 s |

This leans faster, but four runs against ±25% noise between runners don't prove it. The large cut, to about 2.5–3 minutes, needed the parallel split, which the user declined so that the Windows check stays one job running `verify:full`.

Open:
- The braid's goal of a much faster Windows check is only partly met: about a minute at best, against 6 extra minutes.
- Leftover 2026-11-21-dvse: re-measure `TEMP` on D: in pairs after D: becomes ReFS (from 2026-11-30), and drop the step if it doesn't help.
- Leftover 2026-11-21-bc9k: start fewer `git` processes in the tests, the largest lever left. It helps Ubuntu too and needs its own measurement.
- 0057/C (fix strand, PR #220) merged `main` again after 0053 landed: it placed 0053's seven new start tests in the split files unchanged (443 tests on `main` and the branch) and moved this braid's decision to D85.
- Leftover 2026-11-21-27yx (an unknown Windows test failure in 2 of 15 runs) went to the sweep braid 0059.
- No `Docs:` strand. D81 (`docs.update: both`) came from `main` after this plan was approved. 0057/B already updated the internal docs this braid touches, and no public doc describes CI.

Decisions: the user approved the plan; picked "TEMP and files only" for 0057/B, so no split into parallel jobs; and chose "Sweep as proposed" for the six leftovers. Own: merged 0057/A and 0057/B under `steady`; the `ci.yml` change and B's size (the test split) were decided as logged on 0057; no docs strand, for the reason above.
For later items: none
Needs the user: none
