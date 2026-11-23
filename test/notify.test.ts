// braid notify and the board's notifier: a temporary home and a fake sender, never the network or the real ~/.braid.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-notify-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
let n = 0;
const dir = (): string => {
  n += 1;
  const d = join(scratch, `d${n}`);
  mkdirSync(d, { recursive: true });
  return d;
};

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

interface Config {
  server: string;
  topic: string;
  enabled: boolean;
}
interface PushIn {
  title: string;
  body: string;
  tags: readonly string[];
  priority: "high" | "default" | "low";
  click: string | null;
  sequence?: string | null;
}
interface Push extends PushIn {
  key: string;
  item: string;
  kind: "need" | "done";
}
type Sender = (config: Config, push: PushIn, token: string | null) => Promise<void>;
interface Notifier {
  (board: Board): void;
  idle(): Promise<void>;
}

const config = (await load("../dist/notify/config.js")) as {
  newTopic(): string;
  partialTopic(topic: string): string;
  readConfig(home: string): Config | null;
  writeConfig(c: Config, home: string): void;
  normaliseServer(s: string): string;
  tokenOf(env: Record<string, string | undefined>): string | null;
  configFile(home: string): string;
};
const message = (await load("../dist/notify/message.js")) as { pushesOf(board: Board): Push[] };
const sender = (await load("../dist/notify/sender.js")) as { ntfySender(fetcher: typeof fetch, timeoutMs?: number): Sender; ntfyBody(c: Config, push: PushIn): Record<string, unknown> };
const notifierMod = (await load("../dist/notify/notifier.js")) as {
  notifier(opts: { file: string; config?: () => Config | null; send?: Sender; token?: () => string | null; warn?: (line: string) => void; timeoutMs?: number }): Notifier;
};
const command = (await load("../dist/commands/notify.js")) as {
  notifyCommand(
    args: readonly string[],
    deps?: { home?: string; env?: Record<string, string | undefined>; send?: Sender; clear?: (c: Config, sequence: string, token: string | null) => Promise<void>; root?: string; t3?: (root: string, args: readonly string[]) => Promise<{ status: number; stdout: string; stderr: string }> },
  ): Promise<string>;
};
const boardMod = (await load("../dist/commands/board.js")) as {
  demoSources(): Record<string, unknown>;
  startBoardWith(src: Record<string, unknown>, web: string, refreshMs?: number): Promise<{ server: Server; url: string; close(): Promise<void> }>;
};

// ---- board fixtures ----

interface Need {
  kind: string;
  text: string;
  verb: string;
  age: string | null;
  since: string | null;
  key: string | null;
  pr: number | null;
  who: string | null;
  more: number;
  link?: string | null;
  via?: string;
}
interface Strand {
  id: string;
  title: string;
  lane: string;
  need: Need | null;
  thread: string | null;
}
interface Card extends Strand {
  pr: { number: number } | null;
  strands: Strand[];
  coordinator: { link: string | null } | null;
}
interface Board {
  repo: string;
  github: { state: string };
  t3: { state: string };
  braids: Card[];
}

const need = (kind: string, text: string, since: string | null, extra: Partial<Need> = {}): Need => ({ kind, text, verb: "asked", age: "1m", since, key: null, pr: null, who: null, more: 0, ...extra });
const card = (id: string, lane: string, n: Need | null, extra: Partial<Card> = {}): Card => ({ id, title: `Title of ${id}`, lane, need: n, thread: null, pr: null, strands: [], coordinator: null, ...extra });
const strand = (id: string, lane: string, n: Need | null, thread: string | null = null): Strand => ({ id, title: `Strand ${id}`, lane, need: n, thread });
const boardOf = (braids: Card[], ok = true): Board => ({ repo: "agento", github: { state: ok ? "ok" : "unavailable" }, t3: { state: "ok" }, braids });

const CFG: Config = { server: "https://ntfy.example", topic: "braid-abcdefghijklmnopqrstuvwx", enabled: true };

function fakeSender() {
  const sent: { push: PushIn; token: string | null }[] = [];
  let mode: "ok" | "fail" | "hang" = "ok";
  const send: Sender = (_c, push, token) => {
    if (mode === "fail") {
      return Promise.reject(new Error("can't reach ntfy.example"));
    }
    if (mode === "hang") {
      return new Promise(() => {});
    }
    sent.push({ push, token });
    return Promise.resolve();
  };
  return { sent, send, set: (m: typeof mode) => (mode = m) };
}

