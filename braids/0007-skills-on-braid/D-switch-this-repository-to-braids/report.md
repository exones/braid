## Final summary

**What changed:** `braid import-backlog` ran here (TASK-1..7 became braids `0001`..`0007`, 19 strands; doc-1 to doc-4 are `0002`'s reports); ten cut-off slugs were shortened; Outline braids `0008`..`0012` hold stories 5 to 9; D34 to D41 in `docs/decisions.md` carry doc-5's decisions; `backlog/` is now `archive/backlog/` with a frozen-history README and links rewritten; the BRAID.md transition line and the roadmap's Backlog.md lines are gone. doc-1 stays frozen in the link checker (its links to the old skill assets no longer exist), at its archive path.

**Why:** the repository's work now lives in `braids/`, with history kept and future stories visible on the board.

**Validation:** `braid check` OK (12 braids, 19 strands); `braid board` lists all twelve; `npm run verify` passes; CI green on Windows and Ubuntu (PR #75, cdbfeee).

**Open:** prose in imported braids still says `backlog/` where it describes the old store (past content, left as is).

For later items: the docs gate checks tracked files only, so `git add` before `npm run verify` when adding files; doc-5 stays only in the archive (not a braid); the `epic/**` CI trigger can go after TASK-7.
Needs the user: none
