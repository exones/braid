# 0045 report: working on several projects

**Answer in short.** Make one `braid board` serve several projects, in stages. First, a project list per machine in `~/.braid/projects.json`, and a board that refuses or warns, instead of showing an empty page, when a project isn't ready for braid. Then one board process that reads every listed project, with an **All projects** attention view (Needs You and To Review from every project) and one board per project behind a switcher. It also sends the phone pushes for all projects, so notifications no longer depend on which board happens to run. Leave the uber-coordinator (an agent that runs braids in several projects) for later: it needs the multi-project reads first, and it changes the skills, which are the user's tier L. Everything stays per repository except the project list and the settings that are already per machine.

## What changed

This spike adds only `report.md` and `sources.md` in this folder. No product code, docs, skills or `BRAID.md` changed.

## 1. Today

### The steps, for two or three projects

1. **Install once per machine.** `scripts/Install-Skills.ps1` (run from a braid checkout) puts the skills into the Cursor, Codex, Claude and `~/.braid/skills` folders and installs one `braid` CLI (D29, D39). Every project on the machine uses this one version, and an update reaches them all at once.
2. **Prepare each project by hand.** Each one needs its own `BRAID.md` (gate, main, ci, models), a `braids/` folder and `braids/**/temp/` in `.gitignore`. A project still on Backlog.md has to run `braid import-backlog` once.
3. **One board per project.** Run `braid board` in each main checkout (or a worktree of it), with one terminal and one tab per project. Each board gets a random port and a new token on every run, so its address changes unless you pass `--port`, and nothing records which port belongs to which project.
4. **Phone.** Add `--host tailscale` to each board. Each board opens its own Tailscale listener on its own port, so you need one bookmark per project, and a bookmark breaks whenever its board restarts without `--port`.
5. **Notifications.** `braid notify setup` runs once per machine, and one ntfy topic serves every project. Push titles start with the repository name (`agento 0044/A: Needs You`). But only a running board sends (D70): a project whose board isn't running sends nothing, and you don't notice. Sent keys live per repository (`.braid/notified.json`), so two boards on different repositories don't conflict.
6. **T3.** T3 already has every project in its sidebar. Each board reads only its own (`t3 thread list --project <main checkout>`). To move from one project's board to another's, you change tabs.
7. **Acting.** Start, Merge, Promote and Open thread work on the board's own repository only. Acting in project B means finding B's tab, or opening B's coordinator chat in T3.
8. **Inbox and requests.** Each repository has its own inbox (`braid-inbox`, D57) and its own requests in `.braid/requests.json`. `braid requests` and `braid inbox` take no project: they work on the folder you're in.

### What I tried with two checkouts

I cloned this repository and chinese-trainer into a scratch folder (`~/.braid/artifacts/agento/0045/`). I ran `braid board --no-open` in each, on ports 47101 and 47102, plus a `--demo` board on 47103, all at once. Each process used the installed CLI 0.2.0 with a temporary home folder, so none of them could send pushes. Then I read `/api/board` from each.

- **Three processes, three ports, three tokens, three tabs.** Each started in under a second and answered on its own: the braid copy with 43 braids (39 Done, 2 To Do, 1 Working, 1 To Review) in 79 ms, chinese-trainer in 9 ms, the demo in 6 ms. Nothing links the boards to each other, and no page lists them.
- **chinese-trainer showed an empty board with no warning.** That project still keeps its items in Backlog.md (`backlog/`, plus a `backlog:` key in its `BRAID.md`) and has no `braids/`. The board served `braids: []`, an empty inbox and `t3: ok`. Nothing says the project isn't on braids yet. D33 says the skills stop in that case, but the board doesn't. Running several projects makes this matter: a silent empty card in an "all projects" view reads as "nothing needs you".
- **The braid copy's board said T3 was fine, though T3 doesn't know that folder.** `t3 thread list --project <a folder T3 doesn't know>` prints `[]` and exits 0, so the board can't tell "no threads" from "not a T3 project". In the main checkout this can't happen, but a project list that points at the wrong folder would hide every thread without any sign.
- **Each board writes to its own repository.** The braid copy's board created `.braid/broke.json` in that clone. chinese-trainer's board wrote nothing, because it had nothing to time.
- **The installed `braid.cmd` (Volta shim) won't start with `LOCALAPPDATA` changed.** I had to run `node dist/cli.js` directly. This only matters for tests and scratch runs, not for users.

