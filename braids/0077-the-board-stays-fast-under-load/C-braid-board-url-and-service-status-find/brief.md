---
id: '0077/C'
title: "braid board --url and service status find a busy board"
status: To Do
labels: ["kind:story", "tier:S"]
dependencies: ['0077/B']
order: 30
---

## Goal

`braid board --url` and `braid board service status` find a running board on a busy machine. Today both probe `/api/session` with a 2-second timeout, so a board that answers late reads as "no braid board is running" and the service's running version as unknown (idea 2026-11-24-z45n). After B the board rarely answers late; this strand makes the probe itself tolerant and honest.

Expected size: about 120 lines in 4 files.

## Start here

- `probeBoard` and `liveAddresses` in src/board/address.ts.
- `versionAt` in src/commands/service.ts and the `status` output.
- `boardUrl` in src/commands/board.ts.

## Change

- One probe used by both, with a longer budget (for example retries up to about 10 s in all) and three answers: answers, busy (the port listens but no answer within the budget), none (nothing listens, or another token).
- `--url` prints the address when the board answers; when it is busy, it prints the address and says on stderr that the board answers slowly, exit 0; nothing listening stays "no braid board is running".
- `service status` shows "busy" instead of an unknown version when the board listens but answers late.

## Already decided

- Merge `main` (with 0074) into the braid branch before this strand starts; 0074 changes service.ts and board.ts.
- Tests use fake probes and a local server that answers late; no real port 7800.

## Out of scope

- Making the board itself faster (B).

## Completion

- [ ] A board that answers after 3 s is found by `--url`; a listening board that never answers reads as busy, with its address; no board reads as none
- [ ] `service status` says busy rather than an unknown version for a slow board
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
