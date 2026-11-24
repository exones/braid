import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// 0075/B: lifecycle events on the record branch (`lifecycle/<item>.json` on braid-requests) and the one status function.

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const life = (await load("../dist/braids/lifecycle.js")) as {
  statusOf: (stored: string, l: object | undefined, pr: object | null, review?: boolean) => { status: string; accepted: string | null };
  braidStatuses: (braid: object, l: ReadonlyMap<string, object>, prs: ReadonlyMap<string, object>, reviews?: ReadonlySet<string>) => Map<string, { status: string; accepted: string | null }>;
  recordEvent: (root: string, id: string, e: object) => { commit: string | null; pushed: boolean; warning: string | null };
  loadLifecycle: (root: string) => ReadonlyMap<string, { id: string; events: { kind: string; at: string }[] }>;
  mergeLifecycle: (path: string, ours: string, theirs: string) => string;
  lifecyclePath: (id: string) => string;
};
const requests = (await load("../dist/braids/requests.js")) as {
  loadRecord: (root: string) => { requests: { id: string }[]; problems: object[] };
  openRequest: (root: string, r: object) => { code: string };
};
const store = (await load("../dist/braids/store.js")) as { loadTree: (t: object) => Braid[]; fsTree: (root: string) => object };
const model = (await load("../dist/board/model.js")) as { toCard: (b: Braid, gh: object, t3?: object, sig?: object) => Card };

interface Braid {
  number: string;
  brief: { status: string };
  strands: { letter: string; brief: { status: string } }[];
}
interface Card {
  id: string;
  status: string;
  lane: string;
  need: { text: string } | null;
  strands: { id: string; status: string; lane: string }[];
}

