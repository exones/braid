---
id: '0005/B'
title: "Create and edit braids and strands"
status: Done
labels: ["kind:story", "tier:L"]
dependencies: ['0005/A']
order: 20
---

Goal: braids and strands are made and changed only through braid, so agents never edit the files by hand.

Expected size: about 500 to 900 lines with tests, in 5 to 8 files.

Start here (read in this order):
- `docs/braids-format.md` and the loader from TASK-5.1.
- `.agents/skills/braid/assets/task.md`: which Backlog.md create and edit calls the skills make today; braid needs their equivalents, not all of Backlog.md's options.

Change:
- `braid new <title>`: the next free number, also checking remote branches for numbers already taken; creates the folder and `brief.md`.
- `braid strand new <braid> <title>`: the next free letter; letters never reused.
- `braid edit <id>`: status, title, labels, dependencies, order, delivery mode.
- `braid brief <id> <section>`: set a section of `brief.md`; multi-line text from a file or standard input.

Already decided (don't re-investigate): doc-5 "Decided so far" (`archive/backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`) and the parent TASK-5. Node.js 26, strict TypeScript, ESM; the skeleton from TASK-4 (`src/cli.ts` router, tests that run the built CLI). Cross-platform: Windows and Ubuntu.

Out of scope: logs and reports (TASK-5.3), the board, the import.

## Acceptance

- [x] A braid with two strands can be created and edited entirely from the CLI, covered by tests
- [x] Numbers and letters are never reused, including numbers taken on remote branches
- [x] Multi-line text works from a file and from standard input on Windows and Ubuntu
- [x] npm run verify passes; CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open

## Plan

1. src/braids/write.ts: formatBrief (the front matter subset: ids in single quotes, text JSON-escaped in double quotes, labels and dependencies always, order when set, delivery on braids), slugify, setSection (replace a `## ` section outside code fences, or append it). Every write is parsed back with parseBrief before it lands.
2. src/braids/numbers.ts: taken numbers and letters = the working tree plus every path ever under braids/ in any ref (`git log --all --name-only -- braids`), so numbers and letters on other branches, remote-tracking branches and deleted folders are never reused; next = highest + 1 (gaps are not filled). Before that, `git fetch --all` when the repo has a remote; a failed fetch stops with exit 1 unless `--no-fetch`.
3. src/commands/edit.ts with node:util parseArgs: `braid new <title>` and `braid strand new <braid> <title>` (options --status, --labels, --dep, --order, --delivery (braids), --slug, --no-fetch); `braid edit <id>` (--status, --title, --labels, --dep, --order <n|none>, --delivery); `braid brief <id> <section>` with --file <path>, --file - (standard input) or --text. Dependencies must name existing braids or strands. The folder name keeps its slug when the title changes.
4. src/cli.ts routing and help; docs/braids-format.md and README commands.
5. test/edit.test.ts running the built CLI in temp git repos with a local bare remote: a braid with two strands made and edited from the CLI; numbers taken only on a remote branch and deleted folders not reused; letters not reused; multi-line text from a file and piped stdin (CRLF input too); usage errors.
6. npm run verify, PR into epic/task-5-braids-folder.
