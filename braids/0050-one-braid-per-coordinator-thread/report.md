## What changed

- `SKILL.md` "Ground rules": new rule, a coordinator thread holds one braid; another braid goes to a new thread; absolute, asking doesn't override.
- `SKILL.md` "Plan": new step 0 for a thread that already holds a braid: launch (provisional title `🧠 <repo> coordinator: <short goal>`), first message with quoted answers, source and leftovers, link and stop; no-T3 fallback writes out the handover text.
- `SKILL.md` "Accept and hand over" 6.5: same-braid follow-ups stay, new-braid follow-ups go to a new thread; the recap may still ask which to plan.
- `docs/decisions.md`: D76 and a dated log line. `workflow.md` doesn't talk about who coordinates, so it is unchanged. No CLI or board change.

## Why

In the 0045 thread the coordinator planned and ran 0049 and never renamed the thread, so the board (which keys coordinators by title) showed no Coordinator button for 0049.

## 0045 → 0049 walkthrough

1. The 0045 recap asks "Merge now" and which follow-up to plan; the user answers "Option 3, staged" (still allowed, step 6.5).
2. The coordinator merges PR #181 and cleans up as before.
3. Option 3 becomes a new braid, so "Plan" step 0 applies: it `t3_thread_launch`es a thread titled `🧠 braid coordinator: Working on several projects, staged` with the coordinator model.
4. First message: use the braid skill and plan this goal; the user's quoted words "Option 3, staged" and "Merge now"; source braid 0045, its report path and PR #181; leftovers routed to it.
5. It tells the user with the new thread's link and ends its turn. 0045's thread plans nothing. The new coordinator runs `braid new`, gets 0049 and renames itself `braid title 0049 --role coordinator`, so the board finds it.

## Failure modes

- Mid-braid with workers running: rule and step 0.3 say the old thread keeps its watches and waits.
- Launch fails: step 0.1 says tell the user and stop, not plan here.
- User asks to plan here: Ground rules say absolute, one line why, launch.
- Lost decision: step 0.2 quotes every answer; the walkthrough above shows it held.

## Validation

`rg -n "new coordinator thread" .agents/skills/braid/SKILL.md` finds the rule and steps; `npm run verify` passed (see PR).

For later items: none.
Needs the user: none.

## After review

- Ground rules' rename exception: the provisional title of Plan step 0.
- New work found while a braid runs is a strand of that braid by default (a lone story turns into phases), in the same thread; "Grow and adjust" says so, with a separate braid only when `main` needs the fix on its own. The sweep story is its own braid, so Sweep step 3 hands it to a new coordinator thread. D76 records both.
- Step 6.5 order: the recap (before the merge) may ask which follow-up to plan; the new thread is launched after the merge, and Merge on request now runs step 5 for a spike story.
- The 0051 case (docs-gate fix, made a separate braid) is the example: `main`'s Windows gate had passed (run 44745907768), so a strand would have done.
