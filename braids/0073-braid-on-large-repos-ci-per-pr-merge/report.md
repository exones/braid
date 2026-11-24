braid 0073 makes braid work on a large repository whose merge into main deploys. The user asked for it as P20 of pm/autonomous-dev-machine, after the Everix field report. Five strands were merged into the braid branch, each reviewed by an independent braid-reviewer and green on Windows and Ubuntu CI.

- 0073/A, fewer CI runs per strand (PR #277):
  - Push CI now runs only on `main`.
  - `braid wait` answers a merge commit that has no runs of its own from its second parent: the merged strand head, or main's tip.
  - The worker pushes a review round's fixes in one push.
  - Reached main early through PR #279, merged on the user's request.
- 0073/B, merge gate (PR #280): `merge-gate: <command>` and `merge-gate-on: [strand, main]`.
  - `braid accept --merge` runs the command with `<pr>` and the reviewed head before the Done stamp and before every merge, under every preset.
  - Exit 0 merges. Anything else, or the 9-minute timeout, refuses and changes nothing, and the timeout kills the command's whole process tree.
- 0073/C, `ci: all` (PR #283): every check reported on the commit must pass, after a 2-minute grace for checks that appear late, in wait, accept, handover, recap and facts. `[]` and `none` are unchanged.
  - Also: `braid clean` keeps a braid's own branch until that braid is Done on it. This was leftover 2026-11-23-puxp: after the early PR, `braid clean` read the live braid branch as merged.
- 0073/D, large-repo lines and the docs (PR #284):
  - `braid facts` names the merge gate (leftover 2026-11-23-avsv).
  - BRAID.md template keys `review-bots` and `reviewer-with-bots: always | L-only`, plus lines with examples for partial CI on braid branches, the merge gate, caches and path stops.
  - The worker reads the named bots' threads once at green CI, then fixes, answers or marks a nit, pushes once, replies and resolves. It has no separate wait.
  - The braid reviewer reads the bots' threads.
  - Docs: "braid on a large repo" in getting-started, and D100–D102.
- 0073/E, the user's board additions (PR #286): a request code chip copies its code on click, also over plain http and on a phone. Project tag colours use no warm hues.

Validation:
- Every strand passed `npm run verify`.
- Review rounds: B, D and the early PR's strand A each had one blocking round, fixed and re-checked; C and E passed the first time.
- `braid wait 0073` was green before the final PR.

Skill size, by `wc -w` per skill (the user's rule counts each skill as a whole, confirmed by the PM): braid-worker 1774 to 1771, braid-reviewer 709 to 706, the braid skill folder 12801 to 12799.

Every Completion box holds; none is left open.

Decisions:
- The PM, for the user: approved the plan (q-7qq3).
- The user, relayed by the PM (q-gbni):
  - the merge gate's scope is configurable, defaulting to strand and main;
  - the braid reviewer with bots is configurable, with the default `always` set by the PM;
  - the worker resolves bot threads.
- The user: merged the early PR #279 (q-n2a7).
- The PM: start D alongside 0071/D (q-l7z6); D may change one sentence each in braid/SKILL.md and autonomy.md.
- The user's additions, logged: 0073/E's copy chip and project colours.
- The coordinator's own, under `free` (`braid decisions 0073`): the process cases of A to D, the size flags of D and E, and the `merge-gate-on` form.

For later items:
- Everix's `deploys/ci/gate/gate.py` exits 0 with `gatePassed` false, so it needs a wrapper or an exit-code flag before it works as `merge-gate`. The PM told the user.
- The board's pause message misprinted its steering thread id ("37cc2" for "37c2"); 0071's coordinator has it.

Needs the user: merging this final PR into main. It changes CI, the braid, braid-worker and braid-reviewer skills and the BRAID.md template, so the merge is the user's (AGENTS.md).
