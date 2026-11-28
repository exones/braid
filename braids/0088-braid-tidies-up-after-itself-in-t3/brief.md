---
id: '0088'
title: "braid tidies up after itself in T3"
status: To Do
labels: []
dependencies: []
related: ['0080', '0083', '0085', '0087']
delivery: epic
autonomy: free
---

## Goal

Programme pm/autonomous-dev-machine, row P35, for the user's machine: braid stops leaving load behind in T3. T3 rechecks every unsettled, unarchived top-level thread with a branch each minute (35 such threads were braid's); it keeps every settled thread's checkpoint refs for ever (5,643 refs in agento slowed every `git for-each-ref`); deleting a parent leaves its subagents behind (806 settled subagents still active on 2026-11-28, 570 of them with a deleted parent); and braid's own git calls start fsmonitor daemons in everix4's 82 worktrees. Evidence and recipes: `braids/0083-how-braid-can-read-t3-lightly/report.md` ("Recommendation for braid" 5, 8–10; part 5; "What else loads the machine"), helper scripts in `~/.braid/artifacts/agento/0083/` (`seg.mjs`, `unmatched.mjs`, `prune-refs.ps1`). Performance is the priority.

What a user can try at the end: after a braid closes, its coordinator, worker and reviewer threads are settled; `braid t3 prune-refs` in dry run lists only safe refs, and applied removes them; `braid t3 tidy` lists finished braid threads left unsettled and settled subagents whose parent is deleted; a gate or `braid` command in an everix4 worktree starts no fsmonitor daemon; the board and `braid clean` make fewer `t3` CLI calls.

## Strands

| Strand | What | Tier | After |
| --- | --- | --- | --- |
| 0088/A | braid's git calls start no fsmonitor daemon: `-c core.fsmonitor=false` in braid's git runners, and the env equivalent for the gate braid runs | S | |
| 0088/B | Fewer `t3` CLI calls (0077 follow-ups): worktree and branch cached per thread id, a parent shown once per `clean` run, one board service per project | M | 0085 in `main` |
| 0088/C | braid settles the threads it finishes: skill steps settle a worker's and a reviewer's thread after the merge or the posted review, and the coordinator's own at the braid's end | L | |
| 0088/D | `braid t3 prune-refs`: 0083's rule, dry run by default, also a `braid clean` step | L | 0085 in `main` |
| 0088/E | `braid t3 tidy`: lists finished braid threads left unsettled and settled subagents whose parent is deleted; agents settle or archive them through T3's MCP | M | D |
| 0088/F | Docs: braid tidies up after itself in T3 | S | all |

