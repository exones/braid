# Auto mode

Read this when the user asks for auto mode on a goal, or when the braid has the `auto` label. In auto mode you merge that goal's strand PRs into the braid branch yourself. Everything else in [the skill](../SKILL.md) stays as it is, and the final PR into `main` is always the user's to merge.

## Switching it on and off

- Refuse, with the reason, if `BRAID.md` lacks `auto: allowed`, if `ci` is `none`, or for a story (its PR goes into `main`).
- On: add the `auto` label to the braid (`braid edit --labels`, repeating the others) and a log entry, as one commit on the braid branch. "Stop auto" or "pause" removes the label the same way. Both commits are among your commit points.

## Review

Tier S gets an independent review too, as for tier M.

## Merging

Merge a strand's PR only when all seven hold:

1. The worker reported green.
2. On the PR branch every Completion box is ticked and `report.md` is present.
3. An independent `braid-reviewer` review found nothing blocking, and for tier L any re-check is finished.
4. `gh pr checks` is green on the head commit for the `ci` names.
5. The PR is mergeable and its base is the braid branch.
6. `Needs the user: none` from all four sources: plan labels, worker, reviewer, diff facts.
7. The head is the reviewed commit. If it moved after the review, get the new head reviewed first.

Then:

1. Post a PR comment with the commit, the review link, the checks, the four Needs the user sources and "merged by braid auto mode".
2. Merge with `braid accept <id> --head <sha> --review <link> --thread <your thread id> --merge --log -`. It checks conditions 2, 4, 5 and 7 again, merges and stamps Done.
3. Tell the user in one line, and do "After the merge" in the skill. Auto mode runs no handover or recap, so check the inbox here: read the `Inbox:` line of `braid list` (or the draft of `braid recap <id>`). At 3 or more open leftovers, propose the sweep as the skill's "Sweep" says, on the braid's number, while the strands go on, in chat with lettered answers and not with the question tool, since a pending question would hold the next worker's report and PR wakes until the user answers, unless a sweep proposal is already open (an open request on the braid) or a sweep story is pending, in which case a later proposal adds to it as the skill's "Sweep" step 4 says.
4. Before the next item, wait until the braid branch's CI is green on the merge commit (`gh run list --commit <sha>`). If it is red, follow "Fixes" in the skill.

## Stopping

Stop instead of merging:

- on any [stop case](stop-cases.md);
- when a review is still blocking after two fix rounds (`quality`; the skill's review step adds the `ask:quality` label);
- when branch protection refuses the merge. Never use `--admin` or another bypass.

On a stop: don't merge, unwatch the PR, run `braid ask <id> "<what is needed>" --key <case>`, give the recap naming the case and its source, and ask with the skill's stop-case options, adding *Merge it* where a merge is the way forward. Nothing else runs for you then, so the question tool applies. If the user then says "merge", that is a merge on request.