function setupNotifier(file: string, f = fakeSender(), opts: { config?: () => Config | null; timeoutMs?: number } = {}) {
  const warnings: string[] = [];
  const notify = notifierMod.notifier({ file, config: opts.config ?? (() => CFG), send: f.send, token: () => null, warn: (l) => warnings.push(l), timeoutMs: opts.timeoutMs ?? 2_000 });
  return { notify, warnings };
}

// ---- config ----

test("settings round-trip in the given home; a missing or corrupt file reads as not set up", () => {
  const home = dir();
  assert.equal(config.readConfig(home), null);
  config.writeConfig(CFG, home);
  assert.deepEqual(config.readConfig(home), CFG);
  writeFileSync(config.configFile(home), "{ not json");
  assert.equal(config.readConfig(home), null);
});

test("a new topic is braid- and 24 random characters; the partial topic hides the rest", () => {
  const a = config.newTopic();
  const b = config.newTopic();
  assert.match(a, /^braid-[a-z0-9]{24}$/);
  assert.notEqual(a, b);
  assert.equal(config.partialTopic(a), `${a.slice(0, 10)}…`);
  assert.ok(!config.partialTopic(a).includes(a.slice(10)));
});

test("the server must be https; the token comes only from BRAID_NTFY_TOKEN", () => {
  assert.equal(config.normaliseServer("https://ntfy.example/"), "https://ntfy.example");
  assert.throws(() => config.normaliseServer("http://ntfy.example"), /https/);
  assert.throws(() => config.normaliseServer("https://user:pw@ntfy.example"), /token/);
  assert.equal(config.tokenOf({}), null);
  assert.equal(config.tokenOf({ BRAID_NTFY_TOKEN: " tk_123 " }), "tk_123");
});

// ---- braid notify ----

