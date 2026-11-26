# 0072/F report: docs as a whole

## What changed

- CLI help (`src/cli.ts`): `handover` prints the request's name; `answer` says an answer recorded outside the asking thread wakes it; `answer` and `withdraw` ask for the name, not the code; `requests` says it lists what each request blocks and decide, do or merge.
- Docs: stale "code" wording replaced by the name (handle) where braid shows or takes the handle; `--kind action` and `--to self` added to the `braid ask` flag lists; what a question blocks and the recap added to getting started and the README; `docs/board.md` now says what puts a programme in Needs you; `docs/decisions.md` records the recap (D113); the roadmap has 0072.

No behaviour changed; only help strings in code.

## Why

The braid's strands each updated their own part; these were the gaps left between them, most named in the braid log.

## Docs checked (BRAID.md `docs`)

| Doc | Result |
| --- | --- |
| `README.md` | updated: the questions and wakes bullets |
| `docs/getting-started.md` | updated: what a question unblocks, the recap, Decided, the PM answering on the record |
| `docs/cli.md` | updated: `handover`, `ask` (`action`), `answer`, `withdraw`, `eta`, `requests` rows |
| `docs/board.md` | updated: request handles, pushes, `braid eta`/`answer`/`withdraw` by name, programme Needs you |
| `docs/autonomy.md` | updated: `braid answer <name>` |
| CLI help (`src/cli.ts`, usage lines) | help updated; the commands' usage lines unchanged (already current) |
| `docs/decisions.md` | updated: D113, date. D107 to D112 are in order and unique on this branch and match the behaviour |
| `docs/braids-format.md` | updated: names in the request commands, `action` open to coordinators, `--to self` |
| `docs/roadmap.md` | updated: 0072 built |
| `docs/development.md` | unchanged: nothing 0072 touched |
| `docs/npm-distribution.md` | unchanged: nothing 0072 touched |

## Validation

- `npm run verify` locally: 745 tests, 745 pass, 0 fail (log `~/.braid/artifacts/agento/0072/F-verify.log`).
- `braid check`: OK.

## Open

- 0074's branch also has a D107, D108 and D109 with other content. Whichever braid merges `main` second renumbers; by the plan 0074 merges first, so 0072's D107 to D113 move.
- `braid decisions` and the recap draft still name an answered request by its q-code, and the "has 2 open requests" and "--by is for an id" refusals still say "code". The docs describe that as it is.

For later items: Leftover: show the handle in `braid decisions`/recap rows (`answeredRows` in `src/braids/requests.ts`) and say "name" instead of "code" in the refusals of `src/commands/requests.ts`.

Needs the user: none
