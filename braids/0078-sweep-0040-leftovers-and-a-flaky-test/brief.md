---
id: '0078'
title: "Sweep: 0040 leftovers and a flaky test"
status: In Progress
labels: ["kind:task", "tier:M", "sweep"]
dependencies: []
related: ['0060', '0072', '0074']
delivery: epic
autonomy: free
---

## Goal

Programme pm/autonomous-dev-machine, row P15, for the team: empty the 0040 leftovers and the leftovers routed here, remove dead shims, make the gate lighter and its PowerShell tests Pester, fix two tests that can harm the repository or fail at midnight UTC, and split docs/decisions.md into current rules and history with per-braid decision ids.

## Taken from the inbox

Each was checked against `main` at 90c3d68 (2026-11-25); all are still open there.

- 2026-11-24-es8z (review 0071/F, PR #288 comment 7118981578): test/cli.test.ts:45 "every command named in the help is known to run" runs `run([name, "--nope"], root)` in the braid repository itself and imports dist/cli.js, which runs `main` on load; it also skips by name the commands `main` handles before `run`, so no check covers those. → 0078/E.
- 2026-11-20-6ce8: the expected log file name is built from `new Date()` after the command ran, so a run across 00:00 UTC fails; now test/done-merge.test.ts:21 and :23 (moved from done.test.ts). → 0078/E.
- 2026-11-24-l7dw (idea, Fable's review), the parts routed here: the shim sweep (the per-read requests.json migration; old shapes: the `done` alias, pre-0053 worktree folders, old headings; import-backlog, ~500 lines, if no project is on Backlog.md) → 0078/F; `fresh` always true → P24 (Already decided); the gate: test/fixtures/oidc-release/Test-OidcReleaseGuard.ps1, 685 lines with a hand-written YAML reader over release.yml on every quick verify → 0078/B; 2,518 lines of hand-written PowerShell harnesses under test/fixtures to Pester (AGENTS.md: they convert), and the ~220-line CR and trailing-whitespace byte scanner in scripts/Test-DocsGate.ps1 → 0078/A.
- 2026-11-19-diq9 (0040/D): the recap shows the report.md Decisions placeholder above the `Decided:` lines (src/commands/facts.ts:192); `braid help` and the braids-format recap bullet don't mention `Decided:` entries; no test for a strand-only recap. → 0078/D.
- 2026-11-20-w5cd (0040/E review): (1) the reviewer reads the preset from `origin/<base>` while `braid autonomy` follows live copies, so a story or final PR into main can loosen the preset it is judged by; (2) tier S independent review is in merge condition 3 while the skill still says "S: read the diff yourself"; (3) `braid autonomy` and `braid decisions` refuse a strand id; (4) the digest's `--since <date>` repeats that whole day. (1), (3), (4) → 0078/D; (2) is a skill change, out of scope.
- 2026-11-20-gj9u: docs/decisions.md D47, D57 and D68 still describe auto mode in the present tense after D74 replaced it (D66 already carries a superseded note). → 0078/H.
- 2026-11-22-t7ap (0068, PR #250): `braid wait <number> --timeout 0.25` sleeps POLL_MS (15 s, src/commands/wait.ts:206) after a non-terminal first poll; add `--once` (one read, then answer), and exit 1 instead of 3 when that read already names a failed check. → 0078/C.
- 2026-11-23-hjof (PR #273): `braid requests` commits the one-time carry-over of `.braid/requests.json` to the local braid-requests branch without pushing; docs/cli.md:45 says only that it fetches. → 0078/F, with the carry-over itself.
- 2026-11-23-5vky (0064, PR #251): `braid pause --window <id>` without `--until` is refused unless the verdict is `pause` (src/commands/pauses.ts:50), while docs/cli.md:21 reads as if `--window` alone pauses. → 0078/C.
- 2026-11-23-uanu (review 0069, PR #263 comment 7091966796): docs/board.md:421 writes a handover push title as `In Review` where the push says `To Review` (LANE_LABEL, src/board/marks.ts) → 0078/G; the `notify send` usage line (src/cli.ts:86) names exit 0 only for off or not set up, not for a failed send → 0078/C.
- 2026-11-23-cbe9 (PR #263): when one merge leaves the PM's group of merges waiting for the user, the board resends the group push under the same sequence id, and the phone alerts again for a shrinking list (src/notify/message.ts:135-152, src/notify/notifier.ts); a shrink-only update should be quiet. → 0078/G.
- 2026-11-23-cft5 (PR #263): a stored Done whose PR lookup missed, its review with the PM or forwarded under a programme, reads In Progress on the card where docs/board.md:27 (lane rule 1) says To Do (src/board/model.ts: derive, heldReview). → 0078/G.
- 2026-11-23-mchu (PR #263): `braid notify send` without `--programme` uses the sequence id `braid-<repo>-pm---send` (src/commands/notify.ts:68, `pm/${slug ?? "-"}#send`). → 0078/C.
- 2026-11-25-2hkx (0072/A, PR #313), added at the PM's request after the plan (2026-11-25): the two multi-process lock tests in test/requests.test.ts fail every loaded local gate on this machine while CI passes them. → 0078/J, run first.
- 2026-11-25-skgh (0078/J, PR #332), added at the PM request (2026-11-26) after its live check of PR #335 saw lock holds of 30.26 s against the 30 s stale time: a live holder can lose its lock. → 0078/L.
- 2026-11-24-vwv0 (idea, Fable's review), the part moved here by the user's "a" (2026-11-25): docs/decisions.md is 121 KB with supersession chains inside table cells and a dated log restating the rows; split it into current rules and history; per-braid decision ids end the number clashes (D100/D101 between 0071 and 0073 needed 0073/H). → 0078/H.

## Already decided

- Programme-wide (the user): "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". 2026-11-22: "The 0040 sweep (P15) as proposed."
- No change to `.agents/skills/`, AGENTS.md, CLAUDE.md or BRAID.md here: the user hasn't asked for one. Where a fix would need one, the strand stops short of it and its report names it for a leftover.
- `fresh` always true (l7dw) is board read code (src/board/feed.ts, src/board/inputs.ts, src/commands/board.ts) that P24 (0077) (The board stays fast under load) rewrites with its git runner and caches; the PM moved it to P24 (q-nnx1, 2026-11-25).
- Related to 0074 (The board pauses and resumes reliably, `braid/0074-the-board-pauses-and-resumes-reliably-no`), 0072 (Questions say what they unblock, `braid/0072-questions-say-what-they-unblock`), 0060 (Workers as T3 subagents, `braid/0060-workers-as-t3-subagents`) and P24 (0077, The board stays fast under load, `plan/board-fast`): all merge into main before 0078 (order 0074, 0072, 0060, P24, 0078). A strand that touches their files starts only after they merged into main and main was merged into the braid branch: 0078/E after 0060 (test/cli.test.ts, test/done-merge.test.ts); 0078/F after 0072 (src/braids/requests.ts, src/commands/requests.ts); 0078/G after 0074, 0072 and 0060 (src/notify/notifier.ts, src/notify/message.ts, src/board/model.ts); 0078/H after the docs strands of all four (docs/decisions.md). 0078/A to 0078/D touch none of their code and run now; shared docs (docs/cli.md, the usage lines in src/cli.ts) conflict only by line.
- Per-braid decision ids: new decisions are numbered `D<braid>.<n>` (`D0078.1`), unique without a shared counter; D1 to the last plain number keep their ids and anchors. Confirmed by the PM with the plan (q-nnx1, 2026-11-25).

## Out of scope

- w5cd (2), the braid skill's "S: read the diff yourself" against merge condition 3: a skill change the user hasn't asked for; it stays a leftover.
- `fresh` (Already decided) and the other l7dw consolidations (one BRAID.md reader, one CLI table, one git runner): P24 or later.
- New features, and any change to how requests, pauses or the board decide beyond the leftovers listed.

## Completion

- [ ] Every entry under "Taken from the inbox" is fixed, or `report.md` says why it was dropped
- [ ] The quick gate no longer runs the 685-line release guard or the hand-written byte scanner, and the PowerShell harnesses under test/fixtures run as Pester suites
- [ ] The help-command test runs in a temporary repository, and no test depends on the UTC date changing while it runs
- [ ] docs/decisions.md holds the current rules, the history lives apart, and new decisions get per-braid ids
- [ ] Docs from BRAID.md `docs` that this braid makes untrue are updated (0078/I)

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
