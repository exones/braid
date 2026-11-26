The docs now describe 0074 as a whole, and the agents' limits prose says only what to do on the board's texts.

**What changed.** `.agents/skills/braid/references/limits.md` went from 43 lines (961 words) to 23 lines (559 words). The steering thread and the three quoted pause texts are gone, because the board's texts are self-contained and code sends them (D108). What's left: the check before launch, what to do on each of the board's texts (pause: end the turn with the `Paused:` line, with no reply thread; the PM's `Direct pause:` summary; `Resume:`; the PM's resume ask; a pause that didn't reach everyone; a weekly window), the PM-led resume (`braid resume <number> --limit` per braid in the PM's order, or `--all`), queued delivery (a busy agent gets the text at its next turn), and what happens without a running board. The braid, braid-pm and braid-worker skills and `resuming.md` changed only in their limits lines. The steering role is gone from the `models` line, the PM's section follows the summary and the resume ask instead of `Paused: pm` and the steering thread, and the worker ends its turn with the `Paused:` line instead of sending it to a thread. The example usage in docs and comments is now 92% instead of 97%, since the defaults are 90/90 (#316). Old mockups under `docs/design` are left as they are.

**Why.** The programme's rule for skills: no growth and no spaghetti states; lean on reliable calls. Since 0074/C and 0074/D, code does the pause, the reply count and the resume, so the agents need only their reaction.

**Line counts of `.agents/skills/`** (start → now): braid-pm/SKILL.md 151 → 151, braid-researcher 51 → 51, braid-reviewer 50 → 50, braid-worker 78 → 78, braid/SKILL.md 232 → 232, references: autonomy 57 → 57, limits 43 → 23, resuming 17 → 17, setup 7 → 7, stop-cases 24 → 24, workflow 104 → 104. No file grew, and the edited lines are shorter, so `.agents/skills/` has fewer lines of limits prose.

**Docs (BRAID.md `docs`):**
- README.md: updated (pause by code, early resume, Resume now, PM-run braids resume through the PM).
- docs/getting-started.md: updated (early resume, Resume now, the PM-led resume; agents follow the board's texts). It never named a `steering` role, so nothing to remove there.
- docs/cli.md: updated (the example pause line now reads 92%). `braid limits`, `braid resume --limit` and `--all` were already current from 0074/A–E.
- docs/board.md: updated (the two example lines now read 92%). "Provider limits" and "The board pauses and resumes" were already current from 0074/B–F.
- docs/autonomy.md: updated (early resume, Resume now, the PM-led resume; D108 and D109 cited).
- CLI help text (src/cli.ts): unchanged; `limits`, `pause`, `resume --limit [--all]` and `board --no-pause` are already current.
- docs/development.md: unchanged (not affected).
- docs/decisions.md: unchanged; D107, D108 and D109 and their history lines already record 0074's decisions, and D90 is marked as replaced.
- docs/braids-format.md: unchanged; 0074/C and 0074/D already documented the pause record (`replies`, `resuming`, `.braid/resumed.json`).
- docs/roadmap.md: updated (a "braid 0074, built" line; the 0064 line no longer carries 0074/C's change).
- docs/npm-distribution.md: unchanged (not affected).
- Product code: only two doc comments in `src/board/pause.ts` (97% → 92%).

**Validation.** `npm run verify` (see the PR for the result); `rg` finds no reference left to the removed limits.md sections ("Under a PM", "The board's pause message", `<steering thread id>`, `Paused: pm`) outside braids/, epics/ and docs/design. `braid check` passes.

Decisions: none from the user. My own: the PM's two texts are named by their opening words (`Direct pause:`, "Paused braids:"), not quoted. A weekly window became one bullet in limits.md instead of its own section. The user's "pause, limit close" without a board still works: send a pause text like the board's.
For later items: none.
Needs the user: process: `models.steering` in BRAID.md has been unused since 0074/C (the board pauses by code, and `braid limits` marks the role `(unused)`). Remove the `steering:` block (`first`, `fallback`) from BRAID.md `models`; BRAID.md is yours to edit. Also, this PR changes `.agents/skills/` (limits.md, the braid, braid-pm and braid-worker skills, resuming.md), which is yours to merge with the final PR.
