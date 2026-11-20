// One board for several projects (0049/C, docs/board.md "Several projects"): the combined board, boards per
// project, actions by project name, pushes per project, and the failure modes the brief names.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { request, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-projects-board-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
const web = join(scratch, "web");
mkdirSync(web);
writeFileSync(join(web, "index.html"), "<p>board</p>");

type Action = (body: unknown, board?: () => Promise<unknown>) => unknown;
interface Sources {
  repo: string;
  github(fresh: boolean): unknown;
  t3(fresh: boolean): Promise<unknown>;
  braids(): unknown;
  action(name: string): Action | undefined;
  notify?: (board: Board) => void;
  readiness?: (github: unknown) => unknown[];
}
interface Member {
  name: string;
  src: Sources;
}
interface Card {
  id: string;
  lane: string;
  project?: string;
}
interface Board {
  repo: string;
  braids: Card[];
  project?: string;
  failure?: string | null;
  readAt?: string | null;
}
interface ProjectInfo {
  name: string;
  repo: string;
  counts: Record<string, number>;
  problems: { key: string }[];
  readAt: string | null;
  ageMs: number | null;
  failure: string | null;
}
interface All {
  lanes: string[];
  projects: ProjectInfo[];
  braids: Card[];
  missing: string[];
}
interface Started {
  server: Server;
  url: string;
  token: string;
  close(): Promise<void>;
}
interface Push {
  title: string;
}
type Sender = (config: unknown, push: Push, token: string | null) => Promise<void>;

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const board = (await load("../dist/commands/board.js")) as {
  demoSources(): Sources;
  demoMembers(): Member[];
  startBoardWith(served: Sources | (() => readonly Member[]), web: string, refreshMs?: number, token?: string, tailnet?: undefined, port?: number, timeoutMs?: number): Promise<Started>;
  runBoard(root: string, args: readonly string[], tailscale: undefined, run: { gh?: unknown; t3?: unknown; projects?: () => { name: string; path: string }[]; notifier?: (root: string) => (b: Board) => void }): Promise<Started>;
};
const model = (await load("../dist/board/model.js")) as { toBoard(repo: string, braids: unknown, gh: unknown, t3: unknown, sig: unknown, start: unknown): Board };
const notifierMod = (await load("../dist/notify/notifier.js")) as {
  notifier(opts: { file: string; config: () => unknown; send: Sender; token: () => string | null; warn: (line: string) => void }): ((b: Board) => void) & { idle(): Promise<void> };
};

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));
const never = <T>() => new Promise<T>(() => {});

async function serve(served: Sources | (() => readonly Member[]), timeoutMs?: number) {
  const started = await board.startBoardWith(served, web, 600_000, undefined, undefined, 0, timeoutMs);
  after(() => {
    started.server.close();
    started.server.closeAllConnections();
  });
  const get = async <T>(path: string): Promise<{ status: number; body: T }> => {
    const response = await fetch(`${started.url}${path}`);
    return { status: response.status, body: (await response.json()) as T };
  };
  const act = async (name: string, body: unknown): Promise<{ status: number; body: { error?: string } & Record<string, unknown> }> => {
    const response = await fetch(`${started.url}api/action/${name}`, { method: "POST", headers: { "content-type": "application/json", "x-braid-token": started.token, "x-braid-request": "1" }, body: JSON.stringify(body) });
    return { status: response.status, body: (await response.json()) as { error?: string } };
  };
  return { ...started, get, act };
}

/** Two demo projects that act and notify on their own: each records the actions and boards it got. */
function pair(names: [string, string] = ["demo", "api"], repos?: [string, string]) {
  const members = board.demoMembers();
  const log = { acted: [] as string[], notified: [] as string[] };
  const make = (m: Member, repo: string | undefined): Member => ({
    name: m.name,
    src: {
      ...m.src,
      ...(repo === undefined ? {} : { repo }),
      action: (name) => (body) => (log.acted.push(`${m.name}:${name}:${JSON.stringify(body)}`), { ok: true, project: m.name }),
      notify: () => void log.notified.push(m.name),
    },
  });
  const [a, b] = names.map((n) => members.find((m) => m.name === n) ?? members[0]!);
  return { members: [make({ ...a!, name: names[0] }, repos?.[0]), make({ ...b!, name: names[1] }, repos?.[1])], log };
}

