# D resume: actual host-binding constraint

Resume SAME D owner from checkpoints/D.md, not initial entry. Local HEAD `89fc1ea35fa81de627d5345553ff8bee328c96d8`, clean; preparation/native-cleanup corrections retained. Read this packet only after checkpoint. No fixture recreation, gate reruns, toolchain work, push/PR, agent or live canary.

Coordinator independently checked the cleanup diff, author clean HEAD, marker and retained fixtures. Probe1 HEAD b5611e64d3b78877aa9086b3f419c744bc032b0b, branch item/d-probe-match, clean, origin expected local bare path; probe2 HEAD1d8426337b36a661886155799d9e1b4674f725a1; probe3 HEAD11308ef31db813719c72d67a0edd578f749f9835 and parent330585f37e60d093b7e019494e55730f44b25853. No cleanup/recreation was executed by coordinator.

Your preparation result arrived while host still marked ordinal2 active. At clean committed handoff the coordinator explicitly stopped that turn using clientRequestId `braid003-d-preparation-handoff-stop-001`; post-interruption read confirmed interrupted and activeRunId null. This is a second coordinator-mediated boundary, not evidence of natural yield completion or a known host root cause.

Actual probe1 launch attempt: clientRequestId `braid003-d-probe-1-retained-binding-001`, Grok4.7 High/500K, workspaceStrategy existing_worktree with worktreePath `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures/probe-1`, exact raw probe1 prompt only. Host returned `OrchestratorMcpFailure`, code `invalid_request`: `worktreePath must be one of the project's git worktrees. t3_worktree_list shows them.` No thread/link/run identity was returned; do not invent one or count the probe as executed. No subject saw the oracle.

## Small bounded revision

Revise only the subject-binding plan/raw inputs to fit host-created project worktrees. The coordinator creates/binds those through t3_thread_launch; you never create a shell worktree or launch agents. Prefer ordinary project-origin bindings, per-worktree index and owned fixture paths. Do not mutate shared remotes/common Git config, import/rewrite project history, register temporary projects or pretend a disposable subrepository is the actual host-bound root.

Return a short concrete proposal for at most three serial probes: minimal setup operations performed while the subject is idle, exact per-case owned files and expected facts (unknown returned root/HEAD may be supplied later once by coordinator), minimal raw subject tasks separated from oracle, and what the changed setup can/cannot prove. Keep existing identities as historical fixture-setup evidence, not expected HEADs of future project worktrees. Preserve existing retained fixtures and observations; no replays or broadened trial design.

Update only owned D validation/raw/oracle material and a concise report/checkpoint note. Commit locally and send one nonterminal adaptation handoff, then yield. No need to re-read policy/history, run full verify/docs gate or resolve live-canary implementation in this phase; use a scoped diff/whitespace check for text changes. Coordinator decides and commits the concrete subject packet before host creation. If no honest supported setup exists, report that limit instead of more research/retries. D is not accepted, reviewed, merged or Done.
