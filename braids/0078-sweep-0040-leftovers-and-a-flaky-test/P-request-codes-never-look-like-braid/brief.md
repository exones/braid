---
id: '0078/P'
title: "Request codes never look like braid numbers"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 75
---

## Goal

A request's code can never be read as a braid or item number, so `braid answer|withdraw|forward|eta <code>` always find the request, and the tests that open requests stop failing at random. `newCode` in `src/braids/requests.ts:303` draws 4 characters from a-z0-9, so about one code in 170 is all digits (`q-5732`). Its bare form `5732` then reads as an item, and a command refuses ("braid eta: 5732 is an item; give the request's name or code") or looks for a braid ("no braid 9902"). This failed CI on 0078/G (PR #396, Windows, test/request-words.test.ts "an ambiguous name is refused with its candidates…") and 0078/O's local gate once (leftover 2026-11-28-vd3y). It hits every braid's gates and real users the same way.

Expected size: about 20 to 50 lines in 2 to 3 files.

## Start here

- `src/braids/requests.ts`, `newCode` (around line 303), and where a bare code, a name (`yellow-bear-5asx`) or an item id is told apart (the resolver behind `braid answer|withdraw|forward|eta`, `src/commands/requests.ts`).
- `test/request-words.test.ts`, the failing test at line 142, and the other tests that open requests with random codes.

## Change

- New codes always hold at least one letter (draw again, or force one position to a letter), so a bare code is never all digits.
- An existing all-digit code still resolves by its `q-` form, its name, and, where nothing else matches, its bare form. Old records keep working.
- A test that pins the generator to an all-digit draw (an injected random source) and shows the new code has a letter. A test that an old all-digit record still resolves by `q-<code>` and by name.

## Already decided

- Tier S, right after 0078/G, before 0078/H (the coordinator, 2026-11-28: it fails other braids' CI at random). The coordinator ports it to main as an early PR, as with #384 and #395.

## Out of scope

- Name words; other parts of the request record.

## Completion

- [x] New request codes always contain a letter, tested with a pinned random source
- [x] An old all-digit code still resolves by `q-<code>` and by name, tested
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated (docs/braids-format.md on request codes), or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. `newCode` draws again while the four characters hold no letter; export it with an injected random source for the test.
2. `src/commands/requests.ts`: where an item-looking argument is refused or read as an item, first try `digitCode`: four digits that are an old request's code, with no braid and no request's item of that number.
3. Tests in `test/request-words.test.ts`; update `docs/braids-format.md`; run the focused tests, then the gate once.
