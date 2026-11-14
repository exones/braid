What changed: new `.agents/skills/braid-reviewer/` (SKILL.md, agents/openai.yaml, references/stop-cases.md as a third identical copy checked by the docs gate). The skill gives the inputs from the first message, the start (BRAID.md, AGENTS.md/CLAUDE.md, task and parent, `gh pr diff`, confirm the detached worktree is at the head commit and report if the PR moved on), what to check, the blocking bar, an independent Needs the user judgement with evidence, one PR comment in a fixed shape and one `t3_thread_send` message; it never commits, pushes, edits, merges or approves. `braid` "Accept and hand over" step 1 now launches the reviewer with a three-line first-message template; a re-check adds one line; `assets/review.md` is deleted. The BRAID.md template, this BRAID.md, AGENTS.md (Where to look, providers) and the README name the skill. New Pester test installs this repository's HEAD into two temporary targets (exactly braid, braid-reviewer, braid-worker, stamped) and then removes braid-reviewer and braid-worker once they leave the ref.

Why: one review bar and report shape for any model, and an independent stop-case check for auto mode (TASK-1.3).

Line counts: braid/SKILL.md 124 -> 130; braid/assets/braid-md.md 40 -> 40; braid/assets/review.md 13 -> deleted; braid-reviewer/SKILL.md new, 41; braid-reviewer/agents/openai.yaml new, 6; braid-reviewer/references/stop-cases.md new, identical copy.

Validation: `npm run verify` passes; Install-Skills Pester suite 8/8.

Open: none.

For later items: the reviewer comment heading is `**Review of <task-id> at <short sha>** — blocking | not blocking` with Blocking, Suggestions and Needs the user lines, and the coordinator message carries blocking or not, the Needs the user line, the reviewed commit and the comment link; TASK-1.3 can read these. The BRAID.md template now writes the skill as `; skill <name>` after the options (the old `skill: <name>` put a colon inside a YAML value). The new Pester test lists this repository's braid-* folders exactly, so a new braid skill must be added there.

Needs the user: process: changes braid skills, BRAID.md, AGENTS.md and the BRAID.md template, as the task asks.

Review of PR #48: not blocking; its three suggestions applied (template without the re-check line, never edits any file, shorter wording).
