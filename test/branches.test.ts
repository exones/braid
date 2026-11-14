import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-branches-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
// Git in these tests, and in the braid processes they start, reads no real user settings.
const home = join(scratch, "home");
mkdirSync(home);
for (const key of ["HOME", "USERPROFILE", "XDG_CONFIG_HOME"]) {
  process.env[key] = home;
}
process.env["GIT_CONFIG_NOSYSTEM"] = "1";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

interface StrandOut {
  readonly id: string;
  readonly status: string;
  readonly branch: string | null;
}
interface BraidOut extends StrandOut {
  readonly lane: string;
  readonly title: string;
  readonly strands: readonly StrandOut[];
}

// A computed specifier keeps the compiled module out of the typecheck, which runs before the build.
const live = (await import(pathToFileURL(fileURLToPath(new URL("../dist/braids/branches.js", import.meta.url))).href)) as {
  loadLiveBraids: (root: string) => {
    number: string;
    brief: { status: string; title: string };
    source: { branch: string } | null;
    strands: { letter: string; brief: { status: string }; source: { branch: string } | null }[];
  }[];
};

/** `0001: In Progress@braid/0001-a [A: To Do, B: Done@braid/0001/B-b]` per braid. */
function summary(root: string): string[] {
  const at = (source: { branch: string } | null) => (source === null ? "" : `@${source.branch}`);
  return live.loadLiveBraids(root).map(
    (b) =>
      `${b.number}: ${b.brief.status}${at(b.source)} [${b.strands
        .map((s) => `${s.letter}: ${s.brief.status}${at(s.source)}`)
        .join(", ")}]`,
  );
}

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", "-c", "commit.gpgsign=false", ...args], {
    cwd,
    encoding: "utf8",
  });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout;
}

const brief = (id: string, status: string) => `---\nid: '${id}'\ntitle: T ${id}\nstatus: ${status}\n---\n\n## Goal\n\nDo ${id}.\n`;

function write(root: string, files: Record<string, string>): void {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
}

/** Commits `files` on the current branch. */
function commit(root: string, files: Record<string, string>, message = "change"): void {
  write(root, files);
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", message);
}

let repos = 0;
/** A repository on `main` with braid 0001 and strand 0001/A, both To Do. */
function repo(): string {
  const root = join(scratch, `repo-${++repos}`);
  mkdirSync(root);
  git(root, "init", "-q", "-b", "main");
  commit(root, {
    "braids/0001-a/brief.md": brief("0001", "To Do"),
    "braids/0001-a/A-x/brief.md": brief("0001/A", "To Do"),
  });
  return root;
}

/** Makes `branch` from main, commits `files` there and goes back to main. */
function onBranch(root: string, branch: string, files: Record<string, string>): void {
  git(root, "checkout", "-q", "-b", branch, "main");
  commit(root, files);
  git(root, "checkout", "-q", "main");
}

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

test("a strand set In Progress on its branch shows In Progress on a board run from main", async () => {
  const root = repo();
  onBranch(root, "braid/0001/A-x", {
    "braids/0001-a/A-x/brief.md": brief("0001/A", "In Progress"),
    "braids/0001-a/A-x/report.md": "## Report\n\nFrom the branch.\n",
    "braids/0001-a/A-x/log-2026-11-14-5d80964a.md": "## 2026-11-14 10:00Z\n\nStarted.\n",
  });
  await withBoard(root, async (url) => {
    const board = (await (await fetch(`${url}api/board`)).json()) as { braids: BraidOut[] };
    const card = board.braids[0];
    assert.equal(card?.lane, "In Progress");
    assert.equal(card?.branch, null);
    assert.deepEqual(card?.strands, [
      { id: "0001/A", title: "T 0001/A", status: "In Progress", lane: "In Progress", branch: "braid/0001/A-x", pr: null, reason: null },
    ]);
    const item = (await (await fetch(`${url}api/item?id=0001/A`)).json()) as {
      status: string;
      branch: string;
      report: string;
      logs: { name: string; text: string }[];
    };
    assert.equal(item.status, "In Progress");
    assert.equal(item.branch, "braid/0001/A-x");
    assert.match(item.report, /From the branch\./);
    assert.deepEqual(item.logs, [{ name: "log-2026-11-14-5d80964a.md", text: "## 2026-11-14 10:00Z\n\nStarted.\n" }]);
  });
});

