The worker now owns an item PR's CI, and every coordinator wait has a wake T3 doesn't lose. Three strands, all merged into the braid branch under the `steady` preset:

- **0048/A, `braid wait` answers within one call (#186).** A new exit code 3, "still running, call again", when CI is still pending at the `--timeout` limit (in minutes). Exit 2 now means only no run within 5 minutes, or an error; 0 and 1 are unchanged, and 1 comes only once every check has finished. The 5-minute no-run clock restarts with each call, so the coordinator calls with `--timeout 9`.
- **0048/B, `braid start` is safe to run again (#190).** A second start of an item already started as asked prints `(already started)` with branch, commit and folder, creates and pushes nothing, and exits 0. A strand must still contain the braid branch tip; a story has no base check. Anything else in the way still fails and names it. `braid start` and `braid clean` share one path normaliser.
- **0048/C, the skills (#192).**
  - The coordinator sets no watch on an item PR a worker owns. It waits with `t3_thread_wait`, and the worker's report wakes it. It reads `gh pr checks` once before the handover.
  - One Watch rule: the coordinator watches a PR only while no worker waits on it. That is the planning PR, the final PR, and a story's PR from the coordinator's `braid accept` commit. The wake dispatch is split per PR.
  - `references/autonomy.md`: after a merge it made, the coordinator waits for the braid branch's CI with a foreground `braid wait <number> --timeout 9`, again on exit 3. No background command anywhere in the skills.
  - "Say waiting" lists only reliable wakes. Four coordinator habits: check the state after a wake or resume, nothing in parallel with `t3_thread_wait`, a "STOP" during a wait is an incoming message, re-check after "session ended".
  - The worker skill and `workflow.md` say the worker alone waits on an item PR's CI.
  - D77 replaces D71's background wait, with a dated note on D71.

Validation: each strand's gate and CI; independent reviews (0048/A and 0048/B not blocking, 0048/B with a re-check after a docs fix; 0048/C blocking twice, then not blocking: a story's head after `braid accept` had no wake, and a green wake on the final PR could skip the Done stamp). The braid branch was green after each merge (one Windows re-run for a flaky cleanup in `test/board.test.ts`). After merging `main`, `npm run verify` passes with 389 tests.

Open: the first Completion box reads "sets no watch on an item PR"; the built rule watches a story's PR after the coordinator's own `braid accept` commit, when no worker waits on it any more. The decision is D77, not D75 as the brief said: `main` took D75 (0046) and D76 (0050) while this braid ran. The strand records (0048/C `report.md`, logs) still say D75.

Decisions: the user approved the plan (2026-11-20). Under `steady`, the coordinator merged the three strands into the braid branch; the `process` case (skill changes) was kept for this final PR.
For later items: leftovers 2026-11-20-uebf (Windows EPERM flake in the `test/board.test.ts` cleanup) and 2026-11-20-qlko (the docs gate goes over the Windows command-line limit in long worktree paths). The braid number clash (0047 taken a few minutes before this plan was pushed) is idea 2026-11-19-ps6y.
Needs the user: process: this braid changes the braid skills (`.agents/skills/braid/SKILL.md`, `references/autonomy.md`, `references/workflow.md`, `.agents/skills/braid-worker/SKILL.md`) and adds D77; the skills change only when you merge this PR into `main`.
