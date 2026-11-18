---
id: '0023'
title: "Thread titles: one format, with role emoji"
status: In Progress
labels: ["kind:story", "tier:S", "ask:process"]
dependencies: []
order: 207
delivery: epic
---

## Goal

Every braid thread has a title in one defined format that people tell apart at a glance and the board reads without asking T3 for each thread. Since #122 (0021) the board and `braid clean` run `t3 thread show` for up to 40 idle threads (about 3 s each), so `braid clean` takes minutes and every board refresh is slow; the title can tell instead (user, 2026-11-18).

Expected size: about 150 lines in 6 files, with tests.

## Start here

- `src/board/t3.ts` (`readT3`: idle threads, `IDLE_SHOW_CAP`, the coordinator title regex), `src/commands/clean.ts` (how it reads T3), `src/commands/board.ts` (Start's `--title`).
- `src/braids/worktrees.ts` (`repoNameOf`: today the checkout's folder name, `agento` here).
- `.agents/skills/braid/SKILL.md`, ground rules: "Name threads `<repo> <id> <role>: <title>`".

## Change

- **The format:** `<emoji> <repo> <id> <role>: <title>`, roles and emoji (user, 2026-11-18): 🧠 `coordinator`, 💻 `worker`, 👀 `review`, 🧪 `research` (a researcher thread; no braid role launches one yet, but the format reserves it). For example `💻 braid 0021 worker: Board Start: no branch clash`. One function builds it and one parses it; Start uses the builder. The parser also reads titles without the emoji (older threads).
- **The title is the card's title** (user, 2026-11-18: "I absolutely need that card for a braid and T3 thread names are the same"): `<title>` is the item's name exactly as its brief and card have it, never shortened or reworded: a coordinator's is the braid's name; a worker's or reviewer's is the strand's name, or the braid's for a story without strands. `<id>` is that item's id (`0009` or `0009/D`). A new command `braid title <id> --role <role>` prints the full thread title; the skill launches workers, reviewers and researchers with its output, and Start uses the same builder.
- **The repo name** is the GitHub repository's name (from `origin`'s URL), falling back to the checkout folder's name when there is no `origin`. Worktree folders keep their current names.
- **No `show` for idle threads:** the board matches an idle thread to its item by its title (id and role); running threads keep their `show` (worktree, pending questions). Drop `IDLE_SHOW_CAP`.
- **`braid clean`** reads running threads only.
- **The skill** (braid, ground rules) names the format with the emoji and the same example; `docs/board.md` says how the board uses titles.

## Out of scope

- Renaming existing threads or worktree folders.

## Completion

- [x] Start titles a coordinator `🧠 <repo> <n> coordinator: <title>` with the GitHub repo name (tested)
- [x] The board finds an idle worker, reviewer and coordinator thread by title, with no `t3 thread show` for idle threads, and still reads titles without emoji (tested with a fake `t3` that counts calls)
- [x] `braid clean` makes no `t3 thread show` call for idle threads, and finishes in seconds on this repo
- [x] `braid title <id> --role <role>` prints `<emoji> <repo> <id> <role>: <brief title>`, the title exactly as the card shows it (tested)
- [x] The braid skill names the format and launches every thread with `braid title`
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

- One module (title builder and parser, GitHub repo name); the board places idle threads by title; `braid clean` reads GitHub and T3 once for all braids; `braid title`; skill and docs.
