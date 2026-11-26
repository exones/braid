Braid 0072 Questions say what they unblock (programme pm/autonomous-dev-machine, P4). Eight strands, each reviewed independently and merged into the braid branch under the `free` preset with the PM-run exceptions. The final PR into `main` is #349.

What changed:

- **0072/A (PR #313):** `braid ask` and `braid requests` say what each request unblocks and whether to decide, do or merge. This is derived at each read from dependencies, Done (merged PRs included) and other braids' waits; nothing is stored (D110). Coordinators may ask `--kind action`. Codes work in any letter case.
- **0072/G (PR #321):** spoken handles (`yellow-bear-5asx`): two words, unique among open requests, plus the q-code's four characters. Every command resolves them loosely and refuses an ambiguous match with its candidates. The record gains one optional field, `words`; the q-code stays the key (D111).
- **0072/B (PR #327):** the board's cards, the details panel's Needs-you box and the Requests tab show the handle and "blocks … · act". A Decided group lists answered questions with the answer, who gave it and when. Escalations read "Escalated to you", and a coordinator's action reads "The coordinator asks you to:". `Need.blocks` and `Need.act` are data for P25 (D112).
- **0072/C (PR #343):** pushes lead with the handle, the blocks line and the question, and an escalation is titled "Escalated to you". The forwarded-merge push names the braid, its title, the PR, the short head, what it blocks and the PM's note. A programme card lists its braids' questions for the user and sits in Needs you (D114).
- **0072/H (PR #345):** `braid answer` on a wait records `met` when its condition holds and refuses otherwise. A wait with no condition is answered by the coordinator. Waits stay out of Decided and `braid decisions` (D115).
- **0072/D (PR #336):** an answer recorded outside the asking thread (the PM's own, or the user's that the PM records) wakes the asker once from the record. The delivery mark is an existing `reminded` event, so the stored format is unchanged (D113).
- **0072/E (PR #347):** the braid skill makes the coordinator recap an answer in one line and then act. Under a PM, the coordinator takes the PM's answer from the board's wake. The braid-pm skill records the PM's answers and the user's answers given in its thread. `.agents/skills/` has 7 fewer words net.
- **0072/F (PR #348):** the docs and CLI help are true as a whole for 0072 (D116: recap, then act).

Every box of the braid holds. None is left open.

After 0074 merged into `main`, `main` was merged in at 3217744: three one-line conflicts (README.md, docs/braids-format.md, src/board/programme.ts) were resolved by keeping both sides, and 0072's decisions were renumbered D110 to D116 after 0074's D107 to D109.

Validation: every strand passed CI's `verify` on Ubuntu and Windows. The local gate failed only on the two multi-process lock tests under load (leftover 2026-11-25-2hkx, fixed by 0078/J); for B, C, D and H, CI's `verify` counted as the gate's evidence by the coordinator's decision. E and F passed the full local gate.

Open:
- The roomy question card (context, options, Custom answering) moved to P25 "The Questions panel", by the user's decision.
- The built board still has no dark mode.

Decisions: the user's and the PM's answers and the coordinator's own are in `braid decisions 0072`. The plan was approved (q-488f). 0072/G was added and refined by the user through the PM (spoken handle, one piece). The B mockups were approved at their original size, with the roomy card left to P25 (q-zctf, q-pwcu). The C mockups were approved, with the PM's note and head allowed in pushes (q-u89t, a security case decided by the user). Sweep: not now (q-6fnk). D ran before C (the PM). H was added at the PM's request. Coordinator's own: gate evidence on CI for the lock-test flake; G and H over their expected size within their briefs; no-condition waits answered by the coordinator.
For later items: leftovers 2026-11-25-g9as, 7s0b, 2hkx, 2026-11-25-1onw, 2026-11-26-ynd1, kmi7, s63d, u562.
Needs the user: process: `.agents/skills/braid/SKILL.md` and `.agents/skills/braid-pm/SKILL.md` changed (0072/E); AGENTS.md makes skill changes the user's to merge, so this PR into `main` needs the user's own merge.
