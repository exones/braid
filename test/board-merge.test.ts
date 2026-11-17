import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-merge-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

// Open thread and Merge on request, over the demo data and a fake `t3`. Computed specifiers keep the compiled modules out of the typecheck.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);

interface Pr {
  number: number;
  state: string;
  checks: string;
  head?: string;
  failed?: string[];
}
interface Github {
  status: { state: string };
  prs: Map<string, Pr>;
}
interface Request {
  id: string;
  kind: string;
  text: string;
  at: string;
  thread: string | null;
  pr?: number;
  head?: string;
}
interface Sources {
  github(fresh: boolean): Github;
  signals(github: Github): { requests: Map<string, Request> } & Record<string, unknown>;
  [key: string]: unknown;
}
interface Merge {
  pr: number;
  head: string | null;
  target: string | null;
  reason: string | null;
}
interface Strand {
  id: string;
  thread: string | null;
  merge: Merge | null;
}
interface Card {
  id: string;
  thread: string | null;
  merge: Merge | null;
  strands: Strand[];
}
interface T3Call {
  root: string;
  args: readonly string[];
}
const board = (await load("../dist/commands/board.js")) as {
  demoSources(): Sources;
  mergeAction(src: Sources, root: string, t3: (root: string, args: readonly string[]) => Promise<{ status: number | null; stdout: string; stderr: string; error?: Error }>): (body: unknown) => Promise<{ ok: boolean; message: string }>;
};
const model = (await load("../dist/board/model.js")) as {
  toBoard(repo: string, braids: unknown, gh: Github, t3: unknown, sig: unknown): { braids: Card[] };
};
const demo = await load("../dist/board/demo.js");

const HEAD_12 = `${(12).toString(16).padStart(7, "0")}${"0".repeat(33)}`;
const cards = (src: Sources = board.demoSources()): Card[] => {
  const github = src.github(false);
  return model.toBoard("demo", demo.demoBraids(), github, demo.demoT3(), src.signals(github)).braids;
};
const strands = (): Strand[] => cards().flatMap((c) => c.strands);
const find = (id: string): Strand => {
  const s = strands().find((x) => x.id === id);
  assert.ok(s, id);
  return s;
};

function fake(status = 0, stderr = ""): { calls: T3Call[]; run: (root: string, args: readonly string[]) => Promise<{ status: number | null; stdout: string; stderr: string }> } {
  const calls: T3Call[] = [];
  return { calls, run: (root, args) => (calls.push({ root, args }), Promise.resolve({ status, stdout: "", stderr })) };
}

/** The demo with its review request of 0001/B changed, and optionally its PR. */
function variant(change: (r: Request) => void, pr?: (p: Pr) => void): Sources {
  const base = board.demoSources();
  return {
    ...base,
    github: (fresh: boolean) => {
      const g = base.github(fresh);
      const p = g.prs.get("0001/B");
      if (p !== undefined && pr !== undefined) {
        pr(p);
      }
      return g;
    },
    signals: (g: Github) => {
      const s = base.signals(g);
      const r = s.requests.get("0001/B");
      assert.ok(r);
      change(r);
      return s;
    },
  };
}

test("open thread: cards and strand rows with a thread carry its link, the others none", () => {
  assert.equal(find("0002/A").thread, "https://t3.example/thread/demo-1");
  assert.equal(find("0010/A").thread, "https://t3.example/thread/demo-5");
  assert.equal(find("0001/C").thread, null);
  assert.equal(find("0001/B").thread, null);
  const single = cards().find((c) => c.id === "0010");
  assert.equal(single?.strands.length, 1);
  assert.equal(cards().find((c) => c.id === "0001")?.thread, null);
});

test("merge info: the request's PR and head, its target branch; its reason when it can't be asked", () => {
  const ok = find("0001/B").merge;
  assert.deepEqual({ pr: ok?.pr, head: ok?.head, target: ok?.target, reason: ok?.reason }, { pr: 12, head: HEAD_12, target: "main", reason: null });
  assert.equal(find("0003/C").merge?.reason, "no coordinator thread on the review request");
  assert.equal(find("0001/C").merge, null);
  const failing = cards(variant(() => {}, (p) => ((p.checks = "failing"), (p.failed = ["verify (windows-latest)"])))).flatMap((c) => c.strands).find((s) => s.id === "0001/B");
  assert.equal(failing?.merge?.reason, "Checks failed: verify (windows-latest)");
  const pending = cards(variant(() => {}, (p) => (p.checks = "pending"))).flatMap((c) => c.strands).find((s) => s.id === "0001/B");
  assert.equal(pending?.merge?.reason, "Checks are still running.");
});

test("merge sends the request's coordinator thread the message, with the confirmed head", async () => {
  const t3 = fake();
  const out = await board.mergeAction(board.demoSources(), scratch, t3.run)({ id: "0001/B", head: HEAD_12 });
  assert.equal(out.ok, true);
  assert.deepEqual(t3.calls, [{ root: scratch, args: ["thread", "send", "demo-coordinator", `Merge #12 at ${HEAD_12}, from the board.`] }]);
  // A short head, as a recap shows it, matches too.
  await board.mergeAction(board.demoSources(), scratch, t3.run)({ id: "0001/B", head: HEAD_12.slice(0, 7) });
  assert.equal(t3.calls.length, 2);
});

test("merge asks nothing without a valid body, an open review request, a coordinator thread or green checks", async () => {
  const t3 = fake();
  const run = (src: Sources, body: unknown) => board.mergeAction(src, scratch, t3.run)(body);
  await assert.rejects(run(board.demoSources(), {}), /needs \{ id, head \}/);
  await assert.rejects(run(board.demoSources(), { id: "0001/B", head: "not-a-sha" }), /needs \{ id, head \}/);
  await assert.rejects(run(board.demoSources(), { id: "0001/C", head: HEAD_12 }), /Merge: 0001\/C has no open review request/);
  await assert.rejects(run(board.demoSources(), { id: "0003/C", head: HEAD_12 }), /Merge: no coordinator thread/);
  await assert.rejects(run(variant((r) => (r.thread = null)), { id: "0001/B", head: HEAD_12 }), /Merge: no coordinator thread/);
  await assert.rejects(run(variant(() => {}, (p) => ((p.checks = "failing"), (p.failed = ["verify (ubuntu-latest)"]))), { id: "0001/B", head: HEAD_12 }), /Merge: Checks failed: verify \(ubuntu-latest\)/);
  await assert.rejects(run(variant(() => {}, (p) => (p.checks = "pending")), { id: "0001/B", head: HEAD_12 }), /Merge: Checks are still running/);
  assert.deepEqual(t3.calls, []);
});

test("merge refuses when the PR head moved since the confirmation", async () => {
  const t3 = fake();
  const moved = variant(() => {}, (p) => (p.head = `7d20be4${"0".repeat(33)}`));
  await assert.rejects(board.mergeAction(moved, scratch, t3.run)({ id: "0001/B", head: HEAD_12 }), /Not merged: the PR head moved\. You confirmed 000000c, the PR is now 7d20be4/);
  assert.deepEqual(t3.calls, []);
});

test("merge says so when t3 fails, and does not claim it asked", async () => {
  const t3 = fake(1, "T3 is not running\nmore");
  await assert.rejects(board.mergeAction(board.demoSources(), scratch, t3.run)({ id: "0001/B", head: HEAD_12 }), /Not asked: T3 is not running/);
});
