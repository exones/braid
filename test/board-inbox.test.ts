import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { get, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "braid-board-inbox-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

// The board reads Git in this process, so it too gets a home of its own.
const home = join(scratch, "home");
mkdirSync(home);
writeFileSync(join(home, ".gitconfig"), "[user]\n\tname = t\n\temail = t@example.com\n[init]\n\tdefaultBranch = main\n");
Object.assign(process.env, {
  HOME: home,
  USERPROFILE: home,
  APPDATA: join(home, "AppData"),
  LOCALAPPDATA: join(home, "Local"),
  XDG_CONFIG_HOME: join(home, ".config"),
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: join(home, ".gitconfig"),
  GIT_TERMINAL_PROMPT: "0",
});

const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};
const braid = (cwd: string, ...args: string[]) => {
  const r = spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `braid ${args.join(" ")}: ${r.stderr}`);
  return r.stdout;
};

interface Entry { kind: string; id: string; title: string; text: string; from: string | null; ref: string[]; age: string | null; passed: number }
interface Inbox { leftovers: Entry[]; ideas: Entry[]; note: string | null }
interface Sources { inbox(fetch: boolean): Inbox }
const board = (await import(pathToFileURL(fileURLToPath(new URL("../dist/commands/board.js", import.meta.url))).href)) as {
  demoSources(): Sources;
  startBoardWith(src: Sources, web: string): Promise<{ server: Server; url: string; token: string; close(): Promise<void> }>;
};
const { inboxOf } = (await import(pathToFileURL(fileURLToPath(new URL("../dist/board/inbox.js", import.meta.url))).href)) as {
  inboxOf(root: string, fetch: boolean): Inbox;
};

/** A bare remote and two clones of it. */
function world() {
  const base = mkdtempSync(join(scratch, "w-"));
  git(base, "init", "-q", "--bare", "remote.git");
  git(base, "init", "-q", "-b", "main", "seed");
  const seed = join(base, "seed");
  git(seed, "commit", "-q", "--allow-empty", "-m", "init");
  git(seed, "remote", "add", "origin", join(base, "remote.git"));
  git(seed, "push", "-q", "origin", "main");
  git(base, "clone", "-q", join(base, "remote.git"), "a");
  git(base, "clone", "-q", join(base, "remote.git"), "b");
  return { a: join(base, "a"), b: join(base, "b") };
}

function apiBoard(src: Sources, query = ""): Promise<{ inbox: Inbox; braids: unknown[] }> {
  return board.startBoardWith(src, join(scratch, "no-web")).then(
    ({ server, close }) =>
      new Promise((resolve, reject) => {
        get({ host: "127.0.0.1", port: (server.address() as AddressInfo).port, path: `/api/board${query}` }, (res) => {
          let text = "";
          res.on("data", (c: Buffer) => (text += c.toString()));
          res.on("end", () => {
            const answer = JSON.parse(text) as { inbox: Inbox; braids: unknown[] };
            close().then(() => resolve(answer), reject);
          });
        }).on("error", reject);
      }),
  );
}

test("/api/board carries the open entries: kind, id, title, text, source, age and passed", async () => {
  const { a } = world();
  braid(a, "note", "Sort the checks\n\nThe confirmation lists them in a random order.", "--from", "0009/C", "--ref", "PR #96");
  braid(a, "note", "Second leftover", "--from", "review 0012/A");
  braid(a, "note", "--idea", "Swipe between lanes\n\nThe phone layout stacks them.");
  const data = await apiBoard({ ...board.demoSources(), inbox: (fetch) => inboxOf(a, fetch) });
  assert.equal(data.inbox.note, null);
  assert.deepEqual(data.inbox.leftovers.map((e) => e.title).sort(), ["Second leftover", "Sort the checks"]);
  const sort = data.inbox.leftovers.find((e) => e.title === "Sort the checks");
  assert.ok(sort);
  assert.equal(sort.kind, "leftover");
  assert.equal(sort.from, "0009/C");
  assert.deepEqual(sort.ref, ["PR #96"]);
  assert.equal(sort.text, "The confirmation lists them in a random order.");
  assert.equal(sort.passed, 0);
  assert.match(sort.age ?? "", /^\d+[mhd]$/);
  assert.equal(data.inbox.leftovers.length, 2);
  const [idea] = data.inbox.ideas;
  assert.equal(data.inbox.ideas.length, 1);
  assert.equal(idea?.kind, "idea");
  assert.equal(idea?.title, "Swipe between lanes");
  assert.equal(idea?.text, "The phone layout stacks them.");
});

