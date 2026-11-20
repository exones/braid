# Report

**What changed:** the braid skill no longer sets a coordinator watch on item PRs: it waits with `t3_thread_wait` and the worker's report wakes it; "Checks" reads once and sends red back or tells the worker CI is pending. `autonomy.md` waits for braid-branch CI with a foreground `braid wait <number> --timeout 9` and handles exit 3. The "Say waiting" line lists only reliable wakes. Coordinator habits (check state after wake, nothing parallel to `t3_thread_wait`, "STOP" is a message, re-check after "session ended") are in "Run an item". The worker skill and workflow say the worker alone waits on item-PR CI. `docs/decisions.md` has D75 and a dated note on D71.

**Why:** background waits and duplicate watches lost wakes and killed sessions (idea 2026-11-20-80k2, 0044).

**Validation:** `rg -n background .agents/skills` has no hits; `npm run verify` passes.

**Open:** none.

For later items: none.
Needs the user: none
