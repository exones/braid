---
id: '0084/F'
title: "Ship 0084/A to main early"
status: Done
labels: ["kind:task", "tier:M"]
dependencies: []
order: 15
---

## Goal

Ship 0084/A's change (several open questions per item on the record and in the CLI: `braid ask` no longer withdraws the same asker's earlier question) to `main` early, as one small follow-up PR into `main`, so users get it before the braid's final PR. The user decided it (wild-mango-ccj4, 2026-11-28: "A. Ship A early, then tell coordinators"), the way braid 0078 shipped its lock fix as PR #384.

Expected size: 0084/A's diff (about 290 lines in 16 files, outside `braids/`), plus any small fix the board needs.

## Start here

- 0084/A's change: `git diff 98cf3714 797b49d8 -- . ':!braids'` (PR #374, merged into the braid branch; reviewed not blocking: https://github.com/exones/braid/pull/374#issuecomment-7232725103). Its report: `braids/0084-several-open-questions-per-item/A-several-open-questions-on-the-record-and/report.md` on `braid/0084-several-open-questions-per-item`.
- `main` now has 0077 (The board stays fast under load) with new board read paths and request-record writes (`src/braids/requests.ts`, `src/braids/gitbranch.ts`); 0084/E merged it into the braid (PR #385) and found conflicts only in `test/requests.test.ts` (imports) and `docs/decisions.md` (D121 beside main's slug decisions).
- The board keeps one request per item and asker: `src/board/signals.ts` (`requests`, `asks` maps, the later request wins), `src/board/model.ts` (`routing`, `derive`), `src/board/questions.ts`, `src/board/programme.ts`, `src/notify/` (one push sequence per item), `src/board/wake.ts`.

## Change

- This strand's branch is cut from `origin/main`, not from the braid branch. Apply 0084/A's change outside `braids/` onto it (cherry-pick or apply the diff), resolving conflicts against `main` as 0084/E did. The PR goes into `main`.
- No `braids/` files and no mockups in this PR: write no plan, log, report or box on this branch. Your report is your final message; the coordinator records it on the braid branch.
- The board as it is in `main`, with several open requests on one item: check that it stays sane, even though it shows only one per card until 0084/C. Fix only what breaks: a crash, a request lost from every view (the CLI's `braid status`/`braid requests` still list it), a wake or push that fires wrongly or never for one of them, a stall or lane that reads wrong because of a hidden request. Name each check and its result in the PR description. Known and accepted until 0084/C: a card shows the newest question per asker; a question asked after a `review` request hides that review's Merge button on the card.

## Already decided

- Read the braid brief `braids/0084-several-open-questions-per-item/brief.md` "Already decided" on the braid branch: it is binding.
- The user (wild-mango-ccj4): branch from `origin/main`, only 0084/A's change, no `braids/` files and no mockups; focused tests plus the gate, then CI green and a review; then the coordinator hands it to the PM, who live-checks it and brings it to the user to merge.
- If 0084/A's change depends on something only the braid branch has, or doesn't separate cleanly, stop and report what you would ship instead; don't widen the PR.

## Out of scope

- The board showing several questions per card, the Acknowledge button, pushes per question (0084/C).
- The skills' text (0084/D).

## Completion

- [x] A PR into `main` from this branch carries 0084/A's change and nothing from `braids/`
- [x] 0084/A's tests (`test/requests-several.test.ts`, the replacing-rule tests) pass on it
- [x] The board with several open requests on one item is checked as under Change, each check and its result in the PR description, and anything that broke is fixed with a test
- [x] The gate command from BRAID.md passes