test("with two projects, /api/all is one combined board in the usual lanes, tagged, and ?projects= narrows it; /api/board?project= answers each", async () => {
  const { members } = pair();
  const { get } = await serve(() => members);
  const all = await get<All>("api/all");
  assert.equal(all.status, 200);
  assert.deepEqual(all.body.lanes, ["Waiting", "In Review", "In Progress", "To Do", "Done"]);
  assert.deepEqual(all.body.projects.map((p) => p.name), ["demo", "api"]);
  const demo = await get<Board>("api/board?project=demo");
  const api = await get<Board>("api/board?project=api");
  assert.equal(demo.body.project, "demo");
  assert.equal(api.body.project, "api");
  // The combined cards are each project's own cards, with their own lanes, tagged and in list order.
  const tagged = (b: Board, name: string) => b.braids.map((c) => ({ id: c.id, lane: c.lane, project: name }));
  assert.deepEqual(all.body.braids.map((c) => ({ id: c.id, lane: c.lane, project: c.project })), [...tagged(demo.body, "demo"), ...tagged(api.body, "api")]);
  assert.ok(all.body.braids.some((c) => c.project === "api" && c.lane === "Waiting"), "api's question is in Needs You");
  assert.ok(all.body.braids.some((c) => c.project === "demo" && c.lane === "Done"), "Done is included");
  const counts = all.body.projects.find((p) => p.name === "api")?.counts ?? {};
  assert.equal(Object.values(counts).reduce((s, n) => s + n, 0), api.body.braids.length);
  assert.equal(counts["Waiting"], api.body.braids.filter((c) => c.lane === "Waiting").length);
  for (const p of all.body.projects) {
    assert.equal(p.failure, null);
    assert.ok(p.readAt !== null && p.ageMs !== null);
  }
  const narrow = await get<All>("api/all?projects=api,gone");
  assert.deepEqual(narrow.body.projects.map((p) => p.name), ["api"]);
  assert.ok(narrow.body.braids.every((c) => c.project === "api"));
  assert.deepEqual(narrow.body.missing, ["gone"]);
  const listed = await get<{ projects: ProjectInfo[] }>("api/projects");
  assert.deepEqual(listed.body.projects.map((p) => p.name), ["demo", "api"]);
  // No project: the first one, so the current page keeps working.
  assert.equal((await get<Board>("api/board")).body.project, "demo");
  assert.equal((await get<{ id: string }>("api/item?project=api&id=0001/B")).status, 200);
  assert.equal((await get<{ error: string }>("api/board?project=nope")).status, 404);
});

test("actions run in the project they name; no name, an unknown name or a path is refused, and nothing runs", async () => {
  const { members, log } = pair();
  const { act } = await serve(() => members);
  const ok = await act("start", { id: "0003", project: "api" });
  assert.equal(ok.status, 200);
  assert.equal(ok.body["project"], "api");
  assert.deepEqual(log.acted, ['api:start:{"id":"0003","project":"api"}']);
  for (const [body, why] of [
    [{ id: "0003" }, /Name the project/],
    [{ id: "0003", project: "elsewhere" }, /No project elsewhere/],
    [{ id: "0003", project: scratch }, /never a folder path/],
    [{ id: "0003", project: "../demo" }, /never a folder path/],
    [{ id: "0003", project: "C:\\code\\demo" }, /never a folder path/],
    [{ id: "0003", project: ["demo"] }, /No project/],
    [{ id: "0003", project: "__proto__" }, /No project __proto__/],
  ] as const) {
    const refused = await act("start", body);
    assert.equal(refused.status, 400, JSON.stringify(body));
    assert.match(refused.body.error ?? "", why);
  }
  assert.equal(log.acted.length, 1, "no refused action ran");
});