function runCli(home: string, args: string[], env: Record<string, string> = {}) {
  const r = spawnSync(process.execPath, [cli, "notify", ...args], {
    encoding: "utf8",
    cwd: home,
    env: { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, LOCALAPPDATA: home, XDG_CONFIG_HOME: home, BRAID_NTFY_TOKEN: "", ...env },
  });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

test("braid notify setup, the state, off and setup again, in a temporary home", () => {
  const home = dir();
  const none = runCli(home, []);
  assert.equal(none.code, 0);
  assert.match(none.stdout, /not set up/);
  const set = runCli(home, ["setup"], { BRAID_NTFY_TOKEN: "secret-token-1" });
  assert.equal(set.code, 0, set.stderr);
  const file = join(home, ".braid", "notify.json");
  const stored = JSON.parse(readFileSync(file, "utf8")) as Config;
  assert.match(stored.topic, /^braid-[a-z0-9]{24}$/);
  assert.equal(stored.server, "https://ntfy.sh");
  assert.ok(set.stdout.includes(`Topic:  ${stored.topic}`));
  assert.ok(set.stdout.includes(`https://ntfy.sh/${stored.topic}`));
  assert.ok(!readFileSync(file, "utf8").includes("secret-token-1"), "the token is never stored");
  assert.ok(!set.stdout.includes("secret-token-1"));

  const state = runCli(home, [], { BRAID_NTFY_TOKEN: "secret-token-1" });
  assert.match(state.stdout, /Notifications: on/);
  assert.match(state.stdout, /Token: from BRAID_NTFY_TOKEN/);
  assert.ok(state.stdout.includes(config.partialTopic(stored.topic)));
  assert.ok(!state.stdout.includes(stored.topic), "the state shows the topic only in part");
  assert.ok(!state.stdout.includes("secret-token-1"));

  const off = runCli(home, ["off"]);
  assert.equal(off.code, 0);
  assert.equal(config.readConfig(join(home, ".braid"))?.enabled, false);
  const again = runCli(home, ["setup"]);
  assert.equal(config.readConfig(join(home, ".braid"))?.topic, stored.topic, "setup keeps the topic the phone subscribed to");
  assert.match(again.stdout, /kept the topic/);
  runCli(home, ["setup", "--new-topic"]);
  assert.notEqual(config.readConfig(join(home, ".braid"))?.topic, stored.topic);
  runCli(home, ["setup", "--topic", "my_topic-1", "--server", "https://ntfy.example/"]);
  assert.deepEqual(config.readConfig(join(home, ".braid")), { server: "https://ntfy.example", topic: "my_topic-1", enabled: true });

  const bad = runCli(home, ["setup", "--server", "http://ntfy.example"]);
  assert.equal(bad.code, 1);
  assert.match(bad.stderr, /https/);
  assert.equal(runCli(home, ["setup", "--topic", "no spaces?"]).code, 1);
  assert.equal(runCli(home, ["bogus"]).code, 1);
});

test("braid notify test sends one push with the token from the environment, and says when it fails", async () => {
  const home = dir();
  await assert.rejects(command.notifyCommand(["test"], { home, env: {} }), /not set up/);
  config.writeConfig(CFG, home);
  const f = fakeSender();
  const cleared: string[] = [];
  const clear = async (_c: unknown, sequence: string) => void cleared.push(sequence);
  const out = await command.notifyCommand(["test"], { home, env: { BRAID_NTFY_TOKEN: "tk" }, send: f.send, clear });
  assert.match(out, /Sent a test push to https:\/\/ntfy.example, topic braid-abcd…/);
  assert.ok(!out.includes(CFG.topic));
  assert.equal(f.sent.length, 2);
  assert.equal(f.sent[0]?.token, "tk");
  assert.equal(f.sent[0]?.push.sequence, null);
  assert.match(out, /second push with a sequence ID and cleared it/);
  assert.equal(f.sent[1]?.push.sequence, "braid-notify-test");
  assert.deepEqual(cleared, ["braid-notify-test"]);
  f.set("fail");
  await assert.rejects(command.notifyCommand(["test"], { home, env: {}, send: f.send, clear }), /test push failed: can't reach/);
});

test("braid notify send pushes the PM's line opening its thread, and never prints the topic or the token", async () => {
  const home = dir();
  const root = join(dir(), "agento");
  mkdirSync(root);
  const pm = "9b3a8157-f696-45de-ac39-f35a4a90cf9b";
  const asked: string[][] = [];
  const t3 = async (_root: string, args: readonly string[]) => {
    asked.push([...args]);
    const known = args[2] === pm;
    return { status: known ? 0 : 1, stdout: known ? JSON.stringify({ thread: { threadId: pm, link: `http://127.0.0.1:3773/env-1/${pm}` } }) : "", stderr: "" };
  };
  const send = (args: string[], f = fakeSender()) => command.notifyCommand(["send", ...args], { home, root, env: { BRAID_NTFY_TOKEN: "secret-tk" }, send: f.send, t3 }).then((out) => ({ out, f }));

  const unset = await send(["Nothing can run until you act", "--thread", pm]);
  assert.match(unset.out, /^Not sent: notifications are not set up/);
  assert.equal(unset.f.sent.length, 0);
  config.writeConfig({ ...CFG, enabled: false }, home);
  const off = await send(["Nothing can run until you act", "--thread", pm]);
  assert.match(off.out, /^Not sent: notifications are off/);
  assert.equal(off.f.sent.length, 0);

  config.writeConfig(CFG, home);
  const ok = await send(["Digest: 2 done, 1 running; 3 merges wait for you", "--thread", pm, "--programme", "dev-machine"]);
  assert.equal(ok.out, "Sent to ntfy.example.\n");
  assert.deepEqual(asked[0], ["thread", "show", pm, "--json"]);
  assert.equal(ok.f.sent[0]?.token, "secret-tk");
  const push = ok.f.sent[0]?.push as PushIn;
  assert.deepEqual(push, { title: "agento pm/dev-machine: the PM", body: "Digest: 2 done, 1 running; 3 merges wait for you", tags: ["compass"], priority: "high", click: `t3code://threads/env-1/${pm}`, sequence: "braid-agento-pm-dev-machine-send" });
  assert.deepEqual(sender.ntfyBody(CFG, push), { topic: CFG.topic, title: push.title, message: push.body, tags: ["compass"], priority: 4, click: push.click, sequence_id: "braid-agento-pm-dev-machine-send" });

  const plain = await send(["x".repeat(250), "--thread", "unknown-thread"]);
  const p2 = plain.f.sent[0]?.push as PushIn;
  assert.equal(p2.title, "agento: the PM");
  assert.equal(p2.click, null);
  assert.equal(p2.body, `${"x".repeat(199)}…\nOpen the board`, "cut at 200 characters; no link: open the board");
  assert.equal(p2.sequence, "braid-agento-pm---send");
  assert.match(plain.out, /no link/);

  const failing = fakeSender();
  failing.set("fail");
  const failed = await send(["Nothing can run until you act", "--thread", pm], failing);
  assert.equal(failed.out, "Not sent: can't reach ntfy.example.\n", "a failed send says why and doesn't throw");

  for (const out of [unset.out, off.out, ok.out, plain.out, failed.out]) {
    assert.ok(!out.includes(CFG.topic) && !out.includes("secret-tk"), out);
  }
  await assert.rejects(command.notifyCommand(["send", "--thread", pm], { home, root }), /usage: braid notify send/);
  await assert.rejects(command.notifyCommand(["send", "a", "b", "--thread", pm], { home, root }), /usage: braid notify send/);
  await assert.rejects(command.notifyCommand(["send", "a"], { home, root }), /usage: braid notify send/);
  assert.equal(runCli(home, ["send", "Nothing can run", "--thread", pm]).code, 0, "off or not set up exits 0 from the CLI too");
});

// ---- the pushes ----

test("a push carries the repo, id, lane, title, need line, tag, priority and app link only", () => {
  const b = boardOf([
    card("0007", "Waiting", need("decision", "Pick the database", "2026-11-20T10:00:00.000Z", { key: "architecture", link: "http://127.0.0.1:3773/env1/th1" })),
    card("0008", "In Review", need("review", "Merge PR #12", "2026-11-20T10:05:00.000Z", { pr: 12 })),
    card("0009", "In Progress", null),
  ]);
  const pushes = message.pushesOf(b);
  assert.equal(pushes.length, 2);
  assert.deepEqual(
    { ...pushes[0] },
    { key: "0007|Waiting|decision|2026-11-20T10:00:00.000Z", item: "0007", kind: "need", title: "agento 0007: Needs You", body: "Title of 0007\nPick the database", tags: ["scales"], priority: "high", click: "t3code://threads/env1/th1", sequence: "braid-agento-0007" },
  );
  assert.deepEqual({ ...pushes[1] }, { key: "0008|In Review|review|2026-11-20T10:05:00.000Z", item: "0008", kind: "need", title: "agento 0008: To Review", body: "Title of 0008\nMerge PR #12\nOpen the board", tags: ["eyes"], priority: "default", click: null, sequence: "braid-agento-0008" });
  // No thread to open (no request thread, no coordinator): the body says where to go.
  assert.equal(pushes[1]?.body, "Title of 0008\nMerge PR #12\nOpen the board");
});

test("a braid card with strands pushes per strand request, and no alarm", () => {
  const s1 = strand("0010/A", "Waiting", need("question", "Which name?", "2026-11-20T09:00:00.000Z", { link: "http://127.0.0.1:3773/e/asker" }));
  const s2 = strand("0010/B", "In Review", need("review", "Merge PR #3", "2026-11-20T09:30:00.000Z", { pr: 3 }));
  const s3 = strand("0010/D", "Waiting", need("checks failed", "Checks failed: verify; fix or retry", "2026-11-20T09:00:00.000Z", { verb: "for" }));
  const b = boardOf([card("0010", "Waiting", { ...s1.need!, who: "0010/A", more: 2 }, { strands: [s1, s2, s3, strand("0010/C", "In Progress", null)], coordinator: { link: "http://127.0.0.1:3773/e/coord" } })]);
  const pushes = message.pushesOf(b);
  assert.deepEqual(
    pushes.map((p) => [p.key, p.title, p.tags[0], p.click]),
    [
      ["0010/A|Waiting|question|2026-11-20T09:00:00.000Z", "agento 0010/A: Needs You", "question", "t3code://threads/e/asker"],
      ["0010/B|In Review|review|2026-11-20T09:30:00.000Z", "agento 0010/B: To Review", "eyes", "t3code://threads/e/coord"],
    ],
  );
});

test("a Done braid's push names its title and PR", () => {
  const pushes = message.pushesOf(boardOf([card("0011", "Done", null, { pr: { number: 44 }, strands: [strand("0011/A", "Done", null)] })]));
  assert.deepEqual(
    pushes.map((p) => ({ ...p })),
    [{ key: "0011|done", item: "0011", kind: "done", title: "agento 0011: Done", body: "Title of 0011\nPR #44 merged\nOpen the board", tags: ["white_check_mark"], priority: "default", click: null, sequence: null }],
  );
});

// ---- the notifier ----

const Q = need("question", "Which name?", "2026-11-20T08:00:00.000Z");

test("one push per new need, none again across a restart, and again when the need returns", async () => {
  const file = join(dir(), ".braid", "notified.json");
  const f = fakeSender();
  const a = setupNotifier(file, f);
  const waiting = boardOf([card("0001", "Waiting", Q)]);
  a.notify(waiting);
  await a.notify.idle();
  a.notify(waiting);
  await a.notify.idle();
  assert.equal(f.sent.length, 1);
  // A restart: a new notifier over the same file sends nothing twice.
  const b = setupNotifier(file, f);
  b.notify(waiting);
  await b.notify.idle();
  assert.equal(f.sent.length, 1);
  // The need is answered (Working), then the same request comes back: sent again.
  b.notify(boardOf([card("0001", "In Progress", null)]));
  await b.notify.idle();
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), { keys: {} });
  b.notify(waiting);
  await b.notify.idle();
  assert.equal(f.sent.length, 2);
});

