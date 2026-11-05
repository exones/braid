# <ID>: <title>

- Kind: story | task | spike.
- Tier: S | M | L.
- Expected size: about <N> lines in <K> files.
- Branch: `item/<NNN>-<id>-<slug>` at `<short sha>`.
- PR into: `epic/<NNN>-<slug>`.
- Result to: thread `<coordinator thread id>`.

## Goal

<One to three sentences: the outcome and who it is for.>
<For a spike instead: the question to answer, the time box, and the decision the answer feeds.>

## Start here

Read these, in this order. They are enough to start.

- `<path>`: <what to look at and why>

## Change

- `<path>`: <what to add or change>
<For a spike: `reports/<ID>.md` in the epic folder, with the answer, the evidence, and proposed follow-up items.>

## Already decided

Settled by the coordinator. Don't re-investigate.

- <A fact or choice, for example "Use pwsh 7 and native git only; no Node.">

## Out of scope

- <What not to touch or build.>

## Done when

- <Testable outcome. For a spike: the question is answered with evidence, or the time box ran out and the report says what is still unknown.>
- The `gate` command from `BRAID.md` passes and the PR checks are green.

## Check with

```powershell
<exact commands>
```