test("pushes for both projects come from one board, each with its keys in its own notified.json", async () => {
  const folders = ["one", "two"].map((n) => join(scratch, `push-${n}`, ".braid"));
  const sent: string[] = [];
  const send: Sender = async (_config, push) => void sent.push(push.title);
  const config = () => ({ server: "https://ntfy.example", topic: "braid-test", enabled: true });
  const notifiers = folders.map((f) => notifierMod.notifier({ file: join(f, "notified.json"), config, send, token: () => null, warn: () => {} }));
  const members = board.demoMembers();
  const roster = [
    { name: "demo", src: { ...members[0]!.src, notify: notifiers[0]! } },
    { name: "api", src: { ...members[1]!.src, notify: notifiers[1]! } },
  ];
  const { get } = await serve(() => roster);
  await get("api/all");
  await Promise.all(notifiers.map((n) => n.idle()));
  assert.ok(sent.some((t) => t.startsWith("demo ")), sent.join("; "));
  assert.ok(sent.some((t) => /^api 0001\/B: /.test(t)), sent.join("; "));
  const keys = folders.map((f) => Object.keys((JSON.parse(readFileSync(join(f, "notified.json"), "utf8")) as { keys: Record<string, string> }).keys));
  assert.ok(keys[1]!.some((k) => k.startsWith("0001/B|")), "api's key in api's file");
  assert.ok(!keys[0]!.some((k) => k.startsWith("0001/B|Waiting|question")), "api's question key is not in demo's file");
});

test("failure mode: one project's read hangs; the other still refreshes and pushes, the hung one shows its failure and its snapshot's age", async () => {
  const { members, log } = pair();
  const api = members[1]!;
  let hang = false;
  const base = api.src.github.bind(api.src);
  api.src = { ...api.src, github: (fresh) => (hang ? never() : base(fresh)) };
  const { get } = await serve(() => members, 400);
  const first = await get<All>("api/all");
  assert.equal(first.body.projects.find((p) => p.name === "api")?.failure, null);
  const goodCards = first.body.braids.filter((c) => c.project === "api").length;
  hang = true;
  const pushesBefore = log.notified.filter((n) => n === "demo").length;
  const apiPushesBefore = log.notified.filter((n) => n === "api").length;
  const began = Date.now();
  const after = await get<All>("api/all?fresh=1");
  assert.ok(Date.now() - began < 3000, `answered in ${Date.now() - began} ms`);
  const hung = after.body.projects.find((p) => p.name === "api");
  assert.match(hung?.failure ?? "", /took longer than/);
  assert.ok(hung?.readAt !== null && (hung?.ageMs ?? -1) >= 0, "the old snapshot's age is shown");
  assert.equal(after.body.braids.filter((c) => c.project === "api").length, goodCards, "the hung project keeps its last snapshot");
  assert.equal(after.body.projects.find((p) => p.name === "demo")?.failure, null);
  assert.ok(log.notified.filter((n) => n === "demo").length > pushesBefore, "the other project refreshed and pushed");
  assert.equal(log.notified.filter((n) => n === "api").length, apiPushesBefore, "the hung project sent nothing");
  assert.equal((await get<Board>("api/board?project=api")).body.failure !== null, true);
});

