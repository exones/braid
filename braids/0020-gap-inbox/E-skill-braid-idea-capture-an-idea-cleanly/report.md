# Report: 0020/E Skill braid-idea: capture an idea cleanly

## Proposal (waiting for the user's verdict)

The draft skill is `.agents/skills/braid-idea/SKILL.md` on this branch. Below: what it would write from three one-sentence inputs, using this repository's braids.

### 1. A clear input

> `$braid-idea braid recap should say how long the item took, from braid start to green CI`

No question; the skill reads `braid view 0014` (recap) and writes:

```markdown
Recap shows how long an item took

`braid recap` would add one line with the time an item took, from `braid start` to the
first green CI run on its PR. The user sees at a glance which items ran long.

Related: 0014 braid facts, recap and merge; 0008 Coordinator commands (braid start)

Open questions:
- Wall time, or also the agent's active time?

In the user's words: "braid recap should say how long the item took, from braid start to green CI"
```

### 2. A vague input

> `$braid-idea something to make reviews cheaper`

"Cheaper" could mean money, time or the user's attention, and the idea is different for each, so the skill asks once:

> Cheaper in what: the reviewer model's cost, the time a review round takes, or your own attention on reviews?

User: "the cost, grok-4.6 on high for a two-line fix is overkill". The skill writes:

```markdown
Cheaper reviews for small changes

A small PR (a few lines, a task or tier S) would get a cheaper review than a large one:
a lighter model or a lower effort, instead of the reviewer from BRAID.md for every PR.

Why: a full high-effort review of a two-line fix costs more than the change is worth.

Related: BRAID.md `models.reviewer`; .agents/skills/braid-reviewer/SKILL.md

Open questions:
- What counts as small: lines changed, tier, or kind?
- Skip the review altogether for the smallest ones?

In the user's words: "something to make reviews cheaper", then: "the cost, grok-4.6 on high for a two-line fix is overkill"
```

### 3. An input that touches existing braids

> `$braid-idea from the phone I want to start the next item, not just look at the board`

The skill finds 0012 (Board on the phone, Outline: read and act over Tailscale) and 0009 (Board actions), and states how the idea relates to them instead of repeating them:

```markdown
Start the next item from the phone

From the board on the phone, the user would start the next item (the action behind
`braid next` and `braid start`), not only see the lanes. 0012 plans the phone layout and
safe actions over Tailscale; this idea says starting an item is the action that matters
most there.

Related: 0012 Board on the phone (Outline); 0009 Board actions; 0008 Coordinator commands

Open questions:
- Should it start the worker thread too, or only mark the item and wait for a coordinator?

In the user's words: "from the phone I want to start the next item, not just look at the board"
```

## Choices in the draft for the user to judge

- Shape: title, restatement, `Why:`, `Related:`, `Open questions:`, the user's words. Empty sections are left out.
- When the user answered a question, their answer is quoted too, after "then:".
- Step 1 runs `braid inbox --ideas --no-fetch` (quick, offline) as the check that `braid` is new enough.
- The skill doesn't research solutions; it reads only `braid list`, the touched briefs and the named files.
