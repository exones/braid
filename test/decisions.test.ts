import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { decidedEntries } = await load("../dist/braids/decided.js");
const { decisionsCommand } = await load("../dist/commands/decisions.js");

const scratch = mkdtempSync(join(tmpdir(), "braid-decisions-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", env: { ...process.env, GIT_AUTHOR_DATE: "2026-11-20T10:00:00Z", GIT_COMMITTER_DATE: "2026-11-20T10:00:00Z" } });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};
const brief = (id: string) => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: To Do\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n`;
const entry = (at: string, text: string, tag = "") => `## ${at}Z${tag}\n\n${text}\n`;

function repo() {
  const root = mkdtempSync(join(scratch, "r-"));
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "t@example.com");
  git(root, "config", "user.name", "t");
  put("braids/0001-alpha/brief.md", brief("0001"));
  put("braids/0001-alpha/A-first/brief.md", brief("0001/A"));
  put("braids/0001-alpha/B-second/brief.md", brief("0001/B"));
  put("braids/0002-other/brief.md", brief("0002"));
  put("braids/0001-alpha/log-2026-11-18-aaaaaaaa.md", `${entry("2026-11-18 09:00", "Decided: braid first")}\n${entry("2026-11-20 12:00", "Not a decision: Decided: in the middle")}`);
  put("braids/0001-alpha/A-first/log-2026-11-19-bbbbbbbb.md", `${entry("2026-11-19 08:00", "Decided: strand A\nover two lines", " checkpoint")}\n${entry("2026-11-19 09:00", "plain note")}`);
  put("braids/0001-alpha/B-second/log-2026-11-21-cccccccc.md", entry("2026-11-21 07:00", "Decided: strand B"));
  put("braids/0002-other/log-2026-11-19-dddddddd.md", entry("2026-11-19 10:00", "Decided: other braid"));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "init");
  return root;
}

test("decidedEntries keeps only entries whose text starts with Decided:", () => {
  const text = `${entry("2026-11-19 08:00", "Decided: a\nb", " checkpoint")}\n${entry("2026-11-19 09:00", "note, Decided: no")}\r\n`;
  assert.deepEqual(decidedEntries(text), [{ at: "2026-11-19 08:00", text: "Decided: a b" }]);
  assert.deepEqual(decidedEntries(""), []);
});

test("braid decisions lists the Decided: entries of a braid and its strands, oldest first", () => {
  const root = repo();
  assert.equal(decisionsCommand(root, ["1"]), "2026-11-18  0001  Decided: braid first\n2026-11-19  0001/A  Decided: strand A over two lines\n2026-11-21  0001/B  Decided: strand B\n");
  assert.equal(decisionsCommand(root, ["0002"]), "2026-11-19  0002  Decided: other braid\n");
});

test("braid decisions --since cuts by a date (that day included) or by a commit's time", () => {
  const root = repo();
  assert.equal(decisionsCommand(root, ["0001", "--since", "2026-11-19"]), "2026-11-19  0001/A  Decided: strand A over two lines\n2026-11-21  0001/B  Decided: strand B\n");
  assert.equal(decisionsCommand(root, ["0001", "--since", "2026-11-22"]), "no Decided: entries for 0001 since 2026-11-22\n");
  // The commit was made 2026-11-20 10:00: only later entries remain.
  const sha = git(root, "rev-parse", "HEAD").slice(0, 9);
  assert.equal(decisionsCommand(root, ["0001", "--since", sha]), "2026-11-21  0001/B  Decided: strand B\n");
});

test("braid decisions refuses bad arguments", () => {
  const root = repo();
  assert.throws(() => decisionsCommand(root, []), /usage: braid decisions/);
  assert.throws(() => decisionsCommand(root, ["0001/A"]), /give a braid number/);
  assert.throws(() => decisionsCommand(root, ["0009"]), /no braid 0009/);
  assert.throws(() => decisionsCommand(root, ["0001", "--since", "yesterday"]), /--since needs a date/);
  assert.throws(() => decisionsCommand(root, ["0001", "--since", "abcdef0"]), /no commit abcdef0/);
});