test("failure mode: a read that finishes after the timeout is dropped: it doesn't replace the snapshot shown or send pushes, and the next read stores again", async () => {
  const { members, log } = pair();
  const api = members[1]!;
  let release: () => void = () => {};
  let late = false;
  const base = api.src.github.bind(api.src);
  // The late read's GitHub answer differs from every good one, so a late result that got stored would show.
  const LATE = { status: { state: "unavailable", reason: "the late read" }, prs: new Map() };
  api.src = { ...api.src, github: (fresh) => (late ? new Promise((done) => (release = () => done(LATE))) : base(fresh)) };
  const { get } = await serve(() => members, 300);
  const before = await get<Board & { github: { state: string } }>("api/board?project=api");
  assert.equal(before.body.github.state, "ok");
  const pushes = log.notified.filter((n) => n === "api").length;
  late = true;
  const timedOut = await get<Board & { github: { state: string } }>("api/board?project=api&fresh=1");
  assert.match(timedOut.body.failure ?? "", /took longer than/);
  assert.equal(timedOut.body.readAt, before.body.readAt, "still the snapshot from before the hung read");
  // Now the hung read finishes, after its timeout.
  late = false;
  release();
  await sleep(200);
  const after = await get<Board & { github: { state: string } }>("api/board?project=api");
  assert.equal(after.body.github.state, "ok", "the late result was not stored");
  assert.equal(after.body.readAt, before.body.readAt);
  assert.match(after.body.failure ?? "", /took longer than/, "the project still shows the failed read");
  assert.equal(log.notified.filter((n) => n === "api").length, pushes, "the late result sent no pushes");
  // The next read runs as usual and replaces the old snapshot.
  const next = await get<Board & { github: { state: string } }>("api/board?project=api&fresh=1");
  assert.equal(next.body.failure, null);
  assert.notEqual(next.body.readAt, before.body.readAt);
  assert.equal(log.notified.filter((n) => n === "api").length, pushes + 1);
});

test("the local listener answers only Host 127.0.0.1:<port> or localhost:<port>: a DNS-rebinding name reads nothing", async () => {
  const { members } = pair();
  const { url } = await serve(() => members);
  const port = Number(new URL(url).port);
  const raw = (path: string, host: string) =>
    new Promise<{ status: number; text: string }>((resolve, reject) => {
      const req = request({ host: "127.0.0.1", port, path, method: "GET", headers: { host } }, (res) => {
        let text = "";
        res.on("data", (c: Buffer) => (text += c.toString()));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, text }));
      });
      req.on("error", reject);
      req.end();
    });
  for (const host of [`127.0.0.1:${port}`, `localhost:${port}`, `LOCALHOST:${port}`]) {
    assert.equal((await raw("/api/all", host)).status, 200, host);
  }
  for (const host of [`rebind.evil.example:${port}`, `127.0.0.1:${port + 1}`, "127.0.0.1", `localhost.evil.example:${port}`, `[::1]:${port}`]) {
    for (const path of ["/api/all", "/api/projects", "/api/board", "/", "/api/events"]) {
      const r = await raw(path, host);
      assert.equal(r.status, 403, `${host} ${path}`);
      assert.ok(!r.text.includes("0001"), "no board data in the refusal");
    }
  }
});

test("failure mode: one project's read fails; the other is served, and the broken one shows why", async () => {
  const { members } = pair();
  members[1]!.src = { ...members[1]!.src, braids: () => Promise.reject(new Error("braids unreadable")) };
  const { get, url } = await serve(() => members, 2000);
  const all = await get<All>("api/all");
  const broken = all.body.projects.find((p) => p.name === "api");
  assert.equal(broken?.failure, "braids unreadable");
  assert.equal(broken?.readAt, null);
  assert.ok(all.body.braids.length > 0 && all.body.braids.every((c) => c.project === "demo"));
  // Its own board answers as a single project's board did after a failed read: an error.
  assert.equal((await fetch(`${url}api/board?project=api`)).status, 500);
});

test("failure mode: a project removed from the list disappears at the next read and its pending pushes aren't sent", async () => {
  const { members, log } = pair();
  let slow = false;
  const api = members[1]!;
  const base = api.src.github.bind(api.src);
  api.src = { ...api.src, github: async (fresh) => (slow ? (await sleep(600), base(fresh)) : base(fresh)) };
  let listed = [...members];
  const { get } = await serve(() => listed);
  await get("api/all");
  const apiPushes = log.notified.filter((n) => n === "api").length;
  assert.equal(apiPushes, 1);
  // A read of api is under way when it leaves the list.
  slow = true;
  void get("api/board?project=api&fresh=1");
  await sleep(100);
  listed = [members[0]!];
  const all = await get<All>("api/all?fresh=1");
  assert.deepEqual(all.body.projects.map((p) => p.name), ["demo"]);
  assert.ok(all.body.braids.every((c) => c.project === "demo"));
  assert.equal((await get<{ error: string }>("api/board?project=api")).status, 404);
  await sleep(900);
  assert.equal(log.notified.filter((n) => n === "api").length, apiPushes, "the read that was under way sent nothing");
});

