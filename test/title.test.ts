import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);

const { parseThreadTitle, threadTitle, titleRepoName } = (await load("../dist/braids/title.js")) as {
  parseThreadTitle(t: string): { repo: string; id: string; role: string; title: string } | null;
  threadTitle(repo: string, id: string, role: string, title: string): string;
  titleRepoName(root: string): string;
};
const { titleCommand } = (await load("../dist/commands/braids.js")) as { titleCommand(root: string, args: string[]): string };

const git = (cwd: string, ...args: string[]) => assert.equal(spawnSync("git", args, { cwd, encoding: "utf8" }).status, 0);

function repo(remote: string | null): string {
  const root = mkdtempSync(join(tmpdir(), "braid-title-"));
  git(root, "init", "-q");
  if (remote !== null) {
    git(root, "remote", "add", "origin", remote);
  }
  const brief = (id: string, title: string) => `---\nid: '${id}'\ntitle: ${title}\nstatus: To Do\n---\n\n## Goal\n\nDo it.\n`;
  mkdirSync(join(root, "braids", "0009-wide", "D-part"), { recursive: true });
  writeFileSync(join(root, "braids", "0009-wide", "brief.md"), brief("0009", "Wide: braid"));
  writeFileSync(join(root, "braids", "0009-wide", "D-part", "brief.md"), brief("0009/D", "Part D"));
  return root;
}

test("the builder and the parser agree; the parser reads titles without the emoji and refuses other titles", () => {
  const title = threadTitle("braid", "0021", "worker", "Board Start: no branch clash");
  assert.equal(title, "💻 braid 0021 worker: Board Start: no branch clash");
  assert.deepEqual(parseThreadTitle(title), { repo: "braid", id: "0021", role: "worker", title: "Board Start: no branch clash" });
  assert.deepEqual(parseThreadTitle("chinese-trainer 0012/A review: data model"), { repo: "chinese-trainer", id: "0012/A", role: "review", title: "data model" });
  assert.equal(parseThreadTitle(threadTitle("r", "0001", "coordinator", "x"))?.role, "coordinator");
  assert.equal(threadTitle("r", "0001", "research", "x").startsWith("🧪 "), true);
  assert.equal(threadTitle("r", "0001", "review", "x").startsWith("👀 "), true);
  assert.equal(parseThreadTitle("just a chat"), null);
});

test("the repo name is the GitHub repository's, else the folder's", () => {
  assert.equal(titleRepoName(repo("https://github.com/exones/braid.git")), "braid");
  assert.equal(titleRepoName(repo("git@github.com:exones/other-repo.git")), "other-repo");
  const bare = repo(null);
  assert.equal(titleRepoName(bare), basename(bare));
});

test("braid title prints the full title with the brief's title exactly, for a story, a strand and a role", () => {
  const root = repo("https://github.com/exones/braid");
  assert.equal(titleCommand(root, ["0009", "--role", "coordinator"]), "🧠 braid 0009 coordinator: Wide: braid\n");
  assert.equal(titleCommand(root, ["--role", "review", "0009/D"]), "👀 braid 0009/D review: Part D\n");
  assert.throws(() => titleCommand(root, ["0009", "--role", "boss"]), /usage/);
  assert.throws(() => titleCommand(root, ["0009"]), /usage/);
  assert.throws(() => titleCommand(root, ["0010", "--role", "worker"]), /no item/);
});

test("a checkout named agento whose origin is braid.git: titles with either name match, another repo's don't", async () => {
  const t3 = (await load("../dist/board/t3.js")) as { readT3(root: string, o: { run: unknown; ttlMs: number; agents: string; project: string }): Promise<{ coordinators: Map<string, unknown>; idle: Map<string, { id: string }[]>; idleCoordinators: Map<string, unknown> }> };
  const parent = mkdtempSync(join(tmpdir(), "braid-title-"));
  const root = join(parent, "agento");
  mkdirSync(root);
  git(root, "init", "-q");
  git(root, "remote", "add", "origin", "https://github.com/exones/braid.git");
  const listed = [
    { threadId: "c1", status: "running", title: "🧠 braid 0009 coordinator: x" },
    { threadId: "c2", status: "running", title: "agento 0010 coordinator: x" },
    { threadId: "c3", status: "running", title: "🧠 other 0011 coordinator: x" },
    { threadId: "w1", status: "idle", title: "💻 braid 0009 worker: x" },
    { threadId: "w2", status: "idle", title: "agento 0009/D worker: x" },
    { threadId: "w3", status: "idle", title: "💻 other 0009/E worker: x" },
  ];
  const run = (_r: string, args: readonly string[]) => Promise.resolve({ status: 0, stdout: args[1] === "list" ? JSON.stringify(listed) : "{}", stderr: "" });
  const read = await t3.readT3(root, { run, ttlMs: 0, agents: join(parent, "agents"), project: root });
  assert.deepEqual([...read.coordinators.keys()], ["0009", "0010"]);
  assert.deepEqual([...read.idle].map(([k, v]) => [k, v.map((t) => t.id)]), [["0009", ["w1"]], ["0009/D", ["w2"]]]);
});
