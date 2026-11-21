0053 emptied the open leftovers from 0049 and 0052 in two strands, merged into the braid branch under the `steady` preset.

- **0053/A** (PR #204): pushes from two listed projects with the same repository name are titled with the project name (D83); `braid board --demo` has a project `mail` whose reads fail, with screenshots 81 to 83; `Started.close()` also waits for the server's close event (10 s bound); every in-process board test awaits `close()`.
- **0053/B** (PR #214): item worktrees of a listed project go to `~/braid-worktrees/<project name>/`, an unlisted repository keeps its folder name, and worktrees under the old folder stay where they are and are still found by start, clean and the board; `braid projects add` prints a note instead of the warning (D84).

Why: leftovers 2026-11-20-rxvh, -7pcs, -e5gb, -ftvw and -vk6w (the sweep the user chose on 2026-11-21).

Validation: each strand passed the gate, an independent review (cursor / grok-4.6) with a re-check after fixes, and CI on Ubuntu and Windows; the braid branch is green after each merge and after merging `main`.

Open: three leftovers in the inbox. 2026-11-21-jhmo (the demo's `mail` looks healthy on its first read) is in sweep 0059. 2026-11-21-6gvh (listed names that differ only by case share a worktrees folder on Windows) and 2026-11-21-tnqj (an unlisted repository can share a listed project's folder) are new.

Decisions: the user approved the plan (one braid, two strands); approved 0053/B's proposal as proposed (project-name key, old worktrees left in place, the `projects add` note); chose to sweep jhmo, az63 and 1gie into a strand 0053/C, which I dropped before it started because the 0057 coordinator had already taken them into sweep 0059; approved merging `main` into the braid branch with 0053/A's decision renumbered (D80 became D83, because `main` took D80 to D82 meanwhile).
For later items: none.
Needs the user: none.
