---
id: '0084/D'
title: "Docs: Several open questions per item"
status: To Do
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0084/A', '0084/B', '0084/C', '0084/E']
order: 40
---

## Goal

Read everything 0084 changed, from 0084/A on, and bring the docs from BRAID.md `docs` up to date as a whole, together with the braid skills' lines that state the old rule ("a new question replaces your open question on the item").

Expected size: about 120 lines in 9 files.

## Start here

- The braid's log and every strand's report in `braids/0084-several-open-questions-per-item/`.
- `docs/braids-format.md` "Requests" ("An item has at most one open question per asker ..."), `docs/cli.md` rows `braid ask`, `braid answer`, `braid withdraw`, `braid handover`, `docs/board.md` (the PM's own requests, the card, the Questions panel, notifications), `docs/decisions.md` D96 and D118, `docs/roadmap.md`, `README.md`, `docs/getting-started.md`, the CLI help in `src/cli.ts`.
- `.agents/skills/braid/SKILL.md` "Talking to the user" ("A new question replaces your open question on the item, a wait your wait on that braid") and "Sweep" step 2 ("a new question replaces it"). Search `.agents/skills/` for any other line that relies on the old rule (`rg -n -i "replace" .agents/skills`).

## Change

- The docs listed above, where they state the old rule or the board's one-question view.
- `docs/decisions.md`: a new decision for several open questions per item, naming what it changes in D96 (a question no longer replaces a question) and why (the user, 2026-11-27).
- `.agents/skills/braid/SKILL.md` and any other skill line found: a new question no longer replaces one; to replace your own, withdraw it (`braid withdraw <handle> --why`) and ask again; with several open, answer and withdraw by handle. Change only the words that are wrong and add no sections ("don't overblow skills").
- `.agents/skills/braid/SKILL.md` "Talking to the user": one line that a request the user dismissed (Dismiss, `braid answer --dismiss`, 0084/C) is asked again only when it is still needed, saying what changed (the user, 2026-11-28).
- Docs for Acknowledge and Dismiss (0084/C): `docs/board.md`, `docs/cli.md` (`braid answer --ack|--dismiss`), `docs/braids-format.md`.
- `report.md`: each doc and skill file checked, as updated or unchanged.

## Already decided

- Read the braid brief `braids/0084-several-open-questions-per-item/brief.md` "Already decided": it is binding.
- The skill edits are part of the user's goal ("A coordinator that wants to replace its own question withdraws it explicitly"). Per AGENTS.md the user merges skill changes: this PR is handed over through the PM, not merged under the preset.

## Out of scope

- Any product code.
- Skill changes beyond the old rule and the dismissed-request line.

## Completion

- [ ] Every doc from BRAID.md `docs` and every skill line that states the old rule is updated; report.md lists each file checked, as updated or unchanged
- [ ] `docs/decisions.md` has the new decision
- [ ] The Pester suites (`pwsh -NoProfile -File scripts/Test-Pester.ps1`) and the gate command from BRAID.md pass
- [ ] report.md written: what changed, why, validation, anything open
