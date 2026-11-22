# Notes: autonomous dev machine (planning session)

Free-form notes from the planning session with the user. They become the plan in `pm/autonomous-dev-machine.md` when the user says "convert". The board doesn't read this file.

## Goal (the user's words, 2026-11-22)

"a long-running programme to make a autonomous agentic software development machine"

## Principles

- **Involve the user in planning, not in the work.** "My priority: to be involved as much as possible in the initial planning, and as little as possible during the work."
- **Per-programme say settings.** "Per-programme settings (mb just in MD file) must allow defining where I want to have a say similar to current autonomy settings (maybe just with more precise areas / topics)". So: a programme-level settings block (in the plan file or next to it) with finer areas and topics than today's `ask:` keys (security, data, outward, architecture, dependency, scope). The PM applies it to every braid it runs.

## Priorities (the user, 2026-11-22)

The user's order; fractional numbers insert between 2 and 3. The user wrote "#5" twice; the PM reads the first as 4 (to confirm).

1. Precise notifications (below). Inbox idea 2026-11-22-n46f is the same thing: "basically what I told about more precise notifications".
2. Explicit questions (below).
2.4. Board lanes collapse, a Held lane, and a Hold button (below).
2.5. The board nudges stalled threads (below).
3. Headless board started at login (inbox 2026-11-21-mbb2; relates to 0067's token address file).
4. (written "#5") Better output in chat and reports, especially the PM's: where we are, how it's going; intermediate reports too. HTML reports and notebooks belong here. "This we can think through later".
5. Evidence for braids: on big projects, an evidence collection stage before the work, so a worker starts with context from a stronger model: what exists, where to look, what not to do. Related inbox: 2026-11-19-q6jw (evidence folder with a manifest), 2026-11-19-ha6j (final report says where the proof is), 2026-11-18-bvcs (workers say how they verified).
6. Per-project learnings: "we can define it better when we get to it". Related inbox: 2026-11-19-by68 (learnings for future workers), 2026-11-18-ndmt (review checklist that grows), 2026-11-19-co8u (one place for BRAID.md, AGENTS.md, learnings), 2026-11-20-gb5r (use AGENTS.md and CLAUDE.md).

Not yet placed: 0064, 0067, 0060, 0036, the per-programme say settings, the other inbox ideas and cleanups, T3 Issues.

## Board: collapsible lanes, Held lane, Hold button (2.4)

The user: "possibility to collapse each lane (like DONE now) + new lain held (when held) + button to hold a braid / whole programme with a reason".

- Every lane collapses to a narrow strip, as Done does since 0055; the choice is remembered per browser.
- A **Held** lane: braids under a deliberate hold (`braid pause --hold`, by the user or the PM) leave their lane for it, with the reason and who held them. Provider-limit pauses: Held too, or a separate marker (to decide).
- A **Hold** button on a braid's card and on a programme in the programmes panel, with a reason field; and Go to lift it. A braid hold records `braid pause <n> --hold "<reason>"` and tells its coordinator; a programme hold tells the PM, which holds its braids as the braid-pm skill's "Hold" says. Telling a thread is the board messaging a thread on a click: an idle thread gets a plain `t3 thread send`; a busy one needs the steering of 0064.

## Board nudges stalled threads (2.5)

The user: "board surveys sends "hey what's going on to threads it conseders stalled" (stallness already surveyed). It should say like this is board, I deteced you don't work and none of your subitems don't please check all good. You can propose better".

- The board already derives stalls (docs/board.md, the broke alarms and the programme stall). New: on a stall, the board sends the stalled thread one nudge. A stalled thread is idle, so a plain `t3 thread send` reaches it as its next turn; no steering thread needed.
- One nudge per stall (the key kept like `notified.json`); if nothing changes within a set time after it, the stall escalates as today (to the PM, else to the user's Needs You and a push).
- Not nudged: a braid held or paused, a thread waiting on an open request (that's the user's or the PM's turn), a Done braid.
- The PM's proposed text:

  ```text
  Board check (<time>): braid <number> looks stalled. This thread has been idle for <n> min, none of its agents (<workers, reviewers>) is running, and no request is open. If you are waiting for something, open a request for it (braid ask) so it shows. If work is done, report it. If you lost track, run braid status <number> and continue. Reply with one line starting "Board:", e.g. "Board: continuing 0064/D" or "Board: waiting on CI run 123".
  ```

- This is the board acting without a click, as 0064 does for limits; it needs its own decision next to 0064's.

## Ship first (ASAP)

**Precise notifications: a push only when the PM really needs the user, or the coordinator when no PM runs the braid.**

- The user's words: "So what I need to ship ASAP is better more precise notifications only when pm really needs me. Or coordinator if running without PM (now for example I get notifs "to review" while noone asked / required me explicitly"
- What happens today (docs/board.md "Notifications"): the board pushes every item in Needs You **or To Review**, one push per strand need. A strand PR in To Review pushes 👀 at high priority even when the braid's autonomy preset lets the coordinator merge it without the user. 0062 already keeps requests addressed to the PM (`--to pm`) silent and pushes escalations and forwards once.
- Inbox idea 2026-11-22-n46f (pushes only for what needs the user under a PM) is mostly this item. Part of it shipped in 0062 (`--to pm`, forward, escalation). What's left: To Review and other lane-derived pushes that nobody addressed to the user, a `mode` setting, and direct PM pushes (digest, "nothing can run until you act").
- Rule to settle: a push only when someone **explicitly** asked the user (an open request addressed to the user, a forward or escalation, a merge into `main` the user keeps), never because a lane moved.
- Also T3's per-thread notifications: can they be muted for coordinator, worker and checker threads?

## Ship second: explicit questions

- The user's words (2026-11-22): "more explicit "questions": bcs now a lot of asynchrony happens. If pm / coordinator asks a question, it after an hour of the user away, this question can be lost in the chat history. related to board: if the question is asked, it should be logged, and I should see it in board, and have reliable way to answer it. also if question becomes irrelevant, it must be marked so. this is prio #2 after more precise notifs"
- What exists today: `braid ask` opens a request in `.braid/requests.json` (one open request per asker per item; a new one replaces the old). The board shows it in Needs You or the programmes panel, with its options. Answering happens only in the asker's thread: "the board has no Answer or Approve button" (docs/board.md). The asker closes it with `braid answer`, and the record is gone from view; the answer lives only in the chat and, if the agent logged it, in the braid's log.
- Gaps against what the user wants:
  - **Logged:** every question and its answer (or its fate) kept as a record, not only while open. Today `requests.json` is local state in the main checkout, not in git.
  - **Seen:** every open question on the board, also the ones an agent asked only in chat (a question in the chat with no `braid ask` is invisible to the board, except T3's pending-question flag).
  - **Answered reliably, in the thread, not on the board.** The user (2026-11-22): "about answers: I don't want to answer from board now, will be enough that I can see the question, navigate to the thread, refer to it by some code, ask question about this question etc." So, for now: no Answer action on the board. Each question has a **short code** shown on the board, in the push and in the chat message (for example `Q-0064-3` or a short id). The board's card links to the asking thread. In any thread, the user can say "about Q-0064-3: …" or ask a follow-up about the question, and the agent finds it by its code (`braid ask show <code>` or similar: the text, options, context, who asked, its state and history). The answer is still given in the asking thread, and the asker records it on the question.
  - **Marked irrelevant:** a question an agent no longer needs (superseded by a later one, decided another way, the braid stopped) is closed as "withdrawn" or "no longer needed", with a reason, never just disappears; and its push is cleared.
  - Fits with: 2026-11-19-aeli (what the answer unblocks), 2026-11-21-t7b8 (recap after the answer), HTML reports (the question rendered with its context).
- **Every question goes through the CLI, never chat only.** The user (2026-11-22): "actually pm / coordinator skills should know: if they need some info, it should go not only via chat, but via braid cli." The skills (braid, braid-pm, and the workers, reviewers and researchers that ask through their coordinator) say: a question that needs an answer is a `braid ask` record first; the chat message repeats it. A question in chat with no record is a skill violation the board could flag (T3's pending-question flag with no open request).
- **The PM answers like the user, and that is recorded.** The user: "And of course, same goes for PM case: coordinator can ask question to PM, and it can answer as I would. And coordinator would record it as answer". Today a coordinator under a PM asks `--to pm`, the PM answers in the coordinator's thread, and the coordinator closes the request, but the answer and who gave it aren't kept on the record. In the new record: `answered by: pm | user`, the answer text, the PM's reason, the time; the coordinator records it when closing (`braid answer <id> --by pm --text "…"` or similar). Then the board and the digest can list "decided by the PM" next to "decided by you", and a user who disagrees can find and reverse it.
- Order: right after precise notifications; they share the request model (who it is for, its state), so one braid may shape the contract for both: settle the request record (addressee, state open/answered/withdrawn, answer, reason, history) in the first.

## Braids already in (order to discuss)

- **0064** The board watches provider limits (In Progress, D running, E to do).
- **0067** Sweep: PM naming and escalation; board token address at login (To Do; its brief says after 0064 merges).
- **0060** Workers as T3 subagents (Outline; six open questions; overlaps with 0011).

## To review

- **0036** Coordinator polish from the thread review (Outline, from 17 to 19 November): "maybe 36 (needs review and what's relevant): it's already quite 'old'". The PM checks each of its seven strands against what has shipped since (0040 autonomy, 0062 PM, the request flow) and proposes what to keep, drop or move.
- Other open outlines that may belong: 0010 Runs, checkpoints, resuming; 0011 Reports and several agents; 0035 Delivery into main.

## Inbox ideas: all go into the programme (except the HTML one)

The user: "ideas from inbox indeed all have to be turned into this programme work except HTML one". Then, after T3 v0.1.11: "I think HTML notebooks can be interesting. If it can show HTML in chat, maybe we can consider it". So 2026-11-21-xebx (HTML reports before questions and at the end of work) is back in, as a candidate (see "T3 v0.1.11").

Notifications and asking the user:
- 2026-11-22-n46f Pushes only for what needs the user under a PM (see "Ship first")
- 2026-11-19-aeli Needs You says what the answer unblocks
- 2026-11-21-t7b8 Recap after the user answers

Running unattended:
- 2026-11-21-mbb2 Headless board started at login (relates to 0067)
- 2026-11-19-s12b Wait on another braid's completion
- 2026-11-19-buqn Checkpoints with a RESUME HERE section (for 0010)

Quality and learning:
- 2026-11-18-bvcs Workers say how they verified the work
- 2026-11-18-ndmt Review checklist that grows from past mistakes
- 2026-11-18-pwb6 Reviewer captures pre-existing problems instead of dropping them
- 2026-11-18-aske Reviewer reads its rules from the base branch, not the PR
- 2026-11-19-by68 Learnings: workers leave findings for future workers
- 2026-11-19-co8u BRAID.md, AGENTS.md and learnings: one clear place for each
- 2026-11-20-gb5r Use AGENTS.md and CLAUDE.md to make the braid skills work better

Evidence and records:
- 2026-11-19-q6jw Evidence folder per item, with a manifest
- 2026-11-19-ha6j A goal's final report lists where the proof is
- 2026-11-19-cbe0 Decisions say how to reverse them
- 2026-11-18-lpz8 Keep the ledger on its own branch

Board and CLI:
- 2026-11-18-1nfi braid list and view show what the board shows
- 2026-11-19-35gp Board dark theme
- 2026-11-18-vumx Ideas: draft first, and edit entries later
- 2026-11-19-ps6y Two braids can take the same number

Cleanups:
- 2026-11-19-diq9 0040/D leftovers (recap, help, test)
- 2026-11-20-w5cd 0040/E review leftovers (preset source, tier S review, strand ids, digest --since)
- 2026-11-20-gj9u decisions.md D47, D57, D66, D68 point to D73
- 2026-11-20-6ce8 Flaky test at midnight UTC (test/done.test.ts)
- Leftover 2026-11-22-zmry A failed one-shot limit push can be lost on a multi-project board (0064/C review)

## T3 v0.1.11 (released 2026-11-20)

From the release notes (https://github.com/pingdotgg/t3code/releases/tag/v0.1.11), what touches this programme:

- **HTML in chat works today.** `html_preview` and `html_render` show a self-contained HTML page inline in the thread, above the reply, themed, on desktop and phone (the PM showed the notes this way on 2026-11-22). v0.1.11 fixes how these render: no white flash, no scroll jumps, page scripts don't scroll the chat. HTML reports in dot-prefixed folders now open too. That would cover `.braid/` and `~/.braid/artifacts/`. So the HTML idea (xebx) is feasible without new infrastructure: rundowns before a question, recaps and final reports rendered in the coordinator's or PM's thread. Hosts without HTML (plain Claude Code, Codex) fall back to Markdown. "HTML notebooks": a living HTML page per programme or braid, re-rendered at each digest or recap, is a possible shape.
- **Issues page, with issue tools for agents** (GitHub, Linear, GitLab, Azure DevOps, Forgejo), and issues linked to threads: "hand an issue to an agent all the way to a merged PR". This is an intake path for the machine (an issue becomes an inbox idea or a braid), or it overlaps with braid's own inbox. To discuss.
- **`t3 thread start` takes model options** (#23932): the board's steering thread in 0064 can set them.
- **Delegated tasks are more reliable** (child reports kept, wakes name the child thread, resumed subagents keep their result, a delegated wake survives cancellation). This lowers the risk for 0060 (workers as subagents).
- **Steers are reliable** (an unread steer no longer hangs or is lost, accepted steers replay after the turn ends). This supports 0064's steering thread.
- **One-time scheduled tasks are removed after their turn.** This bears on the PM's and coordinators' resume tasks, which 0064 replaces anyway.
- Usage limit rows show your pace (UI only; `braid limits` reads T3's caches).

## Open points

- Order of 0064, 0067, 0060, and where "precise notifications" goes among them.
- The format and the areas of the per-programme say settings.
- How much of 0036 is still relevant.
- Explicit questions: where the record lives (git, like the inbox branch, or `.braid/`), whether one braid covers notifications and questions or two, the form of the short code. (No board Answer action for now.)
- HTML reports and notebooks: where they render (chat, board, a file), and for which messages.
- T3 Issues: an intake path for the machine, or not?

## Session log

- 2026-11-22 21:47Z: session started; 0064, 0067, 0060 in.
- 2026-11-22 23:05Z: priorities 1 to 6 set; n46f is priority 1; lanes, Held, Hold button (2.4); stall nudges (2.5).
- 2026-11-22 22:50Z: no board Answer for now; questions get a short code to refer to them in any thread.
- 2026-11-22 22:45Z: questions always through the CLI; PM answers recorded as answers.
- 2026-11-22 22:35Z: explicit questions as priority 2.
- 2026-11-22 22:20Z: T3 v0.1.11 read; HTML reports back in as a candidate; T3 Issues noted.
- 2026-11-22 22:00Z: principles (planning, not the work; per-programme say settings), notifications first, inbox ideas in except HTML, 0036 to review.
