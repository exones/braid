---
id: '0080/A'
title: "How the board signs in to T3"
status: To Do
labels: ["kind:spike", "tier:L", "ask:security", "ask:dependency"]
dependencies: []
order: 10
---

## Goal

Question: how does the braid board (a long-running Node.js process, `braid board`, also run as a service) sign in to T3 Code's MCP endpoint at "Supervised" and keep the sign-in, so that it can call `t3_thread_interrupt`, `t3_thread_list` and `events/poll`, with the token only in the host's secret store? The user asked for exactly this explanation ("B: a and explain how board would do it") and decides on it before anything is built (security). Time box: 3 hours. The decision it feeds: what 0080/D builds, and whether braid takes a new dependency.

Expected size: a report of about 150 lines and `sources.md`; no product code. Look at T3's own sign-in code and docs (below), the MCP authorization spec the T3 version follows, and at least three ways a Node.js program can keep a secret in the OS store on Windows, macOS and Linux (a maintained library and the OS's own command-line tools at least). Read each source rather than its title, record each in `sources.md` in the item folder in the [braid-researcher](../../../.agents/skills/braid-researcher/SKILL.md) source line format, and cite source ids (`[S1]`) for claims in `report.md`.

## Start here

- `~/.braid/artifacts/braid/p27-t3-tests/t3-src-v0.1.12/docs_user_outside-agents.md`: how outside agents sign in (OAuth, `https` or `localhost` only, the approval page, levels, 30 days, revoke).
- `~/.braid/artifacts/braid/p27-t3-tests/t3-src-v0.1.12/McpOAuth.ts`: T3's authorization server: discovery, client registration (signed client metadata, redirect URI limits), authorization codes (60 s), tokens, scopes, levels.
- `~/.braid/artifacts/braid/p27-t3-tests/t3-src-v0.1.12/apps_server_src_mcp_McpHttpServer.ts`: what a call needs (headers, protocol 2026-07-28, Bearer).
- `~/.braid/artifacts/braid/p27-t3-tests/events-mock/client.mjs`: the call shape the board would use.
- `src/commands/board.ts`, `src/commands/service.ts`: how the board runs (port, foreground or service, which user); where a sign-in could start (a CLI command, a board button) and where its loopback callback could land.
- `src/board/tailnet.ts`, `src/board/address.ts`: the board's own address handling; the existing board sign-in stays out (the user withdrew absorbing it), but the report says whether the two can be confused.

## Change

- `braids/0080-…/A-…/report.md` and `sources.md` only. The report answers, each with the recommended choice first and the alternatives in a line each:
  1. **The flow**, step by step, as the user sees it: who starts it (`braid t3 login`, a board button, or both), what opens in the browser, what the user approves (Supervised), where the code returns (a loopback port of the CLI or of the board), the PKCE and `state` checks, and what the board calls afterwards. Which T3 address: `localhost` on the host, as the docs allow.
  2. **The token**: what T3 returns (access token, any refresh token, lifetime), where it is kept per OS (Windows Credential Manager, macOS Keychain, Linux Secret Service), how the board process, possibly a service under another session, reads it, and what happens on a host with no secret store (no sign-in; the board works as today). The dependency this needs, if any, with its licence, maintenance and native-build cost, against shelling out to the OS tools. Never a file, a log line, an environment variable or chat.
  3. **Expiry and loss**: the 30-day sign-in, how the board learns its date, the warning (when, where: a board chip and one push), what a 401 does (signed-out state, back to CLI paths, no retry storm), sign-out and revoke in T3's settings.
  4. **Threat model** in a few lines: another local user or process, the loopback callback, a leaked token's reach at Supervised (start, message and stop threads in every project), and what braid does to limit that (scope requested, what is never printed).
  5. **What 0080/D builds**: the commands, the board pieces (icon-only buttons, words in tooltips) and the tests, with an estimate in lines and files, and what to test live once the user signs in (scratch threads only).
- No live sign-in in this strand: signing in needs the user's approval, which comes after the report.

## Already decided

- Supervised, the token only in the host's secret store (the user, 2026-11-25). Signed out, the board works as today.
- Nothing is absorbed: the board's existing sign-in stays as it is (the user withdrew "absorb the simple signin we already have").
- The spike's output is this report; nothing in `docs/` or the roadmap changes here.

## Out of scope

- Building any of it (0080/D), the MCP client (0080/B), events (0080/F).

## Completion

- [x] `report.md` answers the five questions under Change, each with a recommendation and its alternatives
- [x] `sources.md` in the item folder (per source: id, link, version, access date, how it was read (whole, part, search result only), what it says, adopted or not and why), and `report.md` cites source ids for its claims
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open; `Needs the user:` names the security and dependency decisions

## Plan

1. Frame (decision, sub-questions, candidates) and read T3's sign-in: the given v0.1.12 sources plus the installed T3 server bundle for what they leave out (session lifetime, revoke, approval page, runtime file).
2. Read the board's run modes (board.ts, service.ts, address.ts, tailnet.ts) for where a sign-in can start and land.
3. Two researcher subagents in parallel: OS secret stores from Node (library vs OS tools, per OS) and the MCP authorization spec with the OAuth RFCs it cites.
4. Write report.md (five answers, recommendation first, threat model, 0080/D estimate, Needs the user) and sources.md; no product code, no live sign-in.
5. braid check, the gate once at the end, PR into braid/0080-the-board-talks-to-t3-directly.
