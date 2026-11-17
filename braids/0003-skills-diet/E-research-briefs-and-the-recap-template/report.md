Research briefs: the brief template (`assets/brief.md`) now has a line under "Expected size" for spikes and stories with research (how wide to look, read each source, record it in `sources.md` in the item folder, name it in Completion) and an optional Completion box for `sources.md` (link, how it was read, what it says, adopted or not and why). The worker's spike line (`braid-worker/SKILL.md`) points to that file and says not to cite a source not read.

Recap template: `braid/SKILL.md` no longer repeats the 8-field skeleton that `braid handover` prints (checked in `src/commands/facts.ts`). It says the draft has every field and lists only what the coordinator adds: context first, exact steps under "You", growth and plan changes in Decisions, Deviations, Next, screenshots for `ui`.

Why: 0003/B's first research named four sources, one unread, because its brief only said to name sources; the recap skeleton duplicated the draft (found by 0003/A).

Word counts (before → after): braid/SKILL.md 2970 → 2871; assets/brief.md 706 → 780; braid-worker/SKILL.md 1455 → 1486. Net +4 words: the research asks (+104) cost slightly more than the recap cut (-99).

Validation: `npm run verify` passed (179 tests); `braid check` OK.

Decisions: the sources file is named `sources.md`, optional box so non-research items skip it.
For later items: none
Needs the user: process: skill wording changed in 3 skill files, as the user asked; review the wording.
