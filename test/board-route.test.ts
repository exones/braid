import assert from "node:assert/strict";
import { test } from "node:test";
import { closeMode, hashFor, openMode, parseHash, pushedAfter } from "../src/board/route.ts";

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

test("opening from the bare board pushes an entry; inside open details it replaces", () => {
  for (const hash of ["", "#", "#/", "#/inbox"]) {
    assert.equal(openMode(hash), "push", hash);
  }
  for (const hash of ["#/0003", "#/0003/A?tab=report"]) {
    assert.equal(openMode(hash), "replace", hash);
  }
});

test("closing goes Back when the entry was pushed; a link opened on a fresh load closes by replace", () => {
  assert.equal(closeMode(true), "back");
  assert.equal(closeMode(false), "replace");
  // A fresh load on #/0003: nothing was pushed, so the panel closes to #/ without leaving the site.
  assert.equal(closeMode(pushedAfter(false, parseHash("#/0003"))), "replace");
  // Board, then open (push), then move to another item (replace): still one pushed entry, one Back closes.
  let pushed = false;
  if (openMode("#/") === "push") {
    pushed = true;
  }
  pushed = pushedAfter(pushed, parseHash("#/0003"));
  assert.equal(openMode("#/0003"), "replace");
  pushed = pushedAfter(pushed, parseHash("#/0004"));
  assert.equal(closeMode(pushed), "back");
});

test("reaching the bare board forgets the pushed entry", () => {
  assert.equal(pushedAfter(true, parseHash("#/")), false);
  assert.equal(pushedAfter(true, parseHash("#/0003")), true);
});
