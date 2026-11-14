What changed: `braid board` (story 3), a local read-only attention board over `braids/`. 6.1 board skeleton (React/Vite page, 127.0.0.1, braid page with brief, report and logs) and `braid check`; 6.2 live copies of briefs from braid and strand branches; 6.3 GitHub states via one `gh pr list` per refresh; 6.4 T3 threads (running, question, stopped), live refresh (30 s, file change, Refresh button) and `--demo`; 6.5 live lanes on strand rows, reason icons with hover, running wrench, review eye, Done tick, lanes renamed To Do · Working · To Review · Needs You · Done.
Why: see where running work needs the user without opening each PR or thread.
Validation: npm run verify green on the epic branch (73 tests); CI green on every strand PR on Windows and Ubuntu; T3 field names checked against real T3 data; every visible change came from mockups the user approved.
Docs: docs/board.md (lanes, rules, sources, icons, refresh, demo); D32 in docs/decisions.md; braids-format and README link to it.
Open: none in scope. Later: story 4 (skills on braid with the import), outline story 9 (board on the phone over Tailscale).
For later items: board code in src/board/ (model.ts derive/laneOfLanes, github.ts, t3.ts, marks.ts, demo.ts) and src/commands/board.ts; change the board's behaviour or look together with docs/board.md.
Needs the user: none
