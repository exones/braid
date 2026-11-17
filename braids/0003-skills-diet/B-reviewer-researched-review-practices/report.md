# Report: reviewer, researched review practices

## What changed

`.agents/skills/braid-reviewer/SKILL.md`, Check section only: five lines added to the base. The blocking bar and the stop cases are untouched.

- **Read around the diff**: whole changed functions, their callers, docs and decisions made stale.
- **Failure paths**: empty or missing input, errors (also swallowed ones), a second or concurrent run, Windows against Linux.
- **Test the tests**: would each new test fail on the old code; assertions that can't fail.
- **What a finding is**: a code finding names the input and the wrong result. A likely blocking problem the reviewer couldn't confirm stays Blocking, marked so, unless a run disproves it; "unverified" is for weaker suspicions, in Suggestions.
- **What to leave out and what to admit**: skip style and preexisting problems; a repeated problem once with all its places; say what you could not check.

New file `research.md` in this folder: 23 sources, each with a link, how it was read, what it says, and adopted or not and why.

## Why

The first version rested on four sources, one not retrieved and one misdescribed, and its "about 90% sure" bar could move a likely bug out of Blocking. The second pass read the sources and changed three things:

- **No percentage.** The gate is evidence (the input and the wrong result), not a self-estimate. Greptile found a model's rating of its own comments "nearly random"; OpenAI's and Anthropic's prompts ask for the concrete scenario.
- **Blocking-class suspicions are kept.** Benchmarks show AI review misses most real bugs (best recall about 33% in CR-Bench) and that pushing for silence loses security bugs first. braid's reviewer posts one comment sorted by a blocking bar, so it has no noise problem that a floor would solve.
- **Read around the diff** is new. It is the largest single cause of wrong findings in SWR-Bench (48%) and the main difficulty reviewers report in the Microsoft study; it also absorbs the old "what the diff left out" bullet.

From the review of this PR: the two repeated clauses ("risky paths left untested", "or run it to settle it") are gone, and the source notes it corrected are fixed in research.md.

## Sources

Full list with links and verdicts: [research.md](research.md). In short:

- Vendor prompts, read in full: Anthropic's `code-review` plugin, `pr-review-toolkit` agents and `security-review` command; OpenAI Codex's review rubric and sample review skill.
- Vendor write-ups: Anthropic's Code Review documentation, Cursor (Bugbot), Greptile, Cubic, GitHub (Copilot review), Agent Patterns.
- Human review: Google's Engineering Practices reviewer guide (four pages, in full), Conventional Comments, Linear.
- Studies: Bacchelli and Bird 2013, Czerwonka et al. 2015, Sadowski et al. 2018 (papers read); SWR-Bench and CR-Bench (pages read); three more from their abstracts only, marked so.
- Not used and said so: OWASP's guide (only a landing page loaded), postmortems (no primary report found), and the two sites the first report cited from search summaries.

## Word count

`braid-reviewer/SKILL.md` by `wc -w`: 447 before this item, 547 after the first version, 555 now (+108 against the base, +8 against the first version). Five lines added to the base file.

## Validation

`npm run verify` (the gate) passed locally before the push; CI on the PR runs it on Ubuntu and Windows. No test reads the skill's wording. `braid check` passes.

## Open

- The wording is the user's to accept.
- "say what you could not check" is the one addition the review did not ask for. It is seven words, backed by four sources; drop it if it doesn't earn its place.

For later items: research.md lists what was not adopted because it needs machinery (a second validating reviewer, merging several independent reviews, learning from the user's verdicts on past findings); the second is the cheapest to try if reviews keep missing things.

Needs the user: process: the braid-reviewer skill wording changes (`.agents/skills/braid-reviewer/SKILL.md`, Check section); the user reviews and merges it.
