---
id: '0053'
title: "Sweep: board leftovers from 0049 and 0052, a worktrees folder per project"
status: To Do
labels: ["kind:task", "tier:M", "sweep"]
dependencies: []
related: ['0049', '0052']
delivery: epic
---

## Goal

The sweep of 2026-11-21 (the user chose "Sweep as proposed" on the 0049 coordinator's proposal, then "as a new braid"). It empties the five open leftovers from 0049 "One board for all your projects" and the 0052 sweep: four small board fixes in strand A, and a worktrees folder per project in strand B. Afterwards pushes name the right project, the demo shows a failed read, board tests stop the board cleanly, and two same-named checkouts no longer share a worktrees folder.

Expected size: about 150 to 300 lines in 10 to 15 files over two PRs.

## Taken leftovers

- `2026-11-20-rxvh`, from 0049/C, ref https://github.com/exones/braid/pull/198. **Push titles clash when two projects share a repository name.** Strand A.
- `2026-11-20-7pcs`, from 0049/D, ref https://github.com/exones/braid/pull/199. **Demo board has no project with a failed read.** Strand A.
- `2026-11-20-e5gb`, from review 0052, ref https://github.com/exones/braid/pull/194#issuecomment-7044215311. **Board close() doesn't wait for the server's close event.** Strand A.
- `2026-11-20-ftvw`, from 0052, ref https://github.com/exones/braid/pull/194. **Other in-process board tests should stop the board with close().** Strand A.
- `2026-11-20-vk6w`, from 0049/B, ref https://github.com/exones/braid/pull/197. **A worktrees folder per project, not per folder name.** Strand B.

Each strand's brief carries its leftovers' full text.

## Already decided

- One braid with two strands, not a sweep story plus a separate braid: both are leftovers of 0049's board work, B is tier M like A, and one final PR into `main` means one merge for the user. Strands merge into the braid branch under the `steady` preset.
- A runs first: it is small, and its test changes (`close()`) make B's CI less flaky.
- Dropped earlier by the 0049 coordinator, as the user chose, and not in this braid: `2026-11-20-bnwt` (headless board at login, noted again as idea `2026-11-21-mbb2`) and `2026-11-20-e625` (T3 project check, blocked on T3's CLI).
- Related to 0049 (One board for all your projects) and 0052 (Sweep: Windows board-test cleanup flake): both are Done and merged into `main`; this braid builds on their code and changes none of their decisions.

## Out of scope

- Ideas in the inbox, and any leftover not listed above.
- Other board changes; agent instructions (`AGENTS.md`, skills, `BRAID.md`).

## Completion

- [ ] Strand A merged: push titles, demo failed read, `close()` and the board tests
- [ ] Strand B merged: each project gets its own worktrees folder, and existing worktrees are still found and cleaned
- [ ] The gate command from BRAID.md passes on the braid branch
- [ ] report.md written: what changed, why, validation, anything open