test("failure mode: two projects with the same repository name keep their items, actions and push keys apart", async () => {
  const { members, log } = pair(["demo", "api"], ["same", "same"]);
  const files = ["a", "b"].map((n) => join(scratch, `same-${n}`, ".braid", "notified.json"));
  const sent: string[] = [];
  const send: Sender = async (_c, push) => void sent.push(push.title);
  const config = () => ({ server: "https://ntfy.example", topic: "braid-test", enabled: true });
  const notifiers = files.map((file) => notifierMod.notifier({ file, config, send, token: () => null, warn: () => {} }));
  members[0]!.src.notify = notifiers[0]!;
  members[1]!.src.notify = notifiers[1]!;
  const { get, act } = await serve(() => members);
  const a = await get<Board>("api/board?project=demo");
  const b = await get<Board>("api/board?project=api");
  assert.equal(a.body.repo, "same");
  assert.equal(b.body.repo, "same");
  assert.notDeepEqual(a.body.braids.map((c) => c.id), b.body.braids.map((c) => c.id));
  const item = await get<{ title: string }>("api/item?project=api&id=0001");
  const other = await get<{ title: string }>("api/item?project=demo&id=0001");
  assert.notEqual(item.body.title, other.body.title);
  await act("merge", { id: "0001", project: "demo" });
  await act("merge", { id: "0001", project: "api" });
  assert.deepEqual(log.acted.map((l) => l.split(":")[0]), ["demo", "api"]);
  await Promise.all(notifiers.map((n) => n.idle()));
  const keys = files.map((f) => Object.keys((JSON.parse(readFileSync(f, "utf8")) as { keys: Record<string, string> }).keys));
  assert.ok(keys[0]!.length > 0 && keys[1]!.length > 0);
  assert.notDeepEqual(keys[0], keys[1], "each project has its own keys");
  assert.ok(sent.some((t) => t.startsWith("same 0001/B: ")), "the push title keeps the <repo> <id>: <lane> form");
});

test("failure mode: with no list, run in a project folder, the board is that folder's: the same snapshot and actions as before", async () => {
  const src = board.demoSources();
  const acted: unknown[] = [];
  const { get, act } = await serve({ ...src, action: () => (body) => (acted.push(body), { ok: true }) });
  const served = await get<Board>("api/board");
  const github = await src.github(false);
  const own = model.toBoard(src.repo, await src.braids(), github, await src.t3(false), (src as unknown as { signals(g: unknown): unknown }).signals(github), (src as unknown as { start(): unknown }).start());
  assert.deepEqual(served.body.braids.map((c) => [c.id, c.lane]), own.braids.map((c) => [c.id, c.lane]));
  assert.equal(served.body.repo, own.repo);
  assert.equal(served.body.project, "demo");
  // The page sends no project; with one project served the action runs there.
  assert.equal((await act("start", { id: "0011" })).status, 200);
  assert.deepEqual(acted, [{ id: "0011" }]);
  assert.equal((await act("start", { id: "0011", project: "/elsewhere" })).status, 400);
});

