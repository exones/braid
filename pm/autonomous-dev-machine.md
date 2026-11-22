---
programme: autonomous-dev-machine
title: Autonomous dev machine
goal: An autonomous agentic software development machine that the user plans with and then leaves to work
thread: 9b3a8157-f696-45de-ac39-f35a4a90cf9b
limit: 2
state: running
hold:
next: P2 Precise notifications, when P0 finishes; its code strands after P1 · 0064 merges
digest:
rows:
  - P0 | 0068 | Coordinators stop waiting in the foreground | running
  - P1 | 0064 | The board watches provider limits | running
  - P2 | - | Precise notifications | planned
  - P3 | - | Questions on record | planned
  - P4 | - | Questions say what they unblock | planned
  - P5 | - | Board lanes collapse, Held lane, Hold and Go | planned
  - P6 | - | The board nudges stalled threads | planned
  - P7 | 0067 | Board at login, fully usable; PM naming | planned
  - P8 | 0060 | Workers as T3 subagents | planned
  - P9 | - | Per-programme say settings | planned
  - P10 | 0036 | Coordinator polish, reviewed | planned
  - P11 | - | Reports that say where we are | planned
  - P12 | - | Evidence before the work | planned
  - P13 | - | Learnings and a review that learns | planned
  - P14 | - | Board and CLI polish | planned
  - P15 | - | Sweep: 0040 leftovers and a flaky test | planned
  - P16 | 0010 | Runs, checkpoints, resuming | planned
---
# PM plan: Autonomous dev machine

The front matter above is what the board reads; `braid check --plan pm/autonomous-dev-machine.md` checks it before every push.

Branch: `pm/autonomous-dev-machine`. The planning notes, with the user's words in full, are in [autonomous-dev-machine-notes.md](autonomous-dev-machine-notes.md).

## Goal

"a long-running programme to make a autonomous agentic software development machine" (the user, 2026-11-22)

The principle: "My priority: to be involved as much as possible in the initial planning, and as little as possible during the work."

The user adds items as the programme runs; the PM places them ("other things I will add as we go and you will adjust").

## Decisions

The user's decisions, quoted and dated, then the PM's own.

