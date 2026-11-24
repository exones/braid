// The request record on `braid-requests`: one file per request with a code and events that only grow,
// written like the inbox (no checkout, pushed at once, a refused push redone, offline kept local), and the
// old `.braid/requests.json` carried over once.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-record-test-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const R: any = await load("../dist/braids/requests.js");
const B: any = await load("../dist/braids/gitbranch.js");
const { requestsCommand }: any = await load("../dist/commands/requests.js");

const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};

/** A bare origin and `n` clones of it, each with an identity. */
function world(n = 2): { origin: string; clones: string[] } {
  const base = mkdtempSync(join(scratch, "w-"));
  const origin = join(base, "origin.git");
  git(base, "init", "-q", "--bare", "origin.git");
  const seed = join(base, "seed");
  git(base, "init", "-q", "-b", "main", "seed");
  writeFileSync(join(seed, "README.md"), "x\n");
  git(seed, "add", "-A");
  git(seed, "-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-q", "-m", "init");
  git(seed, "remote", "add", "origin", origin);
  git(seed, "push", "-q", "origin", "main");
  const clones = Array.from({ length: n }, (_, i) => {
    const dir = join(base, `c${i}`);
    git(base, "clone", "-q", origin, `c${i}`);
    git(dir, "config", "user.email", `c${i}@example.com`);
    git(dir, "config", "user.name", `c${i}`);
    return dir;
  });
  return { origin, clones };
}

const q = (id: string, extra: object = {}) => ({ id, kind: "question", text: `about ${id}`, at: "2026-11-23T10:00:00.000Z", thread: null, ...extra });
const onOrigin = (origin: string) => git(origin, "ls-tree", "-r", "--name-only", "braid-requests").split("\n").filter((p) => p !== "");
const fileOn = (origin: string, code: string) => JSON.parse(git(origin, "show", `braid-requests:requests/${code}.json`));

test("a request round-trips through its file: fields fixed at opening, every change an event, nothing deleted", () => {
  const { origin, clones } = world(1);
  const root = clones[0] as string;
  const { code, warning } = R.openRequest(root, q("0001/A", { key: "scope", to: "pm", pm: "pm-thread-1234" }));
  assert.match(code, /^q-[a-z0-9]{4}$/);
  assert.equal(warning, null);
  assert.deepEqual(onOrigin(origin), [`requests/${code}.json`]);
  const file = fileOn(origin, code);
  assert.deepEqual(file, {
    code,
    item: "0001/A",
    kind: "question",
    text: "about 0001/A",
    key: "scope",
    by: "coordinator",
    thread: null,
    to: "pm",
    pm: "pm-thread-1234",
    doneWhen: "answered",
    eta: null,
    events: [{ event: "opened", at: "2026-11-23T10:00:00.000Z", by: "coordinator" }],
  });
  R.forwardRequest(root, "0001/A", "2026-11-23T10:05:00.000Z", "your call");
  assert.equal(R.closeRequest(root, "0001/A", "coordinator", { state: "answered", who: "coordinator", text: "B", at: "2026-11-23T10:10:00.000Z" }).found, true);
  const [r] = R.loadRecord(root).requests;
  assert.deepEqual([r.state, r.to, r.forwarded, r.note], ["answered", "user", "2026-11-23T10:05:00.000Z", "your call"]);
  assert.deepEqual(
    fileOn(origin, code).events.map((e: any) => [e.event, e.by, e.text]),
    [
      ["opened", "coordinator", undefined],
      ["forwarded", "pm", "your call"],
      ["answered", "coordinator", "B"],
    ],
  );
  assert.equal(fileOn(origin, code).to, "pm", "the fields stay as opened; the forward is an event");
  assert.deepEqual(R.loadRequests(root), [], "closed requests aren't open, but their files stay");
  assert.deepEqual(onOrigin(origin), [`requests/${code}.json`]);
});

test("codes are unique on the branch, and a review's done-when is its PR", () => {
  const { clones } = world(1);
  const root = clones[0] as string;
  const codes = Array.from({ length: 12 }, (_, i) => R.openRequest(root, q(`00${10 + i}`)).code);
  assert.equal(new Set(codes).size, 12);
  const { code } = R.openRequest(root, q("0002", { kind: "review", pr: 7, head: "a".repeat(40) }));
  assert.equal(R.loadRequests(root).find((r: any) => r.code === code).doneWhen, "pr:7");
});

test("a new request from the same asker on the same item withdraws the open one; the other asker's stays", () => {
  const { clones } = world(1);
  const root = clones[0] as string;
  const first = R.openRequest(root, q("0003")).code;
  const pm = R.openRequest(root, q("0003", { by: "pm" })).code;
  const second = R.openRequest(root, q("0003", { at: "2026-11-23T11:00:00.000Z" })).code;
  const all = new Map(R.loadRecord(root).requests.map((r: any) => [r.code, r]));
  assert.deepEqual([(all.get(first) as any).state, (all.get(pm) as any).state, (all.get(second) as any).state], ["withdrawn", "open", "open"]);
  assert.deepEqual((all.get(first) as any).events.at(-1), { event: "withdrawn", at: "2026-11-23T11:00:00.000Z", by: "coordinator", text: `replaced by ${second}` });
});

