---
id: '0062/A'
title: "Spike: programme model, routing, pushes and board mockups"
status: To Do
labels: ["kind:spike", "tier:L", "ui"]
dependencies: []
order: 10
---

## Goal

Before anything is built, work out how a programme and its PM show on the board and in pushes, and draw it. The output is a report for the user to review and board mockups on test data. The report gives the answers, a recommended design, and strands B to E restated from it. The worker stops after the mockups for the user's review, and builds nothing.

Time box: about 3 hours of work. Expected size: a report of about 300 lines, `sources.md`, and one HTML mockup file with a few screens.

Follow the braid-researcher skill's Method. Look at about 10 to 15 sources of these kinds: the dctl-studio PM thread and its plan file, this repository's board, notifier and requests code, ntfy's documentation, and two or three agent orchestrators or supervisor-agent tools that show a supervising agent and route its questions to a human. Read each source, not only its title. Record each one in `sources.md` in the item folder in the [braid-researcher](../../../.agents/skills/braid-researcher/SKILL.md) source line format, and cite source ids (`[S1]`) for claims in `report.md`.

## Start here

- The thread `🧭 dctl-studio pm: working product per specs` (T3, project dctl-studio; find it with `t3_thread_list` with `titleContains: 🧭` and `allProjects`). Read it whole: it is the first real PM run. For each message the PM got from a coordinator, note whether it reached the user's board as Needs You (and was pushed), and what the user said about it. Its plan file is `pm/working-product.md` on the `pm/working-product` branch of the dctl-studio repository (worktree `C:\code\dctl-studio-pm`).
- `.agents/skills/braid-pm/SKILL.md` and `assets/plan.md`: the PM as built. `.agents/skills/braid/SKILL.md`, "Launched by a PM".
- `docs/board.md`: "How an item's lane is chosen", "Requests", "Broke", "Notifications", "Several projects". `src/braids/requests.ts` (the request record has no addressee), `src/board/model.ts`, `src/board/t3.ts` (title parsing; `🧭` threads are not read as braid threads), `src/notify/notifier.ts` and `message.ts`.
- `braids/0054-*/` (the PM braid) and `braids/0044-*/` (notifications), with `docs/decisions.md` D70, D82 and D83.
- 0061 on `braid/0061-pause-and-resume-braids-on-provider-rate`: its briefs and the 0061/A spike report (the pause state on the board, who pauses under a PM).
- Inbox idea `2026-11-21-mbb2` (`braid inbox show 2026-11-21-mbb2`): a headless board started at login.
- `docs/design/board-mockups/`: the approved style for mockups.

## Change

- `report.md` answers each question below, with evidence and a recommendation:
  1. **Programme model.** What a programme is in braid's data:
     - the plan file's structure, which the board can read without parsing a free-form table (front matter, a JSON file next to it, or something else);
     - how a braid is tied to its programme (a front-matter field, the `PM-run` autonomy line, or the coordinator's first message);
     - whether a programme needs an id like a braid's.
  2. **Request addressee.** How a request says whom it is for (the user or the PM), and who sets that (`braid ask --to`, or inferred from the `PM-run` line). How the board shows a request the PM is handling. What makes a request escalate to the user: a timeout (what value), the PM thread stopped or archived, or the PM forwarding it itself.
  3. **The PM's own requests.**
     - Which item a PM request belongs to when it isn't about one braid: the programme, or a braid it names.
     - The kinds it uses: a question, a decision, something the user must do.
     - How the PM's digest and its ready-to-merge batch show.
  4. **Pushes.**
     - Which events push under a PM, at what priority and with what click target, and which ones stop pushing.
     - Whether ntfy action buttons could let the user answer an option from the phone. What that would need (an endpoint the board serves, a token), and whether it is safe and small enough to be a strand now.
  5. **Pushes without a running board.** Whether this goal needs `2026-11-21-mbb2` (a headless board or notifier started at login) for "notify me when the PM asks", and how that would run on Windows and Linux.
  6. **Hold and pause.** How a PM's hold shows, and whether it is the same board state as 0061's rate-limit pause.
  7. **Naming.** "Programme manager" in the skill, the docs and the board, and whether `braid-pm`, `🧭 <repo> pm:` titles and `pm/<slug>` branches keep `pm`.
  8. **Prior art.** How two or three orchestrators show a supervisor agent's work and route its questions to a human, and what to adopt and what not.
- **Strands.** Restate B to E from the answers: for each, a few lines of what it builds, its tier and a few Completion boxes. Add or drop strands where the answers call for it. The coordinator details the Outline briefs from this.
- **Mockups:** `docs/design/board-mockups/programmes.html`, in the style of the existing mockups, on test data shaped like the dctl-studio programme. It shows:
  - the programme card or band above the lanes;
  - a braid card whose request the PM is handling, and an escalated one;
  - the PM's own question in Needs You;
  - the filter by programme;
  - the phone layout.

  Put screenshots of each screen in the item folder.
- Stop after the report and mockups. Send them to the coordinator, and wait for the user's verdict on the design before writing anything else (the converge loop).

## Already decided

- See the braid's brief: the user's words, the evidence from the dctl-studio run, the board writing only its own state files, ntfy as the only channel, and the overlap with 0061.
- This strand changes no product code, skill or docs. The only new file outside its item folder is the mockup file.

## Out of scope

- Building any of B to E.
- Editing other files under `docs/`, including `docs/decisions.md` and the roadmap. The answers go in `report.md`; decided behaviour reaches the docs through the strands and the docs strand.

## Completion

- [ ] `report.md` answers questions 1 to 8 with evidence and a recommendation each, and restates strands B to E (what, tier, Completion boxes)
- [ ] `docs/design/board-mockups/programmes.html` shows the programme on the board, a request handled by the PM, an escalated one, the PM's own question, the filter and the phone layout; screenshots in the item folder
- [ ] Research items only: `sources.md` in the item folder (per source: id, link, version, access date, how it was read (whole, part, search result only), what it says, adopted or not and why), and `report.md` cites source ids for its claims
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
