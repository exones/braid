import assert from "node:assert/strict";
import { test } from "node:test";
import { copyText, type CopyEnv, type CopyTextarea } from "../src/board/copy.ts";
import { TAG_COLOURS } from "../web/src/palette.ts";

function fakeDocument(ok = true) {
  const log: string[] = [];
  const area: CopyTextarea & { removed?: boolean } = {
    value: "",
    readOnly: true,
    style: {},
    setAttribute() {},
    focus: () => log.push("focus"),
    select: () => log.push("select"),
    setSelectionRange: (a, b) => log.push(`range ${a}-${b}`),
  };
  const document: NonNullable<CopyEnv["document"]> = {
    createElement: () => area,
    body: { appendChild: () => log.push("append"), removeChild: () => log.push("remove") },
    execCommand: () => (log.push("copy"), ok),
  };
  return { document, area, log };
}

test("a secure context uses the clipboard API", async () => {
  const written: string[] = [];
  const { document, log } = fakeDocument();
  const ok = await copyText("q-7f3k", { isSecureContext: true, clipboard: { writeText: async (t) => void written.push(t) }, document });
  assert.equal(ok, true);
  assert.deepEqual(written, ["q-7f3k"]);
  assert.deepEqual(log, []);
});

test("without a secure context or a clipboard it falls back to a hidden textarea", async () => {
  for (const env of [{ isSecureContext: false, clipboard: { writeText: async () => assert.fail("no") } }, { isSecureContext: true }]) {
    const { document, area, log } = fakeDocument();
    assert.equal(await copyText("q-7f3k", { ...env, document }), true);
    assert.equal(area.value, "q-7f3k");
    assert.equal(area.readOnly, false);
    assert.equal(area.style["fontSize"], "16px");
    assert.deepEqual(log, ["append", "focus", "select", "range 0-6", "copy", "remove"]);
  }
});

test("a rejected clipboard write falls back; a failed copy resolves false and cleans up", async () => {
  const a = fakeDocument();
  assert.equal(await copyText("q-1", { isSecureContext: true, clipboard: { writeText: async () => Promise.reject(new Error("denied")) }, document: a.document }), true);
  const b = fakeDocument(false);
  assert.equal(await copyText("q-1", { document: b.document }), false);
  assert.equal(b.log.at(-1), "remove");
  assert.equal(await copyText("q-1", {}), false);
});

test("project tag colours have no warm hue and are distinct", () => {
  const warm = /(red|pink|rose|orange|amber|yellow|fuchsia)-/;
  for (const c of TAG_COLOURS) {
    assert.doesNotMatch(`${c.dot} ${c.text} ${c.border}`, warm);
  }
  assert.equal(new Set(TAG_COLOURS.map((c) => c.dot)).size, TAG_COLOURS.length);
});