test("Done braids at the first run push nothing; a braid becoming Done later pushes once", async () => {
  const file = join(dir(), ".braid", "notified.json");
  const f = fakeSender();
  const { notify } = setupNotifier(file, f);
  notify(boardOf([card("0002", "Done", null), card("0003", "In Progress", null)]));
  await notify.idle();
  assert.equal(f.sent.length, 0);
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), { keys: { "0002|done": "0002" } });
  notify(boardOf([card("0002", "Done", null), card("0003", "Done", null, { pr: { number: 9 } })]));
  await notify.idle();
  notify(boardOf([card("0002", "Done", null), card("0003", "Done", null, { pr: { number: 9 } })]));
  await notify.idle();
  assert.deepEqual(
    f.sent.map((s) => s.push.title),
    ["agento 0003: Done"],
  );
});

test("a corrupt sent file starts empty: current needs may go again once, old Done braids don't, and nothing crashes", async () => {
  const file = join(dir(), ".braid", "notified.json");
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, "garbage");
  const f = fakeSender();
  const { notify } = setupNotifier(file, f);
  notify(boardOf([card("0004", "Done", null), card("0005", "Waiting", Q)]));
  await notify.idle();
  assert.deepEqual(
    f.sent.map((s) => s.push.title),
    ["agento 0005: Needs You"],
  );
});

