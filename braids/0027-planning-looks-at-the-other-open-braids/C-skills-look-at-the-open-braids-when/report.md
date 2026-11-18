The braid skill's Plan now looks at the other open braids before drafting briefs.

- `.agents/skills/braid/SKILL.md`, "Plan": a new step 3, "Look around": `braid list --open`, read the briefs (`braid view`) that touch the same commands, files or decisions, and judge each as overlap without conflict (`related` plus an "Already decided" line on what is shared and how the two stay apart), one needing the other's result (a dependency if the id resolves, else a line to start after the other merges), or duplicate or contradiction (`related` and a `scope` warning in the plan request with the other braid's id, title, branch, the conflicting text and the four options; the plan is drafted anyway and the user's answer goes into the braid's log). It says never to edit another braid's brief for a link (`braid view --links` shows that side). Later steps renumber 4 to 8; the Sweep's "Plan, step 5, Story" reference is now step 6.
- The plan shown to the user (now step 6) lists related braids and leads with any warning from step 3. Context first is not repeated there: the skill's general "Context first" rule covers it.
- `.agents/skills/braid/assets/brief.md`: `related` under "Fields", `--related 0025` in the "Create" example, and a template "Related to ..." line under "Already decided".
- `docs/decisions.md`: D62 and its log line, since the user's plan decided this behaviour (no other open branch holds D62).

Validation: `npm run verify` passes (284 tests); `braid check` OK. Text-only change; reread the Plan section in full for numbering and cross-references (`rg 'step [0-9]'` over `.agents/`).

Decisions: the warning carries the `scope` stop-case key, as stop-cases.md files a goal that duplicates agreed work there; D62 added for the decided behaviour.
For later items: none
Needs the user: process: the braid skill's Plan changes (a new Look-around step, steps renumbered); the user merges skill changes.
