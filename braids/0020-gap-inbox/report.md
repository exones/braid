# Report: 0020 Gap inbox: small findings and side ideas without a decision each

## What changed

Each project gets one inbox: the branch `braid-inbox`, an orphan never merged into `main`, with one file per entry in `leftovers/` and `ideas/`. Leftovers are filled by a fixed routing rule and emptied by batched sweeps. Ideas are the user's brain dump; they never expire and are never proposed for review.

- **0020/A, the inbox branch** (PR #124, D54): `braid note "<text>" --from <source> [--ref <url>]` writes an open leftover, and `braid note --idea` writes an idea. Each write is one commit built with Git's low-level commands, so no checkout, index or HEAD is touched. It is pushed as a fast-forward, fetched and redone when someone pushed first, and kept locally with a warning when offline; the next write replays it. `braid inbox [--leftovers|--ideas] [--all] [--no-fetch]` and `braid inbox show <id>` read it, and a malformed entry is named while the rest still list.
- **0020/F, the sweep commands** (PR #127): `braid inbox take <ids> --into <braid>`, `pass <ids>` (drops a leftover at its second pass and refuses ideas), `drop <ids> --why "<reason>"` and `reopen <id>`. Each command checks every id first, so a typo changes nothing, and writes one commit through 0020/A's write path.
- **0020/B, the counts** (PR #128): `braid recap` and `braid handover` end with `Sweep due: <n> open leftovers` at 3 or more open leftovers, and otherwise say nothing about the inbox. `braid list` ends with `Inbox: <n> leftovers, <n> ideas`. Both read the local refs only.
- **0020/C, the board** (PR #129, D55): a header chip with the counts opens a read-only `#/inbox` page with Leftovers and Ideas, as in the mockups the user approved. Refresh fetches `braid-inbox`; the 30 s reload doesn't.
- **0020/E, the `braid-idea` skill** (PR #130, D56): `$braid-idea <a sentence>` checks for `braid inbox`, reads only what the idea touches, asks one question only when it must, and writes a short idea in the shape the user approved (title, restatement, Why, Related, Open questions, the user's words).
- **0020/D, the coordinator skills** (PR #131, D57): the workflow's new section "Gaps and the inbox" holds the routing table, the two kinds and how to write a self-contained leftover, with `braid-inbox` as the one exception to "one writer per branch". The `braid` skill replaces "Side ideas get a home": the coordinator captures leftovers with `braid note` before each handover, proposes one sweep story at `Sweep due` or before planning, never decides a sweep in auto mode, and never lists entries or ideas in a recap.
- **0020/G, final review fixes** (PR #133): from Fable's final review, auto mode checks the inbox after each strand merge and proposes a sweep at 3 or more open leftovers (unless one is open or pending); the offline warning quotes Git's `fatal:` line; a write refuses, changing nothing, while `braid-inbox` is checked out in any worktree.

## Why

Small leftovers cost the user a decision each, and stayed scattered across briefs and reports where nothing gathered them. Now capturing takes no decision, deciding happens in batches, and ideas have a place where they aren't forgotten.

## Validation

- `npm run verify` passes on the braid branch after merging `main` (246 tests).
- The final review by Fable, at the user's request, found nothing blocking; three of its suggestions became 0020/G, which Fable re-checked.
- Each strand passed its own gate and both CI checks, and had an independent review with nothing blocking (re-checks for A and F after their fixes; the suggestions of C and D were taken).
- Tests cover the first capture, two clones racing, offline captures and their replay, a capture from a dirty worktree, malformed entries, every sweep command with a refused push, the recap at 2 and 3 leftovers, the list counts, and the board's API data, including a failed fetch.
- Merging `main`: main had taken D53 (a braid being planned shows Working), so this braid's decisions became D54 to D57. Conflicts in `src/cli.ts`, `src/commands/braids.ts`, `docs/cli.md` and the `braid` skill kept both sides (0023's thread titles and the inbox).

## Open

- Not tried end to end: the installed `braid` comes from `main` (D39), so no real `braid note` or `$braid-idea` capture has run yet. After the merge and an install, the first capture, sweep and board view are the real check.
- This goal's own leftovers could not go into the inbox (see "During this goal" in the brief). After the install they are noted with `braid note`:
  1. From 0020/A: the inbox lock waits at most 10 s, so a second writer on the same machine gives up with an error while a slow write (several push retries) holds it. The entry isn't lost; running the command again works. `src/inbox/branch.ts`, `src/braids/requests.ts` (`locked`).
  2. From 0020/A: when two writers change the same entry, the later write wins, and a replayed offline commit that changed an existing entry overwrites the remote's newer version of it. Matters for sweeps run from two clones. `src/inbox/branch.ts` (`rebase`, `commitOn`).
  3. From the 0020/B review: `braid list` with no braids prints only `No braids.`, without the Inbox line, so a new project with ideas but no braids shows no counts. `src/commands/braids.ts` (`listBraids`).
  4. From the 0020/B review: no test locks that the counts include a local-only leftover without fetching; `readInbox` covers it in 0020/A's tests, but a regression in `openCounts` wouldn't be caught. `test/inbox-sweep.test.ts`, `test/facts.test.ts`.
- Size: 0020/A came to about 940 lines against 400 to 550 expected, under twice the estimate; the offline replay and its tests account for most of it.

Decisions: the user's: the inbox on its own branch `braid-inbox` with `leftovers/` and `ideas/`, one file per entry; a sweep at 3 open leftovers or before planning, a leftover dropped after 2 passes; ideas never expire and are never proposed for review; recaps show only `Sweep due`, never entries or ideas; self-contained leftovers with a source and links; a separate small skill `braid-idea`; no import of past leftovers; no inbox actions on the board; the board's inbox as a separate page with idea previews; the idea shape and wording of `braid-idea`; auto mode for this goal, with the final review by Fable. Mine: the decisions renumbered to D54 to D57 when merging `main`; the review suggestions of C and D taken before their merges.
For later items: the four leftovers above, to note with `braid note` after the install.
Needs the user: process: this PR changes `.agents/skills/` (a new `braid-idea` skill, and the `braid` skill, workflow and brief template) and adds decisions D54 to D57; the user reviews it and merges it into `main`.
