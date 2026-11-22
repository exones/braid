import assert from "node:assert/strict";
import { test } from "node:test";
import { readReply } from "../src/board/reply.ts";

const reply = (status: number, text: string, statusText = "") => ({ ok: status >= 200 && status < 300, status, statusText, text: async () => text });

test("an ok JSON reply is parsed", async () => {
  assert.deepEqual(await readReply(reply(200, '{"a":1}')), { a: 1 });
});

test("an error reply with a JSON error shows that text", async () => {
  await assert.rejects(readReply(reply(403, '{"error":"refresh and retry"}')), /^Error: refresh and retry$/);
});

test("an error reply that isn't JSON shows the status and text, never a parse error", async () => {
  await assert.rejects(readReply(reply(403, "forbidden")), (e: Error) => e.message === "403 forbidden");
  await assert.rejects(readReply(reply(502, "", "Bad Gateway")), (e: Error) => e.message === "502 Bad Gateway");
  await assert.rejects(readReply(reply(500, "<html>oops</html>")), (e: Error) => !/JSON|Unexpected token/.test(e.message) && /500/.test(e.message));
});
