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
2. On the PR branch every acceptance and Definition of done box is ticked and `report.md` is present.
3. An independent `braid-reviewer` review found nothing blocking, and for tier L any re-check is finished.
4. `gh pr checks` is green on the head commit for the `ci` names.
5. The PR is mergeable and its base is the braid branch.
6. `Needs the user: none` from all four sources: plan labels, worker, reviewer, diff facts.
7. The head is the reviewed commit. If it moved after the review, get the new head reviewed first.

Then:

1. Post a PR comment with the commit, the review link, the checks, the four Needs the user sources and "merged by braid auto mode".
2. Merge with `braid done <id> --head <sha> --thread <your thread id> --merge --log -`. It checks conditions 2, 4, 5 and 7 again, merges and stamps Done.
3. Tell the user in one line, and do "After the merge" in the skill.
4. Before the next item, wait until the braid branch's CI is green on the merge commit (`gh run list --commit <sha>`). If it is red, follow "Fixes" in the skill.

## Stopping

Stop instead of merging:

- on any [stop case](stop-cases.md);
- when a review is still blocking after two fix rounds (`quality`; the skill's review step adds the `ask:quality` label);
- when branch protection refuses the merge. Never use `--admin` or another bypass.

On a stop: don't merge, unwatch the PR, run `braid ask <id> "<what is needed>" --key <case>`, give the recap naming the case and its source, and wait. If the user then says "merge", that is a merge on request.