const scratch = mkdtempSync(join(tmpdir(), "braid-lifecycle-test-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};

/** A bare remote and `n` clones of it, each with one commit on main. */
function clones(n: number): { remote: string; roots: string[] } {
  const base = mkdtempSync(join(scratch, "w-"));
  const remote = join(base, "remote.git");
  git(base, "init", "-q", "--bare", "remote.git");
  const roots = Array.from({ length: n }, (_, i) => {
    const root = join(base, `c${i}`);
    git(base, "init", "-q", "-b", "main", root);
    git(root, "config", "user.email", "t@example.com");
    git(root, "config", "user.name", "t");
    git(root, "remote", "add", "origin", remote);
    git(root, "commit", "-q", "--allow-empty", "-m", "init");
    return root;
  });
  return { remote, roots };
}

const merged = (at = "2026-11-20T10:00:00Z", head = "a".repeat(40)) => ({ number: 1, url: "u", state: "merged", checks: "passing", head, mergedAt: at });
const open = (head = "b".repeat(40)) => ({ number: 2, url: "u", state: "open", checks: "passing", head });
const closed = { number: 3, url: "u", state: "closed", checks: "none" };
const started = { id: "0001", events: [{ kind: "started", at: "2026-11-20T09:00:00Z", thread: null, branch: "braid/0001-x" }] };

test("statusOf: one rule from the record, the PR and the stored status", () => {
  const s = (stored: string, l: object | undefined, pr: object | null) => life.statusOf(stored, l, pr);
  // Old braids: stored In Progress and Done keep their meaning.
  assert.deepEqual(s("In Progress", undefined, null), { status: "In Progress", accepted: null }, "stored In Progress, no started event");
  assert.deepEqual(s("Done", undefined, null), { status: "Done", accepted: null }, "stored Done, no PR at all (merged long ago, branch deleted)");
  assert.deepEqual(s("Done", undefined, merged()), { status: "Done", accepted: null }, "stored Done and a merged PR");
  assert.deepEqual(s("Done", undefined, closed), { status: "To Do", accepted: null }, "a closed PR never makes Done");
  assert.deepEqual(s("Done", undefined, open("c".repeat(40))), { status: "In Progress", accepted: "c".repeat(40) }, "an older CLI's stamp before the merge waits for the merge");
  // New braids: the brief says To Do (or what the worker set); the record and the PR decide.
  assert.deepEqual(s("To Do", started, null), { status: "In Progress", accepted: null }, "a started event");
  assert.deepEqual(s("To Do", undefined, merged()), { status: "Done", accepted: null }, "a merged PR, never accepted");
  assert.deepEqual(s("In Progress", started, merged()), { status: "Done", accepted: null });
  const accepted = { id: "0001", events: [...started.events, { kind: "accepted", at: "2026-11-20T11:00:00Z", head: "b".repeat(40), review: "r", thread: "t" }] };
  assert.deepEqual(s("In Progress", accepted, open()), { status: "In Progress", accepted: "b".repeat(40) }, "accepted at the open PR's head");
  assert.deepEqual(s("In Progress", accepted, open("d".repeat(40))), { status: "In Progress", accepted: null }, "the head moved since the acceptance");
  assert.deepEqual(s("Outline", started, merged()), { status: "Outline", accepted: null }, "Outline stays in the brief");
  // A manual `braid edit --status` wins where it says more than the record: Done stays Done.
  assert.deepEqual(s("Done", started, null), { status: "Done", accepted: null });
});

test("a goal is Done when its PR into main merged after every strand; an early PR merged with strands open is not (dsyv)", () => {
  const braid = { number: "0001", brief: { status: "In Progress" }, strands: [{ letter: "A", brief: { status: "To Do" } }, { letter: "B", brief: { status: "To Do" } }] };
  const st = (prs: [string, object][]) => life.braidStatuses(braid, new Map(), new Map(prs));
  // The early PR merged at 10:00 while B is open: the braid isn't Done.
  const early = st([["0001/A", merged("2026-11-20T09:00:00Z")], ["0001", merged("2026-11-20T10:00:00Z")]]);
  assert.deepEqual([early.get("0001/A")?.status, early.get("0001/B")?.status, early.get("0001")?.status], ["Done", "To Do", "In Progress"]);
  // B merged later, after the early PR, and no later PR from the braid merged: still not Done.
  const later = st([["0001/A", merged("2026-11-20T09:00:00Z")], ["0001/B", merged("2026-11-20T12:00:00Z")], ["0001", merged("2026-11-20T10:00:00Z")]]);
  assert.equal(later.get("0001")?.status, "In Progress");
  // The final PR merged after both strands: Done.
  const final = st([["0001/A", merged("2026-11-20T09:00:00Z")], ["0001/B", merged("2026-11-20T12:00:00Z")], ["0001", merged("2026-11-20T13:00:00Z")]]);
  assert.equal(final.get("0001")?.status, "Done");
  // A strand stored Done by an older CLI, with no PR left, counts as Done before the braid's merge.
  const old = life.braidStatuses({ ...braid, strands: [{ letter: "A", brief: { status: "Done" } }] }, new Map(), new Map([["0001", merged()]]));
  assert.equal(old.get("0001")?.status, "Done");
});

test("the record: start and accept events in lifecycle/<item>.json beside requests/, read back; a record without lifecycle/ reads as before", () => {
  const { remote, roots } = clones(1);
  const root = roots[0] as string;
  assert.equal(life.loadLifecycle(root).size, 0, "no record branch at all");
  requests.openRequest(root, { id: "0001/A", kind: "question", text: "which?", at: "2026-11-20T08:00:00Z", thread: null });
  assert.equal(life.loadLifecycle(root).size, 0, "a record with requests only (every repo today)");
  const before = requests.loadRecord(root);
  assert.equal(life.lifecyclePath("0001/A"), "lifecycle/0001-A.json");
  const w1 = life.recordEvent(root, "0001/A", { kind: "started", at: "2026-11-20T09:00:00Z", thread: "mcp:x", branch: "braid/0001/A-a" });
  assert.equal(w1.pushed, true);
  life.recordEvent(root, "0001/A", { kind: "accepted", at: "2026-11-20T10:00:00Z", head: "f".repeat(40), review: "https://r", thread: "mcp:y" });
  assert.deepEqual(life.loadLifecycle(root).get("0001/A")?.events.map((e) => e.kind), ["started", "accepted"]);
  assert.equal(git(root, "--git-dir", remote, "log", "-1", "--format=%s", "braid-requests"), "docs(record): 0001/A accepted");
  const files = git(root, "--git-dir", remote, "ls-tree", "-r", "--name-only", "braid-requests").split("\n");
  assert.deepEqual(files.map((f) => f.replace(/q-[a-z0-9]+/, "q-…")).sort(), ["lifecycle/0001-A.json", "requests/q-….json"]);
  // The requests reader skips the lifecycle files: no problems, the same requests.
  const after = requests.loadRecord(root);
  assert.deepEqual([after.requests.length, after.problems.length], [before.requests.length, 0]);
});

test("two writers, one offline: the events of both are unioned when the offline one pushes", () => {
  const { remote, roots } = clones(2);
  const [a = "", b = ""] = roots;
  life.recordEvent(a, "0002", { kind: "started", at: "2026-11-20T09:00:00Z", thread: null, branch: "braid/0002-x" });
  git(b, "fetch", "-q", "origin");
  // b is offline: its write commits locally with a warning.
  git(b, "remote", "set-url", "origin", join(remote, "..", "nowhere.git"));
  const offline = life.recordEvent(b, "0002", { kind: "accepted", at: "2026-11-20T11:00:00Z", head: "e".repeat(40), review: "r", thread: null });
  assert.equal(offline.pushed, false);
  assert.match(offline.warning ?? "", /the next write pushes it/);
  // Meanwhile a writes another event on the remote.
  life.recordEvent(a, "0002", { kind: "started", at: "2026-11-20T10:00:00Z", thread: "again", branch: "braid/0002-x" });
  // b comes back; its next write replays the offline commit over the remote one.
  git(b, "remote", "set-url", "origin", remote);
  life.recordEvent(b, "0003", { kind: "started", at: "2026-11-20T12:00:00Z", thread: null, branch: "braid/0003-y" });
  const text = git(a, "--git-dir", remote, "show", "braid-requests:lifecycle/0002.json");
  assert.deepEqual((JSON.parse(text) as { events: { kind: string; at: string }[] }).events.map((e) => `${e.kind} ${e.at.slice(11, 16)}`), ["started 09:00", "started 10:00", "accepted 11:00"]);
  // The merge on its own: each event once, in time order.
  const one = JSON.stringify({ id: "0004", events: [{ kind: "started", at: "2026-11-20T09:00:00Z", thread: null, branch: "x" }] });
  const two = JSON.stringify({ id: "0004", events: [{ kind: "started", at: "2026-11-20T09:00:00Z", thread: null, branch: "x" }, { kind: "accepted", at: "2026-11-20T08:00:00Z", head: "h", review: "", thread: null }] });
  assert.deepEqual((JSON.parse(life.mergeLifecycle("lifecycle/0004.json", one, two)) as { events: { kind: string }[] }).events.map((e) => e.kind), ["accepted", "started"]);
});

/** The board's GitHub read with these PRs by item key. */
const gh = (prs: [string, object][]) => ({ status: { state: "ok" }, prs: new Map(prs) });
const t3 = { status: { state: "ok" }, threads: new Map(), coordinators: new Map() };
const lanes = (braids: Braid[], g: object): Record<string, string> =>
  Object.fromEntries(
    braids.flatMap((b) => {
      const c = model.toCard(b, g, t3);
      return [[c.id, `${c.status} / ${c.lane}`], ...c.strands.map((s) => [s.id, `${s.status} / ${s.lane}`])];
    }),
  );

test("another project's braids/ written before 0075 (stored statuses only) read the lanes they read before", () => {
  const braids = store.loadTree(store.fsTree(fileURLToPath(new URL("./fixtures/old-project", import.meta.url))));
  // 0010 merged long ago (branches gone, no PRs); 0011 Done with its PR merged; 0012 under way; 0015 stamped Done by an older CLI before its merge.
  const g = gh([["0011", merged()], ["0012/A", merged()], ["0012/B", open()], ["0015", { ...open(), number: 15 }]]);
  assert.deepEqual(lanes(braids, g), {
    "0010": "Done / Done",
    "0010/A": "Done / Done",
    "0010/B": "Done / Done",
    "0011": "Done / Done",
    "0012": "In Progress / In Progress",
    "0012/A": "Done / Done",
    "0012/B": "In Progress / In Progress",
    "0012/C": "To Do / To Do",
    "0013": "In Progress / In Progress",
    "0014": "To Do / To Do",
    "0015": "In Progress / In Review",
  });
  assert.equal(model.toCard(braids.find((b) => b.number === "0015") as Braid, g, t3).need?.text, "Merge PR #15");
  // Without GitHub, stored statuses alone decide, as before.
  const none = lanes(braids, { status: { state: "unavailable", reason: "x" }, prs: new Map() });
  assert.deepEqual([none["0010"], none["0012/A"], none["0013"], none["0015"]], ["Done / Done", "Done / Done", "In Progress / In Progress", "Done / Done"]);
});

test("this repository's braids/: every stored Done reads Done, with its PR merged or with no PR at all; stored In Progress reads In Progress", () => {
  const braids = store.loadTree(store.fsTree(fileURLToPath(new URL("..", import.meta.url))));
  const done = braids.filter((b) => b.brief.status === "Done");
  assert.ok(done.length > 10, "this repository has Done braids");
  const items = braids.flatMap((b) => [{ id: b.number, stored: b.brief.status }, ...b.strands.map((s) => ({ id: `${b.number}/${s.letter}`, stored: s.brief.status }))]);
  for (const prs of [new Map(), new Map(items.filter((i) => i.stored === "Done").map((i) => [i.id, merged()]))]) {
    const read = new Map(braids.flatMap((b) => [...life.braidStatuses(b, new Map(), prs)]));
    for (const i of items.filter((x) => x.stored === "Done" || x.stored === "In Progress")) {
      assert.equal(read.get(i.id)?.status, i.stored, `${i.id} with ${prs.size === 0 ? "no PRs" : "merged PRs"}`);
    }
  }
});

test("fix round: a stored Done whose PR wasn't found keeps an open review request (To Do, so the request decides); a merge without mergedAt isn't the braid's", () => {
  // As before 0075 (0068, 0069/A): the review request holds a stored Done whose PR the lookup missed.
  assert.deepEqual(life.statusOf("Done", undefined, null, true), { status: "To Do", accepted: null });
  assert.deepEqual(life.statusOf("Done", undefined, null, false), { status: "Done", accepted: null });
  assert.deepEqual(life.statusOf("Done", undefined, merged(), true), { status: "Done", accepted: null }, "a merged PR is Done whatever is open");
  const braid = { number: "0001", brief: { status: "In Progress" }, strands: [{ letter: "A", brief: { status: "To Do" } }] };
  const reviews = life.braidStatuses({ number: "0002", brief: { status: "Done" }, strands: [] }, new Map(), new Map(), new Set(["0002"]));
  assert.equal(reviews.get("0002")?.status, "To Do");
  // A merged braid PR with no merge time can't be placed after its strands' merges: not the braid's Done.
  const noTime = { ...merged(), mergedAt: undefined };
  const st = life.braidStatuses(braid, new Map(), new Map<string, object>([["0001/A", merged("2026-11-20T09:00:00Z")], ["0001", noTime]]));
  assert.deepEqual([st.get("0001/A")?.status, st.get("0001")?.status], ["Done", "In Progress"]);
});