test("a wait doesn't withdraw its asker's open question on the item, nor a question a wait (rf9z)", () => {
  const { clones } = world(1);
  const root = clones[0] as string;
  const question = R.openRequest(root, q("0003", { to: "pm", pm: "pm-thread-1234" })).code;
  const wait = R.openRequest(root, q("0003", { to: "0004", doneWhen: "braid:0004", at: "2026-11-23T10:05:00.000Z" })).code;
  const other = R.openRequest(root, q("0003", { to: "0005", doneWhen: "braid:0005", at: "2026-11-23T10:06:00.000Z" })).code;
  const user = R.openRequest(root, q("0003", { at: "2026-11-23T10:10:00.000Z" })).code;
  const state = () => new Map(R.loadRecord(root).requests.map((r: any) => [r.code, r.state]));
  assert.deepEqual([question, wait, other, user].map((c) => state().get(c)), ["withdrawn", "open", "open", "open"], "the question to the user replaced the one to the PM; both waits stay");
  assert.equal(R.loadRecord(root).requests.find((r: any) => r.code === question).events.at(-1).text, `replaced by ${user}`);
});

test("a wait replaces only its asker's wait to the same braid", () => {
  const { clones } = world(1);
  const root = clones[0] as string;
  const question = R.openRequest(root, q("0003")).code;
  const first = R.openRequest(root, q("0003", { to: "0004", doneWhen: "braid:0004", at: "2026-11-23T10:05:00.000Z" })).code;
  const second = R.openRequest(root, q("0003", { to: "0004", doneWhen: "time:2026-11-24T00:00:00.000Z", at: "2026-11-23T10:06:00.000Z" })).code;
  const pmWait = R.openRequest(root, q("0003", { by: "pm", to: "0004", at: "2026-11-23T10:07:00.000Z" })).code;
  const state = new Map(R.loadRecord(root).requests.map((r: any) => [r.code, r.state]));
  assert.deepEqual([question, first, second, pmWait].map((c) => state.get(c)), ["open", "withdrawn", "open", "open"]);
});

test("a refused push is fetched and redone on top: both writes land", () => {
  const { origin, clones } = world(2);
  const [a, b] = clones as [string, string];
  R.openRequest(a, q("0001"));
  let other = "";
  let calls = 0;
  const result = B.writeBranch(b, R.REQUESTS, (view: any) => {
    calls++;
    if (calls === 1) {
      other = R.openRequest(a, q("0002")).code; // lands on origin between b's fetch and its push
    }
    return { files: new Map([["requests/q-zzzz.json", JSON.stringify({ code: "q-zzzz", item: "0003", kind: "question", text: "x", by: "coordinator", thread: null, to: "user", doneWhen: "answered", eta: null, events: [{ event: "opened", at: "2026-11-23T10:00:00.000Z", by: "coordinator" }] })]]), message: `saw ${view.paths().length}` };
  });
  assert.equal(calls, 2, "the change ran again on the fetched tip");
  assert.equal(result.pushed, true);
  assert.equal(onOrigin(origin).length, 3);
  assert.ok(onOrigin(origin).includes(`requests/${other}.json`));
  assert.ok(onOrigin(origin).includes("requests/q-zzzz.json"));
});

test("two clones writing at once lose no request", async () => {
  const { origin, clones } = world(2);
  const script = join(scratch, "open.mjs");
  writeFileSync(
    script,
    `import { openRequest } from ${JSON.stringify(pathToFileURL(fileURLToPath(new URL("../dist/braids/requests.js", import.meta.url))).href)};
const [root, prefix] = process.argv.slice(2);
for (let i = 0; i < 3; i++) openRequest(root, { id: prefix + i, kind: "question", text: "x", at: new Date().toISOString(), thread: null });`,
  );
  const run = (root: string, prefix: string) => new Promise<number | null>((done) => spawn(process.execPath, [script, root, prefix]).on("close", done));
  assert.deepEqual(await Promise.all([run(clones[0] as string, "000"), run(clones[1] as string, "001")]), [0, 0]);
  assert.equal(onOrigin(origin).length, 6);
});

test("offline, a request opens on the local branch and the next write pushes it; an offline change to a request the remote also changed keeps both events", () => {
  const { origin, clones } = world(2);
  const [a, b] = clones as [string, string];
  const shared = R.openRequest(a, q("0001", { to: "pm", pm: "pm-thread-1234" })).code;
  git(b, "fetch", "-q", "origin", "+refs/heads/braid-requests:refs/remotes/origin/braid-requests");
  git(a, "remote", "set-url", "origin", join(scratch, "nowhere.git"));
  const offline = R.openRequest(a, q("0002"));
  assert.match(offline.warning, /the request is on the local braid-requests branch and the next write pushes it/);
  assert.ok(R.loadRequests(a).some((r: any) => r.code === offline.code), "listed from the local branch");
  assert.ok(!onOrigin(origin).includes(`requests/${offline.code}.json`));
  // Offline, a answers the shared request; meanwhile b forwards it, online.
  R.closeRequest(a, "0001", "coordinator", { state: "answered", who: "coordinator", text: "A", at: "2026-11-23T10:20:00.000Z" });
  R.forwardRequest(b, "0001", "2026-11-23T10:10:00.000Z", "over to you");
  git(a, "remote", "set-url", "origin", origin);
  const next = R.openRequest(a, q("0003"));
  assert.equal(next.warning, null);
  const files = onOrigin(origin);
  assert.ok(files.includes(`requests/${offline.code}.json`) && files.includes(`requests/${next.code}.json`), "the offline request was pushed with the next write");
  assert.deepEqual(
    fileOn(origin, shared).events.map((e: any) => e.event),
    ["opened", "forwarded", "answered"],
    "both sides' events, in time order",
  );
});