I didn't try `--host` with three boards at once. Its behaviour (one listener per board, a port per board) follows from `docs/board.md` and the code. I stopped all three processes afterwards.

### Where it hurts

- **Seeing.** No single place shows what needs you. You find out by opening each board in turn, or not at all.
- **Notified.** You get pushes only from projects whose board you remembered to start. A project left without a board is silent, and nothing warns you.
- **Acting.** Every board, address and token is separate. On the phone, that means one bookmark per project, and each breaks on restart.
- **Readiness.** A project that isn't ready for braid (still on Backlog.md, or a `BRAID.md` missing keys) shows nothing, instead of saying it isn't ready.

## 2. The questions

"Several projects" comes down to five questions:

1. **Seeing.** Is there one view across projects? What does it show: only what needs you (Needs You and To Review, plus Done recently), or every lane? And how do you get from it to a single project's full board?
2. **Being notified.** Who sends pushes when you aren't looking at a project's board? Today only a board that is running sends. The choice is between one long-running process covering every listed project, and nothing more than a reminder to start each board.
3. **Acting.** Start, Merge, Promote and Open thread for project B, from a page you opened for A or from a combined page. Each action has to name its project, and the server has to resolve that name only through its own list, never from a path the browser sends.
4. **State.** Where does each kind of state live?
   - **Per repository (unchanged):** `braids/`, `BRAID.md`, `braid-inbox`, `.braid/` (requests, broke clock, reviews, notified keys) in the main checkout. These travel with the repository and its branches. Moving them would break D33 to D35, D57 and D69.
   - **Per machine (already):** the installed skills and CLI, `~/.braid/notify.json`, `~/braid-worktrees/<repo>/`, `~/.braid/artifacts/`.
   - **New, per machine:** a **project list**. Each entry holds the main checkout path, a short name, and optionally a fixed board port. It lives in `~/.braid/projects.json` next to `notify.json`, and `braid projects add|remove|list` manages it. T3's project list can *suggest* entries (it has `workspaceRoot` and the GitHub identity), but it can't *be* the list. It also holds folders that aren't braid projects, and two checkouts of one repository; this machine has eleven T3 projects. An explicit list is also the boundary for what a board may serve over Tailscale.
5. **Versions.** The CLI and skills have one version per machine, so projects never run different CLI versions. What differs is the format each project is in: still on Backlog.md, `braids/` from an older CLI, `BRAID.md` missing a key that newer skills read. The real question is whether a project is ready for the installed version, not which version a project runs. Today nothing checks this: `braids/` has no format version, and a project without `braids/` gets an empty board. A per-project readiness check (has `braids/`, `BRAID.md` parses, `braid check` passes, T3 knows the folder, `gh` can read the repository) answers it for the list and for the board.

Two more facts shape every option:

- **Repository names can collide.** Worktrees live in `~/braid-worktrees/<repo folder name>/` and push titles use the repository name. Two projects named `app` from different owners would share a worktree folder and look alike on the phone. A project list should refuse duplicate short names.
- **Load grows with every project.** Each board refresh reads T3 once (`t3 thread list`, plus `show` per running thread), GitHub (`gh pr list --limit 500` with checks) and git refs, every 30 s. Five projects mean five times that, from one process or several. A slow or unreachable project must not hold back the others.

## 3. Options

From smallest to largest. Sizes are rough. Tiers follow the workflow: a change to skills, `AGENTS.md` or `BRAID.md` is L.

### Option 1: one board per project, documented (status quo plus small fixes)

