# Report: 0020/D Skills: route gaps to the inbox and sweep in batches

## What changed

- `.agents/skills/braid/references/workflow.md`: a new section "Gaps and the inbox", the one place for every role: the two kinds, the routing table from the braid's brief, how to write a self-contained leftover (title, what, where, why, `--from`, `--ref`) with one `braid note` example, and that ideas are never proposed. "One writer per branch" names `braid-inbox` as the exception, written only by braid commands.
- `.agents/skills/braid/SKILL.md`:
  - Ground rules: "Side ideas get a home" is replaced by "Gaps go by the table", linking the workflow.
  - Plan, new step 1: before planning a braid, propose a sweep if a leftover is open; an idea becomes braids only on the user's request, then `braid inbox take <idea> --into <ids>`. Later steps renumbered (no reference used the old numbers except my own).
  - Accept and hand over: review step routes non-blocking findings by the table; new step 4 **Capture** before the handover (non-blocking findings with `--from 'review <id>'`, the report's unfinished bits and `For later items:` gaps with `--from <id>`); notes for later strands stay in the log line, which names the entry ids.
  - New section "Capture": `braid inbox --no-fetch` before the first capture, the setup reference if it fails; the user's side observations captured at once (an idea as `braid-idea` writes one, or a leftover).
  - New section "Sweep": when (a recap with `Sweep due`, or before planning with at least one leftover), propose with `braid ask --kind decision` (one `kind:task` story labelled `sweep`, what goes in, what is dropped and why, a big one becomes its own braid or an idea, optional fold into the braid being planned), record with `take`/`drop`/`pass`, run after the current braid, one pending at a time; auto mode never decides one.
  - The sweep's `braid ask` never goes on an item whose handover request is open, since a new request replaces it: a strand's sweep is asked on its braid, a lone story's after its merge, and before planning in the plan request of the braid being planned.
  - Finish: the final PR's "Accept and hand over" list names the capture step too.
  - The recap keeps the draft's `Sweep due` line and never lists entries or ideas.
- `.agents/skills/braid/assets/brief.md`: the braid log line's `For later items:` names notes for later strands and the captured entry ids; the report's line splits notes for later strands from self-contained gaps.
- `docs/decisions.md`: D56 and its log line; D33 now says the skills route gaps to the inbox (D56 replaced "give side ideas a home").

## Why

The braid 0020's plan: gaps stop costing the user a decision each; they are captured by a fixed rule and decided in batches.

## Validation

- Search for rules that contradict the new routing: `rg -n -i "track it|side ide|extended outline|one writer|non-blocking|suggestion|for later|leftover|idea"` over `.agents/`, `README.md`, `docs/getting-started.md`, `docs/development.md`, `docs/roadmap.md`, plus `rg "step [0-9]|After the merge|Plan, step"` for the renumbering. Nothing else conflicts: the worker skill's `For later items:` line and the reviewer's Suggestions stay as they are (the coordinator captures them); README and getting-started don't describe the old rule, so they are unchanged.
- `npm run verify` passes (docs gate with the skills' links, 230 tests).
- Not tried end to end: the installed `braid` comes from `main` and has no `braid note` yet.

## Open

- Size: about 70 changed lines in 4 files plus D56, within the brief's range.
- Review at 27c8b79 (not blocking): its three suggestions are taken (the sweep's request target, D33, capture in Finish).

Decisions: the user's, from the plan: recaps never list inbox entries or ideas, only the `Sweep due` line. Mine: the routing table and the leftover rule live in the workflow (true for every role, per D47), the coordinator's steps in the skill; in auto mode the strands go on while a sweep answer is pending.
For later items: none.
Needs the user: process: changes to the braid skills (`.agents/skills/braid/`); the user reviews and merges them (AGENTS.md).