test("a request file that doesn't parse is reported and skipped; the others still read", async () => {
  const { clones } = world(1);
  const root = clones[0] as string;
  const good = R.openRequest(root, q("0001")).code;
  B.writeBranch(root, R.REQUESTS, () => ({ files: new Map([["requests/q-bad1.json", "{ not json"]]), message: "bad" }));
  const { requests, problems } = R.loadRecord(root);
  assert.deepEqual(requests.map((r: any) => r.code), [good]);
  assert.deepEqual(problems.map((p: any) => p.file), ["requests/q-bad1.json"]);
  const out = (await requestsCommand(root, [], { gh: () => ({ status: 1, stdout: "", stderr: "" }) })) as string;
  assert.match(out, /^warning: skipped requests\/q-bad1\.json: not JSON/m);
  assert.match(out, new RegExp(`^${good}  0001  question`, "m"));
  assert.equal(R.openRequest(root, q("0002")).warning, null, "a bad file doesn't stop writes");
});

const legacy = (root: string, list: object[]) => {
  mkdirSync(dirname(R.legacyFile(root)), { recursive: true });
  writeFileSync(R.legacyFile(root), `${JSON.stringify(list, null, 2)}\n`);
};
const OLD = [
  { id: "0001", kind: "plan", text: "Approve?", at: "2026-11-20T09:00:00.000Z", thread: "mcp:launch:aaaaaaaa1111" },
  { id: "0002/B", by: "pm", kind: "question", text: "Which?", at: "2026-11-21T09:00:00.000Z", thread: null, to: "pm", pm: "pm-thread", forwarded: "2026-11-21T10:00:00.000Z", note: "yours" },
  { id: "0003", kind: "review", text: "review PR #9 at abcdef0", at: "2026-11-22T09:00:00.000Z", thread: null, pr: 9, head: "b".repeat(40) },
];

test("an old .braid/requests.json is carried over once, with codes and its times, and kept renamed", () => {
  const { origin, clones } = world(1);
  const root = clones[0] as string;
  legacy(root, OLD);
  const open = R.loadRequests(root);
  assert.equal(open.length, 3);
  assert.deepEqual(
    open.map((r: any) => [r.id, r.by ?? "coordinator", r.at, r.state]),
    [
      ["0001", "coordinator", "2026-11-20T09:00:00.000Z", "open"],
      ["0002/B", "pm", "2026-11-21T09:00:00.000Z", "open"],
      ["0003", "coordinator", "2026-11-22T09:00:00.000Z", "open"],
    ],
  );
  const pm = open.find((r: any) => r.id === "0002/B");
  assert.deepEqual([pm.to, pm.forwarded, pm.note], ["user", "2026-11-21T10:00:00.000Z", "yours"]);
  assert.deepEqual([open[2].pr, open[2].doneWhen], [9, "pr:9"]);
  assert.ok(open.every((r: any) => /^q-[a-z0-9]{4}$/.test(r.code)));
  assert.equal(existsSync(R.legacyFile(root)), false);
  assert.deepEqual(JSON.parse(readFileSync(join(root, ".braid", R.MIGRATED), "utf8")), OLD, "the old file is kept, renamed");
  // The board's read commits locally; the next write pushes it.
  R.openRequest(root, q("0004"));
  assert.equal(onOrigin(origin).length, 4);
  assert.equal(R.migrate(root), 0, "once");
});

test("a migration that died before the rename doesn't duplicate what it wrote", () => {
  const { clones } = world(1);
  const root = clones[0] as string;
  // The first record made it onto the branch, then the process died: the file is still there.
  R.openRequest(root, OLD[0]);
  legacy(root, OLD);
  assert.equal(R.migrate(root), 2);
  assert.equal(R.loadRecord(root).requests.length, 3);
  legacy(root, OLD);
  assert.equal(R.migrate(root), 0, "everything already there");
  assert.equal(R.loadRecord(root).requests.length, 3);
});

test("readers list from the local refs without fetching", () => {
  const { clones } = world(2);
  const [a, b] = clones as [string, string];
  R.openRequest(a, q("0001"));
  assert.deepEqual(R.loadRequests(b), [], "b hasn't fetched");
  B.fetchBranch(b, R.REQUESTS);
  assert.deepEqual(R.loadRequests(b).map((r: any) => r.id), ["0001"]);
});
