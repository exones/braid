# Sources: 0062/A

The format follows braid-researcher. All sources were accessed 2026-11-21.

The thread S1 and the plan file S2 were read whole by a researcher subagent I launched for this item. The ntfy sources, the orchestrators and the login-task docs (S12–S26) were read by a second researcher subagent, and I checked the claims the report rests on against its quotes. The repository sources were read by me at `ab06142`.

- S1 Thread `🧭 dctl-studio pm: working product per specs` (T3, project dctl-studio, thread `fcd4680b-0f08-41e9-b5d1-ce72cb6d3444`) — t3 thread · version: 572 items, last update 2026-11-21T20:11Z · accessed 2026-11-21 · read: whole (messages view; checker results from the activity view) · says:
  - Every coordinator request was also open on the board ("board request "Approve the plan" open", #53; "handover open on the board", #72; and others).
  - The PM answered coordinators 6–55 s after their message (10 measured gaps).
  - A handover waiting on the PM's live check took 2 min 41 s and 19 min 22 s.
  - The PM asked Q1–Q8, a runner install, a runner access decision and "protect main" only in chat. The user answered questions in 1–15 min and the install in about 2 h; "protect main" was never answered.
  - The user said "Would be nice the coordinator left it as a question so that I saw it in the board" (#147), "Which braid 1?" (#41), "I just want to be able to just open the plan file and observe from time to time" (#392), and "Please freeze work for a bit, limit is approaching. Tell all your agents" (#181).
  - The hold went to two coordinators, and one never confirmed (#189). The PM watched no coordinator's liveness.
  · adopted: the primary evidence for every routing and timeout choice.
- S2 Plan file `pm/working-product.md` on `pm/working-product` (dctl-studio) — `C:\code\dctl-studio-pm` · version: 872f5bb (2026-11-21 21:10 +0100) · accessed 2026-11-21 · read: whole · says:
  - No front matter. The header line is `PM thread: … · Branch: … · Parallel limit: 3 · Hold: no`.
  - The table header is `| Row | Sketch | Braid | Coordinator thread | Depends on | State |`. Rows P0–P11 are listed out of order.
  - Braids are named both ways ("PM for 0003", "P2 is braid 0006").
  - The change-log times are wrong: the hold is logged at 20:15Z but happened at 16:30Z, and some entries are dated 2026-11-22.
  · adopted: why the board must not parse the table, and why rows keep a `P` name.
- S3 `.agents/skills/braid-pm/SKILL.md` and `assets/plan.md` — this repository · version: ab06142 · accessed 2026-11-21 · read: whole · says:
  - The PM asks the user "in chat", never with the question tool.
  - Its digest goes out after three braids or five decisions.
  - Hold sends `Hold from the user: …` to every coordinator and notes it in the plan file.
  - The plan template has the header line and the braid table.
  - Titles are `🧭 <repo> pm: <short goal>`.
  · adopted: the as-built behaviour that strands C and E change.
- S4 `.agents/skills/braid/SKILL.md`, "Launched by a PM" — this repository · version: ab06142 · accessed 2026-11-21 · read: part (that section) · says: "Every request you would put to the user … is still opened on the board as usual, and its full message … is sent to the PM thread"; and "A reply from the user on the board still wins". · adopted: the cause of the Needs You noise, and the rule that the user's answer wins.
- S5 `docs/board.md` — this repository · version: ab06142 · accessed 2026-11-21 · read: part ("How an item's lane is chosen", "Requests", "Broke", "Where the states come from", "Refresh", "On the phone", "Several projects", "Notifications") · says:
  - Rule 3: "any other open request" is Needs You.
  - The board writes only `broke.json` and `notified.json`.
  - A push has priority high for Needs You and default otherwise, and its click is the thread's `t3code://` link.
  - "when no board runs nothing is sent".
  - The phone uses a tab bar and a project picker.
  · adopted.
- S6 `src/braids/requests.ts` — this repository · version: ab06142 · accessed 2026-11-21 · read: part (the `Request` type, `openRequest`, `closeRequest`) · says: a request has `id`, `kind` (review, question, decision, plan), `text`, `key`, `at`, `thread`, `pr` and `head`, and no addressee; `openRequest`: "an earlier one on the same item is replaced". · adopted: why the PM's requests need their own item or slot.
- S7 `src/board/model.ts` (`derive`, `requestLane`), `src/notify/message.ts`, `src/notify/notifier.ts` — this repository · version: ab06142 · accessed 2026-11-21 · read: part · says:
  - `requestLane`: a review request is In Review, any other request is Waiting.
  - `pushesOf` pushes every need on the user's side, with priority `lane === "Waiting" ? "high" : "default"`.
  - The need key is item, lane, kind and since.
  · adopted: where routing hooks in.
- S8 `src/board/t3.ts`, `src/braids/title.ts`, `src/braids/roles.ts` — this repository · version: ab06142 · accessed 2026-11-21 · read: part · says: the title regex accepts only the roles `coordinator|worker|review|research` with a `\d{4}` id, so a `🧭 <repo> pm: …` title is no braid thread's. `ROLES` maps 🧠 💻 👀 🧪. · adopted.
- S9 `docs/decisions.md` D70, D82, D83 — this repository · version: ab06142 · accessed 2026-11-21 · read: part (the three rows) · says:
  - D70: pushes from the running board only, ntfy over JSON with `fetch`, no new dependency, a minimal push.
  - D82: one PM per project with a plan on `pm/<slug>`, and "No CLI or board change".
  - D83: push titles carry the project name when repository names clash.
  · adopted.
- S10 Braid 0061: its briefs and the 0061/A spike report — branch `braid/0061-pause-and-resume-braids-on-provider-rate` · version: e18c279a (2026-11-21 20:43 +0100) · accessed 2026-11-21 · read: part (the 0061/C brief whole; the 0061/A report, "Q3" and the proposed changes) · says:
  - `.braid/pauses.json` holds one record per braid, with "who paused (`coordinator` or `pm`)".
  - A paused braid gets a `paused` mark, "is not `stalled`", and "doesn't open Needs You".
  - An overdue pause shows "resume was due", then `stalled`.
  - "under a PM, the PM pauses each braid on that provider".
  - The board "sends no messages and schedules nothing".
  · adopted: one paused state, with a hold as a second reason.
- S11 Inbox idea `2026-11-21-mbb2` "Headless board started at login" — `braid inbox show 2026-11-21-mbb2` · version: created 2026-11-21 12:04Z · accessed 2026-11-21 · read: whole · says: "A `braid board --no-open` mode … that can start at login … a login task per OS stays outside braid's code." · adopted in part: docs only, as an optional strand.
- S12 ntfy publishing docs — https://docs.ntfy.sh/publish/ (source `docs/publish.md` on GitHub) · version: last commit 4c4b1da6, 2026-11-16 · accessed 2026-11-21 · read: part (priority, tags, title, markdown, click, action buttons, updating and deleting) · says:
  - The priorities are 5 max, 4 high, 3 default, 2 low and 1 min. Priority 2 has "No vibration or sound".
  - "up to three user actions"; `http` actions take `url`, `method`, `headers.<name>`, `body` and `clear`.
  - A sequence ID can update, clear (`PUT /<topic>/<sid>/clear`) or delete a notification, on "Android and web only".
  · adopted: priority low for a PM-run braid's Done; clear on answer as a later idea; actions not now.
- S13 ntfy-android `UserActionWorker.kt` — https://github.com/binwiederhier/ntfy-android/blob/main/app/src/main/java/io/heckel/ntfy/msg/UserActionWorker.kt · version: commit 018d3a87, 2026-02-09 · accessed 2026-11-21 · read: part (`performHttpAction`) · says: an `http` action runs on the phone with OkHttp (`client.newCall(request).execute()`). · adopted: the phone must reach the board.
- S14 ntfy web app `Notifications.jsx` — https://github.com/binwiederhier/ntfy/blob/main/web/src/components/Notifications.jsx · version: main at 18c15d70 · accessed 2026-11-21 · read: part (`performHttpAction`) · says: the web app sends `http` actions with the browser's `fetch`. · adopted.
- S15 ntfy phone docs — https://docs.ntfy.sh/subscribe/phone/ · version: none shown · accessed 2026-11-21 · read: part (priority channels) · says: "one notification channel for each priority"; the user sets the per-channel Do Not Disturb override in the app. · adopted: the message can't bypass Do Not Disturb.
- S16 ntfy config docs, access control — https://docs.ntfy.sh/config/ · version: none shown · accessed 2026-11-21 · read: part (access control, tokens, cache) · says: "everyone can read and write to any topic" by default; tokens "grant users full access to the user account"; the message cache holds messages for 12 h. · adopted: no token in an action on ntfy.sh.
- S17 ntfy known issues — https://docs.ntfy.sh/known-issues/ · version: none shown · accessed 2026-11-21 · read: whole · says: iOS with a self-hosted server needs `upstream-base-url: "https://ntfy.sh"`. · adopted as a caveat.
- S18 LangGraph interrupts — https://docs.langchain.com/oss/python/langgraph/interrupts · version: none shown (mentions langgraph>=1.2.12) · accessed 2026-11-21 · read: whole · says: `interrupt()` pauses and the graph "waits indefinitely until you resume"; parallel interrupts are mapped by ID. · adopted: a request has an id and waits. Not adopted: no timeout.
- S19 LangChain Agent Inbox README — https://github.com/langchain-ai/agent-inbox · version: archived 2026-09-20 · accessed 2026-11-21 · read: whole · says: `HumanInterrupt { action_request, config: { allow_ignore, allow_respond, allow_edit, allow_accept }, description }`; the action name is the header and the description the body. · adopted in part: one inbox item per question, with its allowed responses. Not adopted: the repository is archived and has no notifications.
- S20 CrewAI hierarchical process — https://docs.crewai.com/en/learn/hierarchical-process · version: none shown · accessed 2026-11-21 · read: whole · says: the manager "allocates tasks among crew members" and "evaluates outcomes"; nothing on human input. · adopted: a manager that validates; nothing on routing.
- S21 CrewAI human-in-the-loop — https://docs.crewai.com/en/learn/human-in-the-loop · version: none shown (`@human_feedback` 1.8.0+) · accessed 2026-11-21 · read: whole · says: the run pauses in "Pending Human Input", a webhook notifies, and a resume endpoint takes feedback; no timeout. · adopted: one visible waiting state plus a notification.
- S22 AutoGen AgentChat human-in-the-loop — https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/human-in-the-loop.html · version: v0.4 docs · accessed 2026-11-21 · read: whole · says: `UserProxyAgent` "blocks the execution of the team"; it is recommended only for short interactions, otherwise "stop the team and resume later". · adopted: never block the team on the user, which the PM skill already follows.
- S23 AutoGen Magentic-One — https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/magentic-one.html · version: none shown (© 2024) · accessed 2026-11-21 · read: whole · says: the Orchestrator keeps a Task Ledger and a Progress Ledger and re-plans on stalls; `approval_func` asks the user before code runs. · adopted: the programme's state as a ledger the board shows.
- S24 schtasks create — https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/schtasks-create · version: updated 2025-10-22 · accessed 2026-11-21 · read: whole · says: `/sc ONLOGON`, `/it`, `/delay`, `/f`. The page contradicts itself on whether ONLOGON means any user or the `/ru` user. · adopted for the docs recipe, with `New-ScheduledTaskTrigger -AtLogOn -User`.
- S25 New-ScheduledTaskTrigger — https://learn.microsoft.com/en-us/powershell/module/scheduledtasks/new-scheduledtasktrigger · version: updated 2025-05-14 · accessed 2026-11-21 · read: whole · says: `-AtLogOn` with `-User` starts a task when that user logs on. · adopted.
- S26 systemd man pages (systemd.unit, pam_systemd, loginctl, user@.service) — https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html · version: systemd 262 · accessed 2026-11-21 · read: part (user unit paths, `[Install]`, the user manager's lifetime, `enable-linger`) · says: user units live in `~/.config/systemd/user`; the user manager starts at the first login and stops after the last session; linger keeps it running from boot. · adopted for the docs recipe.
- S27 `braids/0054-…/report.md` — this repository · version: ab06142 · accessed 2026-11-21 · read: part (what changed, "For later items") · says: "Requests are still opened on the board and also sent to the PM thread"; "For later items: a `braid pm` view on the board". · adopted: confirms the design gap.
- S28 `docs/design/board-mockups/all-projects.html` — this repository · version: ab06142 · accessed 2026-11-21 · read: part (its CSS, the project lines, the phone picker) · says: the approved style for a block above the lanes, filter lines and the phone picker sheet. · adopted as the style of `programmes.html`.

Set aside: OpenAI Agents SDK, Temporal, Devin and the Copilot coding agent were not read, for time. Three orchestrators with readable docs were enough to show that none has built-in escalation on timeout. ArchWiki's Systemd/User page was blocked by bot protection, so the freedesktop man pages were used instead. A search summary calling Agent Inbox active was set aside: GitHub shows it archived.

Added after the design review, to check question 6 and strands B to E against 0061 as built:

- S29 0061/C as built — branch `origin/braid/0061-pause-and-resume-braids-on-provider-rate` (PR #229 merged into it) · version: 59a723c5 (2026-11-21 23:30 +0100) · accessed 2026-11-22 · read: part (`src/braids/pauses.ts` whole; `src/board/pause.ts` phases; the diff of `docs/cli.md`, `docs/braids-format.md` and `docs/decisions.md` D86; `docs/board.md` "Paused") · says:
  - A pause record requires `braid`, a non-empty `provider`, `resumeAt` (ISO), `thread`, `by` (`coordinator` or `pm`) and `at`, with `window`, `label`, `usedPercent`, `resetsAt` and `task` nullable. It has no reason field. Invalid records "are left out with a note".
  - `braid pause` needs `--provider` and is "refused unless the verdict is `pause`" or `--until` is given.
  - The board shows "a sky pause icon" and a line on Working or To Do cards. A pause "opens no Needs You", and `stalled` "is held back (both kinds)".
  - 15 min past `resumeAt` the mark turns amber ("resume was due"). At 25 min the item reads `stalled`.
  · adopted: the hold goes in this store, which needs `reason` and nullable `provider` and `resumeAt` (strand B).
- S30 0061/D, pause and resume in the skills — PR #231 (`braid/0061/D-pause-and-resume-in-the-skills`, open) · version: the PR diff on 2026-11-22 · accessed 2026-11-22 · read: part (the diff of `braid-pm/SKILL.md`, `braid/SKILL.md`, `references/limits.md`, `references/autonomy.md` and `braid-worker/SKILL.md`) · says:
  - braid-pm gets "Provider limits": a `braid pm limits check` task every 15 min, a pause message to each coordinator, `braid pause --by pm`, and a resume task in the PM's thread.
  - braid-pm's "Hold" stays message-only and adds "A pause for a provider's usage limit is "Provider limits" instead."
  - Under a PM, a coordinator over a threshold tells the PM and runs no `braid pause`.
  · adopted: E builds on these sections after #231 merges, and adds `braid pause --hold` to "Hold".
