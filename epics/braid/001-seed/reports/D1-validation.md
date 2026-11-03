# D1 candidate validation

Date: 2026-11-03. Coordinator-owned. Status: D1 Done. Bounded fresh planning proof accepted. Independent review reported no findings on the merged proof head.
Candidate policy: `da4792a485f45f54b0f0b912d3df62a2a484bdf0`, [PR #4](https://github.com/exones/agento/pull/4), merge `3a46c9e10399502fe1b9c27aa0840632d3da8c66` at 2026-11-03T18:40:03Z.
Reviewed and merged proof: `d22b4bbccd4f38f6fb66c1e03c4cc56570060036`, [PR #5](https://github.com/exones/agento/pull/5), merge `ecf0d7c0f4cb717e63b469ce0bd9625c12d2ee74`.

## Inspection and boundaries

Read the actual worker report/checkpoint and implementation diff. The workflow defines backlog naming centrally; the skill reads it before assigning IDs, and both planning templates link there. Existing IDs, review naming, and the separate epic are preserved. No product/package/script/workflow input changed. Worker local skill/link/formatting results remain distinct from hosted CI, independent review, and behavioral proof. Coordinator `git diff --check` passed on the returned clean candidate.

## Hosted CI

Verified PR #4 still points to exact `da4792a485f45f54b0f0b912d3df62a2a484bdf0`. [PR run 41695094058](https://github.com/exones/agento/actions/runs/41695094058) succeeded on Windows and Ubuntu; push run 41695084289 also passed. GitHub reports no merge conflict. This is hosted verification evidence, not independent review or planning-behavior acceptance. No code/instruction changes since the tested candidate; only coordinator status/evidence edits are pending locally.

## Fresh planning exercise

Requested goal: “Plan a small documentation improvement so a new contributor can find prerequisites, complete a first local run, and troubleshoot common setup failures. Check which existing commands are safe to document. Planning only.”

Run a fresh inherited Sol High session in a tool-created isolated worktree at the candidate. The prompt supplies no expected IDs and no prior findings or proposed solution. It routes through normal project planning instructions, limits writes to `validation/D1-fresh-plan/`, and excludes production epic/backlog reports to avoid seeding the answer from this story. Retain generated artifacts, exact revision, consulted sources/read-write inventory, checks, and preservation evidence. No product execution, implementation, installation, Git writes, external actions, or subagents. These are validation artifacts, not adopted production work.

Result: accepted for D1 criterion 5 within the following limits. The fresh inherited Sol High session used exact `da4792a` in `C:\worktrees\agento\t3-8a92b62a`. The coordinator read the original task through the completed thread and inspected the actual generated epic, three backlog items, command audit, research report, checkpoint, validator, inventory, check results, and preservation snapshots.

It independently produced `A-find-prerequisites.md`, `B-first-local-run.md`, and `C-troubleshoot-setup.md`, with matching epic rows, dependency references, and future `reports/A.md` / `checkpoints/A.md` paths (and B/C equivalents). Planned review names follow the existing convention and do not consume backlog IDs. The prompt did not supply these IDs or filenames. The session discovered/read the coordinator skill and canonical workflow; its read inventory excludes production D1 reports and the separate epic.

All 12 outputs were initially copied with SHA-256 equality to [the validation root](../validation/D1-fresh-plan/epic.md). Staged whitespace checking then rejected mixed CRLF/LF in `evidence/checks.json` and `evidence/preservation-after.json`. Only CRLF-to-LF normalization was applied to those two retained copies; the original worktree artifacts remain intact and the other ten files retain exact bytes. JSON values are unchanged.

| File | Original SHA-256 | Retained LF SHA-256 |
| --- | --- | --- |
| checks.json | `9FF59FEE0430B5ACAB9B99C09BDC3A85341DA0DA19BCC07AEC15FBE4EBEC3A6C` | `2DBEEF193F295B6648EBD607C9971DDDDC94F25804A53F401D35C3E0DCC9B547` |
| preservation-after.json | `68F8ADC2414C1073B952EA8BF7AAB8055F01A9F50003EDF9B7BD0B381A6A496B` | `FA769DF2EEEC68CD811AB14D4A458A9189EF939AB778103668207ED100862EF9` |

[Research](../validation/D1-fresh-plan/reports/research.md), [inventory](../validation/D1-fresh-plan/evidence/inventory.json), and [machine checks](../validation/D1-fresh-plan/evidence/checks.json) preserve the source context. The exercise reports 111 relative links and seven anchors checked. The coordinator independently confirmed source HEAD, zero tracked/index diffs, and index hash `C23ABF7A58C188EDA42AEB589CD9AAAA8CB4A83F9B6F0DFDCD627E2D46593429`, matching the before/after evidence. Source status contains only the assigned new validation directory.

The retained validator/results are historical exercise evidence, not an instruction to rerun preservation checks in the delivery checkout or relabel them as a later revision. A/B/C are unapproved plan artifacts, not additional production stories. The scenario covers three stories; it does not independently demonstrate mixed-kind allocation, later insertions, reordering, beyond-Z behavior, every host/model, or automatic UI selection. Those policy cases receive document review; no product/runtime claim is made.

## Review and next gate

Coordinator checks after retaining proof: 160 local links, including 10 anchors across 16 changed/added files, passed. Whitespace checks passed. Policy/skill/product/package/script/workflow content still matches the tested candidate `da4792a`; this successor records evidence/status only.

[PR run 41697190559](https://github.com/exones/agento/actions/runs/41697190559) passed Windows and Ubuntu on exact `d22b4bbccd4f38f6fb66c1e03c4cc56570060036`. Push run 41696892902 also passed. The user then merged PR #5 at `ecf0d7c0f4cb717e63b469ce0bd9625c12d2ee74`. The seed tree of that merge matches the reviewed head.

Independent review `D1-sequential-backlog-ids-review-001`, request `86981c22-ebf5-436b-8fa5-96dd46269b39`, inherited Sol High, isolated checkout `C:\worktrees\agento\t3-e440c117`, checked that same head. It reported no actionable P1, P2, or P3 findings. The coordinator copied [the report](reviews/D1/D1-sequential-backlog-ids-review-001.md) and [the reviewer checkpoint](../checkpoints/reviews/D1/D1-sequential-backlog-ids-review-001.md) with matching SHA-256 bytes: report `39276A468D9B92CDDDF3B9E9A4E7BF24B37EE5A985F7A0DA3FBA8C25498A5F7F`, checkpoint `3F82DCE349AA992F8B12C3DCDD53689B219E17684376A1023FC462AAC5A62F47`. The report names PR #4 as its artifact label; the authoritative checked revision is `d22b4bb`, which PR #5 merged. No finding required a fix, so nothing was rolled back. This agent review is not a formal GitHub approval. No release or stage 2 start.
