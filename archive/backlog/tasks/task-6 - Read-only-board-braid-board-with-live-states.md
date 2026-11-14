---
id: TASK-6
title: 'Read-only board: braid board with live states'
status: Done
assignee: []
created_date: '2026-11-13T22:00:00Z'
updated_date: '2026-11-14T10:54:00Z'
labels:
  - kind:story
  - tier:L
  - ui
milestone: m-3
dependencies: []
ordinal: 60
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: story 3 of the new braid (plan: `backlog/docs/doc-5 - New-braid-implementation-plan-draft.md` ("Decided so far", story 3)). `braid board` opens a local page with the lanes To Do · In Progress · In Review · Waiting · Done; braid cards expand to their strands; states come from the stored status, the strand's own branch, GitHub PRs and T3 threads.

Strands, in order:
- TASK-6.1: board skeleton and `braid check`.
- TASK-6.2: live copies from branches.
- TASK-6.3: GitHub states.
- TASK-6.4: T3 threads and live refresh.

Already decided (don't re-investigate): doc-5 "Decided so far" and story 3's decisions: the five lanes and their meaning; branch names `braid/0006-<slug>` (a braid) and `braid/0006/A-<slug>` (a strand); the four Waiting reasons for now; refresh every 30 s, on file change and by button; tried in the playground repo and on fixtures; React, Vite, Tailwind, Radix; no drag and drop; agents may edit braid files directly, then `braid check`.

Out of scope: board actions (Start, Merge, Open thread are story 6), the import of `backlog/` and the skills switch (story 4), several projects.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All four strands are Done on the epic branch
- [x] #2 braid board shows the playground's braids in the five lanes, with a strand's state taken from its branch, its PR and its T3 thread
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-13 User added to TASK-6.1's mockups: the final state with Start and Merge buttons, and a braid page with a strand table of contents on the left, details and brief by default, and tabs for report and logs.

2026-11-14 TASK-6.1 merged: PR #65, 329a8b2. Done: braid check; braid board (127.0.0.1, read-only, React/Vite/Tailwind/Radix bundled into dist/web, 430 KB); five lanes from stored status, expandable braid cards, braid page with contents panel and Brief/Report/Logs tabs; Start/Merge as disabled icons (Start on To Do, Merge on In Review); mockups reviewed by the user first, kept in docs/design/. Review not blocking; 4 suggestions applied (repo label, bound-address and HTML-in-brief tests, size measured). For later items: /api/board and /api/item in src/board/model.ts and src/commands/board.ts; web code in web/ (hash routes #/0002/A?tab=report).
Plan changes: none. User decided: mockup review (icons bottom right); merge on request.

2026-11-14 TASK-6.2 merged: PR #66, db7eae7. Done: board reads a strand's brief, report and logs from braid/0006/A-<slug> (local or origin/), else braid/0006-<slug>, else the working tree; branch-only items shown; newest commit wins, local wins a tie; merged branches and the checked-out branch skipped; no fetch; cards note the branch. Review not blocking; squash note and test, narrower git calls applied. For later items: BRAID_BRANCH and STRAND_BRANCH in src/braids/branches.ts match PR head branches; treeOf(root, item) reads an item's files; /api/item has branch.
Plan changes: TASK-6.3 also shows the branch in the braid page's details (user's yes). User decided: that; merge on request.

2026-11-14 TASK-6.3 merged: PR #67, 9047a57. Done: lanes from GitHub via one `gh pr list` per refresh (merged -> Done, open -> In Review, failing checks -> Waiting "checks failed", ask:<key> -> Waiting); PR link, Waiting reason and Branch row on the braid page; without gh the board uses stored states and says why. For later items: src/board/github.ts, `derive` in model.ts; screenshots of GitHub states still missing.
Plan changes: TASK-6.4 adds `braid board --demo` (sample braids with fake GitHub and T3 states) and refreshes the screenshots with it. User decided: keep the "Pull request" row on the braid page; add --demo.

2026-11-14 TASK-6.4 merged: PR #68, b2cae69. Done: lanes from T3 (running -> In Progress, pending question -> Waiting "question", interrupted/cancelled with no PR -> Waiting "agent stopped"); a thread joins a strand by linkedPullRequest, else a single pullRequests entry, else worktree path or branch; `thread list` carries --project <main checkout>; refresh by server-sent events (/api/events: 30 s, braids/ file change, Refresh button with ?fresh=1); `braid board --demo` and `--demo-t3-down`; screenshots 08-10. For later items: src/board/t3.ts (readT3, T3), derive takes a T3, src/board/demo.ts, Sources/startBoardWith/demoSources in src/commands/board.ts.
Plan changes: TASK-6.5 added (live lane in strand lists, running-agent marker), mockups first. User decided: accept both proposals from the 6.4 worker.

2026-11-14 TASK-6.5 merged: PR #69, 1f9a689. Done: strand rows and the braid page show the live lane; reasons as icons with hover (? question, red cross checks failed, red stop agent stopped, amber flag ask:<key>), purple eye for a PR to review, blue wrench for a running agent, green tick for Done; lanes labelled To Do · Working · To Review · Needs You · Done (`LANE_LABEL` in src/board/marks.ts; stored statuses unchanged); header "braid · attention board"; 0003/C in --demo; screenshots 08-12. For later items: `cardMarks`, `strandMarks` in src/board/marks.ts.
Plan changes: doc-5 records the attention board, story 4's ways of working (converge loop, decided means documented, side ideas get a home) and outline story 9 (board on the phone). User decided: attention board over four mockup rounds (lane names, icons instead of text, Working blue, Done green, wrench, eye, tick); add D32 and docs/board.md at the close.

2026-11-14 Closed. Story 3 is complete: `braid board` is a local, read-only attention board over braids/, branches, GitHub and T3, with live refresh and a --demo mode. Close-out: docs/board.md (lanes, rules, sources, icons, refresh, demo), D32 in docs/decisions.md, braids-format and README point to it; old screenshots 01-07 removed (08-12 show the current board). Next: story 4 (skills on braid, with the import), planned with the user.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: `braid board` (story 3), a local read-only attention board over `braids/`. 6.1 board skeleton (React/Vite page, 127.0.0.1, braid page with brief, report and logs) and `braid check`; 6.2 live copies of briefs from braid and strand branches; 6.3 GitHub states via one `gh pr list` per refresh; 6.4 T3 threads (running, question, stopped), live refresh (30 s, file change, Refresh button) and `--demo`; 6.5 live lanes on strand rows, reason icons with hover, running wrench, review eye, Done tick, lanes renamed To Do · Working · To Review · Needs You · Done.
Why: see where running work needs the user without opening each PR or thread.
Validation: npm run verify green on the epic branch (73 tests); CI green on every strand PR on Windows and Ubuntu; T3 field names checked against real T3 data; every visible change came from mockups the user approved.
Docs: docs/board.md (lanes, rules, sources, icons, refresh, demo); D32 in docs/decisions.md; braids-format and README link to it.
Open: none in scope. Later: story 4 (skills on braid with the import), outline story 9 (board on the phone over Tailscale).
For later items: board code in src/board/ (model.ts derive/laneOfLanes, github.ts, t3.ts, marks.ts, demo.ts) and src/commands/board.ts; change the board's behaviour or look together with docs/board.md.
Needs the user: none
<!-- SECTION:FINAL_SUMMARY:END -->
