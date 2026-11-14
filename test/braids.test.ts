import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const fixture = fileURLToPath(new URL("./fixtures/braids-repo", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "braid-braids-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

function braid(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", cwd });
}

let repos = 0;
/** A repository with a `.git` marker and the given files under it. */
function repo(files: Record<string, string>): string {
  const root = join(scratch, `repo-${++repos}`);
  mkdirSync(join(root, ".git"), { recursive: true });
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

const good = "---\nid: '0001'\ntitle: One\nstatus: To Do\n---\n";

test("list shows braids by number and strands in run order", () => {
  const r = braid(fixture, "list");
  assert.equal(r.stderr, "");
  assert.equal(r.status, 0);
  assert.equal(
    r.stdout,
    [
      "0001  Done         Fresh start",
      "0002  In Progress  Braids folder: the format",
      "  0002/A  Done          1  Read braids",
      "  0002/C  Outline       2  Logs and reports",
      "  0002/B  To Do         3  Create and edit",
      "0003  Outline      Read-only board",
      "",
    ].join("\n"),
  );
});

test("list works from a subfolder of the repository", () => {
  const r = braid(join(fixture, "braids", "0002-braids-folder", "A-read"), "list");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^0001 {2}Done/);
});

test("view shows a braid with its fields, files, strands and brief", () => {
  const r = braid(fixture, "view", "0002");
  assert.equal(r.status, 0);
  assert.equal(
    r.stdout,
    [
      "0002  Braids folder: the format",
      "",
      "Status: In Progress",
      "Labels: kind:story, tier:L",
      "Dependencies: 0001",
      "Order: none",
      "Delivery: epic",
      "Folder: braids/0002-braids-folder",
      "Report: none",
      "Logs:",
      "  log-2026-11-14-user.md",
      "Strands:",
      "  0002/A  Done          1  Read braids",
      "  0002/C  Outline       2  Logs and reports",
      "  0002/B  To Do         3  Create and edit  (needs 0002/A)",
      "",
      "## Goal",
      "",
      "braid tracks braids from the command line.",
      "",
    ].join("\n"),
  );
});

test("view reads block lists, delivery main, a report and logs", () => {
  const r = braid(fixture, "view", "1");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^Labels: kind:story, tier:M$/m);
  assert.match(r.stdout, /^Delivery: main$/m);
  assert.match(r.stdout, /^Report: report\.md$/m);
  assert.match(r.stdout, /^ {2}log-2026-11-13-2831f09b\.md$/m);
  assert.match(r.stdout, /^Strands: none$/m);
  assert.match(r.stdout, /## Working at the end/);
});

test("view shows a strand with its braid and no delivery mode", () => {
  for (const id of ["0002/A", "2/a"]) {
    const r = braid(fixture, "view", id);
    assert.equal(r.status, 0);
    assert.equal(
      r.stdout,
      [
        "0002/A  Read braids",
        "",
        "Status: Done",
        "Labels: none",
        "Dependencies: none",
        "Order: 1",
        "Folder: braids/0002-braids-folder/A-read",
        "Report: report.md",
        "Logs: none",
        "Braid: 0002  Braids folder: the format",
        "",
        "## Goal",
        "",
        "List and view.",
        "",
      ].join("\n"),
    );
  }
});

test("view without a body prints only the header", () => {
  const r = braid(fixture, "view", "0002/B");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^Dependencies: 0002\/A$/m);
  assert.match(r.stdout, /Braid: 0002 {2}Braids folder: the format\n$/);
});

test("usage errors exit 1", () => {
  const cases: [string[], string][] = [
    [["view"], "error: braid view needs an id, like 0002 or 0002/A\n"],
    [["view", "x"], "error: not a braid or strand id: x (expected like 0002 or 0002/A)\n"],
    [["view", "0009"], "error: no braid 0009\n"],
    [["view", "0002/Z"], "error: no strand 0002/Z\n"],
    [["view", "1", "2"], "error: braid view takes one id; got: 1 2\n"],
    [["list", "extra"], "error: braid list takes no arguments; got: extra\n"],
  ];
  for (const [args, stderr] of cases) {
    const r = braid(fixture, ...args);
    assert.equal(r.stderr, stderr, args.join(" "));
    assert.equal(r.status, 1);
  }
});

test("a repository without braids/ has no braids", () => {
  const r = braid(repo({}), "list");
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "No braids.\n");
});

