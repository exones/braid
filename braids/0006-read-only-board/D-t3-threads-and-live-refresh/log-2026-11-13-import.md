## 2026-11-13 22:01Z

2026-11-14 Decisions: T3 ids come from the list's threadId; a thread joins by linked PR (number/url against GitHub's PRs, or head branch if given), else worktree path vs git worktree list, else show's branch; show runs per running thread (pending questions) and once per unjoined stopped thread (cached). Refresh is server-sent events on /api/events (30 s timer, fs.watch on braids/ debounced 200 ms); the Refresh button refetches with fresh=1. Added --demo-t3-down so the T3-down note can be screenshotted. Tests no longer reach real gh/t3 (board.test spawns with an empty PATH).

2026-11-14 Fix round (review + coordinator): PR join uses linkedPullRequest, else a pullRequests list of exactly one; thread list gets --project <main checkout>. AC 4 unticked until CI is green on the new head. History: first summary said the join used every pullRequests entry and thread list ran in the cwd.
