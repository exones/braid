import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { get, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const fixture = fileURLToPath(new URL("./fixtures/braids-repo", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "braid-board-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

let repos = 0;
function repo(files: Record<string, string>): string {
  const root = join(scratch, `repo-${++repos}`);
  mkdirSync(join(root, ".git"), { recursive: true });
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

const brief = (id: string, status: string, extra = "") => `---\nid: '${id}'\ntitle: T ${id}\nstatus: ${status}\n${extra}---\n\n## Goal\n\nDo ${id}.\n`;

function braid(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", cwd });
}

test("check passes on a clean folder and on no braids/ folder", () => {
  const clean = braid(fixture, "check");
  assert.equal(clean.status, 0);
  assert.match(clean.stdout, /^braids OK: 3 braids, 3 strands\n$/);
  assert.equal(braid(repo({}), "check").status, 0);
});

test("check lists every broken brief with its file and exits 2", () => {
  const root = repo({
    "braids/0001-a/brief.md": brief("0001", "Nope"),
    "braids/0001-a/A-x/brief.md": brief("0001/A", "To Do", "delivery: main\n"),
    "braids/0001-a/B-y/brief.md": brief("0001/B", "To Do"),
    "braids/0001-a/C-z/readme.md": "no brief here",
    "braids/0002-b/brief.md": brief("0009", "To Do"),
    "braids/0003-c/brief.md": brief("0003", "Done"),
    "braids/Oops/brief.md": "x",
  });
  const r = braid(root, "check");
  assert.equal(r.status, 2);
  assert.equal(r.stdout, "");
  const lines = r.stderr.trimEnd().split("\n");
  assert.equal(lines.length, 6);
  assert.match(lines[0] ?? "", /^braids\/0001-a\/brief\.md: line \d+: status must be one of/);
  assert.match(lines[1] ?? "", /^braids\/0001-a\/A-x\/brief\.md: line \d+: delivery is set per braid/);
  assert.match(lines[2] ?? "", /^braids\/0001-a\/C-z\/brief\.md: file is missing$/);
  assert.match(lines[3] ?? "", /^braids\/0002-b\/brief\.md: line \d+: id 0009 does not match its folder/);
  assert.match(lines[4] ?? "", /^braids\/Oops: folder name must be/);
  assert.equal(lines[5], "5 errors");
});

test("check reports duplicate numbers and strand letters", () => {
  const root = repo({
    "braids/0001-a/brief.md": brief("0001", "To Do"),
    "braids/0001-b/brief.md": brief("0001", "To Do"),
    "braids/0002-c/brief.md": brief("0002", "To Do"),
    "braids/0002-c/A-x/brief.md": brief("0002/A", "To Do"),
    "braids/0002-c/A-y/brief.md": brief("0002/A", "To Do"),
  });
  const r = braid(root, "check");
  assert.equal(r.status, 2);
  const errors = r.stderr.trimEnd().split("\n");
  assert.equal(errors.length, 3);
  assert.match(errors[0] ?? "", /0001-b: braid number 0001 is also used by 0001-a/);
  assert.match(errors[1] ?? "", /A-y: strand letter A is also used by A-x/);
});

/** Runs `braid board --no-open` in `root` and calls `run` with the printed address. */
async function withBoard<T>(root: string, run: (url: string) => Promise<T>): Promise<T> {
  const child = spawn(process.execPath, [cli, "board", "--no-open"], { cwd: root });
  try {
    const url = await new Promise<string>((resolve, reject) => {
      let out = "";
      child.stdout.on("data", (chunk: Buffer) => {
        out += chunk.toString();
        const m = /braid board: (http:\/\/127\.0\.0\.1:\d+\/)/.exec(out);
        if (m?.[1]) resolve(m[1]);
      });
      child.on("error", reject);
      child.on("exit", () => reject(new Error(`exited: ${out}`)));
    });
    return await run(url);
  } finally {
    child.kill();
  }
}

const lanesRepo = () =>
  repo({
    "braids/0001-done/brief.md": brief("0001", "Done"),
    "braids/0002-mix/brief.md": brief("0002", "In Progress"),
    "braids/0002-mix/A-a/brief.md": brief("0002/A", "Done"),
    "braids/0002-mix/A-a/report.md": "## Done\n\nIt works.\n",
    "braids/0002-mix/B-b/brief.md": brief("0002/B", "To Do"),
    "braids/0002-mix/B-b/log-2026-11-13-2831f09b.md": "## 2026-11-13 14:05Z\n\nHello.\n",
    "braids/0003-idea/brief.md": brief("0003", "Outline"),
    "braids/0004-fin/brief.md": brief("0004", "To Do"),
    "braids/0004-fin/A-a/brief.md": brief("0004/A", "Done"),
    "braids/0005-run/brief.md": brief("0005", "To Do"),
    "braids/0005-run/A-a/brief.md": brief("0005/A", "To Do"),
    "braids/0005-run/B-b/brief.md": brief("0005/B", "In Progress"),
  });

test("the board API puts each braid in its most urgent strand's lane", async () => {
  await withBoard(lanesRepo(), async (url) => {
    assert.match(url, /^http:\/\/127\.0\.0\.1:\d+\/$/);
    const data = (await (await fetch(`${url}api/board`)).json()) as {
      repo: string;
      lanes: string[];
      braids: { id: string; lane: string; done: number; total: number }[];
    };
    assert.match(data.repo, /^repo-\d+$/);
    assert.deepEqual(data.lanes, ["To Do", "In Progress", "In Review", "Waiting", "Done"]);
    const lane = Object.fromEntries(data.braids.map((b) => [b.id, b.lane]));
    assert.deepEqual(lane, {
      "0001": "Done",
      "0002": "To Do",
      "0003": "To Do",
      "0004": "Done",
      "0005": "In Progress",
    });
    const mix = data.braids.find((b) => b.id === "0002");
    assert.equal(mix?.done, 1);
    assert.equal(mix?.total, 2);
  });
});

test("the item API returns brief, report and logs, and rejects bad ids", async () => {
  await withBoard(lanesRepo(), async (url) => {
    const a = (await (await fetch(`${url}api/item?id=0002/A`)).json()) as { brief: string; report: string; logs: unknown[] };
    assert.match(a.brief, /Do 0002\/A\./);
    assert.match(a.report, /It works/);
    assert.deepEqual(a.logs, []);
    const b = (await (await fetch(`${url}api/item?id=0002/B`)).json()) as { report: null; logs: { name: string; text: string }[] };
    assert.equal(b.report, null);
    assert.equal(b.logs[0]?.name, "log-2026-11-13-2831f09b.md");
    assert.match(b.logs[0]?.text ?? "", /Hello\./);
    assert.equal((await fetch(`${url}api/item?id=0009`)).status, 404);
    assert.equal((await fetch(`${url}api/item?id=zzz`)).status, 400);
    assert.equal((await fetch(`${url}api/item`)).status, 400);
  });
});

test("a broken brief gives a 500 that points at braid check", async () => {
  const root = repo({ "braids/0001-a/brief.md": brief("0001", "Nope") });
  await withBoard(root, async (url) => {
    const r = await fetch(`${url}api/board`);
    assert.equal(r.status, 500);
    assert.match(((await r.json()) as { error: string }).error, /0001-a\/brief\.md.*Run braid check/);
  });
});

function rawStatus(url: string, path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    get({ host: "127.0.0.1", port: new URL(url).port, path }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    }).on("error", reject);
  });
}

test("braid board serves the built page and nothing outside it", async () => {
  await withBoard(repo({}), async (url) => {
    assert.match(await (await fetch(url)).text(), /<div id="root">/);
    assert.equal((await fetch(`${url}missing.js`)).status, 404);
    assert.equal(await rawStatus(url, "/..%2fpackage.json"), 404);
    assert.equal(await rawStatus(url, "/%2e%2e/package.json"), 404);
    assert.equal((await fetch(url, { method: "POST" })).status, 405);
    assert.equal((await (await fetch(`${url}api/board`)).json() as { braids: unknown[] }).braids.length, 0);
  });
});

test("the server binds to 127.0.0.1 only", async () => {
  // A computed specifier keeps the compiled module out of the typecheck, which runs before the build.
  const compiled = fileURLToPath(new URL("../dist/commands/board.js", import.meta.url));
  const mod = (await import(pathToFileURL(compiled).href)) as {
    startBoard: (root: string) => Promise<{ server: Server; url: string }>;
  };
  const { server, url } = await mod.startBoard(repo({}));
  try {
    const address = server.address() as AddressInfo;
    assert.equal(address.address, "127.0.0.1");
    assert.equal(address.family, "IPv4");
    assert.equal(url, `http://127.0.0.1:${address.port}/`);
  } finally {
    server.close();
    server.closeAllConnections();
  }
});
