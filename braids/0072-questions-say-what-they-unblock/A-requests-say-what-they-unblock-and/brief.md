---
id: '0072/A'
title: "Requests say what they unblock and whether to decide or do"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: []
order: 10
---

## Goal

Every open request can say what its answer unblocks and whether it is something to decide or to do outside braid, from what braid already knows, so the user can tell "this blocks three strands" from a naming choice. Also: a request code typed in any letter case is found.

Expected size: about 250 lines in 6 files, tests included.

## Start here

- `src/braids/requests.ts`: the record (`Request`, `KINDS`, `CODE`, `loadRecord`), and `answeredRows`.
- `src/commands/requests.ts`: `askCommand` (its output line), `requestsCommand` (the open list, `history`, `closedLine`), `target` and `etaCommand` (code lookup), `askerFlag` and the `--kind action` check.
- `src/braids/store.ts`, `src/braids/branches.ts` (`loadKnownBraids`), `src/braids/lifecycle.ts` (`withStatuses`): braids, their strands, dependencies and Done.
- Inbox idea 2026-11-19-aeli, taken in: "Needs You says what the answer unblocks. When braid ask puts an item in Needs You, the question would also say what it unblocks and whether the user has to decide something or do something outside braid (e.g. create a token, change a repo setting). Answered questions stay listed as decided, with the answer. Example: the card shows 'Decide: inbox branch name - unblocks 0020/B, 0020/C' or 'Do: add secret X'."
- Leftover 2026-11-23-nq6c, taken in: "Request codes are made and stored lowercase (q-l9en), but lookup by code is case-sensitive. braid requests Q-L9EN is refused as 'not a request code', and braid answer Q-L9EN / braid withdraw Q-L9EN are refused with the misleading 'not a braid or strand id'. Nothing is written under a wrong code. Where: src/commands/requests.ts (code lookup in answer, withdraw, requests), src/braids/requests.ts. Lower-case a /^q-/i code before lookup and name it as a request code in the refusal; add a test."

## Change

- A pure function, for example `unblocksOf(request, braids, requests)` in `src/braids/requests.ts` or a small module beside it, used by the CLI here and by the board in 0072/B and 0072/C: the request's item and every strand that depends on it, directly or not, that isn't Done; for a braid-level request the braid's strands not Done (a story: the braid itself); plus every braid with an open wait on it (`to` its number, or `--done-when braid:<number>`). Sorted, no duplicates.
- An act word per kind: `action` reads `do`, `review` reads `merge`, every other kind `decide`.
- `braid requests` (the open list and `braid requests <code>`) and the output line of `braid ask` say both, e.g. `blocks 0072/B, 0072/C · decide`.
- `--kind action` is allowed for a coordinator's request too (to the user or the PM); the PM's wording stays "The PM asks you to:".
- Every place that takes a code (`braid answer`, `braid withdraw`, `braid eta`, `braid requests <code>`) lower-cases a `/^q-/i` code first; a malformed code is refused as "not a request code", never as "not a braid or strand id".
- Tests for the derivation (a strand with dependents, a Done dependent left out, a braid-level request, a wait from another braid), the output lines and the letter case.

## Already decided

- Derived at each read, never stored: no new field on the record (the braid's "Already decided").
- The shape of the line on the board and in pushes comes from the mockups of 0072/B and 0072/C; here only the CLI's text, which they may adjust.

## Out of scope

- The board and pushes (0072/B, 0072/C). The pause, limits and steering code (0074).

## Plan

- `unblocksOf(request, braids, requests)` and `actOf(kind)` in `src/braids/requests.ts`: pure, derived at each read.
- `src/commands/requests.ts`: `braid ask` prints the line under its first, `braid requests` (list and `<code>`) shows it before whom; `--kind action` no longer needs `--by pm`; `codeOf` lower-cases a `/^q-/i` code for answer, withdraw, eta and requests.
- Tests in `test/requests-unblocks.test.ts`; existing line expectations updated; docs: braids-format, cli, decisions (D107), the help text.

## Completion

- [x] `braid requests` and `braid ask` show what a request unblocks and `decide`, `do` or `merge`, derived from the briefs and the record, with tests
- [x] A coordinator can open `--kind action`, with a test
- [x] `Q-L9EN` works wherever a code is taken, and a malformed code is refused as not a request code, with tests
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
