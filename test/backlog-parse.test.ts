import assert from "node:assert/strict";
import { test } from "node:test";
import { checks, list, marked, splitFile, text } from "../dist/backlog/parse.js";

const task = [
  "---",
  "id: TASK-2.1",
  "title: 'Spike: Backlog.md''s implementation'",
  "labels:",
  "  - kind:spike",
  "dependencies: []",
  "documentation:",
  "  - >-",
  "    backlog/docs/doc-4 -",
  "    TASK-2-report.md",
  "  - plain/path.md",
  "ordinal: 10",
  "---",
  "",
  "## Description",
  "",
  "<!-- SECTION:DESCRIPTION:BEGIN -->",
  "Goal text",
  "<!-- SECTION:DESCRIPTION:END -->",
  "",
  "<!-- AC:BEGIN -->",
  "- [x] #1 Done thing",
  "- [ ] #2 Open thing",
  "<!-- AC:END -->",
  "",
].join("\n");

for (const [name, input] of [
  ["LF", task],
  ["CRLF", task.replaceAll("\n", "\r\n")],
] as const) {
  test(`splitFile reads quoted, listed and folded values (${name})`, () => {
    const { fields, body } = splitFile(input, "t.md");
    assert.equal(text(fields, "id"), "TASK-2.1");
    assert.equal(text(fields, "title"), "Spike: Backlog.md's implementation");
    assert.deepEqual(list(fields, "labels", "t.md"), ["kind:spike"]);
    assert.deepEqual(list(fields, "dependencies", "t.md"), []);
    assert.deepEqual(list(fields, "documentation", "t.md"), ["backlog/docs/doc-4 - TASK-2-report.md", "plain/path.md"]);
    assert.equal(text(fields, "ordinal"), "10");
    assert.equal(marked(body, "SECTION:DESCRIPTION", "t.md"), "Goal text");
    assert.deepEqual(checks(marked(body, "AC", "t.md"), "t.md", "acceptance criteria"), [
      { done: true, text: "Done thing" },
      { done: false, text: "Open thing" },
    ]);
  });
}

test("a missing section is null and gives no checks; a missing key is absent", () => {
  const { fields, body } = splitFile(task, "t.md");
  assert.equal(marked(body, "SECTION:NOTES", "t.md"), null);
  assert.deepEqual(checks(marked(body, "DOD", "t.md"), "t.md", "definition of done"), []);
  assert.equal(text(fields, "milestone"), null);
  assert.deepEqual(list(fields, "milestone", "t.md"), []);
});

test("bad input names the file and the problem", () => {
  assert.throws(() => splitFile("no front matter", "a.md"), /must start with ---/);
  assert.throws(() => splitFile("---\nid: x\n", "a.md"), /not closed/);
  assert.throws(() => marked("<!-- AC:BEGIN -->\n- [ ] x", "AC", "a.md"), /no matching/);
  assert.throws(() => checks("not a checkbox", "a.md", "acceptance criteria"), /not a checkbox/);
});
