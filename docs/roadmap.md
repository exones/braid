# Roadmap

Live status is in `braids/` (`braid list`, `braid board`); see the [workflow](../.agents/skills/braid/references/workflow.md).

The old manual-ledger CLI and its staged bootstrap plan were dismissed in TASK-4. The CLI now tracks braids and strands in `braids/` ([format](braids-format.md)) and serves the [attention board](board.md), which also acts: Start a braid, ask the coordinator to Merge, Open a thread; the next stories are the Outline braids 0008 to 0012 in `braids/` (the earlier plan is in `archive/backlog/docs/doc-5`).

## braid's own board

As [D01](decisions.md) says, built with the Backlog.md-based flow, and now done. braid has its own tracker and board, keeping what worked in Backlog.md: Markdown task files in Git that travel with branches and PRs, a CLI with plain output for agents, acceptance criteria, Definition of Done, final summaries, subtasks and cross-branch reads. It adds:

- goals shown with their subtasks nested;
- states derived from GitHub, T3 and labels, not stored in task files: built as the attention board's lanes To Do, Working, To Review, Needs You, Done (D32);
- actions: Start, Merge on request, Open thread (built, see [the board](board.md)).
- pausing for provider usage limits (braid 0061, built): `braid limits`, `braid pause` and `braid resume`, the paused state on the board and in `braid status`, and the pause and resume steps in the skills (D86, D87).
- the board watches provider limits (braid 0064, built): the board reads `braid limits` at each refresh, shows each provider's usage against its threshold, pauses and resumes the agents on a provider over its threshold through a steering thread (`braid board --no-pause` turns it off), and pushes each pause, resume and weekly window; coordinators and PMs keep only the check before a launch (D90, replacing D87's pauser).
- programmes (braid 0062, built): the programme manager's programmes in a panel on the board with their stall, requests addressed to the PM with escalation and `braid forward`, the PM's own requests pushed to the phone, and holds (D88, D89).
- precise notifications (braid 0069, built): one rule pushes only what an open request asks of you and opens the thread that needs you, the merges waiting under a PM are one push, and `braid notify send` is the PM's own push (D92, D93).
- questions on record (braid 0070, built): requests on their own branch `braid-requests` with a code and their whole history, answered, withdrawn and shown by code with who answered, "done when" conditions (`pr:<n>` checked), codes and closed requests on the board and in pushes, questions in chat with no question tool, and the end markers ✋, ⏳ and 🟢 (D96 to D99).
- the board wakes, reminds and nudges (braid 0071, built): a `braid:`, `time:` or `pr:` condition that holds wakes the asking thread once, the one a wait is for is reminded hourly and can say when with `braid eta` ("expected by" on the request), a coordinator or PM that stopped with nothing open is nudged once before it reads as stalled, and a PM's live checker is recorded with `braid review pm/<slug>`; the skills say how to wait, answer and resume (D100, D101).
- braid on large repos (braid 0073, built): one CI run per push on a strand and no push CI on braid branches (D71's note), a project merge gate `braid accept --merge` runs under every preset (`merge-gate`, `merge-gate-on`; D102), `ci: all` for checks that vary per PR (D103), review bots, partial CI, path stops and caches as `BRAID.md` and `AGENTS.md` lines (D104, [braid on a large repo](getting-started.md#braid-on-a-large-repo)); `braid facts` names the merge gate. Not built: path rules in `ci`, `gate:` as a list, a `cleanup:` field, a disk-space check, `braid doctor` (P18).
