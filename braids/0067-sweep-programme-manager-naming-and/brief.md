---
id: '0067'
title: "Board as a Windows service, fully usable; PM naming"
status: Done
labels: ["kind:story", "tier:L", "sweep", "ask:security", "ask:architecture"]
dependencies: []
related: ['0064', '0062', '0069']
delivery: epic
autonomy: free
---

## Goal

The board runs as a Windows service: it starts with the machine or the login, restarts when it fails, and is fully usable from its local page and the phone (Start, Merge, Open thread), without a console. braid has commands to install, remove, restart and show it (status, port, address). Along the way, the programme manager's name and escalation path read the same in braid-pm's agent metadata and `docs/autonomy.md` as everywhere else. For the user, who today runs the board by hand from a console. Programme row P7 of `pm/autonomous-dev-machine` ("Board as a Windows service, fully usable; PM naming").

A user can try it: install the service, reboot, open the board's address on the phone, Start a strand from the page, and restart the service with braid's command.

Expected size: about 400 lines in 10 to 14 files, in two strands: 0067/A (the address file, `braid board --url`, the PM naming) and 0067/B (the service).

## Leftovers taken

The user chose this sweep on 2026-11-22 ("Sweep: a"), when the coordinator of braid 0064 proposed it: 2026-11-22-7kqa went into 0064/C, and the two leftovers below into this braid, run after 0064. On 2026-11-23 the PM's go amended the goal with the user's request for the Windows service, and the idea 2026-11-21-mbb2 was taken in too.

### 2026-11-22-n60n: braid-pm openai.yaml and docs/autonomy.md still lag the programme manager

From review 0062, ref https://github.com/exones/braid/pull/245#issuecomment-7081454396.

What: .agents/skills/braid-pm/agents/openai.yaml still has display_name "Braid PM" (not programme manager); docs/autonomy.md lists how a request to the PM reaches the user but omits the gone-PM-thread escalation.
Why: names and escalation paths should read the same everywhere.
Where: .agents/skills/braid-pm/agents/openai.yaml (a skill file; the user asked for this change by choosing the sweep), docs/autonomy.md.

### 2026-11-22-uk4f: A board started at login cannot act from its local page

From 0062/F, ref https://github.com/exones/braid/pull/244.

What: braid board prints its address with the session token only to its console; a board started at login (scheduled task or systemd service, docs/board.md "Run the board at login") hides that, so its page cannot Start, Merge or Open thread.
Why: the login recipe gives notifications but a read-only board.
Where: src/commands/board.ts (the token address); the board could write it to a file under ~/.braid.

### 2026-11-21-mbb2 (idea): Headless board started at login

From 0049/C.

A `braid board --no-open` mode (no browser window) that can start at login, so the multi-project board and its phone pushes run without a terminal open. Proposed in 0049/C's report; a login task per OS stays outside braid's code.

(The user's request of 2026-11-23 brings the Windows part into braid's code; Linux keeps the systemd recipe in docs/board.md.)

## Already decided

- The user's words, through the PM (2026-11-23): "braid board as a windows service. now I run it manually from console", "very close to the beginning", and from the after-merge routine: "kill running board, start a new one … (when service ready, service)".
- The user's rule for every braid of this programme: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". So: one command group for the service, and no new state file beyond the address file of 0067/A.
- "Remove check, you will run under pm" (the user, 2026-11-23): this braid is run by the PM (`## Autonomy`).
- The kind of service (a real Windows service under the user's account with a stored password, a logon scheduled task, or what the research finds) is the user's decision, asked through the PM on 0067/B before its worker starts. The research goes into `sources.md` and 0067/B's brief.
- The openai.yaml edit is a skill file change the user asked for by choosing the sweep; the user merges this braid's PR into `main`.
- Related to 0064 (The board watches provider limits): merged into `main` at 93c9c47; this branch merged `main` after it.
- Related to 0069 (Precise notifications, on `braid/0069-precise-notifications`): it changes `src/notify/` and the board's request routing; this braid changes `src/commands/board.ts`. 0069/D also edits `.agents/skills/braid-pm/SKILL.md`. Whichever merges into `main` second merges `main` first and keeps both.
- Related to 0062 (Programme manager on the board and in the skills): the source of both leftovers; done.
- No docs strand: each strand updates the docs it touches (`docs/board.md`, `docs/cli.md`, `docs/autonomy.md`, `docs/decisions.md`, the help text), which are all the docs this braid changes.

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.

## Out of scope

- The Tailscale listener and its request header (D60): unchanged, except that the service may pass `--host tailscale` when installed with it.
- A Linux or macOS service command: Linux keeps the systemd recipe in docs/board.md.
- Renaming "PM" elsewhere: the short name stays where the docs use it after first naming the programme manager.

## Completion

- [x] braid-pm's `agents/openai.yaml` names the programme manager, and `docs/autonomy.md` gives the gone-PM-thread escalation as the other docs do
- [x] A running board writes its tokened local address to an owner-only file under `~/.braid` and removes it on stop; `braid board --url` prints it, or says no board runs
- [x] braid installs, removes, restarts and shows the board as a Windows service of the kind the user chose; it starts with the machine or the login and restarts after a failure
- [x] The service's board is fully usable: Start, Merge and Open thread from its local page and on the phone after a reboot
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated
- [x] The gate command from BRAID.md passes on the braid branch
