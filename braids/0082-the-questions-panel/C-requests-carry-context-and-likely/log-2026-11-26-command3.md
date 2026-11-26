## 2026-11-26 22:05Z

Decided: `look` pushes at default priority (it blocks nothing); an escalated or forwarded look stays high. A lone option letter is mapped from `--file` too, since coordinators record chat replies that way; a letter with no stored option is recorded as given. `braid show` doesn't exist: `braid requests <name>` is the request's show and prints options and context. D119 records the change.

## 2026-11-26 23:53Z

Review round (comment 7205548399): fixed the stale docs in braids-format (catalogue), board and getting-started. Took all four suggestions: braid-pm names --context-file -; a look unblocks nothing (unblocksOf returns []); the PM's look pushes at default; a test that a letter with no stored options stays a letter. Gate green, 802/802.
