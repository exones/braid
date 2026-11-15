# 0014/F: braid done ignores the coordinator thread

**What changed:** `braid done` no longer counts the caller's own thread (`--thread`) as a running worker. The refusal for another running thread now names its id and title (`T3Thread` gained an optional `title`). The braid skill's `braid done` commands now all pass `--thread <your thread id>`; `docs/braids-format.md` has a sentence on the skip.

**Why:** a coordinator whose checkout is on the braid branch is matched to its own braid, so every braid finish was refused.

**Validation:** `test/done.test.ts` covers: another running thread refuses and is named, the caller's thread is skipped when passed, and with only the caller's thread running the check passes (the next refusal is reached). `npm run verify` passes.

**Open:** nothing.

For later items: the board still shows a braid as Working while the coordinator's checkout is on its branch (braid 0015 territory); a caller without `--thread` still gets blocked by its own thread.

Needs the user: none
