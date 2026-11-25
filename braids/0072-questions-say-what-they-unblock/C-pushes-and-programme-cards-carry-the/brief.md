---
id: '0072/C'
title: "Pushes and programme cards carry the whole question"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0072/A']
order: 30
---

## Goal

A push and a programme's card carry the whole question, so the user can act from the phone or from inside a programme without opening a braid: the code, what it unblocks, decide or do; a forwarded merge names the braid, the PR, its head and the PM's note; a programme whose braid has a question for the user shows it and sits in Needs you.

Expected size: about 250 lines in 5 files, tests included.

## Start here

- `src/notify/message.ts`: `needPush` (its title already says "(escalated)"), `pmAskPush`, `mergesPush` (one line per forward: `${f.id} PR #${pr}`), `coded`.
- `src/board/programme.ts`: `Forward` (id, title, need, head), `toProgrammes` and the programme's `section`.
- `web/src/App.tsx`: the programmes panel and a programme's card.
- Leftover 2026-11-23-zcr3, taken in: "The merge push says too little. The push for a merge the PM forwarded reads only '👀 braid 0070: merge PR #273' with the body '0070 PR #273' (src/notify/message.ts mergesPush: one line per forward). It drops the braid's title, the PM's note ('live check passed · merge PR #273 at 4f16c7f'), the head to merge and what the braid does, so on the phone the user can't tell what they are merging or whether it was checked. Body should carry, per merge: id and title, the PM's note (checked or not fully checked), the head. The user, 2026-11-23, with a screenshot: 'just received this low level push'."
- Idea 2026-11-24-32me, taken in: "Programmes panel: show the requests of a programme's braids on the programme card. The user, 2026-11-24: an escalated question (dctl-studio 0011/E, q-vvb7) showed on the braid's card in Needs You, but nothing on the programme card, and 'usually I don't want to go to the braid worker when I work inside a program'. A programme card with an open or escalated request of one of its braids shows it, with the code, and the programme moves to Needs You; answering in the PM thread is enough."
- Idea 2026-11-24-s9sr (0072/B has its text): the push says "Escalated to you" too.

## Change

- **Mockups first** (the `ui` label): the push texts (a strand question, an escalated one, an `action`, one and two forwarded merges) and a programme card with a braid's escalated question, on test data. Stop and report them; build only after the user's verdict, through the coordinator.
- Need pushes add what the request unblocks and decide or do to the body; an escalated one says "Escalated to you".
- The forwarded-merge push, per merge: code, id and title, PR and head (short sha), the PM's note; the key and sequence ID stay as they are, so nothing unchanged is sent again.
- The programme card shows each open request of its braids that is the user's (escalated, forwarded, or addressed to the user) with its code and what it unblocks, and the programme is in Needs you while one is.
- Tests for each push text and the programme card.

## Already decided

- Related to 0074: 0074/D adds a Resume button to the programme card in `src/board/programme.ts` and the web panel. Before starting, merge `main` into the braid branch if 0074 has merged by then, so this strand builds on it; otherwise keep the change there small and expect a merge at the final PR.

## Out of scope

- The braid's own card and the details panel (0072/B). Pause, limits, Resume (0074).

## Completion

- [ ] Mockups shown and approved before building (log entry with the verdict)
- [ ] Need pushes say what the request unblocks and decide or do, and an escalation "Escalated to you", with tests
- [ ] The forwarded-merge push names the code, braid, title, PR, head and the PM's note, without re-sending an unchanged push, with tests
- [ ] A programme card shows its braids' requests that are the user's and is in Needs you while one is open, with tests
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
