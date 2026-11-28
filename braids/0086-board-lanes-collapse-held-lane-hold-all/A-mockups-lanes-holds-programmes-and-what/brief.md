---
id: '0086/A'
title: "Mockups: lanes, holds, programmes and what is left"
status: To Do
labels: ["kind:task", "tier:M", "ui"]
dependencies: []
order: 10
---

## Goal

One HTML page of mockups, `mockups.html` in this strand's folder, that shows every board change of braid 0086 on realistic test data, so the user can approve the design before anything is built. Nothing else is built.

Expected size: one self-contained HTML file of about 800 lines, plus `report.md`.

## Start here

- The parent brief `braids/0086-board-lanes-collapse-held-lane-hold-all/brief.md`, "Already decided": the user's words for each change, binding.
- `braids/0082-the-questions-panel/A-mockups-the-questions-panel/mockups.html`: the latest mockups page of this board (format, light and dark, the inline test-data script). Start from its look and format.
- `web/src/App.tsx`: the lanes (`Board`, `DoneLane`: the collapsed Done strip with its count), the card (`Card`, `PauseLine`, `Actions`, `BraidResume`), the project row (`LaneCounts`), the programmes panel (`ProgrammesPanel`, its "Needs you" and "Working" groups, `ProgrammeCard`). `web/src/Limits.tsx`: the provider chips and the limits panel. `web/src/Questions.tsx`: the Questions panel. `web/src/palette.ts`, `web/src/index.css`: the real colours. The mockups look like this board, not a new design language.
- `src/board/demo.ts`: the board's demo data, for realistic names, braids, programmes and providers. Run `braid board --demo` (after `npm run build`) to see today's board; never open port 7800 or read the real `~/.braid`.
- `src/board/limits.ts` (`ChipState`, `ProviderView`) and `src/braids/limits.ts` (`WindowReading`): what a chip can show today.

## Change

- `mockups.html` in this folder, light and dark, with these frames, each titled with what it shows and a short note on what is new against today's board:
  1. **Lanes at desktop width**, two projects: lanes Needs You, To Review, Held, Working, To Do, Done. Held holds two held braids (one held by the user from the board with a reason and "waits for: the T3 restart", one held by the PM for its programme) and one braid paused for a provider limit ("Claude_Everix session, resumes 13:55"); each Held card says the reason, who held it, since when and what it waits for. The project row's counts show Held apart, and Working counts only braids that work.
  2. **Every lane collapsed and opened**: the same board with Working and To Do collapsed to narrow strips with their counts (as Done is today), and Done opened; how a lane collapses and opens (its header), and that the choice is remembered.
  3. **Phone width**: the lane tabs with Held among them and their counts.
  4. **Hold on a braid's card**: the Hold button (icon-only, words in the tooltip, as the board's buttons are since 0082), the small form it opens (reason, required; "waits for", optional; Hold), the card right after (Holding: "1 of 3 threads answered Held"; who still works, with thread links), then held. Go on a held card, and the card after Go.
  5. **Hold and Go on a programme card**, with its open braids moving to Held.
  6. **Hold all** from the board's header: a confirm with a reason and the projects it covers; then the progress view: per project the threads asked, those that answered "Held", those still working (thread links), and "All held" only when no thread of those braids runs; and Go all.
  7. **The programmes panel**: Needs you, Working, a Held/Paused group (collapsed by default), a Finished group (collapsed by default) shown opened in a second view; a programme whose rows are all done with "Finished? Close it" and a Close button; a closed programme in Finished with who closed it and when.
  8. **The Questions panel**: a request forwarded to the user on a held braid, marked held (and no push: say so in the note), beside ordinary questions.
  9. **Provider chips and the limits panel, as what is left**: chips like "S 85% · W 20%" (no word "left"), the meter starting full and shrinking from right to left to the threshold tick (session 3% left, weekly 5% left in the test data), near, over and paused chips, a tooltip saying "85% left of the session, holds at 3% left, resets 14:10"; the limits panel with the same bars; and the `braid limits` text lines for the same readings, as plain text.
- `report.md`: what the page shows, the design choices you made, and the open questions for the user as lettered options. Include at least: where a held braid with a PR to merge or a question for the user sits (Held, or Needs You/To Review with the held mark); which lanes are open by default; whether a limit pause shows in Held beside deliberate holds or apart within the lane; the Working group of the programmes panel collapsed by default or not (idea l3l3 asked for collapsed).
- Commit the page and the report on your strand branch and push. Then end your run with the report, naming the page's path, and stop: no PR yet. The coordinator shows the mockups to the user; each verdict comes back to you as a message, and you revise until the user approves. Only after the approval, on the coordinator's word, open the PR into the braid branch.

## Already decided

- Everything under the parent brief's "Already decided" is binding.
- The mockups are test data only: no product code, no change to `web/`, `src/` or tests.
- Board buttons are icon-only with the words in the tooltip; Open thread and thread links stay as they are (0082, q-i0ry).
- Hold (one braid, one programme) and Hold all use one mechanism: the hold text goes by code to every thread of the braid that works now and to its coordinator, and the board counts each thread's own `Held:` reply (0086/E, 0086/F). With today's `t3 thread send`, a busy thread gets the text at its next turn, so "still working" is a real state the frames show.

## Out of scope

- Any product code, CLI or record change; any other strand.
- Signing the board in to T3 or interrupting threads through T3 (0080).

## Completion

- [ ] `mockups.html` in this folder shows frames 1 to 9 above, light and dark, on realistic test data
- [ ] report.md lists the design choices made and the open questions for the user as lettered options
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Plan

1. One self-contained `mockups.html` (style and format of 0082/A's page, light and dark, ◐ switch) with frames 1 to 9, all drawn from one inline test-data script: projects `sample` and `api` (names and braids from `src/board/demo.ts`), providers as BRAID.md names them.
2. Recommended design drawn, alternatives named as lettered options in `report.md`.
3. Check the page in `html_preview` (light, dark, narrow), run `npm run verify`, commit and push; end the run with no PR (converge loop).
