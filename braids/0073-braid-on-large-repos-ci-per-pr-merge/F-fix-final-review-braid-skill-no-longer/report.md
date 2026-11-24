# 0073/F report

## What changed

- The BRAID.md template (`.agents/skills/braid/assets/braid-md.md`) keeps every 0073 key with an example and one short clause; the long explanations left it. It points to `docs/getting-started.md`.
- `docs/getting-started.md` now holds what moved: the meaning of a `ci` list, `all`, `[]` and `none`, and the merge gate's details (nine minutes, exit 0, wrapper, `merge-gate-on`). Review bots, partial CI, caches and path stops were already explained there.
- Command names: getting-started no longer gives the 2-minute start grace to `braid accept`, `braid handover` and `braid recap`; only `braid wait` has it. The 0073 brief and 0073/C brief Completion boxes say `braid recap`, not `braid facts`.

## Size

Sum of `wc -w` over `.agents/skills/braid`: 12561 on `origin/main`, 12556 on this branch.

## Validation

`npm run verify` exits 0 (633 tests pass). `braid check` OK.

## Docs

`docs/getting-started.md` updated; `docs/cli.md`, `docs/braids-format.md` and D101 were already correct.

## Open

For later items: none.
Needs the user: none.
