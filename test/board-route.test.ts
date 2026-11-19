import assert from "node:assert/strict";
import { test } from "node:test";
import { hashFor, parseHash } from "../src/board/route.ts";

test("the bare hash is the board with no details", () => {
  for (const hash of ["", "#", "#/"]) {
    assert.deepEqual(parseHash(hash), { id: null, inbox: false, tab: "brief" });
  }
});

test("an item hash keeps the board as the base view and names the item and tab", () => {
  assert.deepEqual(parseHash("#/0003"), { id: "0003", inbox: false, tab: "brief" });
  assert.deepEqual(parseHash("#/0003/A?tab=report"), { id: "0003/A", inbox: false, tab: "report" });
  assert.deepEqual(parseHash("#/0034?tab=logs"), { id: "0034", inbox: false, tab: "logs" });
});

test("the inbox is a page, not an item", () => {
  assert.deepEqual(parseHash("#/inbox"), { id: null, inbox: true, tab: "brief" });
});

test("hashFor round-trips through parseHash", () => {
  for (const [id, tab] of [[null, "brief"], ["0003", "brief"], ["0003/A", "logs"]] as const) {
    const route = parseHash(hashFor(id, tab));
    assert.equal(route.id, id);
    assert.equal(route.tab, tab);
  }
  assert.equal(hashFor("0003"), "#/0003");
  assert.equal(hashFor("0003/A", "report"), "#/0003/A?tab=report");
  assert.equal(hashFor(null), "#/");
});
