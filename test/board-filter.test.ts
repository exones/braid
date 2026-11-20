import assert from "node:assert/strict";
import { test } from "node:test";
import { filterSearch, parseFilter, toggleProject } from "../src/board/filter.ts";

const served = ["demo", "api", "notes"];

test("no parameter shows every project", () => {
  assert.deepEqual(parseFilter("", served), served);
  assert.deepEqual(parseFilter("?x=1", served), served);
});

test("projects= picks any number, in served order, with the older project= form accepted", () => {
  assert.deepEqual(parseFilter("?projects=api", served), ["api"]);
  assert.deepEqual(parseFilter("?projects=notes,demo", served), ["demo", "notes"]);
  assert.deepEqual(parseFilter("?project=api", served), ["api"]);
  assert.deepEqual(parseFilter("?projects=%20api%20,,api", served), ["api"]);
});

test("names that aren't served are dropped; none left means every project", () => {
  assert.deepEqual(parseFilter("?projects=api,gone", served), ["api"]);
  assert.deepEqual(parseFilter("?projects=gone", served), served);
  assert.deepEqual(parseFilter("?projects=", served), served);
});

test("the query is empty for all, and round-trips for a subset", () => {
  assert.equal(filterSearch(served, served), "");
  assert.equal(filterSearch([], served), "");
  assert.equal(filterSearch(["api"], served), "?projects=api");
  assert.equal(filterSearch(["notes", "demo"], served), "?projects=demo,notes");
  for (const sel of [["api"], ["demo", "notes"]]) {
    assert.deepEqual(parseFilter(filterSearch(sel, served), served), sel);
  }
  assert.equal(filterSearch(["my app"], ["my app", "b"]), "?projects=my%20app");
  assert.deepEqual(parseFilter("?projects=my%20app", ["my app", "b"]), ["my app"]);
});

test("toggling ticks and unticks in served order, and never empties the board", () => {
  assert.deepEqual(toggleProject(["demo", "api"], "notes", served), ["demo", "api", "notes"]);
  assert.deepEqual(toggleProject(["demo", "api"], "demo", served), ["api"]);
  assert.deepEqual(toggleProject(["notes"], "demo", served), ["demo", "notes"]);
  assert.deepEqual(toggleProject(["api"], "api", served), ["api"]);
});
