# Autonomy

Read this whenever the braid's preset is not `careful`. A preset's front matter says which PRs you merge yourself (`merge`) and whether you start the next item without a go (`continue`); its table says, per [stop case](stop-cases.md), what you decide yourself and what you ask the user. Everything else in [the skill](../SKILL.md) stays as it is.

## Reading

- Read the preset with `braid autonomy <number>` when you take the braid, and again after the user changes it.
- The `This braid:` lines under it are the braid's exceptions and win over the table; a line under the table (`Tier L items: always ask`) is a rule like a row.

## Merging

Merge a PR yourself only when its kind is in `merge` (`strands`: a strand's PR into the braid branch; `all`: also a story's or the final PR into `main`) and all seven hold:

1. The worker reported green.
2. On the PR branch every Completion box is ticked and `report.md` is present.
3. An independent `braid-reviewer` review found nothing blocking (tier S too), and for tier L any re-check is finished.
4. `gh pr checks` is green on the head commit for the `ci` names.
5. The PR is mergeable into its base.
6. Nothing the preset says to ask about is open: every stop case from the four sources ("Deciding") is decided and logged, or kept for the final PR.
7. The head is the reviewed commit. If it moved after the review, get the new head reviewed first.

The evidence is the same in every preset: no preset, exception or tier waives conditions 3, 4 and 7. Then:

1. Post a PR comment with the commit, the review link, the checks, the four sources' cases with how each was decided, and "merged by braid under the `<preset>` preset".
2. Merge with `braid accept <id> --head <sha> --review <link> --thread <your thread id> --merge --preset` (for a strand add `--log -` with the braid's log entry). It checks the preset's `merge` and conditions 2, 4, 5 and 7 again, merges and stamps Done.
3. Tell the user in one line, and do "After the merge" in the skill. A merge you make runs no handover or recap, so check the inbox here: read the `Inbox:` line of `braid list` (or the draft of `braid recap <id>`). At 3 or more open leftovers, propose the sweep as the skill's "Sweep" says, on the braid's number, while the strands go on, in chat ("Talking to the user"), unless a sweep proposal is already open (an open request on the braid) or a sweep story is pending, in which case a later proposal adds to it as the skill's "Sweep" step 4 says.
4. After a strand's merge, start the next item; the braid branch's CI is read later (the skill's "Accept and hand over" step 3).

A PR outside `merge` goes to the user with the skill's handover.

## Continuing

With `continue: yes`, start the next ready item without a go, and a pending sweep story by launching its own coordinator thread (the skill's "Plan", step 0) without a go. With `continue: no`, ask for the go first.

## Deciding

For each stop case from the plan's `ask:` labels, the worker, the reviewer or `braid facts`, find its row:

- **Decide yourself:** decide, and log it as `Decided:` on the braid ([stop cases](stop-cases.md), "Who records what").
- **Ask me, or unsure which side:** `braid ask` as "Stopping" says.
- **Ask at the final PR:** go on, and put the case in the braid's log entry for the merge under "For the final PR's recap:"; the final PR's recap lists them under "Needs the user".

## Telling

After every third merge you made yourself, send the user `braid decisions <number> --since <the date of the last one you sent>` in a few lines, without stopping.

## Hold

"Hold", "pause" or "stop" from the user: let the running item finish, start nothing and merge nothing until they say go, and log it on the braid. A pause for a provider's usage limit ("pause, limit close") is [provider limits](limits.md) instead.

## Changing the preset

Only at the user's request: `braid edit <number> --autonomy <name>` and a log entry, as one commit on the braid branch; then read it again.

## Stopping

Stop instead of merging on a case on the "ask me" side, and when branch protection refuses the merge (never use `--admin` or another bypass). Don't merge, unwatch the PR, run `braid ask <id> "<what is needed>" --key <case>`, give the recap naming the case and its source, and ask with the skill's stop-case options, adding *Merge it* where a merge is the way forward. If the user then says "merge", that is a merge on request.
