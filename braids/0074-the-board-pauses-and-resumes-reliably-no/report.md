0074 makes the board's pause and resume for provider limits a reliable call in code, with no LLM in the path. It replaces the 🚦 steering thread that paused 0 of 18 agents twice on 2026-11-24.

- **0074/A** (#307, shipped early to `main` in #310): `braid limits` reads a cache window without `resetsAt` (T3 leaves it off a window at 0%). It also reads `windows` written as an object keyed "0", "1", "2". Claude_Everix no longer reads `unknown` after a reset.
- **0074/B** (#312): one acting board per provider account and per repository, through leases in `~/.braid/acting/` (D107). Only that board pauses, resumes, wakes, reminds, nudges and sends limit pushes. A failed limit push waits in `notified.json`. Children are matched by project, and the resume reads each project's own BRAID.md.
- **0074/C** (#314): the board pauses by `t3 thread send` with ids from its T3 snapshot. It pauses only braids with a working agent, and only working threads plus the coordinator; the PM gets one summary. Replies are the agents' `Paused:` lines, read from their threads for 10 minutes. A failed or partial pause shows Needs You and sends one push and one PM message. No steering thread starts (D108). Delivery is queued: a busy agent sees the pause at its next turn.
- **0074/D** (#318): one resume path for the timer, early resume, the icon-only ▶ and ↻ buttons, and `braid resume --limit [--all]` (D109). PM-run braids resume through one message to the PM; other braids resume directly. Early resume happens on a fresh reading under the threshold, or when the window no longer applies. Failed resume sends retry until delivered. After a resume, the board waits for a reading checked after it before pausing that provider again.
- **0074/E** (#325): a provider in use whose reading has been unknown for over 30 minutes shows the orange "⚠ blind since <time>" chip and sends one push per spell. Every displayed percent is a whole number.
- **0074/F** (#331): a braid with no strands doesn't read stalled while its coordinator works.
- **0074/G** (#337): docs updated as a whole. `limits.md` shrank from 43 to 23 lines; no skill file grew.
- **0074/H** (#344, from the PM's live check of #339): a paused braid in Needs You shows ▶ Resume now; a Done braid's board pause record is cleared at the next refresh with no sends and never reaches a PM's resume ask.

Validation: each strand passed the gate (CI `verify` on Ubuntu and Windows) and an independent review. Three PRs needed blocking fixes: D (two rounds), E (one) and F (docs, one). The PM's live check of the final PR found two gaps, fixed in H. Every Completion box of the braid holds.

Open:
- Pause delivery to a busy agent is queued (T3 v0.1.11's `t3 thread send` doesn't steer). Steering mid-turn through T3's MCP server is braid 0080, which the user approved (leftover 2026-11-25-cixz taken into it).
- Leftovers: 2026-11-25-khtk, wwkn, b4ie, afbv and 01yh, and 2026-11-26-vm70 (no ▶ in To Review; `braid resume --limit --all` before a refresh). 01yh is the multi-process lock test in `test/requests.test.ts`, which fails under machine load.

Decisions: the user's and the PM's answers: q-en2r (plan approved), q-clq8 (early PR #310 merged), q-odpb (queued delivery now), q-i0ry (Resume now mockups, icon-only, thread access unchanged), q-ex55 (blind chip approved as shown). Mine, under the `free` preset:
- the lease with a heartbeat (D107);
- replies read from the agents' threads;
- 30 minutes before "blind";
- a missing cache file is never blind;
- `.braid/resumed.json` for the hold-off after a resume;
- scope of B to E, over twice the expected size, judged within the briefs.

For later items: none.
Needs the user:
- process: the skill changes in `.agents/skills/` (limits.md and the limits lines of braid, braid-pm, braid-worker, resuming.md) are yours to merge with this PR.
- process: `models.steering` in BRAID.md has been unused since 0074/C. Remove its `first` and `fallback` lines; BRAID.md is yours to edit.
