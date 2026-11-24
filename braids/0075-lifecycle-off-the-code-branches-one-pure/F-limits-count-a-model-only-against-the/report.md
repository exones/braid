# 0075/F report

**What changed:** `SCOPED_WINDOWS` in `src/braids/limits.ts` now maps a window to the models it bills by pattern (`only` or `except`). For Cursor, "Cursor Models" (`autoPercentUsed`) counts only for grok, composer and auto models; "Other Models" (`apiPercentUsed`) counts for every other model; "Overall" and all other providers' windows count for everyone, as before. The board and `braid limits` share `readProvider`, so both are fixed.

**Why:** grok-4.6 is billed under Cursor Models but was paused by Other Models at 100%, blocking every review on cursor.

**New model mapping:** a model joins the Cursor Models pool by adding its name to `CURSOR_POOL` in `src/braids/limits.ts`; models not matched count against Other Models. No config added.

**Validation:** new test with fixtures `cursor_other_over` (today's reading: grok-4.6 ok, a non-pool model pauses on Other Models) and `cursor_total_over` (Overall pauses grok-4.6); claude fixtures unchanged. Gate: see PR.

**Docs:** `docs/cli.md` (Provider limits) updated; no others affected.

**Open:** the window ids (`apiPercentUsed`, `autoPercentUsed`) come from the brief; no real cursor cache was available in the fixtures.

For later items: none.
Needs the user: none.
