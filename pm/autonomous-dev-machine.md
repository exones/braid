---
programme: autonomous-dev-machine
title: Autonomous dev machine
goal: An autonomous agentic software development machine that the user plans with and then leaves to work
thread: 9b3a8157-f696-45de-ac39-f35a4a90cf9b
limit: 2
state: running
hold:
next: P2 · 0069 and P7 · 0067 run; then P3 when a slot frees, on the user's go after the look
digest: 23 Nov · 2 done · 1 running · 1 ready to merge (#263) · 7 PM decisions
rows:
  - P0 | 0068 | Coordinators stop waiting in the foreground | done
  - P1 | 0064 | The board watches provider limits | done
  - P2 | 0069 | Precise notifications | ready to merge
  - P7 | 0067 | Board as a Windows service, fully usable; PM naming | running
  - P3 | - | Questions on record | planned
  - P6 | - | The board wakes, reminds and nudges | planned
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
- 2026-11-23, user: "Yes" to the PM's proposal: waits are requests with a condition on P3's record; P6 is a small board rule (wake, remind, estimate, nudge), no new state.
- 2026-11-23, user, on waits: "The agent that it waits for can say estimate when it thinks it will get back to it" (P6).
- 2026-11-23, user, on waits: "it can hourly send a message to the thread it passively waits smth like \"Gentle hourly reminder: I'm still waiting for you\"" (P6).
- 2026-11-23, user, on waits: "Yes it's kinda registering wait indeed, it's needed. Also this is a passive wait: so it also can sometimes never happen (imageine pm forgot about this thread)" (P6).
- 2026-11-23, user: "I agree with the exception for 69. Start when you see fit": 0069's code strands start as soon as 0064 is on main, without a further go.
- 2026-11-23, PM for P2 · 0069/D: `braid notify send` (the PM's direct push) goes on despite the security and outward stop cases, because the user asked for PM pushes over the existing ntfy path ("rely on braid notify and ntfy") and it adds no new channel, secret or exposure, instead of escalating.
- 2026-11-23, PM for P7 · 0067/B: the logon, real-update and Start-from-page boxes move to the braid's final PR (the user tries on this PC before the merge into main; the real update is checked after it), because they need the user's PC and the braid box keeps them, instead of the user trying the strand branch; the conhost launcher deviation and 903 lines accepted.
- 2026-11-23, PM for P7 · 0067: plan approved as a goal with strands A (address file, `braid board --url`, PM naming) and B (`braid board service install|remove|restart|status`, Outline until the user picks the service kind), because the widened goal needs two PRs and B waits on the user; the service kind forwarded to the user with the PM's recommendation (a logon task).
- 2026-11-23, PM for P2 · 0069: plan approved (strands A leftovers brb2 and zmry, B one push rule from the request record, C one updated push for merges waiting under a PM, D `braid notify send` for the PM, E docs; no mode setting, no new lane), with the programme stall still pushed, because a dead PM thread has no one else to ask, instead of no derived push at all; the braid-pm skill line kept, since the user asked for PM direct pushes.
- 2026-11-23, user, P7 · 0067/A security: "A" (accept the token-checked GET /api/session for `braid board --url`, and the systemd recipe's stdout to null).
- 2026-11-23, user, P2 · 0069: "But did 67 need me? As pm was handling it. Pm (you) needed me yes, but not 67 (it talked to you, the PM)": a forwarded request shows as the PM asking (programmes panel, PM thread), not as the braid's card in Needs You; sent to 0069/B.
- 2026-11-23, user, P7 · 0067/B: "A ok just think how updating would go" (a logon task; the update path in its brief).
- 2026-11-23, user: "threshold also should be how much left. E.g. at 5% left hold" (P5).
- 2026-11-23, user: "in provider usage I want to see how much left, not how much spent, so opposite to what's now" (P5).
- 2026-11-23, user, after the look at 0064: "Looks great so far, continue with the program" (go for P7 · 0067).
- 2026-11-23, user: "Ok go with your plan": go for P2 now, and the PM live-checks 0064's new head before the user's merge.
- 2026-11-22, PM: 2026-11-22-n46f (pushes only for what needs the user under a PM) is P2, as the user said ("basically what I told about more precise notifications").
- 2026-11-22, PM: the headless board (2026-11-21-mbb2) goes into P7 · 0067: `braid board --no-open` and the login recipes already exist (docs/board.md "Run the board at login"); what is missing is the page being able to act (0067's token address) and, if the coordinator finds it worth it, a command that installs the login task.

## Braids

Order: the user's priorities, then dependencies and overlap. A row starts when its dependencies are done and a slot is free (limit 2; P1 · 0064 counts, though it runs under its own coordinator).

| Row | Sketch | Braid | Coordinator thread | Depends on | State |
| --- | --- | --- | --- | --- | --- |
| P0 | **Coordinators stop waiting in the foreground.** The coordinator ends its turn and is woken by events (the worker's report, a `delegate_task` result, a PR watch), so the user's and the PM's messages no longer queue behind `t3_thread_wait` and `braid wait`. Try: write to a coordinator while its worker runs; it answers at once. | 0068 | mcp:launch:c419718a1a923226aae4fd04259b64cecbd21c5cd9e70288b871e599f7a7e9bc | - | done |
| P1 | **The board watches provider limits.** Runs under its own coordinator (not PM-launched); D and E left. | 0064 | its own (bb0085ac-a894-4e76-af27-60ee4c3ed77e) | - | done |
| P2 | **Precise notifications.** A push only when someone explicitly asked the user: a request addressed to the user, a PM forward or escalation, the PM's own request, a merge into `main` the user keeps. A lane moving (To Review for a strand PR the coordinator merges itself, a braid Done under a PM) never pushes. The PM can push the digest and "nothing can run until you act" directly. A `mode` per machine (`all` or `escalations`). T3's own notifications are out of scope: the user relies on braid's ntfy pushes. **Every ntfy notification braid sends opens, when tapped, the thread that needs the user** (the coordinator's or the PM's); today some don't. PRs ready for the user's merge come as one notification for whatever is waiting (updated in place when another joins), opening the PM thread. No Done notification for a braid the PM runs: the PM's after-merge "have a look" request covers it. Inbox: 2026-11-22-n46f; leftover 2026-11-22-zmry (a failed one-shot limit push lost on a multi-project board); leftover 2026-11-23-brb2 (a forwarded merge handover of a Done-stamped story never reached the user: 0068, PR #250), first in this braid. Also leftovers 2026-11-23-xoj1 (the weekly-limit Needs You box tells the user to answer the coordinator) and 2026-11-23-wxvh (push typo "0026 stay paused"), from 0064. Try: run a braid under a PM and get no push until the PM asks you. | 0069 | mcp:launch:445e5f92461ce8a17b9922e8d0c0a75776571f533d61750ff2b0f82c4945208f | P1's code merged (both change `src/notify/`); may plan before | ready to merge |
| P7 | **Board as a Windows service, fully usable; PM naming.** The board runs as a Windows service (the user: "braid board as a windows service. now I run it manually from console"), started with the machine or the login, restarted when it fails, with commands to install, remove, restart and show it; Linux (systemd) as the docs already describe. A board run that way can act from its page (0067's token address file and `braid board --url`). Plus 0067's PM naming in openai.yaml and docs/autonomy.md, and inbox 2026-11-21-mbb2. Which kind of service (a real Windows service, which runs as a user who must hold the `gh` and `t3` logins, or a logon task) is the coordinator's question to the user. Try: reboot, open the board's address, Start a strand from the page. | 0067 | mcp:launch:b6c8bc714b65c70603b4dc1e03e48b2aa8babbf90f52dad7b13a29adf860583a (planned the sweep on 2026-11-22; on the PM's go it amends its plan for the service) | P1 (both change `src/commands/board.ts`); runs beside P2, merges after it if they overlap | running |
| P3 | **Questions on record.** Every question an agent needs answered is a `braid ask` record first and a chat message second (braid, braid-pm, and the roles that ask through their coordinator). The record keeps its history: who asked, for whom, state (open, answered, withdrawn with a reason), the answer, **who answered (the user or the PM)**, the PM's reason, the times. Each question has a short code shown on the board, in the push and in chat; `braid` shows a question by its code, so the user can refer to it from any thread. A question no longer needed is marked withdrawn, never vanishes; its push is cleared. No Answer button on the board yet; the card links to the asking thread. Also: requests on a story whose branch is gone after its merge (from 0036). **The record also carries waits** (decided 2026-11-23): a wait is a request with a condition. Asker, addressee (the user, the PM, or another braid's coordinator), a "done when" (answered; a braid merged into main; a time), an estimate the addressee can set, its state and history, a short code. Design the record for that from the start; P6 builds on it. Inbox 2026-11-23-k5d1 (recording a merge answer must not move the PR head): today `braid answer` commits the answer on the braid branch, which on a final PR is the PR head, so either the merge is refused or the answer goes unrecorded (0064, PR #251); answers kept on the record's own branch remove this. A request with a "done when" closes itself: the PM's "Merge PR #251" request stayed on the board after the user merged, because the PM closed it by hand and forgot (2026-11-23, the user: "Although you saw I merged the question is still there"); a merge request's condition is its PR merged, checked by the board (P6), so it never outlives its reason. No separate wait state, and holds stay deliberate stops only. The record lives on its own git branch, as the inbox does on `braid-inbox` (the user, Q1). Try: ask, go away, come back: the question is on the board with its code, and after the answer it is listed with who answered. | - | - | P2 | planned |
| P6 | **The board wakes, reminds and nudges.** One board rule over P3's record, no new state: at each refresh the board checks each open wait's "done when" and, when it holds, closes it and sends the waiting thread one wake message; while it doesn't hold, it sends the addressee a reminder ("Gentle hourly reminder: I'm still waiting for you", the user's words) at most hourly, or after the addressee's estimate (one call, e.g. `--eta 2h "<why>"`), and the waiting card shows "expected by <time>" and never reads as stalled; a missed estimate, or a gone addressee, escalates as a stall. A real stall (idle, no open request or wait, no hold) gets one nudge (text in the notes) and then escalates. Not while held or paused. The case: 0069, idle on purpose until 0064 merged, read "Stalled: the coordinator stopped and nothing was asked" (the user, 2026-11-23: "Interesting case"; "this is a passive wait: so it also can sometimes never happen"); the PM held it as a stopgap. A board action without a click: a dated decision next to 0064's. | - | - | P1, P3 | planned |
| P4 | **Questions say what they unblock.** Each question says what it unblocks (items, strands) and whether it is a decision or something to do outside braid; answered questions stay listed as decided, with the answer. The agent recaps the user's answer in a line before it acts on it. Inbox: 2026-11-19-aeli (promoted by the user), 2026-11-21-t7b8. | - | - | P3 | planned |
| P5 | **Board lanes collapse, Held lane, Hold and Go.** Leftover 2026-11-23-qap7 (a provider chip mixes a weekly and a session pause record, src/board/limits.ts). Leftovers 7ija (a stale comment in src/board/limits.ts) and yd2t (a programme hold set only in the PM plan doesn't stop a board limit pause; the Hold button for a programme should record it where the board reads it). The provider chips and the limits panel show what is **left**, not what is spent (the user, 2026-11-23: "in provider usage I want to see how much left, not how much spent, so opposite to what's now"): e.g. "S 85% · W 20%" without the word "left" (the user: "You can even exclude the word \"left\" to not take space"), the bar shrinking towards the threshold and the tooltip saying "left"; `braid limits` text the same. **Thresholds as what is left too** (the user: "threshold also should be how much left. E.g. at 5% left hold"): `limits:` in BRAID.md says the remaining share at which agents hold (e.g. session 3% left, weekly 5% left), and the docs, `braid limits` and the board use that form; how the old `limits:` form (97/95 used) is read is the coordinator's call, logged. Every lane collapses like Done. A Held lane for braids under a deliberate hold, with the reason, who held them and what they wait for. A Hold button with a reason, and Go, on a braid's card and on a programme; the board tells the coordinator or the PM (idle: `t3 thread send`; busy: 0064's steering). | - | - | P1 | planned |
| P8 | **Workers as T3 subagents.** As 0060's outline; T3 v0.1.11 fixed several `delegate_task` issues (reports kept, wakes name the child, resumed subagents keep their result). Builds on P0. | 0060 | - | P0 | planned |
| P9 | **Per-programme say settings.** A settings block for each programme (in its plan file or next to it) saying where the user wants a say, by area and topic, finer than today's `ask:` keys; the PM applies it to every braid it runs and answers the rest. Takes 0036's "foreseeable stops asked at planning": the plan asks them up front so the run doesn't stop. Try: set "ask me about UI, never about libraries" on a programme and watch the PM route accordingly. | - | - | P3 | planned |
| P10 | **Coordinator polish, reviewed.** Inbox 2026-11-23-4s1a (scheduled and watch wakes keep arriving after the task is deleted or the PR unwatched). 0036's coordinator replans it against what has shipped since 17 to 19 November: keep after-merge chores, mockups from the real screen, leftovers named with what they are, recaps leading with the action, decision numbers that don't collide (with inbox 2026-11-19-ps6y, two braids taking one number), wakes for superseded work; requests after a story's merge go to P3, foreseeable stops to P9. Drop what no longer applies. | 0036 | - | P3, P9 | planned |
| P11 | **Reports that say where we are.** The PM's and coordinators' output in chat and reports, intermediate ones too: where we are, how it's going. HTML reports and a living per-programme or per-braid page rendered in the thread (T3 `html_render`), Markdown where the host has no HTML. Inbox: 2026-11-21-xebx. The user: "This we can think through later". | - | - | - | planned |
| P12 | **Evidence before the work.** On big projects, an evidence stage before a worker starts: a stronger model collects what exists, where to look and what not to do, so the worker starts with context; evidence kept per item. Inbox: 2026-11-19-q6jw, 2026-11-19-ha6j, 2026-11-18-bvcs. | - | - | - | planned |
| P13 | **Learnings and a review that learns.** Inbox 2026-11-23-i3iz (workers miss docs that a behaviour change makes untrue). Per-project learnings left by workers for future workers, one clear place for BRAID.md, AGENTS.md and learnings, and a review checklist that grows from past mistakes. Inbox: 2026-11-19-by68, 2026-11-19-co8u, 2026-11-20-gb5r, 2026-11-18-ndmt, 2026-11-18-pwb6, 2026-11-18-aske. The user: "we can define it better when we get to it". | - | - | P12 | planned |
| P14 | **Board and CLI polish.** `braid list` and `view` show what the board shows; board dark theme; ideas drafted first and editable later. Inbox: 2026-11-18-1nfi, 2026-11-19-35gp, 2026-11-18-vumx. | - | - | P5 | planned |
| P15 | **Sweep: 0040 leftovers and a flaky test.** Inbox: 2026-11-19-diq9, 2026-11-20-w5cd, 2026-11-20-gj9u, 2026-11-20-6ce8 (fails at midnight UTC); leftover 2026-11-22-t7ap (`braid wait --once`, exit 1 when a short read already sees a failure). Leftover 2026-11-23-5vky (`braid pause --window` alone is refused while docs/cli.md suggests it works). Leftover 2026-11-23-uanu (two wording slips from 0069: a handover title "In Review" in docs/board.md; `notify send` help omits exit 0 on a failed send). Leftovers from 0069's live check: 2026-11-23-cbe9 (a merge leaving the group re-alerts the phone; make the update quiet), 2026-11-23-cft5 (a Done-stamped forwarded story reads In Progress where board.md says To Do), 2026-11-23-mchu (`notify send` without `--programme` gets the sequence id `braid-<repo>-pm---send`). Its increment is for the team. | - | - | - | planned |
| P16 | **Runs, checkpoints, resuming.** As 0010's outline, with inbox 2026-11-19-buqn (a RESUME HERE progress file). At the very end for now (the user). | 0010 | - | - | planned |

Not in the programme: 0011 Reports and several agents (the user: "11 is aleady the case with PM, so I'm not sure we need it"); 0035 Delivery into main; T3 Issues (idea 2026-11-22-7zbv). Open with the user: inbox 2026-11-18-lpz8 (the whole ledger on its own branch).

The inbox ideas routed to rows above were dropped from the inbox with the row named (`braid inbox show <id>` still prints them in full); 2026-11-21-mbb2 was taken into 0067 and 2026-11-19-buqn into 0010.

Merges into `main` stay the user's (AGENTS.md): each story's and final PR waits for the user's merge after the PM's live check, listed as one batch in the digest.

## After each merge: try it, then the user's go

The user (2026-11-22): "each item of this programme changes materially how the braid works. Previous dev showed that we can build braid using braid. So after each item, when it's merged, please install the new skills / board, kill running board, start a new one and notify me to have a look (when service ready, service). Then wait for my instructions."

Before the merge, when a PR passes the live check and waits for the user's merge: until P2 fixes 2026-11-23-brb2 (and P3/P6 close requests by their condition), the PM also opens `braid ask pm/autonomous-dev-machine "Merge PR #<n> at <head> (<braid>): live check passed" --kind action`, which reliably shows and pushes.

After each braid of this programme merges into `main` (the user's merge), the PM:

1. Closes that merge request: `braid answer pm/autonomous-dev-machine --by pm`.
2. Waits for the `ci` run on the merge commit, then installs the skills and the CLI from `origin/main`: `pwsh -NoProfile -File scripts/Install-Skills.ps1` (docs/getting-started.md).
3. Stops the running board and starts the new one: today by its port and a new console window (`braid board`), so its tokened address is printed where the user sees it; once P7 · 0067 is in, by restarting the service.
4. Tells the user to have a look: a message in this thread and a programme request `braid ask pm/autonomous-dev-machine "<braid> is installed and the board restarted: have a look" --kind action`, so it is on the board and pushed. It names what changed and what to try.
5. Waits for the user's instructions: no next braid is launched until the user says so. Braids already running go on.

## Next

After P0 · 0068 or P1 · 0064 merges: install, restart the board, and wait for the user ("After each merge"). On the user's go: P2 Precise notifications and P7 · 0067 Board as a Windows service (both need 0064's code on `main`). Then P3, P5.

## Change log

- 2026-11-23: P2 · 0069 ready to merge: PR #263 at 05b64d8 (0069/F read by the PM, main unchanged); forwarded to the user; one programme request asks for the merge and the 0067 try.
- 2026-11-23: 0069/F (every push links its thread) started; leftovers cbe9, cft5, mchu to P15.
- 2026-11-23: P2 · 0069 live check passed on the goal; a fix round for two pushes without a thread link (a programme request without --thread, the Done push), per the user's "always … a thread link"; three cosmetic findings to leftovers.
- 2026-11-23: P2 · 0069 final PR #263 at bf8aa63 handed to the PM; live check launched (clone, fake ntfy server). Leftover uanu to P15.
- 2026-11-23: P2 · 0069/D merged into its braid branch (PR #260, `braid notify send`); 0069/E (docs) started.
- 2026-11-23: P7 · 0067 live check: works, but the address file inherits its folder's ACL (the user's ~/.braid grants CodexSandboxUsers read), so it isn't owner-only; sent as a blocking fix with the misleading install message, a possible wrong exit code and the display name case. The user's try waits for the fix.
- 2026-11-23: P2 · 0069/C merged into its braid branch (PR #258): forwarded merges are one push per project and PM thread, updated in place, cleared when empty; shown in the programmes panel. 0069/D started.
- 2026-11-23: P7 · 0067 final PR #259 at e0cd47c handed to the PM; live check launched; the user's try follows it (install from the PR head, logon, Start from the page).
- 2026-11-23: P7 · 0067/B reviewed (PR #257); PM moved its on-PC try to the final PR.
- 2026-11-23: P2 · 0069/B merged into its braid branch (PR #256): one push rule (forUser); forwarded questions and decisions show as "The PM asks you", cards keep their lanes; forwarded merge handovers move to 0069/C with the merge group. 0069/C started.
- 2026-11-23: P2 · 0069/A merged into its braid branch (PR #255): the board's PR lookup missed a Done-stamped story's PR and dropped its open review request (the cause of 0068's missed merge notification); also the lost one-shot limit push, the weekly-limit hint and the typo. 0069/B started.
- 2026-11-23: P7 · 0067/A merged into its braid branch (address file, `braid board --url`, PM naming, D92); 0067/B started. No sweep into 0067; leftovers 7ija and yd2t routed to P5 (with qap7), t7ap and 5vky stay with P15.
- 2026-11-23: P7 · 0067 plan approved by the PM (strands A, B); service-kind decision forwarded to the user.
- 2026-11-23: the user looked at 0064 and said continue; P7 · 0067 started in its existing coordinator thread with the amended goal (Windows service) and the PM-run autonomy.
- 2026-11-23: P1 · 0064 merged by the user (PR #251 at 93c9c47); CI green; installed from 93c9c47; board restarted on 7800; 0069 resumed and told to start 0069/A; have-a-look request open.
- 2026-11-23: the PM forgot to close its "Merge PR #251" request after the merge; closed; routine fixed (close first); self-closing requests noted in P3.
- 2026-11-23: 0064's self-observation ideas routed: k5d1 to P3, 4s1a to P10, i3iz to P13.
- 2026-11-23: 0064's four leftovers routed: xoj1 and wxvh to P2 · 0069, qap7 to P5, 5vky to P15.
- 2026-11-23: P1 · 0064 live check passed at a3a3fb2 (a real pause not runnable: no provider over its threshold; checked in code and tests); 4 minor display defects to leftovers; PR #251 ready for the user's merge, merge request opened.
- 2026-11-23: P3 shapes its record for waits; P6 retitled "The board wakes, reminds and nudges" and reduced to one board rule over it.
- 2026-11-23 01:40Z: 0069 showed as stalled while waiting for 0064; the PM held it (`braid pause 69 --hold`), to resume when 0064 merges; the case goes to P6.
- 2026-11-23: P2 is 0069; the PM approved its plan with one change (programme stall keeps its push).
- 2026-11-23: P7 · 0067 keeps its existing coordinator thread (planned as the sweep; the user told it "Remove check, you will run under pm"); the PM told it it is P7 and to wait for the go.
- 2026-11-23 01:15Z: P2 launched on the user's go (coordinator mcp:launch:445e5f92…); 0064's coordinator told to send its new head to the PM for a live check first.
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