test("GitHub or T3 unreadable, or notifications off: no push and the sent keys stay", async () => {
  const file = join(dir(), ".braid", "notified.json");
  const f = fakeSender();
  let cfg: Config | null = CFG;
  const { notify } = setupNotifier(file, f, { config: () => cfg });
  notify(boardOf([card("0006", "Waiting", Q)]));
  await notify.idle();
  const before = readFileSync(file, "utf8");
  notify(boardOf([card("0006", "In Progress", null), card("0007", "Waiting", Q)], false));
  await notify.idle();
  assert.equal(readFileSync(file, "utf8"), before);
  cfg = { ...CFG, enabled: false };
  notify(boardOf([card("0007", "Waiting", Q)]));
  cfg = null;
  notify(boardOf([card("0008", "Waiting", Q)]));
  await notify.idle();
  assert.equal(f.sent.length, 1);
});

test("a failed send is retried at the next refresh, not marked sent, and reported once per outage", async () => {
  const file = join(dir(), ".braid", "notified.json");
  const f = fakeSender();
  const { notify, warnings } = setupNotifier(file, f);
  const b = boardOf([card("0009", "Waiting", Q)]);
  f.set("fail");
  notify(b);
  await notify.idle();
  notify(b);
  await notify.idle();
  assert.equal(f.sent.length, 0);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0] ?? "", /a push failed \(can't reach ntfy.example\)/);
  assert.ok(!warnings.join("").includes(CFG.topic));
  assert.ok(!existsSync(file) || !readFileSync(file, "utf8").includes("0009|"));
  f.set("ok");
  notify(b);
  await notify.idle();
  assert.equal(f.sent.length, 1);
  assert.ok(readFileSync(file, "utf8").includes("0009|Waiting|question"));
  assert.deepEqual(warnings.slice(1), ["braid notify: sending again"]);
});