- 2026-11-22, user: 0064, 0067 and 0060 are in the programme as its first braids, "order we will discuss".
- 2026-11-22, user: "ideas from inbox indeed all have to be turned into this programme work except HTML one"; then the HTML one back in as a candidate after T3 v0.1.11 ("If it can show HTML in chat, maybe we can consider it").
- 2026-11-22, user, priorities: 0 foreground waits; 1 precise notifications; 2 explicit questions; 2.x aeli promoted to a braid; 2.4 lanes, Held, Hold; 2.5 stall nudges; 3 headless board; 4 better output and reports (written "#5"); 5 evidence; 6 learnings.
- 2026-11-22, user, on P0: "very annoying thing to fix almost immediately: now coordinator waits for subordinate threads in foreground. remove it, it puts arriving messages in the queue"; "yes" to running it now; "now we have workers wake the coordinator + board detects stale coordinator so we are covered".
- 2026-11-22, user, on P3: "I don't want to answer from board now, will be enough that I can see the question, navigate to the thread, refer to it by some code, ask question about this question etc."; "if they need some info, it should go not only via chat, but via braid cli"; "coordinator can ask question to PM, and it can answer as I would. And coordinator would record it as answer".
- 2026-11-22, PM for P0 · 0068: plan approved as proposed (one tier L story; braid-branch CI read with short `braid wait --timeout 0.25` calls before the next strand's review or merge and before the final PR; no board CI view), because it meets the goal without a blocking wait and is cheap to reverse; leftover 2026-11-22-zmry passed there, routed to P2.
- 2026-11-22, user, Q1: "A": question records live on their own git branch, like `braid-inbox`.
- 2026-11-22, user, Q2: "11 is aleady the case with PM, so I'm not sure we need it. 10 ok but somewhere at the very end for now".
- 2026-11-22, user, Q3: "A, note as idea" (T3 Issues: idea 2026-11-22-7zbv).
- 2026-11-22, user: "many items I said existed as ideas. so the corresponding ideas must be killed unless they contain something that we didn't mention".
- 2026-11-22, PM: 2026-11-22-n46f (pushes only for what needs the user under a PM) is P2, as the user said ("basically what I told about more precise notifications").
- 2026-11-22, PM: the headless board (2026-11-21-mbb2) goes into P7 · 0067: `braid board --no-open` and the login recipes already exist (docs/board.md "Run the board at login"); what is missing is the page being able to act (0067's token address) and, if the coordinator finds it worth it, a command that installs the login task.

## Braids

Order: the user's priorities, then dependencies and overlap. A row starts when its dependencies are done and a slot is free (limit 2; P1 · 0064 counts, though it runs under its own coordinator).

| Row | Sketch | Braid | Coordinator thread | Depends on | State |
| --- | --- | --- | --- | --- | --- |
| P0 | **Coordinators stop waiting in the foreground.** The coordinator ends its turn and is woken by events (the worker's report, a `delegate_task` result, a PR watch), so the user's and the PM's messages no longer queue behind `t3_thread_wait` and `braid wait`. Try: write to a coordinator while its worker runs; it answers at once. | 0068 | mcp:launch:c419718a1a923226aae4fd04259b64cecbd21c5cd9e70288b871e599f7a7e9bc | - | running |
| P1 | **The board watches provider limits.** Runs under its own coordinator (not PM-launched); D and E left. | 0064 | its own | - | running |
| P2 | **Precise notifications.** A push only when someone explicitly asked the user: a request addressed to the user, a PM forward or escalation, the PM's own request, a merge into `main` the user keeps. A lane moving (To Review for a strand PR the coordinator merges itself, a braid Done under a PM) never pushes. The PM can push the digest and "nothing can run until you act" directly. A `mode` per machine (`all` or `escalations`). Looks at muting T3's own notifications for coordinator, worker and checker threads. Inbox: 2026-11-22-n46f; leftover 2026-11-22-zmry (a failed one-shot limit push lost on a multi-project board). Try: run a braid under a PM and get no push until the PM asks you. | - | - | P1's code merged (both change `src/notify/`); may plan before | planned |
| P3 | **Questions on record.** Every question an agent needs answered is a `braid ask` record first and a chat message second (braid, braid-pm, and the roles that ask through their coordinator). The record keeps its history: who asked, for whom, state (open, answered, withdrawn with a reason), the answer, **who answered (the user or the PM)**, the PM's reason, the times. Each question has a short code shown on the board, in the push and in chat; `braid` shows a question by its code, so the user can refer to it from any thread. A question no longer needed is marked withdrawn, never vanishes; its push is cleared. No Answer button on the board yet; the card links to the asking thread. Also: requests on a story whose branch is gone after its merge (from 0036). The record lives on its own git branch, as the inbox does on `braid-inbox` (the user, Q1). Try: ask, go away, come back: the question is on the board with its code, and after the answer it is listed with who answered. | - | - | P2 | planned |
| P4 | **Questions say what they unblock.** Each question says what it unblocks (items, strands) and whether it is a decision or something to do outside braid; answered questions stay listed as decided, with the answer. The agent recaps the user's answer in a line before it acts on it. Inbox: 2026-11-19-aeli (promoted by the user), 2026-11-21-t7b8. | - | - | P3 | planned |
| P5 | **Board lanes collapse, Held lane, Hold and Go.** Every lane collapses like Done. A Held lane for braids under a deliberate hold, with the reason, who held them and what they wait for. A Hold button with a reason, and Go, on a braid's card and on a programme; the board tells the coordinator or the PM (idle: `t3 thread send`; busy: 0064's steering). Inbox: 2026-11-19-s12b (wait on another braid's completion, shown in Held). | - | - | P1 | planned |
| P6 | **The board nudges stalled threads.** On a stall the board already detects, it sends the stalled thread one nudge (the text in the notes), at most once per stall; no change after it, and the stall escalates as today. Not for held or paused braids, open requests or Done braids. A board action without a click: a dated decision next to 0064's. | - | - | P1, P5 | planned |
| P7 | **Board at login, fully usable; PM naming.** 0067 as planned (the token address file and `braid board --url`; the PM's name and escalation in openai.yaml and docs/autonomy.md), plus inbox 2026-11-21-mbb2: whatever a board started at login still lacks, possibly a command that installs and removes the login task per OS. | 0067 | - | P1 | planned |
| P8 | **Workers as T3 subagents.** As 0060's outline; T3 v0.1.11 fixed several `delegate_task` issues (reports kept, wakes name the child, resumed subagents keep their result). Builds on P0. | 0060 | - | P0 | planned |
| P9 | **Per-programme say settings.** A settings block for each programme (in its plan file or next to it) saying where the user wants a say, by area and topic, finer than today's `ask:` keys; the PM applies it to every braid it runs and answers the rest. Takes 0036's "foreseeable stops asked at planning": the plan asks them up front so the run doesn't stop. Try: set "ask me about UI, never about libraries" on a programme and watch the PM route accordingly. | - | - | P3 | planned |
| P10 | **Coordinator polish, reviewed.** 0036's coordinator replans it against what has shipped since 17 to 19 November: keep after-merge chores, mockups from the real screen, leftovers named with what they are, recaps leading with the action, decision numbers that don't collide (with inbox 2026-11-19-ps6y, two braids taking one number), wakes for superseded work; requests after a story's merge go to P3, foreseeable stops to P9. Drop what no longer applies. | 0036 | - | P3, P9 | planned |
| P11 | **Reports that say where we are.** The PM's and coordinators' output in chat and reports, intermediate ones too: where we are, how it's going. HTML reports and a living per-programme or per-braid page rendered in the thread (T3 `html_render`), Markdown where the host has no HTML. Inbox: 2026-11-21-xebx. The user: "This we can think through later". | - | - | - | planned |
| P12 | **Evidence before the work.** On big projects, an evidence stage before a worker starts: a stronger model collects what exists, where to look and what not to do, so the worker starts with context; evidence kept per item. Inbox: 2026-11-19-q6jw, 2026-11-19-ha6j, 2026-11-18-bvcs, 2026-11-19-cbe0. | - | - | - | planned |
| P13 | **Learnings and a review that learns.** Per-project learnings left by workers for future workers, one clear place for BRAID.md, AGENTS.md and learnings, and a review checklist that grows from past mistakes. Inbox: 2026-11-19-by68, 2026-11-19-co8u, 2026-11-20-gb5r, 2026-11-18-ndmt, 2026-11-18-pwb6, 2026-11-18-aske. The user: "we can define it better when we get to it". | - | - | P12 | planned |
| P14 | **Board and CLI polish.** `braid list` and `view` show what the board shows; board dark theme; ideas drafted first and editable later. Inbox: 2026-11-18-1nfi, 2026-11-19-35gp, 2026-11-18-vumx. | - | - | P5 | planned |
| P15 | **Sweep: 0040 leftovers and a flaky test.** Inbox: 2026-11-19-diq9, 2026-11-20-w5cd, 2026-11-20-gj9u, 2026-11-20-6ce8 (fails at midnight UTC). Its increment is for the team. | - | - | - | planned |
| P16 | **Runs, checkpoints, resuming.** As 0010's outline, with inbox 2026-11-19-buqn (a RESUME HERE progress file). At the very end for now (the user). | 0010 | - | - | planned |

Not in the programme: 0011 Reports and several agents (the user: "11 is aleady the case with PM, so I'm not sure we need it"); 0035 Delivery into main; T3 Issues (idea 2026-11-22-7zbv). Open with the user: inbox 2026-11-18-lpz8 (the whole ledger on its own branch).

The inbox ideas routed to rows above were dropped from the inbox with the row named (`braid inbox show <id>` still prints them in full); 2026-11-21-mbb2 was taken into 0067 and 2026-11-19-buqn into 0010.

Merges into `main` stay the user's (AGENTS.md): each story's and final PR waits for the user's merge after the PM's live check, listed as one batch in the digest.

## Next

P2 Precise notifications, when P0 finishes: its coordinator plans now and starts its code strands after P1 · 0064 merges into `main`. Then P3, with P5 and P7 beside it once 0064 is in.

## Change log

- 2026-11-23 00:00Z: Q1 to Q3 answered; P16 · 0010 added at the end; routed inbox ideas dropped into their rows; lpz8 kept open for the user.
- 2026-11-22 23:45Z: P0 is 0068; the PM approved its plan.
- 2026-11-22 23:35Z: programme formed from the notes: P2 to P15 added in the user's priority order; n46f into P2, mbb2 into P7 · 0067, aeli and t7b8 into P4, 0036's parts routed to P3 and P9.
- 2026-11-22 23:20Z: P0 launched at the user's request ahead of the rest of the planning; plan running.
- 2026-11-22 22:00Z: plan started as a draft, held while planning; notes file added.