- **What you see and do.** Same as today, with a recipe in `docs/board.md`: one `braid board --port <n> --host tailscale` per project, a fixed port per project, a phone bookmark per project, the boards started at login (a scheduled task or a shell profile line). Two fixes make it honest. First, the board refuses to start or shows a banner when the folder isn't a braid project (no `braids/`, Backlog.md found, `BRAID.md` unreadable). Second, it says when T3 doesn't know the folder.
- **What changes.** Docs. The readiness check in `braid board` (and `braid status`). No new state.
- **Cost.** S, one task, about 150 lines.
- **Risks.** Low. N processes and N Tailscale listeners, each with today's security model.
- **What it rules out.** Nothing. But it leaves the user's question, one place, unanswered: seeing and notifications still split per project.

### Option 2: a hub that starts and links per-project boards

- **What you see and do.** `braid hub` (or `braid boards`) reads `~/.braid/projects.json` and starts one board per project as a child process, each on its fixed port. It serves a small index page, locally and on Tailscale, with one row per project: its name, its Needs You and To Review counts and its readiness. Each row links to that project's own board. One bookmark on the phone. Pushes come from the children, so every listed project sends while the hub runs.
- **What changes.** CLI: `braid projects add|remove|list`, `braid hub`, a small read-only `/api/summary` on each board. A new page (mockups first). New state: `projects.json`. Boards themselves are unchanged.
- **Cost.** M, 2 or 3 strands, about 800 lines. One of them is UI.
- **Risks.** N+1 processes to supervise: restarts, a child that dies, port clashes. The token model gets awkward locally. Each child has its own token, so a link from the hub page to a child can't carry the token without the hub knowing it, and the hub would have to pass tokens around. Over Tailscale each child runs its own whois check, which works. Counts on the hub page may lag the child they come from by up to a refresh.
- **What it rules out.** Little, but it's a dead end. A real combined view (needs from every project in one list, actions on it) would have to be built again inside one process, i.e. option 3.

### Option 3: one board process serving several projects (recommended)

- **What you see and do.** One `braid board` (with no project folder needed, or `--all`) serves every listed project, on one port and one Tailscale listener, with one token. The first page is **All projects**: Needs You and To Review from every project in one list, grouped or tagged by project (`agento 0044/A`), each card with its usual actions. It also shows one line per project with its counts and readiness (`not on braids: Backlog.md found`, `T3 doesn't know this folder`, `GitHub unreadable`). A project switcher opens the familiar single-project board (`#/p/<name>/…`). Pushes cover every listed project from this one process, so a project is notified as long as the board runs, whether or not anyone looks at it. On the phone: one bookmark.

  ```
  braid · All projects                                   [Refresh]
  ┌ Needs You (3) ─────────────────────────────────────────────┐
  │ agento   0045    question  "Which option for several …"    │
  │ trainer  0007/B  checks failed                              │
  │ site     0002    stalled                                    │
  ├ To Review (1) ─────────────────────────────────────────────┤
  │ agento   0044    PR #178 green          [Merge] [Open]     │
  └────────────────────────────────────────────────────────────┘
  agento ✓ 1 working · trainer ✓ 2 working · notes ⚠ not on braids (Backlog.md)
  Projects: [All] [agento] [trainer] [site] [notes]
  ```

- **What changes.**
  - CLI: `braid projects add|remove|list`, plus the readiness check (shared with option 1). `braid board` takes its projects from the list. Run in a project folder with no list, it serves that project alone, as today, so nothing breaks.
  - Board server: `Sources` (today built for one root) becomes one per project. Each project is read in parallel with its own timeout and its own last good snapshot, and the snapshot records when it was read and what failed. `/api/board` takes a project, `/api/all` returns the attention list, and every action carries a project *name* that the server resolves through the list (a path from the client is never accepted). Each project's notifier keeps its own `.braid/notified.json`, so keys stay per repository.
  - Page: the All projects view, the switcher, the project tag on cards (mockups first).
  - State: `~/.braid/projects.json`. Nothing moves out of the repositories.
  - Skills: none. Coordinators and workers keep working per project.