test("braid board: no list serves this folder alone; a list serves every listed project or the one --project names", async () => {
  const saved = { HOME: process.env["HOME"], USERPROFILE: process.env["USERPROFILE"] };
  process.env["HOME"] = scratch;
  process.env["USERPROFILE"] = scratch;
  const write = process.stdout.write.bind(process.stdout);
  const written: string[] = [];
  process.stdout.write = ((chunk: string | Uint8Array) => (written.push(String(chunk)), true)) as typeof process.stdout.write;
  const gh = () => Promise.resolve({ status: 0, stdout: "[]", stderr: "" });
  const t3 = () => Promise.resolve({ status: 0, stdout: "[]", stderr: "" });
  const folders = ["alpha", "beta"].map((n) => {
    const f = join(scratch, "run", n);
    mkdirSync(join(f, "braids"), { recursive: true });
    return f;
  });
  const list = [
    { name: "alpha", path: folders[0]! },
    { name: "beta", path: folders[1]! },
  ];
  const notified: string[] = [];
  const run = { gh, t3, notifier: (root: string) => () => void notified.push(root) };
  const servers: Started[] = [];
  try {
    const names = async (args: string[], projects: () => { name: string; path: string }[]) => {
      const started = await board.runBoard(folders[0]!, ["--no-open", ...args], undefined, { ...run, projects });
      servers.push(started);
      const response = await fetch(`${started.url}api/projects`);
      return ((await response.json()) as { projects: ProjectInfo[] }).projects.map((p) => p.name);
    };
    assert.equal((await names([], () => [])).length, 1, "no list: this folder alone");
    assert.deepEqual(await names([], () => list), ["alpha", "beta"]);
    assert.deepEqual(await names(["--project", "beta"], () => list), ["beta"]);
    await assert.rejects(board.runBoard(folders[0]!, ["--no-open", "--project", "gamma"], undefined, { ...run, projects: () => list }), /--project: no project gamma/);
    await assert.rejects(board.runBoard(folders[0]!, ["--no-open", "--project", "alpha"], undefined, { ...run, projects: () => [] }), /list is empty/);
    await assert.rejects(board.runBoard(folders[0]!, ["--no-open", "--project"], undefined, { ...run, projects: () => list }), /--project needs/);
    assert.ok(written.some((l) => l === "Projects: alpha, beta\n"), written.join(""));
  } finally {
    process.stdout.write = write;
    process.env["HOME"] = saved.HOME;
    process.env["USERPROFILE"] = saved.USERPROFILE;
    if (saved.HOME === undefined) delete process.env["HOME"];
    if (saved.USERPROFILE === undefined) delete process.env["USERPROFILE"];
    for (const s of servers) {
      s.server.closeAllConnections();
      s.server.close();
    }
  }
  assert.ok(!existsSync(join(scratch, ".braid", "projects.json")), "the test never wrote a project list");
});

test("the demo serves three projects, one of them not ready", async () => {
  const { get } = await serve(() => board.demoMembers());
  const all = await get<All>("api/all");
  assert.deepEqual(all.body.projects.map((p) => p.name), ["demo", "api", "notes"]);
  const notes = all.body.projects.find((p) => p.name === "notes");
  assert.ok((notes?.problems.length ?? 0) > 0, "notes isn't ready");
  assert.deepEqual(all.body.projects.find((p) => p.name === "api")?.problems, []);
});

test("a roster that can't be read while the board runs keeps the projects as they were", async () => {
  const { members } = pair();
  let broken = false;
  const { get } = await serve(() => {
    if (broken) {
      throw new Error("projects.json is not valid JSON");
    }
    return members;
  });
  await get("api/all");
  broken = true;
  const all = await get<All>("api/all?fresh=1");
  assert.deepEqual(all.body.projects.map((p) => p.name), ["demo", "api"]);
});

test("close() waits until every project's read has ended, not only the first one's", async () => {
  const ended: string[] = [];
  const slow = (m: Member, ms: number): Member => ({
    name: m.name,
    src: {
      ...m.src,
      t3: async (fresh) => {
        await sleep(ms);
        try {
          return await m.src.t3(fresh);
        } finally {
          ended.push(m.name);
        }
      },
    },
  });
  const [a, b] = board.demoMembers();
  const started = await board.startBoardWith(() => [slow(a!, 100), slow(b!, 600)], web, 600_000);
  // Both first reads are running now; the second project's is the slower one.
  await started.close();
  assert.deepEqual([...ended].sort(), [a!.name, b!.name].sort(), "no project's read still runs when close() returns");
});
