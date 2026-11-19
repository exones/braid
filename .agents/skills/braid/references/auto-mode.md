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
3. Tell the user in one line, and do "After the merge" in the skill. Auto mode runs no handover or recap, so check the inbox here: read the `Inbox:` line of `braid list` (or the draft of `braid recap <id>`). At 3 or more open leftovers, propose the sweep as the skill's "Sweep" says, on the braid's number, while the strands go on, unless a sweep proposal is already open (an open request on the braid) or a sweep story is pending, in which case a later proposal adds to it as the skill's "Sweep" step 4 says.
4. Before the next item, wait for the braid branch's CI on the merge: run `braid wait <number>` as a background command, and before ending the turn wait on it with the host's wait for background commands (in T3, `t3_background_wait` with `taskIds` set to a list holding the background command's task id), so its end wakes you. It waits on the newest commit with changes outside `braids/` and `epics/`, so the Done stamp after the merge doesn't count. Exit 0: CI is green, go on. Exit 1: a `ci` check failed (the output names it); follow "Fixes" in the skill. Exit 2: no answer (timeout, no run appeared, or an error; the output says which); `braid ask <number> "<the output>"` and stop.

## Stopping

Stop instead of merging:

- on any [stop case](stop-cases.md);
- when a review is still blocking after two fix rounds (`quality`; the skill's review step adds the `ask:quality` label);
- when branch protection refuses the merge. Never use `--admin` or another bypass.

On a stop: don't merge, unwatch the PR, run `braid ask <id> "<what is needed>" --key <case>`, give the recap naming the case and its source, and wait. If the user then says "merge", that is a merge on request.
