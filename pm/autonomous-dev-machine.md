---
programme: autonomous-dev-machine
title: Autonomous dev machine
goal: An autonomous agentic software development machine that the user plans with and then leaves to work
thread: 9b3a8157-f696-45de-ac39-f35a4a90cf9b
limit: 2
state: running
hold:
next: Waiting for the user's look at 0068 and their go; then P2, and P7 · 0067 after 0064 merges
digest: 23 Nov · 1 done · 1 running · 2 PM decisions
rows:
  - P0 | 0068 | Coordinators stop waiting in the foreground | done
  - P1 | 0064 | The board watches provider limits | running
  - P2 | - | Precise notifications | planned
  - P7 | 0067 | Board as a Windows service, fully usable; PM naming | planned
  - P3 | - | Questions on record | planned
  - P6 | - | The board nudges stalled threads | planned
  - P4 | - | Questions say what they unblock | planned
  - P5 | - | Board lanes collapse, Held lane, Hold and Go | planned
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

A requirement for every braid of the programme (the user, 2026-11-22): "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". So: each braid leaves the skills no longer, or shorter, than it found them where it can; it prefers one CLI call that records and checks a state (as `braid ask` and `braid answer` do) over prose rules agents must remember; it adds no new state file or state kind when an existing one can carry it. The PM quotes this in every coordinator's first message and checks it at each plan and live check.

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
- 2026-11-22, user: lpz8 (the ledger on its own branch) stays in the inbox: "it's big and not sure I want it". The 0040 sweep (P15) as proposed. Wait on another braid (s12b) dropped: "I plan to do most of the work with PM which will manage this". Decisions say how to reverse them (cbe0) back to the inbox as an idea. "the rest I agree with your judgements".
- 2026-11-22, user: the board as a Windows service, "very close to the beginning" (P7 · 0067, moved after P2).
- 2026-11-22, user: after each merged item, install, restart the board and wait for the user's instructions ("After each merge").
- 2026-11-22, user, P2 Q3: "I don't care about T3 notifs. I want to rely on braid notify and ntfy for the moment (BTW it always should contain a coordinator / PM thread link that needs my attention: now it doesn't all the time)".
- 2026-11-22, user, P2 Q1: "if they do, I'm OK if I only get one notif with 2" (PRs ready to merge: one notification for the batch). Q2: "A" (no Done notification; the after-merge "have a look" covers it).
- 2026-11-22, user, for the whole programme: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests".
- 2026-11-22, user: "consider the programme started -- let's go! 🚀"; "move P6 after P3".
- 2026-11-22, user, limit: "B: due to too rapid Claude limits consumption" (keep 2; P2 starts when 0068 or 0064 finishes).
- 2026-11-22, PM: 2026-11-22-n46f (pushes only for what needs the user under a PM) is P2, as the user said ("basically what I told about more precise notifications").
- 2026-11-22, PM: the headless board (2026-11-21-mbb2) goes into P7 · 0067: `braid board --no-open` and the login recipes already exist (docs/board.md "Run the board at login"); what is missing is the page being able to act (0067's token address) and, if the coordinator finds it worth it, a command that installs the login task.

## Braids

Order: the user's priorities, then dependencies and overlap. A row starts when its dependencies are done and a slot is free (limit 2; P1 · 0064 counts, though it runs under its own coordinator).

| Row | Sketch | Braid | Coordinator thread | Depends on | State |
| --- | --- | --- | --- | --- | --- |
| P0 | **Coordinators stop waiting in the foreground.** The coordinator ends its turn and is woken by events (the worker's report, a `delegate_task` result, a PR watch), so the user's and the PM's messages no longer queue behind `t3_thread_wait` and `braid wait`. Try: write to a coordinator while its worker runs; it answers at once. | 0068 | mcp:launch:c419718a1a923226aae4fd04259b64cecbd21c5cd9e70288b871e599f7a7e9bc | - | done |
| P1 | **The board watches provider limits.** Runs under its own coordinator (not PM-launched); D and E left. | 0064 | its own | - | running |
| P2 | **Precise notifications.** A push only when someone explicitly asked the user: a request addressed to the user, a PM forward or escalation, the PM's own request, a merge into `main` the user keeps. A lane moving (To Review for a strand PR the coordinator merges itself, a braid Done under a PM) never pushes. The PM can push the digest and "nothing can run until you act" directly. A `mode` per machine (`all` or `escalations`). T3's own notifications are out of scope: the user relies on braid's ntfy pushes. **Every ntfy notification braid sends opens, when tapped, the thread that needs the user** (the coordinator's or the PM's); today some don't. PRs ready for the user's merge come as one notification for whatever is waiting (updated in place when another joins), opening the PM thread. No Done notification for a braid the PM runs: the PM's after-merge "have a look" request covers it. Inbox: 2026-11-22-n46f; leftover 2026-11-22-zmry (a failed one-shot limit push lost on a multi-project board); leftover 2026-11-23-brb2 (a forwarded merge handover of a Done-stamped story never reached the user: 0068, PR #250), first in this braid. Try: run a braid under a PM and get no push until the PM asks you. | - | - | P1's code merged (both change `src/notify/`); may plan before | planned |
| P7 | **Board as a Windows service, fully usable; PM naming.** The board runs as a Windows service (the user: "braid board as a windows service. now I run it manually from console"), started with the machine or the login, restarted when it fails, with commands to install, remove, restart and show it; Linux (systemd) as the docs already describe. A board run that way can act from its page (0067's token address file and `braid board --url`). Plus 0067's PM naming in openai.yaml and docs/autonomy.md, and inbox 2026-11-21-mbb2. Which kind of service (a real Windows service, which runs as a user who must hold the `gh` and `t3` logins, or a logon task) is the coordinator's question to the user. Try: reboot, open the board's address, Start a strand from the page. | 0067 | - | P1 (both change `src/commands/board.ts`); runs beside P2, merges after it if they overlap | planned |
| P3 | **Questions on record.** Every question an agent needs answered is a `braid ask` record first and a chat message second (braid, braid-pm, and the roles that ask through their coordinator). The record keeps its history: who asked, for whom, state (open, answered, withdrawn with a reason), the answer, **who answered (the user or the PM)**, the PM's reason, the times. Each question has a short code shown on the board, in the push and in chat; `braid` shows a question by its code, so the user can refer to it from any thread. A question no longer needed is marked withdrawn, never vanishes; its push is cleared. No Answer button on the board yet; the card links to the asking thread. Also: requests on a story whose branch is gone after its merge (from 0036). The record lives on its own git branch, as the inbox does on `braid-inbox` (the user, Q1). Try: ask, go away, come back: the question is on the board with its code, and after the answer it is listed with who answered. | - | - | P2 | planned |
| P6 | **The board nudges stalled threads.** On a stall the board already detects, it sends the stalled thread one nudge (the text in the notes), at most once per stall; no change after it, and the stall escalates as today. Not for held or paused braids (the existing `braid pause` record), braids with an open question (P3's record), or Done braids. A board action without a click: a dated decision next to 0064's. | - | - | P1, P3 | planned |
| P4 | **Questions say what they unblock.** Each question says what it unblocks (items, strands) and whether it is a decision or something to do outside braid; answered questions stay listed as decided, with the answer. The agent recaps the user's answer in a line before it acts on it. Inbox: 2026-11-19-aeli (promoted by the user), 2026-11-21-t7b8. | - | - | P3 | planned |
| P5 | **Board lanes collapse, Held lane, Hold and Go.** Every lane collapses like Done. A Held lane for braids under a deliberate hold, with the reason, who held them and what they wait for. A Hold button with a reason, and Go, on a braid's card and on a programme; the board tells the coordinator or the PM (idle: `t3 thread send`; busy: 0064's steering). | - | - | P1 | planned |
| P8 | **Workers as T3 subagents.** As 0060's outline; T3 v0.1.11 fixed several `delegate_task` issues (reports kept, wakes name the child, resumed subagents keep their result). Builds on P0. | 0060 | - | P0 | planned |
| P9 | **Per-programme say settings.** A settings block for each programme (in its plan file or next to it) saying where the user wants a say, by area and topic, finer than today's `ask:` keys; the PM applies it to every braid it runs and answers the rest. Takes 0036's "foreseeable stops asked at planning": the plan asks them up front so the run doesn't stop. Try: set "ask me about UI, never about libraries" on a programme and watch the PM route accordingly. | - | - | P3 | planned |
| P10 | **Coordinator polish, reviewed.** 0036's coordinator replans it against what has shipped since 17 to 19 November: keep after-merge chores, mockups from the real screen, leftovers named with what they are, recaps leading with the action, decision numbers that don't collide (with inbox 2026-11-19-ps6y, two braids taking one number), wakes for superseded work; requests after a story's merge go to P3, foreseeable stops to P9. Drop what no longer applies. | 0036 | - | P3, P9 | planned |
| P11 | **Reports that say where we are.** The PM's and coordinators' output in chat and reports, intermediate ones too: where we are, how it's going. HTML reports and a living per-programme or per-braid page rendered in the thread (T3 `html_render`), Markdown where the host has no HTML. Inbox: 2026-11-21-xebx. The user: "This we can think through later". | - | - | - | planned |
| P12 | **Evidence before the work.** On big projects, an evidence stage before a worker starts: a stronger model collects what exists, where to look and what not to do, so the worker starts with context; evidence kept per item. Inbox: 2026-11-19-q6jw, 2026-11-19-ha6j, 2026-11-18-bvcs. | - | - | - | planned |
| P13 | **Learnings and a review that learns.** Per-project learnings left by workers for future workers, one clear place for BRAID.md, AGENTS.md and learnings, and a review checklist that grows from past mistakes. Inbox: 2026-11-19-by68, 2026-11-19-co8u, 2026-11-20-gb5r, 2026-11-18-ndmt, 2026-11-18-pwb6, 2026-11-18-aske. The user: "we can define it better when we get to it". | - | - | P12 | planned |
| P14 | **Board and CLI polish.** `braid list` and `view` show what the board shows; board dark theme; ideas drafted first and editable later. Inbox: 2026-11-18-1nfi, 2026-11-19-35gp, 2026-11-18-vumx. | - | - | P5 | planned |
| P15 | **Sweep: 0040 leftovers and a flaky test.** Inbox: 2026-11-19-diq9, 2026-11-20-w5cd, 2026-11-20-gj9u, 2026-11-20-6ce8 (fails at midnight UTC); leftover 2026-11-22-t7ap (`braid wait --once`, exit 1 when a short read already sees a failure). Its increment is for the team. | - | - | - | planned |
| P16 | **Runs, checkpoints, resuming.** As 0010's outline, with inbox 2026-11-19-buqn (a RESUME HERE progress file). At the very end for now (the user). | 0010 | - | - | planned |

Not in the programme: 0011 Reports and several agents (the user: "11 is aleady the case with PM, so I'm not sure we need it"); 0035 Delivery into main; T3 Issues (idea 2026-11-22-7zbv). Open with the user: inbox 2026-11-18-lpz8 (the whole ledger on its own branch).

The inbox ideas routed to rows above were dropped from the inbox with the row named (`braid inbox show <id>` still prints them in full); 2026-11-21-mbb2 was taken into 0067 and 2026-11-19-buqn into 0010.

Merges into `main` stay the user's (AGENTS.md): each story's and final PR waits for the user's merge after the PM's live check, listed as one batch in the digest.

## After each merge: try it, then the user's go

The user (2026-11-22): "each item of this programme changes materially how the braid works. Previous dev showed that we can build braid using braid. So after each item, when it's merged, please install the new skills / board, kill running board, start a new one and notify me to have a look (when service ready, service). Then wait for my instructions."

After each braid of this programme merges into `main` (the user's merge), the PM:

1. Waits for the `ci` run on the merge commit, then installs the skills and the CLI from `origin/main`: `pwsh -NoProfile -File scripts/Install-Skills.ps1` (docs/getting-started.md).
2. Stops the running board and starts the new one: today by its port and a new console window (`braid board`), so its tokened address is printed where the user sees it; once P7 · 0067 is in, by restarting the service.
3. Until P2 fixes 2026-11-23-brb2: when a PR passes the live check and waits for the user's merge, the PM also opens `braid ask pm/autonomous-dev-machine "Merge PR #<n> at <head> (<braid>): live check passed" --kind action`, which reliably shows and pushes; closed when the merge is relayed.
4. Tells the user to have a look: a message in this thread and a programme request `braid ask pm/autonomous-dev-machine "<braid> is installed and the board restarted: have a look" --kind action`, so it is on the board and pushed. It names what changed and what to try.
5. Waits for the user's instructions: no next braid is launched until the user says so. Braids already running go on.

## Next

After P0 · 0068 or P1 · 0064 merges: install, restart the board, and wait for the user ("After each merge"). On the user's go: P2 Precise notifications and P7 · 0067 Board as a Windows service (both need 0064's code on `main`). Then P3, P5.

## Change log

- 2026-11-23: the forward of 0068's merge handover never reached the user (leftover 2026-11-23-brb2, to P2); stopgap: a PM action request for each merge.
- 2026-11-23: P0 · 0068 merged by the user (PR #250 at 617e484); CI green on main; skills and CLI installed from 617e484; board restarted on port 7800; the user asked to have a look; waiting for their go.
- 2026-11-23: P0 · 0068 live check passed after one fix round (exit mapping in SKILL.md, red-branch merge order, neutral exit-3 output); PR #250 at ec845d6 ready for the user's merge, forwarded to the user. limits.md's old waits go with 0064's merge.
- 2026-11-23: P0 · 0068 handed over: PR #250 at 9c31f67, reviewed and green; PM live check launched (thread:delegated-task:command%3Amcp%3A18e3807a-f7a3-4cdf-a5d8-b3c099c402e3%3Adelegate-task%3Acc9840ae-9ace-4515-a67d-20d46eed85a8). Leftover 2026-11-22-t7ap (`braid wait --once`) to P15.
- 2026-11-23 00:40Z: programme started by the user; P6 moved after P3 (depends on P1, P3; no longer on P5).
- 2026-11-23 00:15Z: P7 · 0067 becomes the board as a Windows service and moves up after P2; s12b and cbe0 out of P5 and P12; "After each merge" added.
- 2026-11-23 00:00Z: Q1 to Q3 answered; P16 · 0010 added at the end; routed inbox ideas dropped into their rows; lpz8 kept open for the user.
- 2026-11-22 23:45Z: P0 is 0068; the PM approved its plan.
- 2026-11-22 23:35Z: programme formed from the notes: P2 to P15 added in the user's priority order; n46f into P2, mbb2 into P7 · 0067, aeli and t7b8 into P4, 0036's parts routed to P3 and P9.
- 2026-11-22 23:20Z: P0 launched at the user's request ahead of the rest of the planning; plan running.
- 2026-11-22 22:00Z: plan started as a draft, held while planning; notes file added.