test("CRLF briefs are read", () => {
  const root = repo({ "braids/0001-one/brief.md": good.replaceAll("\n", "\r\n") + "\r\n## Goal\r\n" });
  const r = braid(root, "list");
  assert.equal(r.stderr, "");
  assert.equal(r.stdout, "0001  To Do        One\n");
});

test("a brief with a UTF-8 BOM is read", () => {
  const root = repo({ "braids/0001-one/brief.md": `﻿${good}` });
  const r = braid(root, "list");
  assert.equal(r.stderr, "");
  assert.equal(r.stdout, "0001  To Do        One\n");
});

test("quoted list items keep escaped and doubled quotes and commas", () => {
  const root = repo({
    "braids/0001-one/brief.md":
      "---\nid: '0001'\ntitle: One\nstatus: To Do\nlabels: [\"a\\\"b\", 'c''d', \"e, f\"]\n---\n",
  });
  const r = braid(root, "view", "1");
  assert.equal(r.stderr, "");
  assert.match(r.stdout, /^Labels: a"b, c'd, e, f$/m);
});

test("strands without order run last, by letter", () => {
  const strand = (id: string, order?: number) =>
    `---\nid: ${id}\ntitle: S${id.slice(-1)}\nstatus: To Do\n${order === undefined ? "" : `order: ${order}\n`}---\n`;
  const root = repo({
    "braids/0001-one/brief.md": good,
    "braids/0001-one/D-d/brief.md": strand("0001/D"),
    "braids/0001-one/B-b/brief.md": strand("0001/B"),
    "braids/0001-one/C-c/brief.md": strand("0001/C", 1),
    "braids/0001-one/A-a/brief.md": strand("0001/A", 2),
  });
  const r = braid(root, "list");
  assert.equal(r.stderr, "");
  assert.equal(
    r.stdout,
    [
      "0001  To Do        One",
      "  0001/C  To Do         1  SC",
      "  0001/A  To Do         2  SA",
      "  0001/B  To Do         -  SB",
      "  0001/D  To Do         -  SD",
      "",
    ].join("\n"),
  );
});

test("temp folders and stray files are ignored", () => {
  const root = repo({
    "braids/README.md": "# Braids\n",
    "braids/0001-one/brief.md": good,
    "braids/0001-one/temp/scratch.md": "not a brief\n",
    "braids/0001-one/log-bad.md": "ignored\n",
  });
  const r = braid(root, "view", "1");
  assert.equal(r.stderr, "");
  assert.match(r.stdout, /^Logs: none$/m);
  assert.match(r.stdout, /^Strands: none$/m);
});

test("malformed braids give a clear error naming the file and exit 2", () => {
  const brief = "braids/0001-one/brief.md";
  const front = (lines: string) => `---\n${lines}\n---\n`;
  const cases: [Record<string, string>, string][] = [
    [{ [brief]: "id: '0001'\n" }, `${brief}: line 1: expected front matter starting with ---`],
    [{ [brief]: "---\nid: '0001'\n" }, `${brief}: front matter is not closed with ---`],
    [{ [brief]: front("id: '0001'\ntitle: One") }, `${brief}: missing key: status`],
    [{ [brief]: front("id: '0001'\ntitle: One\nstatus: Doing") }, `${brief}: line 4: status must be one of Outline, To Do, In Progress, Done; got: Doing`],
    [{ [brief]: front("id: '0002'\ntitle: One\nstatus: Done") }, `${brief}: line 2: id 0002 does not match its folder (expected 0001)`],
    [{ [brief]: front("id: '0001'\ntitle: One\nstatus: Done\nowner: me") }, `${brief}: line 5: unknown key: owner`],
    [{ [brief]: front("id: '0001'\ntitle: One\nstatus: Done\nlabels: a, b") }, `${brief}: line 5: labels must be a list, like [a, b]`],
    [{ [brief]: front("id: '0001'\ntitle: One\nstatus: Done\nlabels: [a, b") }, `${brief}: line 5: inline list is not closed with ]`],
    [{ [brief]: front("id: '0001'\ntitle: 'One\nstatus: Done") }, `${brief}: line 3: unterminated single-quoted string`],
    [{ [brief]: front("id: '0001'\nid: '0001'") }, `${brief}: line 3: duplicate key: id`],
    [{ [brief]: front("id: '0001'\n  - stray") }, `${brief}: line 3: list item without a list key`],
    [{ [brief]: front("id: '0001'\njust text") }, `${brief}: line 3: expected "key: value", got: just text`],
    [{ [brief]: front("id: '0001'\ntitle: One\nstatus: Done\norder: first") }, `${brief}: line 5: order must be a whole number; got: first`],
    [{ [brief]: front("id: '0001'\ntitle: One\nstatus: Done\ndelivery: trunk") }, `${brief}: line 5: delivery must be epic or main; got: trunk`],
    [{ [brief]: front("id: '0001'\ntitle: One\nstatus: Done\ndependencies: [TASK-1]") }, `${brief}: line 5: dependency must be a braid or strand id like 0002 or 0002/A; got: TASK-1`],
    [{ [brief]: front("id: '0001'\ntitle: One\nstatus: Done\ndependencies: ['0001']") }, `${brief}: line 5: 0001 depends on itself`],
    [{ "braids/0001-one/report.md": "# Report\n" }, `${brief}: file is missing`],
    [{ "braids/one/brief.md": good }, "braids/one: folder name must be <4 digits>-<slug>, like 0002-braids-folder"],
    [{ [brief]: good, "braids/0001-two/brief.md": good }, "braids/0001-two: braid number 0001 is also used by 0001-one"],
    [
      { [brief]: good, "braids/0001-one/A-x/brief.md": front("id: 0001/A\ntitle: S\nstatus: To Do\ndelivery: main") },
      "braids/0001-one/A-x/brief.md: line 5: delivery is set per braid, not per strand",
    ],
    [
      {
        [brief]: good,
        "braids/0001-one/A-x/brief.md": front("id: 0001/A\ntitle: S\nstatus: To Do"),
        "braids/0001-one/A-y/brief.md": front("id: 0001/A\ntitle: S\nstatus: To Do"),
      },
      "braids/0001-one/A-y: strand letter A is also used by A-x",
    ],
  ];
  for (const [files, message] of cases) {
    const r = braid(repo(files), "list");
    assert.equal(r.stderr, `error: ${message}\n`);
    assert.equal(r.stdout, "");
    assert.equal(r.status, 2);
  }
});

test("view shows each strand's dependencies; list does not", () => {
  const strand = (id: string, deps: string) =>
    `---\nid: ${id}\ntitle: S${id.slice(-1)}\nstatus: To Do\n${deps}---\n`;
  const root = repo({
    "braids/0001-one/brief.md": good,
    "braids/0001-one/A-a/brief.md": strand("0001/A", ""),
    "braids/0001-one/B-b/brief.md": strand("0001/B", "dependencies: ['0001/A']\n"),
    "braids/0001-one/C-c/brief.md": strand("0001/C", "dependencies: ['0001/A', '0001/B']\n"),
  });
  const view = braid(root, "view", "1");
  assert.equal(view.stderr, "");
  assert.match(view.stdout, /^ {2}0001\/A {2}To Do {9}- {2}SA$/m);
  assert.match(view.stdout, /^ {2}0001\/B {2}To Do {9}- {2}SB {2}\(needs 0001\/A\)$/m);
  assert.match(view.stdout, /^ {2}0001\/C {2}To Do {9}- {2}SC {2}\(needs 0001\/A, 0001\/B\)$/m);
  assert.doesNotMatch(braid(root, "list").stdout, /needs/);
});
