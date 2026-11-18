---
name: braid-idea
description: Capture the user's idea for later as a short, clean note in the project's braid inbox (braid note --idea). Use when the user starts a message with $braid-idea, or asks to note down or remember an idea for later; not for planning, starting or running braids.
---

# Braid idea

Write the user's idea down well, so it isn't forgotten, and stop. An idea is a seed: it may become one braid, several or none, and nothing says when. It never expires and is never proposed for review; only the user drops it or asks for it to become braids.

## Steps

1. Run `braid inbox --ideas --no-fetch`. If `braid` is missing or has no `inbox` command, tell the user as [the setup reference](../braid/references/setup.md) says (an old `braid` is updated the same way it is installed) and stop.
2. Read the user's sentence. Look only as far as the idea needs to be stated correctly: `braid list`, the briefs of the braids it touches (`braid view <id>`), and the files it names. Don't research the solution.
3. If you can't state the idea without guessing what the user means, ask one short question and wait. Otherwise don't ask: a rough idea is still worth keeping, and what is unclear goes into "Open questions".
4. Write the idea through `braid note --idea --file -`, in the shape below. `braid note` commits and pushes it to `braid-inbox` itself; never commit in your checkout.
5. Show the user the entry id and the text, and stop.

## The idea

Short and readable: no plan, strands, tiers or estimates. It is a seed, not a brief. Leave out a section that would be empty.

```markdown
<Title: the idea in a few words>

<The idea restated clearly in two to four sentences: what would be different for the user.
When it touches an existing braid, say what it adds to it instead of repeating it.>

Why: <the reason, only if the user said or clearly implied it>

Related: <braid ids with their titles, files>

Open questions:
- <what the user left open>

In the user's words: "<the sentence as written, without $braid-idea>", then: "<their answer, if you asked>"
```
