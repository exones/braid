# Review: <epic>/<ID>, PR <url>

You are reviewing someone else's change with fresh eyes. Don't push to their branch.

- Brief: `<path>`
- Head commit: `<sha>`
- Focus: <what matters most here, for example failure handling or state-format compatibility> For a second look after fixes: the commits since `<sha>`.
- Skill: <the review skill to use, if `BRAID.md` names one; otherwise delete this line>
- Result to: thread `<coordinator thread id>`

Read the brief, then the diff (`gh pr diff <pr>`). Check that the change does what the brief asks, that nothing important is missing, and that nothing is clearly wrong: bugs, unsafe behavior, missing tests on risky paths, confusing code. Run code locally only to confirm a suspicion. CI results are on the PR; don't re-verify them.

Post one review comment on the PR: blocking findings first, numbered, then optional suggestions. If nothing is blocking, say so plainly. Then send the coordinator a short message with `t3_thread_send`: blocking or not, and the comment link.