test("a hanging send returns at once, isn't sent twice while in flight, and times out into a retry", async () => {
  const file = join(dir(), ".braid", "notified.json");
  const f = fakeSender();
  const { notify, warnings } = setupNotifier(file, f, { timeoutMs: 150 });
  const b = boardOf([card("0012", "Waiting", Q)]);
  let calls = 0;
  const counting: Sender = (c, p, t) => (calls++, new Promise<void>(() => {}).then(() => f.send(c, p, t)));
  const hung = notifierMod.notifier({ file, config: () => CFG, send: counting, token: () => null, warn: (l) => warnings.push(l), timeoutMs: 150 });
  hung(b);
  hung(b);
  assert.equal(calls, 0, "notify returns before the send even starts, so it can't wait for it");
  await new Promise((done) => setImmediate(done));
  assert.equal(calls, 1, "an in-flight key isn't sent again");
  await hung.idle();
  assert.match(warnings[0] ?? "", /did not answer in time/);
  notify(b);
  await notify.idle();
  assert.equal(f.sent.length, 1, "retried on the next refresh");
});

test("a send that succeeds after its need left is not recorded, so the need's return is sent again", async () => {
  const file = join(dir(), ".braid", "notified.json");
  const sent: string[] = [];
  let release: () => void = () => {};
  let first = true;
  const send: Sender = (_c, push) => {
    sent.push(push.title);
    if (first) {
      first = false;
      return new Promise<void>((done) => (release = done));
    }
    return Promise.resolve();
  };
  const notify = notifierMod.notifier({ file, config: () => CFG, send, token: () => null, warn: () => {}, timeoutMs: 2_000 });
  const waiting = boardOf([card("0013", "Waiting", Q)]);
  notify(waiting);
  await new Promise((done) => setImmediate(done));
  notify(boardOf([card("0013", "In Progress", null)]));
  release();
  await notify.idle();
  assert.ok(!readFileSync(file, "utf8").includes("0013|"), "the late success isn't stored");
  notify(waiting);
  await notify.idle();
  assert.equal(sent.length, 2);
});

test("the real sender posts ntfy JSON with the bearer token, and names neither topic nor token on errors", async () => {
  const seen: { url: string; init: RequestInit }[] = [];
  let status = 200;
  const fake = (async (url: string, init: RequestInit) => {
    seen.push({ url, init });
    return new Response("{}", { status });
  }) as unknown as typeof fetch;
  const send = sender.ntfySender(fake);
  await send(CFG, { title: "agento 0001: Needs You", body: "Títle\nWhich name?", tags: ["question"], priority: "high", click: "t3code://threads/e/t" }, "tk_1");
  assert.equal(seen[0]?.url, "https://ntfy.example");
  assert.deepEqual(JSON.parse(String(seen[0]?.init.body)), { topic: CFG.topic, title: "agento 0001: Needs You", message: "Títle\nWhich name?", tags: ["question"], priority: 4, click: "t3code://threads/e/t" });
  assert.equal((seen[0]?.init.headers as Record<string, string>)["authorization"], "Bearer tk_1");
  await send(CFG, { title: "t", body: "b", tags: [], priority: "default", click: null }, null);
  assert.equal((seen[1]?.init.headers as Record<string, string>)["authorization"], undefined);
  assert.equal(JSON.parse(String(seen[1]?.init.body)).priority, 3);
  status = 403;
  const err = await send(CFG, { title: "t", body: "b", tags: [], priority: "default", click: null }, "tk_1").then(
    () => null,
    (e: Error) => e.message,
  );
  assert.equal(err, "ntfy.example answered HTTP 403 (check BRAID_NTFY_TOKEN)");
  const slow = sender.ntfySender(((_u: string, init: RequestInit) => new Promise((_, fail) => init.signal?.addEventListener("abort", () => fail(init.signal?.reason)))) as unknown as typeof fetch, 50);
  await assert.rejects(slow(CFG, { title: "t", body: "b", tags: [], priority: "default", click: null }, null), /did not answer in 0 s|did not answer/);
});

test("the board hands each snapshot to the notifier and keeps serving when it throws", async () => {
  const web = dir();
  writeFileSync(join(web, "index.html"), "<p>board</p>");
  const seen: Board[] = [];
  const src = {
    ...boardMod.demoSources(),
    notify: (b: Board) => {
      seen.push(b);
      throw new Error("notifier broke");
    },
  };
  const started = await boardMod.startBoardWith(src, web, 600_000);
  after(() => started.close());
  const res = await fetch(`${started.url}api/board`);
  assert.equal(res.status, 200);
  assert.ok(seen.length >= 1);
  assert.equal(seen[0]?.repo, "demo");
  assert.equal((await fetch(`${started.url}api/board?fresh=1`)).status, 200);
  assert.ok(seen.length >= 2);
});

