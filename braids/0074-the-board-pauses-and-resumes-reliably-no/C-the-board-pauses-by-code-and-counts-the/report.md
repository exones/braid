# 0074/C report: the board pauses by code and counts the replies

## What changed

- **No steering thread.** `steeringLines`, `pickSteering`, `steeringMessage`, `parseSteeringLine`, `steeringTitle`, the `nosteer` path, the `pausing` and `nosteer` pushes and the 15-minute steering limit are gone (`src/board/steer.ts`, `src/board/steerer.ts`, `src/braids/title.ts`). `parseSteeringTitle` stays so an older 🚦 thread is still no item's agent.
- **Which braids, which threads** (`targetsOf`, from the board's T3 snapshot, per the 0060 contract): a braid gets a record only when one of its agents works now on the provider: a running worker, any running thread recorded in `.braid/reviews.json` (whatever its role), or its running coordinator. The targets are those working threads plus the braid's coordinator, even if idle. Idle workers, archived threads and threads on other providers are never targets. The PM is a `pm` target for the resume only (`pmsOf`); it gets one summary and isn't counted.
- **The sends:** after the claim (unchanged: records under the pauses lock first), each target gets its text with `t3 thread send <id> -`. The text goes on standard input, so cmd.exe never quotes it. A failed send is tried once more. Workers, reviewers and other agents get the worker text, ending their turn with `Paused: <id> at <sha>`. The coordinator gets its own text with its braid number filled in by code. No text names a reply thread. Each PM thread gets one `pmSummary` (braids, provider and window, until when; no reply needed).
- **Counting** (`count`, replacing `follow`): for up to `COUNT_MS` (10 min), each refresh reads each target that hasn't answered with `t3 thread show <id> --messages 10 --json`. A thread that has stopped (by `working()`) and whose last message after the board's `Pause for …` text holds a `Paused:` line has answered; an older `Paused:` line doesn't count. Once every target has answered or failed, or at 10 minutes, the record settles: `paused`, `partial` (still working, `no line`, `send failed`, or `unread`) or `failed` (no send went through).
- **Loud failure:** a `partial` or `failed` record makes the braid's card Needs You (reason `limit`): "Pause for <provider>: paused n/m; no answer: <item> (<thread link>), …". It also sends the `failed` push once ("<provider>: pause reached n/m" or "pause failed") and messages the PM thread once (for a braid without a PM, its coordinator) with the same list. Settling is guarded inside the pauses lock, so a later tick adds nothing.
- **The record:** `steering` became `replies` (`sent`, `outcome`, `answered`, `total`, `got`, `failed`, `noAnswer` with item, thread, link and why, `reason`), and `PauseTarget` gained `link`. An older record's `steering` part is read into `replies`, so old records still read.
- **Views:** the card and details box (`src/board/pause.ts`), the chip's "pausing…" and the panel line "Pause sent 12:52 by the board: …", with an Open link per silent agent (`limits.ts`, `limits-view.ts`, `web/src/Limits.tsx`), the demo, the board's start line, and `braid board --help`. `braid limits` prints a `steering` role as `(unused)`. A BRAID.md with `models.steering` still reads.

## Why

The LLM steering thread paused 0 of 18 twice on 2026-11-24, retyped its own thread id and settled 40 s after sending. The user wants reliable calls, not an LLM, in the pause path. Every id now comes from T3's output, and the replies are read by code.

## Validation

- `test/board-steer.test.ts` holds the brief's tests:
  - the ids sent are exactly T3's (a colon, a `%` and mixed case) and no thread starts;
  - `targetsOf` gives nothing for a braid with only a finished worker, an Outline, or no started item, and never targets archived threads or threads on another provider;
  - a braid whose agents all finished gets no record and no call;
  - a reply is counted from the thread, an older `Paused:` line ignored, and the pause settles early with a quiet push;
  - a silent target at 10 minutes reads Needs You, sends exactly one `failed` push and one PM message, and a later tick adds nothing;
  - a target that stopped with no line reads `no line`, and the coordinator is told when there is no PM;
  - a send that fails twice is retried once; when every send fails the pause fails at once;
  - BRAID.md pauses the same with or without `steering`, and `braid limits` marks the role unused;
  - an old `steering` record reads as `replies`.
- The resume, hold, weekly, restart and push tests were kept and adapted.
- `test/board-acting.test.ts`: two boards with shared leases, each serving two projects on one provider account: each thread gets its pause text once, in its own project. The resume still reads each project's own BRAID.md. The older-record resume test keeps a `steering` record.
- `test/pauses.test.ts`: a partial board pause makes the braid's card Needs You (`limit`) with the thread link, and a full pause doesn't.
- Gate: local `npm run verify` (22 min on a loaded machine) passed 707 of 711. The 4 failures were in files this item doesn't touch (`github`, `requests`, `start-clean`); run alone, 51 of 52 passed, and the one left is the requests store's multi-process lock test, which 0074/B also saw fail under load. CI's full gate passed on Ubuntu and Windows at 977e872.

## Docs

- docs/board.md: "The board pauses and resumes" rewritten (which braids, which threads, the claim and the sends, counting, the loud failure), plus Needs You rule 6, the paused marks, the chip, the panel line, the several-projects bullet and the limit pushes.
- docs/decisions.md: D108 (no LLM in the pause path; decided under `free`, the direct pause and the escalation net by the user), its log line, and a pointer from D90.
- docs/autonomy.md, docs/getting-started.md, docs/cli.md, docs/braids-format.md (the record's `replies`) and docs/roadmap.md.
- The CLI help line of `braid board --no-pause`.

## Open

- `t3 thread send` reaches a busy thread only as its next turn (the CLI's help: "nothing is interrupted"). An agent in a turn longer than 10 minutes therefore reads "no answer" and is escalated, though it will pause when its turn ends. D90 chose the steering thread partly because an agent's `mode:"auto"` steers a busy turn in a second. D108 records the trade the user accepted.
- **Can the board steer without an LLM? Not without a new credential, so no code changed** (the PM's q-odpb, checked in T3 Code's bundled CLI, `resources/server.asar`, `apps/server/dist/binCli-*.mjs`, on this machine):
  - `t3 thread send` calls the same MCP tool, `t3_thread_send`, with `mode: "queue"` hard-coded. No flag changes the mode.
  - For each call, the CLI mints itself a short MCP session in-process (`environmentAuth.issueMcpClientSession`, read from T3's own auth store under `T3CODE_HOME`). It calls `<origin>/mcp` with that bearer token and revokes it at the end. The token never leaves the CLI.
  - The server's `/mcp` (origin in `~/.t3/userdata/server-runtime.json`, `http://127.0.0.1:3773` here) answers 401 `invalid_mcp_credential` to a call without a token.
  - The unlisted `t3 acp-mcp-call <tool> <json>` can call any tool, `mode: "steer"` included. It needs `T3_ACP_MCP_ENDPOINT` and `T3_ACP_MCP_AUTHORIZATION` in its environment, which T3 gives only its own ACP agents.
  - So the board could steer only in one of two ways:
    - Hold a bearer token of its own: `t3 session issue --ttl … --token-only` (a new scoped session in T3's auth store) for each pause, pass it to `acp-mcp-call`, then `t3 session revoke` it.
    - Reach into T3's private auth store and reimplement its token issuing.
  - The first is a new credential that braid would hold and pass in a child's environment. The second is fragile and reads T3's secrets. Both are on the brief's "ask" side (security), so the pause keeps `t3 thread send`.
  - The PM's correction (it wins): build no MCP client and no steer call, and don't reuse the CLI's token from `T3CODE_HOME`. Delivery stays queued (option a).
  - **The supported path, for the user to decide:** T3's MCP server at `<environment-address>/mcp` takes outside agents, signed in with OAuth ([outside-agents.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/outside-agents.md)). With it the board could call `t3_thread_send` with `mode: "auto"` from code and steer a busy turn. It needs an OAuth sign-in at an access level the user chooses, and a token the board stores. That is a security decision; the PM is taking it to the user.
  - **Later:** MCP Events (`io.modelcontextprotocol/events`: a turn ended, an agent waits on a person) on the same connection could replace some of the board's polling, the reply count's `thread show` reads among them.
- T3 lists no subagents, so a child is a target only once it is recorded in `.braid/reviews.json` (the 0060 contract). An unrecorded subagent is not paused directly, but its parent's pause covers it.
- From 0074/B: the provider lease means a board that doesn't serve a project never pauses it. Two boards serving different projects on one account would pause only the acting board's projects. The test covers boards that both serve both projects.
- Size: about 730 lines changed in src and tests (355+/377− in code, 289+/227− in tests), against about 450 expected. Much of it is the rewritten steer test file. Within the brief.

For later items: 0074/G can drop the `Paused: … to <steering thread id>` wording from the skills' limits reference: the agent now ends its turn with the line, and no reply thread exists. 0074/D's resume can read `replies` and the `pm` targets. 2026-11-25-khtk's "steerer keep-path" was not taken in: the keep path (`extended`) is unchanged here.

Needs the user: none
