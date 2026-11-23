---
id: '0070/B'
title: "Answer, withdraw and show by code"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: ['0070/A']
order: 20
---
## Goal

A request is answered, withdrawn and shown by its code from any thread or checkout, and its record says who answered (the user or the PM), with the PM's reason. A request can carry a "done when" and an addressee other than the user or the PM, so a wait is a request like any other. Answering never commits on a braid branch, so recording the user's "merge" no longer moves the PR head (inbox k5d1), and asking or answering works on a story whose branch is gone after its merge (0036).

Expected size: about 450 lines in 7 files, with tests.

## Start here

- The braid's brief (`braid view 0070`), "Already decided": the record's form.
- 0070/A's report and `src/braids/requests.ts` as it left it.
- `src/commands/requests.ts`: `askCommand`, `answerCommand` (its `--log` commits through `logEntry`), `itemId` (finds the item through `loadKnownBraids`, which misses a merged story the checkout hasn't pulled), `requestsCommand`.
- `src/commands/decisions.ts` and `src/commands/facts.ts` (`recapCommand`): where the user's decisions are summed up today, from the braid logs.
- Inbox entry k5d1 (`braid inbox show 2026-11-23-k5d1`) and 0036's brief (`braid view 0036`, "Requests and answers after a lone story's merge").

## Change

- `braid answer <code>|<id> [--from user|pm] [--reason <text>] [--file -]`: records the answer (its text from `--file -`), who answered (`user` by default) and, with `--from pm`, the PM's reason; commits only on `braid-requests`. `--log -` is still accepted, as the answer text, and commits nothing on a braid branch. The id form keeps `--by` (whose request) as today.
- `braid withdraw <code>|<id> --why <reason>`: the request becomes `withdrawn` with the reason; it stays listed.
- `braid requests <code>`: the request with its history (every event with time, who and text). `braid requests --closed [--since <date>]`: closed requests, newest first, with their state and who answered.
- `braid ask` and `braid handover` print the new code. `braid ask --to user|pm|<braid number>` and `--done-when answered|pr:<n>|braid:<number>|time:<iso>`; a `pr:<n>` condition closes as `met` when the PR merges, as a handover's does since 0070/A.
- `braid ask`, `answer` and `withdraw` find an item on any branch, on `origin/main`, or in the record, so they work after a story's branch is gone.
- `braid decisions <number>` and the recap draft's decisions read the braid's answered requests from the record (the answer, who answered, the PM's reason), next to the `Decided:` log entries.
- From 0070/A's review (https://github.com/exones/braid/pull/268#issuecomment-7101350444): reads while the local and remote branch differ overlay the whole local file and never merge the two event lists (`currentFiles` in `src/braids/gitbranch.ts`), so `braid requests` can hide the remote's events until the next write; merge on read as the write's replay does. And `closeRequest` and `forwardRequest` drop `WriteResult.warning`, so `answer`, `forward`, `start` and `accept` don't print the offline line that `ask` and `handover` print.
- `to` is typed `user | pm` since 0070/A: widen it for a braid-number addressee.
- Tests for each, including: answering on a final PR's item leaves the PR head and the braid branch unchanged (k5d1); asking and answering on a merged story whose branch is deleted; withdraw keeps the record; a `pr:` condition met on merge; who answered and the reason round-trip.

## Already decided

- Who answered is a field of the answer (`--from`); `--by` stays whose request it is. The default is the user; the coordinator records a PM reply with `--from pm --reason`, as the user said: "coordinator can ask question to PM, and it can answer as I would. And coordinator would record it as answer".
- The `braid:` and `time:` conditions are stored and shown, not checked: P6 checks them and wakes the asker. `eta` stays empty here.
- An addressee that is another braid's coordinator is stored by its number; nothing routes or pushes it yet (P6).

## Out of scope

- The board and pushes: 0070/C.
- Skills: 0070/D.
- Waking, reminders and the estimate's call (P6).

## Failure modes and required regression tests

- k5d1: a merge answer moves the PR head. Test that `braid answer` on a final PR's item makes no commit on the braid branch, and `braid accept --merge --head <recapped sha>` then merges.
- An answer to a code that is already closed: refused, naming its state and who closed it; nothing changes. Test it.
- An id with two open requests (the coordinator's and the PM's): the id form without `--by` names both codes and changes nothing. Test it.

## Completion

- [ ] `braid answer`, `braid withdraw` and `braid requests` take a code; the record keeps who answered and the PM's reason, and `braid requests <code>` shows the whole history
- [ ] `braid ask` takes `--to` (user, PM or a braid number) and `--done-when`; a `pr:` condition closes as met when its PR merges
- [ ] `braid answer` never commits on a braid branch, and the k5d1 test passes
- [ ] `braid ask`, `answer` and `withdraw` work on a merged story whose branch is gone
- [ ] `braid decisions` and the recap draft include the braid's answered requests
- [ ] The CLI's help text and usage lines describe the new flags
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
