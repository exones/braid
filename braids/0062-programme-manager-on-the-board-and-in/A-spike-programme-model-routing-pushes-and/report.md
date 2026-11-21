# Report: 0062/A Spike: programme model, routing, pushes and board mockups

**Research: how a programme and its programme manager show on the board and in pushes** — answered (the design is the user's to accept)

**Answer:** Each programme's plan file gets YAML front matter that the board reads from the `pm/*` branches. That front matter holds the goal, the plan rows with their braid numbers and states, next, hold, and the PM thread. A request gets an addressee: `braid ask --to pm` and `braid handover --to pm`.

A request addressed to the PM stays in Working with a teal "PM is handling" line and sends no push. It moves to Needs You, with a high-priority push, when:

- the PM hasn't answered within 20 minutes (60 for a handover that waits on a live check);
- the PM thread is archived, gone or failed;
- the PM forwards it (`braid forward`).

The PM's own questions become requests on the programme (`braid ask pm/<slug>`) or on the braid they concern. They are pushed at high priority with the PM thread as the click target.

A hold is 0061's paused state with a second reason. The names `braid-pm`, `🧭 … pm:` and `pm/<slug>` stay. ntfy action buttons wait for a later braid.

Confidence in the basis: high for routing and timeouts (the first PM run measured, the code read), medium for the plan-file contract (no second programme run yet), high for the ntfy facts (the docs and the app source read).

## Evidence from the first PM run

The dctl-studio run is the base rate here: one run, about 5 hours, 5 braids [S1].

- `read [S1]` The PM got 39 messages from coordinators: 6 plan approvals, 4 handovers, 6 decisions and the rest reports. Every request the PM answered itself was also open on the board, because "Launched by a PM" opens it there "as usual" [S4][S27]. Board rule 3 makes any open request Needs You [S5], and `pushesOf` pushes every Needs You need at high priority [S7]. So with notifications on, each of them reached the user's phone (`inferred`; the thread has no word about pushes either way).
- `read [S1]` The PM escalated 5 of the 16 coordinator requests and decisions. The other 11 never needed the user.
- `read [S1]` The PM answered a coordinator 6–55 s after its message (10 gaps measured). A handover waiting on the PM's live check took 2 min 41 s, and 19 min 22 s for a re-check.
- `read [S1]` Of the PM's own asks, 8 were product questions with options (Q1–Q8). Two were decisions with options (`ci:`, runner access). Two were things only the user could do (run the runner install script; protect `main`), and two were FYIs with an opt-out.
  - All of them were in chat only.
  - The user answered questions in 1–15 min. The install took about 2 h ("I'm not at home"). "Protect `main`" was never answered and was repeated in a digest.
- `read [S1]` The user's words:
  - "Would be nice the coordinator left it as a question so that I saw it in the board" (#147). The coordinator had closed its board request once the PM said go, while the user still had to act.
  - "Which braid 1?" (#41).
  - "I just want to be able to just open the plan file and observe from time to time" (#392).
  - "Please freeze work for a bit, limit is approaching. Tell all your agents" (#181).
- `read [S2]` The plan file has no front matter. Its rows P0–P11 are out of order, it names braids both ways ("P2 is braid 0006"), and its change-log times are wrong: the hold is logged at 20:15Z but happened at 16:30Z.
- `read [S1]` The PM never checked whether its coordinators were alive. One coordinator never confirmed the hold, and nobody noticed.

## 1. Programme model

**Candidates:**

- (a) The board parses the plan's markdown table.
- (b) YAML front matter on the plan file.
- (c) A JSON file next to it.
- (d) A field on each braid's brief, with no programme file read.

**Recommendation: (b), front matter on `pm/<slug>.md`, in the brief's YAML subset.**

- The table is free-form and drifts: rows out of order, stale text, wrong times [S2]. Parsing it would break on the PM's next style change. That rules out (a).
- A JSON file (c) puts two files on the branch that must agree. Front matter keeps one file the user can open and read, which is what they asked for [S1 #392]. The repository already has a strict front-matter parser that reports errors by line [`src/braids/frontmatter.ts`]. Its subset holds `key: value` and lists, so a row is one inline-list string, as `dependencies` already is. A row such as `"P2 | 0006 | Compare view | running"` keeps it inside the subset.
- The fields:
  - `programme` (the slug), `title`, `goal` (one line), `thread` (the PM thread id), `limit`, `state` (`running`, `held`, `done` or `stopped`);
  - `hold` (empty, or `<ISO time> <the user's words>`);
  - `next`;
  - `rows`, a list of `"<row> | <braid number or -> | <title> | <state>"`;
  - `digest` (one line, the latest).
- The body keeps the goal in full, the decisions and the change log, for people. The markdown table goes, because it would duplicate `rows`.
- The board reads each `pm/*` branch through the one `git cat-file --batch` it already uses for braid branches [S5 "Refresh"]: local refs, then `origin/pm/*`. That costs nothing extra.
- A plan whose front matter doesn't parse shows the programme line with "plan unreadable: <line>" and still shows the braids. That is the same pattern as Not ready [S5].
- `braid check` learns to check a plan file (`braid check --plan <file>`), so the PM can validate before it pushes.

**How a braid is tied to its programme.** The plan's `rows` are the one source for the board, and the PM is their only writer [S3]. Between `braid new` and the PM recording the number, the braid shows untagged for a minute. That is acceptable.

The `PM-run (thread <id>)` line in the brief's `## Autonomy` stays the coordinator's routing instruction. `braid ask --to pm` reads the PM thread from it (strand B), so B doesn't depend on reading plans.

Not adopted:

- (d), a new brief field: it adds a second writer, the coordinator, to programme membership.
- The coordinator's first message: the board can't read it.

**Does a programme need an id?** Yes, and the slug is the id: `pm/<slug>` is a branch name, so it is unique per repository and stable. No number is needed. In the requests store and the URL it reads `pm/working-product`, and the filter is `?programme=working-product`.

Against: a number like a braid's would sort and fit the `<repo> <id>` push title. But the PM picks the slug from the goal, it already names the branch, and a second counter would be one more thing to keep in step.

## 2. Request addressee

**Candidates:**

- (a) `braid ask --to pm`, set by the coordinator.
- (b) Inferred at read time from the braid being in a running programme.
- (c) Inferred at ask time from the brief's `PM-run` line.

**Recommendation: (a) with (c)'s lookup.**

- `braid ask|handover <id> … --to pm` stores `to: "pm"` and `pm: <thread id>`. The thread id comes from the brief's `PM-run (thread <id>)` line. `--to pm` fails, and opens nothing, when the brief has no such line.
- Without `--to`, a request is the user's, as today. A coordinator that forgets `--to pm` produces today's behaviour, which is noisy but safe.
- Not (b): it would take the user's own requests, on a braid the PM runs, away from them.

**On the board** (the mockup's screen 60 and the panel on screen 64):

- A request to the PM doesn't move the card. The braid stays in Working, and the card carries a teal line: "🧭 The PM is handling: <text> · to the PM 40 s ago". A handover reads "🧭 The PM is checking: PR #29, its live check runs".
- The card's mark is 🧭. The details banner says "For the PM", when it would come to the user, and that the user's own answer still wins [S4].

**Escalation.** It is derived at each read, like the broke alarms, and the board writes nothing new [S5]. The request moves to Needs You (or To Review for a handover) with "Escalated: … the PM hasn't answered for 21 min", and is pushed at high priority, when:

1. **Timeout:** 20 min for a question, decision or plan, and 60 min for a handover (a review).
   - Base rate [S1]: the PM's answer gaps were 6–55 s, so 20 min is over 20 times the slowest and leaves room for a PM in a long turn on something else. A live check took 2.7 and 19.4 min, and the failed first check of 0003 about 18 min, so 60 min covers one check and a re-check.
   - These are constants, like the 10-minute broke clock. Made configurable only if a run shows the need.
2. **The PM thread is not there to answer:** T3 says it is archived, unknown or failed (`t3 thread list` status). An idle PM thread is normal (the PM waits by ending its turn [S3]) and doesn't escalate.
3. **The PM forwards it:** `braid forward <id> [--note <text>]`, run by the PM, sets `to: "user"` and `forwarded: <time>`, and keeps the text, adding the note. It then reads as an ordinary request of the user's, with "Forwarded by the PM:" and the PM thread as click. This is the fix for #147: the coordinator's request stays open, now for the user.

No request escalates while its braid is paused or held (question 6).

The push key gains the escalation or forward time, so each move to the user pushes once.

Against:

- A timeout can escalate a request the PM is about to answer. The cost is one push the user didn't need, and the user's answer still wins.
- A PM that is alive but stuck in a loop escalates only by timeout. That is no worse than today.

## 3. The PM's own requests

**Which item.** Today a request is keyed by its item, and a new one replaces the old [S6]. So a PM request on braid 0004 would replace the coordinator's request there, which is the #147 failure the other way round.

Recommendation:

- The store keys a request by item **and asker**: `by: "coordinator" | "pm"`, defaulting to `coordinator` for old records.
- The PM asks on the braid when the question is about one braid (the runner install was 0004's), and on the programme (`pm/<slug>`) otherwise (Q1–Q8 were product questions).
- One open request per (item, asker). The PM folds questions asked together into one request: "Q1–Q3: … answer in the PM thread", as it did in chat [S1]. A new request replaces the old and pushes again.

**Kinds:**

- `question`, `decision` and `plan`, as today.
- A new `action` for "something only you can do" (an install, a login, protecting `main`). Its line reads "The PM asks you to: …".

Agent Inbox's item ("action request" plus the responses it allows [S19]) points the same way: the request says what kind of answer it wants, and the answer happens in the thread. The board has no Answer button [S5].

**On the board:**

- A programme request is a programme card in Needs You (teal edge, 🧭 tag, the PM thread and Plan buttons) and a "? Q8 for you" pill on the programme line (screens 60 and 61).
- A PM request on a braid shows on that braid's card, above a coordinator's request to the PM when there is one.

**Digest and ready-to-merge batch:**

- The **digest** is not a request. The PM writes its one-line summary into the front matter's `digest`, and the programme line shows "Last digest 20:03 · 3 done · 3 running · 7 PM decisions". It isn't pushed: the user didn't ask for digests on the phone, and they would be noise.
- The **ready-to-merge batch**, where `main` is the user's, is the set of handovers the PM forwards after its live check. Each shows in To Review as "Forwarded by the PM: live check passed · merge PR #31 at 4be1c2a" and is pushed once at default priority, as To Review is today. The programme line counts them ("2 ready to merge").
- In dctl-studio `main` wasn't the user's, so the PM merged itself and no batch formed [S1].

## 4. Pushes

**Under a PM:**

| Event | Push | Priority | Click |
| --- | --- | --- | --- |
| A coordinator's request or handover to the PM | none | | |
| That request escalated (timeout or PM thread gone) | yes, "Needs You (escalated)" | high | the coordinator thread (where it is answered) |
| A request the PM forwards | yes | high (a review: default) | the PM thread (it holds the PM's recommendation) |
| The PM's own request (programme or braid) | yes, title `<repo> <slug>: the PM asks` | high | the PM thread |
| The PM's `action` request | yes, "the PM asks you to" | high | the PM thread |
| A PM-run braid becoming Done | yes | **low** (no sound or vibration [S12]) | none |
| The broke alarms on a PM-run braid (checks failed, stalled) | yes | default (not high) | the PM thread |
| The digest; PM-run strands merging | none | | |
| Held or paused braids | none | | |

- The tags are as today, plus 🧭 `compass` for the PM's requests.
- Why the alarms still push: the PM watches no coordinator's liveness [S1], so a stalled PM-run braid would otherwise go unseen. Default priority and the PM thread as click keep them quiet and point the user at whoever should act.
- The content stays D70's minimal set [S9].

**ntfy action buttons (answer an option from the phone).** Not a strand now. Recommendation: a later braid, only with a self-hosted ntfy server.

- An `http` action is sent by the phone, not the ntfy server: OkHttp on Android, `fetch` in the web app [S13][S14]. A board on the PC's `localhost` can't be reached. It would need the board's Tailscale listener [S5] and the phone on the tailnet.
- An action carries its headers in plain text, and an ntfy.sh topic is "open for everyone" to read [S16]. A board token in a button on ntfy.sh would let anyone who knows the topic answer. A safe design needs a single-use, per-request token, a new endpoint that writes the answer, and the board messaging the coordinator thread. That is a new storage, endpoint and process, the "ask me" side of `architecture` and `security`.
- Up to three actions per push [S12] fit lettered options.
- An iPhone with a self-hosted server still relays through ntfy.sh [S17].
- Size: about M to L, and security-sensitive. It goes to "For later items".

**A small adoption.** Publish each request's push with ntfy's sequence ID set to the request key, and `clear` it when the request closes. An answered request's notification then leaves the phone (Android and web only [S12]). It is about 30 lines in the notifier, so I folded it into strand B.

## 5. Pushes without a running board

The goal doesn't need `2026-11-21-mbb2` [S11] to work. The pushes come from the running board (D70 [S5][S9]), and while the PM runs the user usually has T3 and the board open.

But "notify me when the PM asks" is exactly the case where the user is away from the PC (the runner install: "I'm not at home" [S1]). And today a closed terminal means no pushes and no word about it.

Recommendation: **document "Run the board at login" in the docs strand (F), with no new code.**

- `braid board --no-open` already runs without a browser [S5].
- **Windows:** a Task Scheduler task created with `New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME` and `Register-ScheduledTask` [S25], with the action `pwsh -WindowStyle Hidden -Command "braid board --no-open"`. Prefer it to `schtasks /sc onlogon`, whose docs contradict themselves on which user it runs for [S24].
- **Linux:** a user unit in `~/.config/systemd/user/braid-board.service`, enabled with `systemctl --user enable --now braid-board`. It starts at the first login and stops after the last session; `loginctl enable-linger` keeps it running without a login [S26].
- Both are `inferred` from the docs, not run here. The docs strand runs each one once.

Not adopted: `braid ask` sending its push at once. It would split sending between two processes, and escalation still needs a clock that runs.

## 6. Hold and pause

**Recommendation: one board state, "paused" (grey ⏸), with two reasons.**

- The two reasons are 0061's rate-limit pause and the user's hold.
- Both mean no Needs You, no `stalled`, no escalation and no push [S10].
- The line says which reason applies:
  - "⏸ Paused: Claude 5-hour window 93 %, resumes 21:40";
  - "⏸ Held by the PM: “Please freeze work…” · since 16:31".

The mockup's screen 62 shows both.

**Store.** The hold uses 0061/C's `.braid/pauses.json` with a `reason: "hold"` and the user's words, and no `resumeAt`, through `braid pause <n> --hold "<words>" --thread <PM thread>`. The PM runs it for each running braid when it sends `Hold from the user` [S3]. `braid resume` clears it.

- A pause record already says who paused (`coordinator` or `pm`) [S10].
- One store means one rule in `derive`, and a hold works for a braid the user runs without a PM too.
- A hold has no due time, so it never turns `stalled`. It shows its age instead.
- The plan's front-matter `hold` field gives the programme line "On hold since 16:31" and the user's words.

Against: the hold is written twice, in the plan file and once per braid. The other way, deriving each braid's hold from the plan, would make B's escalation and the board's `stalled` read plan files. That couples B to D, and a held user-run braid would have no store.

**Dependency.** This needs 0061/C merged. The braid brief already starts B to D after 0061.

## 7. Naming

- **"Programme manager"** in prose everywhere: the skill's title and description, the docs and the board's text ("Programmes", "the PM is handling", "Q8 from the PM").
  - "PM" stays the short form on cards, where space is tight.
  - "Programme" is the British spelling the user chose. "Program" is never used.
- **Keep `pm`** in the skill folder `braid-pm`, the titles `🧭 <repo> pm: …` and `🧭 <repo> pm check: …`, and the branches `pm/<slug>`.
  - `pm` fits both words.
  - The dctl-studio run already uses the branch and the title [S1][S2], and Resuming finds plans by `pm/*` [S3].
  - Renaming would break that run and the installed skill's name, for no gain the user would see.
- On the board, the 🧭 emoji marks everything of a programme: the tag, the mark, the PM thread button and the push tag. The emoji is already the PM's in titles [S3][S8].
- Plan rows keep their `P<n>` names, and the board shows the row next to the braid number ("P4 · 0007"). That ends the "braid 1" mix-up [S1 #41].

## 8. Prior art

- **LangGraph interrupts and Agent Inbox** [S18][S19]:
  - Each pending question is an item with an id, a header (the action) and a body. The item declares which responses it allows (accept, respond, edit, ignore), and the run waits until it is resumed.
  - Adopt: one request per question with its kind, answered where the agent runs.
  - Don't adopt: waiting with no limit ("waits indefinitely"), and an inbox with no notifications. Agent Inbox is archived.
- **CrewAI** [S20][S21]:
  - A hierarchical manager allocates tasks and validates outcomes, which is the PM's live check. Human input is one visible state, "Pending Human Input", plus a webhook and a resume endpoint.
  - Adopt: one visible waiting state, pushed.
  - Don't adopt: answering through an endpoint (question 4).
- **AutoGen and Magentic-One** [S22][S23]:
  - `UserProxyAgent` blocks the whole team, and the docs advise stopping and resuming instead. The orchestrator keeps a task ledger and a progress ledger.
  - Adopt: the programme line is the ledger shown to the user. The PM never blocks on the user, which the PM skill already follows ("Don't use the question tool" [S3]).
- **Across all three** (`inferred`): none routes a sub-agent's question to a supervisor first, with escalation to the human on a timeout. So the addressee and timeout design here is braid's own, and its values come from the dctl-studio run, not from prior art.

## Strands, restated

Sizes are estimates. Together about 1,900 lines, more than the braid's 1,200: the plan-file contract and the second request slot weren't in the original estimate.

**B. Requests addressed to the PM (M, about 450 lines, 9 files).**

What it builds:

- `--to pm` on `braid ask` and `braid handover`. It stores `to` and `pm` from the brief's `PM-run` line.
- `braid forward <id> [--note]`.
- `derive`: a request to the PM keeps the lane its other state gives, with a PM line and mark. It escalates on 20 or 60 min, on a gone or failed PM thread, or on a forward, and never while the braid is paused.
- The notifier pushes only what is on the user's side, with high priority and the right click for escalations and forwards.
- `braid status` and `braid requests` show the addressee.
- The ntfy sequence ID with `clear` on close.

Needs 0061/C (paused). Completion boxes:

- [ ] A request opened with `--to pm` reads Working with "The PM is handling" and sends no push; tests cover each lane rule
- [ ] It reads Needs You (a review: To Review) and is pushed once after 20 min (a review: 60 min), when the PM thread is archived, unknown or failed, or after `braid forward`, and never while the braid is paused; tests cover each case
- [ ] Old request records without `to` read as the user's
- [ ] An answered request's push is cleared on Android (sequence ID), checked with `braid notify test`

**C. The PM asks you through the board (M, about 350 lines, 8 files).**

What it builds:

- The requests store keys by item and asker (`by`).
- `braid ask pm/<slug> …` and `braid ask <braid> … --by pm` (the id `pm/<slug>` must be a `pm/*` branch).
- The `action` kind.
- A programme request reads as a programme card in Needs You, before D draws the programme line: in C a card with the slug and the request.
- A push titled `<repo> <slug>: the PM asks`, at high priority, with 🧭 and the PM thread as click.

Completion boxes:

- [ ] A PM request on a braid and that braid's coordinator request are both open and both shown; tests cover the store with old records
- [ ] `braid ask pm/<slug>` opens a programme request that shows in Needs You and is pushed at high priority with the PM thread as click
- [ ] `--kind action` reads "The PM asks you to: …" on the board and in the push

**D. The programme on the board (L, ui, about 800 lines, 10 files).**

What it builds:

- The plan front-matter format, with a reader and `braid check --plan`.
- The board reads `pm/*` branches and shows the Programmes block above the lanes (screens 60–61): goal, row chips, next, hold, the open question, the last digest, PM thread and Plan buttons.
- The 🧭 tag on PM-run cards and Done rows.
- The filter `?programme=` with "Not in a programme" (screen 63), and the phone strip, sheet and picker (screens 65–67).
- The hold shown as paused (screen 62).
- The demo board gets a sample programme.

Needs B and C. Completion boxes:

- [ ] A plan with valid front matter shows as a programme line with its rows mapped to braid numbers and states; an unreadable one shows "plan unreadable: <line>" and the board still works
- [ ] PM-run braids carry the 🧭 programme tag, and the filter by programme (and "Not in a programme") works on desktop and phone and survives a reload
- [ ] A held programme shows "On hold" with the user's words, and its braids show paused, not stalled
- [ ] Screenshots of each screen, matching the approved mockups

**E. Skills: the programme manager routes through the board (L, about 200 lines, 4 files).**

What it builds:

- `braid-pm` is named "programme manager". It keeps the plan file's front matter (the template changes) and validates it with `braid check --plan`.
- It asks the user through `braid ask pm/<slug>` or `--by pm` (still also in chat, context first).
- It forwards with `braid forward`, holds with `braid pause --hold`, and writes `digest`.
- "Launched by a PM" uses `--to pm` on `ask` and `handover`, and never closes a request the user still has to act on.

Changes skills, so the user merges it. Completion boxes:

- [ ] `braid-pm` and "Launched by a PM" use `--to pm`, `braid forward`, `braid ask pm/<slug>`, `--kind action` and `braid pause --hold` as built
- [ ] The plan template has the front matter, and the skill validates it before each push
- [ ] The name "programme manager" throughout; `braid-pm`, `🧭 … pm:` and `pm/<slug>` unchanged

**F. Docs (L, about 200 lines).**

- `docs/board.md`: Programmes, PM routing and escalation, pushes under a PM, and paused with a hold.
- `docs/braids-format.md`: the plan front matter and the request fields.
- `docs/cli.md` and `docs/decisions.md`.
- A new "Run the board at login" section, Windows and Linux, each run once.

Completion boxes:

- [ ] Docs describe programmes, routing, escalation, the pushes under a PM and the login recipe, and each recipe was run once on its OS

No strand is dropped. The headless board is docs in F, not a strand of its own.

## Validation

- `npm run verify`: not run yet (stopped for the hold; run before the PR).
- The mockups render in Edge headless (screenshots in `screenshots/`).
- The report changes no product code, skill or docs; the only new file outside the item folder is `docs/design/board-mockups/programmes.html`.
- Docs: none affected (a spike with mockups only).

## Mockups

`docs/design/board-mockups/programmes.html?s=<screen>`, with screenshots in `screenshots/`:

- 60 the board with the Programmes block, the PM-handled, escalated, forwarded and PM-asked cards;
- 61 the programme line opened;
- 62 hold and the rate-limit pause as one state;
- 63 the filter;
- 64 the panel of a braid whose request the PM handles;
- 65 the phone, Needs You;
- 66 the phone, the programme sheet;
- 67 the phone, the filter;
- 68 the pushes on Android.

## Unknowns

- Whether 20 and 60 min are right beyond one run. Settled by the next two PM runs: log each escalation and whether the PM answered soon after.
- How ntfy priorities behave on iOS (no source found). Settled by a test push of each level on an iPhone.
- Whether the PM keeps front matter correct over a long run. D's `braid check --plan` and the "plan unreadable" line limit the damage.
- The login-task recipes are read, not run (F runs them).

For later items: ntfy action buttons to answer an option from the phone (a self-hosted ntfy server, a Tailscale-reachable board, single-use per-request tokens; security-sensitive, about M–L); per-programme charters, already out of scope; a "what the PM decided" view over the plan's decisions.

Needs the user: `architecture`: the design for programmes on the board (screens 60–68) and its new contracts, for review before B to E are detailed. The contracts are:

- the plan file's front matter, which the PM writes and the board reads;
- request fields `to`, `pm` and `by`, and the new kind `action`;
- the new command `braid forward`;
- `braid pause --hold` on 0061's store;
- the 20 and 60 min escalation timeouts.
