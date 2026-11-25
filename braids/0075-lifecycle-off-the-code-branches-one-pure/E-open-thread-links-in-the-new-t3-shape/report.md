# 0075/E report

**What changed:** `t3codeUrl` (src/board/marks.ts) now accepts `/<env>/<thread>` and the new `/threads/<env>/<thread>` on any host; result stays `t3code://threads/<env>/<thread>`. Tests in test/marks.test.ts: both shapes, a delegated child's `%3A` id, and still-null shapes (extra segment, bare `/threads`).

**Why:** T3 changed thread links to `https://app.t3.codes/threads/<env>/<thread>`; the old regex returned null, so Open thread buttons, push links, steering chip and PM link lost their target.

**Callers checked:** all use `t3codeUrl(link)` as an opaque call. `linkOfThread` (model.ts 334) derives a link by replacing the last path segment of any accepted link, which works for the new shape (new test). No code builds links by the old shape.

**Docs:** docs/board.md (Open thread paragraph) updated; no other doc affected.

**Validation:** `npm run verify`: 684 node tests pass, 0 fail (I saw the tail of its output only).

**For later items:** none. **Needs the user:** none.