- **Cost.** L, a goal of 3 or 4 strands, about 1,500 to 2,000 lines with tests. UI strand(s) start with mockups.
- **Risks.**
  - *Security.* One Tailscale page now shows every listed repository's briefs, logs and inbox, and can act in each. *Who* may reach it doesn't change (the machine owner only, by whois; locally the token). But the blast radius grows from one repository to all listed ones. Mitigations: only listed projects are served (an explicit opt-in per repository); actions resolve a listed name, never a path; Host, Origin and `x-braid-request` checks stay as they are.
  - *Stale or partial reads.* Projects are read at different moments, and one may fail. Each project row and card shows its own age and failures. A project that couldn't be read keeps its last snapshot, marked as old, and sends no pushes (D70 already sends nothing after a partial read).
  - *One slow project.* Reads run in parallel with per-project timeouts (T3 already has a 30 s timeout; GitHub needs one too), so the All view is built from whatever is ready. One `t3` call per project could later become one call if T3 grows a cross-project list.
  - *Load.* `gh pr list` and `t3 thread list` per project every 30 s. Fine for a handful of projects. Beyond that, refresh the projects not on screen less often.
  - *Concurrency.* A second board on the same repository (an old per-project board still running) shares `notified.json` as today: a duplicate push can happen, a broken file can't.
- **What it rules out.** Nothing later. It's the base option 4 needs, since an uber-coordinator would read the same per-project snapshots. It does supersede D40's "one project for now", which a follow-up decision has to record.

### Option 4: a cross-project coordinator (the uber-coordinator idea)