const idOf = (stdout: string) => /Noted \w+ (\S+) /.exec(stdout)?.[1] ?? "";

test("only open entries show: a taken or dropped entry is absent, a reopened one is back; the braids stay", async () => {
  const { a } = world();
  braid(a, "note", "Stay", "--from", "user");
  const dropped = idOf(braid(a, "note", "Dropped leftover", "--from", "user"));
  const taken = idOf(braid(a, "note", "--idea", "Taken idea"));
  braid(a, "note", "--idea", "Open idea");
  braid(a, "inbox", "drop", dropped, "--why", "not worth it");
  braid(a, "inbox", "take", taken, "--into", "0001");
  const src: Sources = { ...board.demoSources(), inbox: (fetch) => inboxOf(a, fetch) };
  const data = await apiBoard(src);
  assert.deepEqual(data.inbox.leftovers.map((x) => x.title), ["Stay"]);
  assert.deepEqual(data.inbox.ideas.map((x) => x.title), ["Open idea"]);
  assert.ok(data.braids.length > 0);
  braid(a, "inbox", "reopen", dropped);
  assert.deepEqual((await apiBoard(src)).inbox.leftovers.map((x) => x.title).sort(), ["Dropped leftover", "Stay"]);
});

test("a refresh without fetch reads the local refs; Refresh (?fresh=1) fetches braid-inbox", async () => {
  const { a, b } = world();
  braid(a, "note", "From clone a", "--from", "user");
  braid(b, "note", "--idea", "Captured in clone b");
  const src: Sources = { ...board.demoSources(), inbox: (fetch) => inboxOf(a, fetch) };
  // a's local ref has only its own entry until a fetch brings clone b's.
  const plain = await apiBoard(src);
  assert.deepEqual(plain.inbox.ideas, []);
  const fresh = await apiBoard(src, "?fresh=1");
  assert.deepEqual(fresh.inbox.ideas.map((e) => e.title), ["Captured in clone b"]);
  assert.equal(fresh.inbox.leftovers.length, 1);
});

test("without a braid-inbox branch the lists are empty", () => {
  const { a } = world();
  assert.deepEqual(inboxOf(a, false), { leftovers: [], ideas: [], note: null });
});

test("a failed fetch on Refresh still returns the braids and the local entries, with the note", async () => {
  const { a } = world();
  braid(a, "note", "Local leftover", "--from", "user");
  git(a, "remote", "set-url", "origin", join(scratch, "missing.git"));
  const data = await apiBoard({ ...board.demoSources(), inbox: (fetch) => inboxOf(a, fetch) }, "?fresh=1");
  assert.ok(data.braids.length > 0);
  assert.deepEqual(data.inbox.leftovers.map((x) => x.title), ["Local leftover"]);
  assert.match(data.inbox.note ?? "", /could not fetch braid-inbox/);
  // Without Refresh nothing is fetched, so nothing is said.
  assert.equal((await apiBoard({ ...board.demoSources(), inbox: (fetch) => inboxOf(a, fetch) })).inbox.note, null);
});

test("the demo board has entries to show", async () => {
  const data = await apiBoard(board.demoSources());
  assert.ok(data.inbox.leftovers.length >= 3);
  assert.ok(data.inbox.leftovers.some((e) => e.passed > 0));
  assert.ok(data.inbox.ideas.length >= 2);
  assert.ok(data.inbox.ideas.some((e) => e.text.includes("\n")));
});