Run order: A, B, C, D, E, F; one worker at a time. B and D start only after 0085 is in `main` and `main` is merged into this braid branch; if 0085 isn't merged when B is next, C runs first. The final PR goes into `main` before 0080's (0080's coordinator asked for B before 0080).

## Already decided

- The user, 2026-11-28, on 0083's follow-ups (c, d, e and the CLI cache): "So otherwise I agree with your propositions"; performance is the priority.
- The PM, 2026-11-28: 0080's auto-settle-off strand (0080/G) was dropped by the user (q-htgo, "M. B"), so coordinators auto-settle as T3 does today, and settling here is about the threads T3 leaves unsettled. The live list on 2026-11-28 (`t3_thread_list {allProjects: true, settled: false}`, 60 threads) shows which: completed coordinator threads of finished braids (everix 0008, 0010, 0014–0018, 0020; dctl-studio 0013–0016; braid 0077, 0080, 0086), finished top-level worker threads (everix 0012/A, 0014/B, 0014/C, 0014/E, 0015/D, 0017/A; dctl-studio 0013/G, 0014/B, 0015/B, 0016/B; braid 0078/L) and a completed review subagent (everix 0035/D).
- 0080's coordinator, 2026-11-28: 0080 builds nothing for settling; braid's skill steps settle coordinators and their children. braid's code has no T3 MCP client until 0080 is in `main` (days away): its client is `src/t3mcp/` (`client.ts`, `mcpClient(endpoint, token)`) on `braid/0080-the-board-talks-to-t3-directly`, the token from 0080/D's `src/t3/secret.ts`, settings in `~/.braid/t3.json`. So in this braid, commands apply only what needs no T3 write (git refs), and T3 writes (settle, archive) are made by agents with `t3_thread_organize`. Wiring the commands to 0080's client is a later item, not this braid's.
- T3's CLI (`t3 thread list|start|send|show`) has no settle, archive or delete. T3's MCP `t3_thread_organize` settles, archives, unsettles and unarchives; nothing deletes a thread. A thread's settle of itself applies at turn end.
- The checkpoint ref rule (0083 part 5): prune a thread's refs when it is archived or deleted, or when it and its parent are both not live; never touch live threads, children of live parents, or `pre-rewind` refs. Live = in `t3_thread_list {projectId, includeSubagents: true, statuses: [queued, preparing, starting, running, waiting]}`. Segment = base64url(first 32 hex characters of sha256(scope id)), scope id `checkpoint-scope:thread:<encodeURIComponent(threadId)>:name:<encodeURIComponent(name)>`, name `root` or `repository:<path>`.
- T3's store is read only read-only, and only where no T3 interface gives the fact (the scope table, archived and deleted threads, parents), as 0083 did: `node:sqlite` with `?mode=ro` and `readOnly: true`, one indexed `SELECT` per need. Never a read-write open, VACUUM, checkpoint or `t3 doctor`.
- Live checks never write to the real T3 store or the real `~/.braid`, never prune refs in `C:\code\everix4` (read-only for agents), and never settle, archive or message real threads: scratch repos, a synthetic store, a fake `t3`, and scratch threads (`t3_thread_launch` `scratch: true`) only where a real T3 call must be shown.
- Related to 0083 (How braid can read T3 lightly, merged): this braid builds its recommendations 5, 8, 9 and 10.
- Related to 0085 (braid clean works in repos with submodules, on `braid/0085-braid-clean-works-in-repos-with-submodules`): it changes `src/commands/clean.ts` and merges into `main` first; B and D merge `main` in before touching `clean`.
- Related to 0080 (The board talks to T3 directly, on `braid/0080-the-board-talks-to-t3-directly`): it owns the MCP reader and the signed-in read path. B stays in the CLI read functions of `src/board/t3.ts`: no change to the T3 snapshot's shape, `Where`/`showThread`, or the `failures` source in `src/board/inputs.ts` and `src/board/failure.ts`. B keeps its value after 0080 (signed-out hosts, `access: cli`). This braid merges into `main` before 0080.
- Related to 0087 (Lighter local gates, on `braid/0087-lighter-local-gates-a-step-runs-only-its-tests`): it pins git settings for test repositories. A changes braid's runtime git calls only, not test setup.

## Out of scope

- Deleting T3 threads (no T3 interface does it), and settling or archiving the user's own threads (only braid's, by title and record).
- Wiring `braid t3` commands to 0080's MCP client, and the board's signed-in read path (0080/F).
- An automatic `git gc` (D may offer it as an opt-in flag); T3's per-turn checkpoints, logs, PR sweep and the upstream asks (the user's).

## Completion

- [ ] braid's own git calls and the gate it runs pass `core.fsmonitor=false` (0088/A)
- [ ] The board and `braid clean` make fewer `t3` CLI calls, and only one board service reads a project (0088/B)
- [ ] The skills settle a worker's and a reviewer's thread when its PR merges or its review is posted, and a coordinator's own thread when its braid closes (0088/C)
- [ ] `braid t3 prune-refs` lists only refs the rule marks safe in dry run, removes them when applied, and never touches live threads, children of live parents or `pre-rewind` refs (0088/D)
- [ ] `braid t3 tidy` lists finished braid threads left unsettled and settled subagents whose parent is deleted, for agents to settle or archive (0088/E)
- [ ] Docs are true as a whole (0088/F)

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
