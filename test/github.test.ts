import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-github-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

interface GhResult {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}
type Runner = (root: string, args: readonly string[]) => GhResult;
interface Pr {
  readonly number: number;
  readonly url: string;
  readonly state: string;
  readonly checks: readonly { conclusion?: string; status?: string; state?: string }[];
}

// Computed specifiers keep the compiled modules out of the typecheck, which runs before the build.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { startBoard } = (await load("../dist/commands/board.js")) as {
  startBoard: (root: string, web: string, gh: Runner) => Promise<{ server: Server; url: string }>;
};
const { resetGithubMemory, readGithub } = (await load("../dist/board/github.js")) as {
  resetGithubMemory: () => void;
  readGithub: (root: string, run: Runner) => { status: { state: string; reason?: string }; prs: Map<string, { state: string; checks: string }> };
};

beforeEach(() => resetGithubMemory());

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
const brief = (id: string, status: string, extra = "") => `---\nid: '${id}'\ntitle: T ${id}\nstatus: ${status}\n${extra}---\n\n## Goal\n\nDo it.\n`;

const files = () =>
  repo({
    "braids/0001-a/brief.md": brief("0001", "In Progress"),
    "braids/0001-a/A-open/brief.md": brief("0001/A", "In Progress"),
    "braids/0001-a/B-merged/brief.md": brief("0001/B", "In Progress"),
    "braids/0001-a/C-red/brief.md": brief("0001/C", "In Progress"),
    "braids/0001-a/D-ask/brief.md": brief("0001/D", "In Progress", "labels:\n  - ask:approve-ui\n"),
    "braids/0001-a/E-plain/brief.md": brief("0001/E", "To Do"),
    "braids/0001-a/F-done/brief.md": brief("0001/F", "Done"),
  });

const pr = (number: number, state: string, head: string, checks: Pr["checks"] = []) => ({
  number,
  url: `https://github.com/o/r/pull/${number}`,
  state,
  headRefName: head,
  statusCheckRollup: checks,
});
const ok = (data: unknown): GhResult => ({ status: 0, stdout: JSON.stringify(data), stderr: "" });
const green = [{ conclusion: "SUCCESS", status: "COMPLETED" }];
const red = [{ conclusion: "SUCCESS", status: "COMPLETED" }, { conclusion: "FAILURE", status: "COMPLETED" }];

async function board(root: string, gh: Runner) {
  const { server, url } = await startBoard(root, join(scratch, "no-web"), gh);
  const data = (await (await fetch(`${url}api/board`)).json()) as any;
  const item = async (id: string) => (await (await fetch(`${url}api/item?id=${encodeURIComponent(id)}`)).json()) as any;
  after(() => server.close());
  return { data, item, url };
}

test("open, merged and failing PRs put strands in the right lanes", async () => {
  const gh: Runner = () =>
    ok([
      pr(10, "OPEN", "braid/0001/A-open", green),
      pr(11, "MERGED", "braid/0001/B-merged"),
      pr(12, "OPEN", "braid/0001/C-red", red),
      pr(13, "OPEN", "feature/other", red),
    ]);
  const root = files();
  const { data, item } = await board(root, gh);
  assert.deepEqual(data.github, { state: "ok" });
  const strands = Object.fromEntries(data.braids[0].strands.map((s: any) => [s.id, s]));
  assert.equal(strands["0001/A"].lane, "In Review");
  assert.equal(strands["0001/A"].pr.number, 10);
  assert.equal(strands["0001/A"].reason, null);
  assert.equal(strands["0001/B"].lane, "Done");
  assert.equal(strands["0001/B"].pr.state, "merged");
  assert.equal(strands["0001/C"].lane, "Waiting");
  assert.equal(strands["0001/C"].reason, "checks failed");
  assert.equal(strands["0001/E"].lane, "To Do");
  assert.equal(strands["0001/F"].lane, "Done");
  assert.equal(strands["0001/E"].pr, null);
  assert.equal(data.braids[0].lane, "Waiting");
  assert.equal(data.braids[0].reason, "checks failed");
  assert.equal(data.braids[0].done, 2);
  const detail = await item("0001/C");
  assert.equal(detail.lane, "Waiting");
  assert.equal(detail.pr.url, "https://github.com/o/r/pull/12");
});

test("an ask:<key> label shows Waiting with its key", async () => {
  const { data, item } = await board(files(), () => ok([]));
  const d = data.braids[0].strands.find((s: any) => s.id === "0001/D");
  assert.equal(d.lane, "Waiting");
  assert.equal(d.reason, "approve-ui");
  assert.equal((await item("0001/D")).reason, "approve-ui");
});

test("a merged PR beats an ask label", async () => {
  const { data } = await board(files(), () => ok([pr(5, "MERGED", "braid/0001/D-ask")]));
  assert.equal(data.braids[0].strands.find((s: any) => s.id === "0001/D").lane, "Done");
});

test("without gh the board keeps stored states and says why", async () => {
  const missing: Runner = () => ({ status: null, stdout: "", stderr: "", error: new Error("spawn gh ENOENT") });
  const { data } = await board(files(), missing);
  assert.equal(data.github.state, "unavailable");
  assert.match(data.github.reason, /gh is not installed/);
  const lanes = data.braids[0].strands.map((s: any) => s.lane);
  assert.deepEqual(lanes, ["In Progress", "In Progress", "In Progress", "Waiting", "To Do", "Done"]);

  const offline: Runner = () => ({ status: 1, stdout: "", stderr: "error connecting to api.github.com\nmore" });
  const second = await board(files(), offline);
  assert.equal(second.data.github.reason, "gh failed: error connecting to api.github.com");
});

test("merged PRs are cached: later reads list only open PRs until one disappears", () => {
  const calls: string[] = [];
  let open = [pr(1, "OPEN", "braid/0001/A-open", green)];
  const merged = [pr(2, "MERGED", "braid/0001/B-merged")];
  const gh: Runner = (_root, args) => {
    const state = args[args.indexOf("--state") + 1] ?? "";
    calls.push(state);
    return ok(state === "all" ? [...open, ...merged] : open);
  };
  const root = "C:\cache-test";
  assert.equal(readGithub(root, gh).prs.get("0001/B")?.state, "merged");
  assert.equal(readGithub(root, gh).prs.get("0001/B")?.state, "merged");
  assert.deepEqual(calls, ["all", "open"]);
  // The open PR merges: it is gone from the open list, so everything is read again.
  open = [];
  merged.push(pr(1, "MERGED", "braid/0001/A-open"));
  assert.equal(readGithub(root, gh).prs.get("0001/A")?.state, "merged");
  assert.deepEqual(calls, ["all", "open", "open", "all"]);
});

test("pending checks stay In Review", async () => {
  const gh: Runner = () => ok([pr(3, "OPEN", "braid/0001/A-open", [{ status: "IN_PROGRESS" }])]);
  const { data } = await board(files(), gh);
  assert.equal(data.braids[0].strands[0].lane, "In Review");
  assert.equal(data.braids[0].strands[0].pr.checks, "pending");
});