- **What you see and do.** One long-running T3 thread, a project manager over the per-braid coordinators in every listed project. It reports what is running, waiting or stuck everywhere. It answers or forwards the coordinators' questions, nudges stalled ones and, within limits, starts the next braid. You talk to it instead of to each coordinator.
- **What changes.** Skills: a new role or a mode of `braid` that reads several projects' state, plus rules for what it may do alone (tier L, the user's merge). CLI: machine-readable per-project state (`braid status --json`, or the option 3 server's `/api/all`). T3: threads in several projects, sends to coordinators there (the T3 tools already allow both). State: the project list, plus the manager's own memory of what it decided.
- **Cost.** L+, a goal of its own after option 3, with open policy questions: autonomy, limits, which questions still go to the user. These are the idea's own open questions.
- **Risks.** An agent acting across repositories widens what one mistake can touch. Its picture of a project goes stale between turns. It costs model time while idle. It also overlaps with 0011 (several agents inside one braid) and with the board's own Start and Merge.
- **What it rules out.** Building it before option 3 would duplicate the cross-project reads in the skill. Building it after option 3 rules out nothing.

### Side by side

| | Seeing | Notified | Acting | New state | Size |
| --- | --- | --- | --- | --- | --- |
| 1 Documented per-project boards | one tab per project | per running board | per tab | none | S |
| 2 Hub over per-project boards | hub counts, then a board per project | all listed, while the hub runs | per child board | `projects.json` | M |
| 3 One board, several projects | one attention list plus per-project boards | all listed, while the board runs | from the All view | `projects.json` | L |
| 4 Cross-project coordinator | in chat | by the agent | the agent acts | list plus agent memory | L+ after 3 |

## 4. How others do it

Sources and how each was read are in [sources.md](sources.md).

- **Registry outside the repositories, data inside them.** Vibe Kanban (repositories in settings, with name and path), Conductor (one project per repository; local settings in the app, shared scripts committed) and Claude Squad (`~/.claude-squad/` with `repo_path` per instance) all keep the list of repositories in the user's folder, not in any repository. Backlog.md keeps everything per folder and has no combined view, but still runs one user-scope MCP server for every repository. braid should copy this split: `projects.json` per machine, while `braids/`, `BRAID.md` and `.braid/` stay in each repository.
- **One inbox across everything, the project as a filter.** Linear's inbox gets every notification of the workspace in one stream, filtered by team or project. GitHub Projects builds one board from items in many repositories, as references that stay home. braid should copy this too: one attention list (Needs You and To Review) across projects, with the project as a tag and filter, rather than a "board of boards".
- **One item, one home.** Linear ties an issue to exactly one team, and GitHub drafts that belong to no repository lose history and notifications. braid should keep every braid in exactly one repository, which matches the user's decision to leave cross-repository goals out.
- **One server, safe defaults.** Vibe Kanban and OpenHands run one local server for every repository. Vibe Kanban binds to 127.0.0.1 with an origin allowlist. OpenHands recommends Tailscale for the phone and demands an API key when exposed publicly. braid's owner-only whois plus the Host and header checks are already stricter, and option 3 keeps them. Avoid Vibe Kanban's cloud relay for phone access; braid has Tailscale.
- **Don't demand a repository for the cross-project view.** Claude Squad keeps a cross-repository list yet refuses to start outside a repository. An all-projects `braid board` should run from any folder.
- **Settings in layers.** Vibe Kanban: project settings override global ones. braid already has this split (`BRAID.md` per project, `notify.json` per user), and nothing needs to change.

## 5. Recommendation

Take **option 3, in stages**, with option 1's readiness check as its first stage, because that check pays off on its own. Leave option 4 in the inbox until option 3 has run for a while. Skip option 2: it costs about half of option 3 and still ends without a combined view.

Proposed follow-up items, in the order they would run:

1. **Project readiness check** (`kind:task`, tier S). `braid board` and `braid status` say why a folder isn't a working braid project instead of showing an empty board: no `braids/` (Backlog.md found: run `braid import-backlog`), `BRAID.md` missing or unreadable, `braid check` errors, T3 doesn't know the folder (`t3 thread list` returns `[]` for an unknown path), GitHub unreadable. A banner on the board, a line in `status`. No new state. Useful with one project too.
2. **Project list** (`kind:story`, tier M). `~/.braid/projects.json` with `braid projects add <path> [--name <n>] [--port <n>]`, `remove`, `list` (each with its readiness). `add` resolves the main checkout and refuses duplicate names. `braid projects suggest` lists T3 projects that have a `BRAID.md` but aren't on the list yet. Docs: `cli.md`, a new decision that amends D40.
3. **One board for several projects: server** (`kind:story`, tier L, a goal with strands). `braid board` serves every listed project: one `Sources` and one notifier per project, parallel reads with per-project timeouts and last good snapshots, `/api/board?project=`, `/api/all`, actions by project name resolved through the list, one Tailscale listener. With no list, or with `--project`, it behaves as today. Pushes for every listed project from one process.
4. **One board for several projects: page** (`kind:story`, tier M, `ui`; could be a strand of item 3). Mockups first on demo data with three projects: the All projects attention view, the per-project line with counts and readiness, the switcher, the project tag on cards and on push titles. The build follows once the user approves.
5. **Later, not now: cross-project coordinator.** The uber-coordinator idea stays in the inbox. Once items 3 and 4 have run, plan it with `/api/all` as its eyes and its autonomy questions answered by the user.

**Effect on 0011.** None. 0011 runs several agents inside one braid of one project, and items 3 and 4 only read what that produces. If 0011 adds new card states, the All view shows them the same way the single-project board does.

## Validation

- I tried two real checkouts (scratch clones of this repository and chinese-trainer) and a demo board side by side, using the installed CLI 0.2.0 with a temporary home folder, and read `/api/board` from each. The results are in "What I tried with two checkouts".
- I ran T3's CLI help, `t3 thread list` on an unknown folder, and T3's project list (read only).
- I read the outside tools' docs. Each source is in `sources.md`, along with what it says and whether I adopted it.
- `npm run verify` passes.

## Open

- Whether pushes should come from a process that runs without a board (a `--headless` board, started at login) is left to item 3's plan. Option 3 makes this a flag, not a new component.
- How T3 would show threads of several projects to the phone's T3 app is T3's concern. The `t3code://threads/<env>/<thread>` links already work for any project.
- Load numbers for more than about five projects weren't measured.

For later items: the installed `braid.cmd` (Volta shim) fails with "Could not determine LocalAppData directory" when `LOCALAPPDATA` points elsewhere, so tests and scratch runs that redirect the home folders should call `node dist/cli.js` directly. Two repositories with the same folder name would share `~/braid-worktrees/<repo>/`. That is worth a check in item 2.

Needs the user: decision: which option, or which staged path, to plan next. The recommendation is option 3, staged as the readiness check, the project list, then the server and the page.
