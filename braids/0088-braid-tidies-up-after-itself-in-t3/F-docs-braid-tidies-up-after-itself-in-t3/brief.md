---
id: '0088/F'
title: "Docs: braid tidies up after itself in T3"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0088/A', '0088/B', '0088/C', '0088/D', '0088/E']
order: 60
---

## Goal

The docs are true as a whole after this braid: what braid does to keep T3 light (settling, pruning refs, tidying leftovers, fsmonitor, fewer CLI calls), and how a user runs it.

Expected size: about 120 lines in 5 files.

## Start here

- Everything this braid changed, from its first strand: `git diff main...braid/0088-braid-tidies-up-after-itself-in-t3` and each strand's `report.md`.
- The docs in `BRAID.md` `docs`: README, `docs/getting-started.md`, `docs/cli.md`, `docs/board.md`, `docs/autonomy.md`, the help text, `docs/development.md`, `docs/decisions.md`, `docs/braids-format.md`, `docs/roadmap.md`.

## Change

- Bring those docs up to date as a whole: `braid t3 prune-refs` and `braid t3 tidy` in `docs/cli.md` and the help, the `clean` step, what a board read asks T3 (`docs/board.md`), the decisions and their reasons (`docs/decisions.md`: commands compute and agents write to T3 until 0080; the ref rule; archive, not delete), the roadmap's status.

## Already decided

- Facts in 0083's report and this braid's briefs are settled; no new research.

## Out of scope

- Skills (0088/C changes them; this strand doesn't).

## Completion

- [ ] Every doc in `BRAID.md` `docs` is checked; report.md lists each as updated or unchanged
- [ ] Docs from BRAID.md `docs` that this braid makes untrue are updated
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