// ---- the merges that wait for the user under a PM (0069/C) ----

test("merges forwarded by one PM are one push, updated in place under one sequence ID, and cleared when none is left", async () => {
  const file = join(dir(), ".braid", "notified.json");
  const f = fakeSender();
  const cleared: string[] = [];
  const at = (n: number): PushIn => (f.sent[n] as { push: PushIn }).push;
  const notify = notifierMod.notifier({ file, config: () => CFG, send: f.send, token: () => null, warn: () => {}, clear: async (_c: unknown, sequence: string) => void cleared.push(sequence) } as never);
  const forward = (id: string, pr: number, head = "a".repeat(40)) => ({ id, title: `Title ${id}`, head, need: need("review", `The PM asks you: merge PR #${pr}`, "2026-11-22T12:00:00Z", { pr, via: "forwarded" }) });
  const prog = (...forwards: unknown[]) => ({ slug: "w", title: "W", section: "needs", thread: "pm-thread", link: "http://127.0.0.1:3773/env1/pm-thread", need: null, forwards });
  const withProg = (...forwards: unknown[]) => ({ ...boardOf([]), programmes: [prog(...forwards)] }) as unknown as Board;
  const run = async (b: Board) => {
    notify(b);
    await notify.idle();
  };
  await run(withProg(forward("0001", 7)));
  assert.equal(f.sent.length, 1);
  assert.equal(at(0).title, "agento 0001: merge PR #7");
  assert.equal(at(0).click, "t3code://threads/env1/pm-thread");
  await run(withProg(forward("0001", 7)));
  assert.equal(f.sent.length, 1, "nothing changed: nothing sent");
  // Another joins: one push with both, the same sequence ID (it replaces the first).
  await run(withProg(forward("0001", 7), forward("0002", 8)));
  assert.equal(f.sent.length, 2);
  assert.equal(at(1).title, "agento: 2 merges wait for you");
  assert.equal(at(1).body, "0001 PR #7\n0002 PR #8");
  assert.equal(at(1).sequence, at(0).sequence);
  assert.deepEqual([at(1).priority, at(1).tags], ["high", ["eyes"]]);
  // A head moves: sent again, still in place.
  await run(withProg(forward("0001", 7, "b".repeat(40)), forward("0002", 8)));
  assert.equal(f.sent.length, 3);
  // One leaves: back to one merge, same sequence ID, nothing cleared.
  await run(withProg(forward("0002", 8)));
  assert.equal(f.sent.length, 4);
  assert.equal(at(3).title, "agento 0002: merge PR #8");
  assert.equal(at(3).sequence, at(0).sequence);
  assert.deepEqual(cleared, []);
  // None left: the push is cleared by that sequence ID.
  await run(withProg());
  assert.deepEqual(cleared, [at(0).sequence]);
});

test("upgrading with 0069/B's per-braid push on the phone: it is cleared and the group push is sent once", async () => {
  const file = join(dir(), ".braid", "notified.json");
  mkdirSync(dirname(file), { recursive: true });
  // 0069/B's key for a forwarded merge: item `0001`, lane, kind and when it was forwarded.
  writeFileSync(file, JSON.stringify({ keys: { "0001|In Review|review|2026-11-22T12:00:00Z": "0001" } }));
  const f = fakeSender();
  const cleared: string[] = [];
  const notify = notifierMod.notifier({ file, config: () => CFG, send: f.send, token: () => null, warn: () => {}, clear: async (_c: unknown, sequence: string) => void cleared.push(sequence) } as never);
  const forward = { id: "0001", title: "T", head: "a".repeat(40), need: need("review", "The PM asks you: merge PR #7", "2026-11-22T12:00:00Z", { pr: 7, via: "forwarded" }) };
  const b = { ...boardOf([]), programmes: [{ slug: "w", title: "W", section: "needs", thread: "pm-thread", link: "http://127.0.0.1:3773/env1/pm-thread", need: null, forwards: [forward] }] } as unknown as Board;
  notify(b);
  await notify.idle();
  notify(b);
  await notify.idle();
  assert.equal(f.sent.length, 1, "the group push is sent once");
  assert.deepEqual(cleared, ["braid-agento-0001"], "the old per-braid push is cleared");
});