test("a strand branch that exists only on the remote is read from origin/", () => {
  const root = repo();
  const origin = join(scratch, `origin-${repos}.git`);
  git(scratch, "init", "-q", "--bare", origin);
  git(root, "remote", "add", "origin", origin);
  onBranch(root, "braid/0001/A-x", { "braids/0001-a/A-x/brief.md": brief("0001/A", "In Progress") });
  git(root, "push", "-q", "origin", "braid/0001/A-x");
  git(root, "branch", "-q", "-D", "braid/0001/A-x");
  assert.deepEqual(summary(root), ["0001: To Do [A: In Progress@origin/braid/0001/A-x]"]);

  // A newer local copy wins over the remote one.
  git(root, "checkout", "-q", "-b", "braid/0001/A-x", "origin/braid/0001/A-x");
  process.env["GIT_COMMITTER_DATE"] = "4000000000 +0000";
  try {
    commit(root, { "braids/0001-a/A-x/brief.md": brief("0001/A", "Done") });
  } finally {
    delete process.env["GIT_COMMITTER_DATE"];
  }
  git(root, "checkout", "-q", "main");
  assert.deepEqual(summary(root), ["0001: To Do [A: Done@braid/0001/A-x]"]);
});

test("a strand branch wins over its braid branch, which wins over the working tree", () => {
  const root = repo();
  // The epic branch has a new strand B, a new title and its own copy of A.
  onBranch(root, "braid/0001-a", {
    "braids/0001-a/brief.md": brief("0001", "In Progress"),
    "braids/0001-a/A-x/brief.md": brief("0001/A", "Done"),
    "braids/0001-a/B-y/brief.md": brief("0001/B", "To Do"),
  });
  assert.deepEqual(summary(root), ["0001: In Progress@braid/0001-a [A: Done@braid/0001-a, B: To Do@braid/0001-a]"]);
  git(root, "checkout", "-q", "-b", "braid/0001/B-y", "braid/0001-a");
  commit(root, { "braids/0001-a/B-y/brief.md": brief("0001/B", "In Progress") });
  git(root, "checkout", "-q", "main");
  assert.deepEqual(summary(root), [
    "0001: In Progress@braid/0001-a [A: Done@braid/0001-a, B: In Progress@braid/0001/B-y]",
  ]);
});

test("a braid that exists only on its branch is added", () => {
  const root = repo();
  onBranch(root, "braid/0002-new", { "braids/0002-new/brief.md": brief("0002", "In Progress") });
  onBranch(root, "braid/0003/A-z", {
    "braids/0003-other/brief.md": brief("0003", "To Do"),
    "braids/0003-other/A-z/brief.md": brief("0003/A", "In Progress"),
  });
  assert.deepEqual(summary(root), [
    "0001: To Do [A: To Do]",
    "0002: In Progress@braid/0002-new []",
    "0003: To Do@braid/0003/A-z [A: In Progress@braid/0003/A-z]",
  ]);
});

test("branches already in HEAD, the checked-out branch, bad names and broken briefs are skipped", () => {
  const root = repo();
  onBranch(root, "braid/0001/A-x", { "braids/0001-a/A-x/brief.md": brief("0001/A", "In Progress") });
  onBranch(root, "braid/oops", { "braids/0001-a/brief.md": brief("0001", "Done") });
  onBranch(root, "braid/0001-a", { "braids/0001-a/brief.md": brief("0001", "Nope") });
  git(root, "merge", "-q", "--no-edit", "braid/0001/A-x");
  // After the merge, main moves on; the merged branch is older than the working tree.
  commit(root, { "braids/0001-a/A-x/brief.md": brief("0001/A", "Done") });
  assert.deepEqual(summary(root), ["0001: To Do [A: Done]"]);

  // On the strand branch itself, uncommitted edits in the working tree win.
  onBranch(root, "braid/0001/B-y", { "braids/0001-a/B-y/brief.md": brief("0001/B", "To Do") });
  git(root, "checkout", "-q", "braid/0001/B-y");
  write(root, { "braids/0001-a/B-y/brief.md": brief("0001/B", "In Progress") });
  assert.deepEqual(summary(root), ["0001: To Do [A: Done, B: In Progress]"]);
});

test("without Git the board reads the working tree only", () => {
  const root = join(scratch, "plain");
  write(root, { "braids/0001-a/brief.md": brief("0001", "To Do") });
  assert.deepEqual(summary(root), ["0001: To Do []"]);
});

test("after a squash merge a leftover strand branch still overlays the working tree until it is deleted", () => {
  const root = repo();
  onBranch(root, "braid/0001/A-x", { "braids/0001-a/A-x/brief.md": brief("0001/A", "In Progress") });
  git(root, "merge", "-q", "--squash", "braid/0001/A-x");
  git(root, "commit", "-q", "-m", "squash");
  commit(root, { "braids/0001-a/A-x/brief.md": brief("0001/A", "Done") });
  assert.deepEqual(summary(root), ["0001: To Do [A: In Progress@braid/0001/A-x]"]);
  git(root, "branch", "-q", "-D", "braid/0001/A-x");
  assert.deepEqual(summary(root), ["0001: To Do [A: Done]"]);
});
