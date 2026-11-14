---
id: '0002/A'
title: "Spike: Backlog.md's implementation as braid's reference; fork or reference"
status: Done
labels: ["kind:spike", "tier:M"]
dependencies: []
order: 10
---

Goal: a lasting map of how Backlog.md is built, so the user can judge how complex braid's own tracker is, and a recommendation: fork Backlog.md and adjust it into braid, wrap its CLI or MCP server, or reimplement a compatible tracker using its code as a reference. Feeds the user's choice and TASK-2.2. Time box: about three hours of agent work; if it runs out, report what is known and what isn't.

Expected size: one new doc of about 200 to 300 lines.

Start here (read in this order):
- `docs/roadmap.md`: "braid's own board" (what braid keeps from Backlog.md and what it adds).
- `docs/decisions.md`: D01 and D30.
- `BRAID.md` and `.agents/skills/braid/assets/task.md`: which Backlog.md features braid uses today.
- The source: `git clone --branch v1.55.3 --depth 1 https://github.com/MrLesk/Backlog.md inspiration/backlog.md` in your worktree (`inspiration/` is gitignored; never commit it).

Change:
- `docs/backlog-md.md` (new): Backlog.md as a reference. Its parts (task file format and parsing, IDs and subtasks, cross-branch reads, config, CLI, MCP server, board and web UI, tests) with line counts and what each does; how it does what braid uses and what braid adds (goals nested, derived states, actions); the hard parts and known bugs braid has hit; runtime and build (Bun or Node; braid is Node.js 26, TypeScript, ESM); upstream health (release pace, contributors, open issues).
- The same doc ends with the three ways compared: size to own, upkeep against upstream, runtime fit, licence, what braid would drop or rewrite, and the path to the derived-state board. Recommend one, with the conditions that would change it.

Already decided (don't re-investigate):
- Backlog.md stays the store until braid reads the same files.
- The current braid CLI (`src/`, the `.braid/` ledger) and the roadmap's stages built around it are dismissed: the new CLI starts fresh and needn't fit them.
- Earlier count: about 68k lines at 1.55.3, 16k of them the web UI (verify with a per-folder count).

Out of scope:
- Starting agents, derived-state sources and the first board version (TASK-2.2).
- Product code, skill changes, and committing Backlog.md's source.

## Acceptance

- [x] docs/backlog-md.md maps Backlog.md 1.55.3 by part with line counts, and names the parts braid uses
- [x] It compares fork, wrap and reimplement-with-reference on size, upkeep, runtime fit and licence, and recommends one with the conditions that would change it
- [x] Claims cite files, commands run or upstream pages
- [x] No product code or skill changes; Backlog.md source is not committed

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open

## Plan

1. Clone Backlog.md v1.55.3 into inspiration/ (gitignored) and count lines per folder (non-test, tests, web UI).
2. Read the parts braid uses: task file format and structured sections, ID and subtask generation, cross-branch loading, config, CLI commands, MCP server, web server and board; note Bun-only APIs and the build.
3. Collect upstream health with gh api (releases, contributors, open issues) and the licence.
4. Write docs/backlog-md.md: parts with line counts, how it does what braid uses, what braid adds, hard parts and known bugs, runtime, upstream health, then fork vs wrap vs reimplement compared, with a recommendation and the conditions that would change it.
5. Run npm run verify; write the final summary; set Done.
